import mongoose from 'mongoose';
import { CandidateProfile } from '../models/candidate-profile.model.js';
import { EmployerProfile } from '../models/employer-profile.model.js';
import { Job } from '../models/job.model.js';
import { Conversation } from '../models/conversation.model.js';
import { Message } from '../models/message.model.js';
import { AppError } from '../utils/app-error.js';
import {
  canEmployerViewCandidate,
  getUnlockedCandidateIds,
} from './candidate-masking.service.js';
import {
  assertCanDirectMessage,
  getEmployerContext,
  recordCandidateOutreach,
} from './entitlement.service.js';

const isObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value));

function fullName(candidate) {
  return [candidate?.firstName, candidate?.lastName].filter(Boolean).join(' ').trim() || 'Candidate';
}

/** Resolve the signed-in user's chat identity (employer or candidate profile). */
async function resolveSelf(user) {
  if (!user?.email || !user?.role) {
    throw new AppError('Authentication required', 401);
  }

  if (user.role === 'employer') {
    const profile = await EmployerProfile.findOne({ email: user.email })
      .select('_id email companyName')
      .lean();
    if (!profile) throw new AppError('Employer profile not found for this account', 404);
    return { role: 'employer', profileId: profile._id, email: profile.email, name: profile.companyName };
  }

  if (user.role === 'candidate') {
    const profile = await CandidateProfile.findOne({ email: user.email })
      .select('_id email firstName lastName')
      .lean();
    if (!profile) throw new AppError('Candidate profile not found for this account', 404);
    return { role: 'candidate', profileId: profile._id, email: profile.email, name: fullName(profile) };
  }

  throw new AppError('Chat is available to employers and candidates only', 403);
}

/** Serialise a conversation into a viewer-aware shape (peer + my unread count). */
function serializeConversation(conversation, viewerRole) {
  const isEmployer = viewerRole === 'employer';
  return {
    _id: String(conversation._id),
    job: conversation.job ? String(conversation.job) : null,
    jobTitle: conversation.jobTitle || '',
    peerName: isEmployer ? conversation.candidateName : conversation.employerName,
    peerRole: isEmployer ? 'candidate' : 'employer',
    lastMessage: conversation.lastMessage || '',
    lastMessageAt: conversation.lastMessageAt,
    lastMessageSender: conversation.lastMessageSender,
    unread: isEmployer ? conversation.employerUnread : conversation.candidateUnread,
    updatedAt: conversation.updatedAt,
  };
}

function serializeMessage(message) {
  return {
    _id: String(message._id),
    conversation: String(message.conversation),
    senderRole: message.senderRole,
    text: message.text,
    isAutoReply: Boolean(message.isAutoReply),
    createdAt: message.createdAt,
  };
}

/**
 * Verify the user belongs to the conversation. Returns the lean conversation.
 * Shared with the socket layer to guard room joins.
 */
export async function assertConversationAccess(user, conversationId) {
  if (!isObjectId(conversationId)) {
    throw new AppError('Invalid conversation id', 400);
  }

  const self = await resolveSelf(user);
  const conversation = await Conversation.findById(conversationId).lean();

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  const ownerId = self.role === 'employer' ? conversation.employerProfile : conversation.candidateProfile;
  if (String(ownerId) !== String(self.profileId)) {
    throw new AppError('You do not have access to this conversation', 403);
  }

  return { conversation, self };
}

/**
 * Start (or continue) a conversation with a peer and post the first/next message.
 * Channel is created lazily here — never before an actual message exists.
 */
export async function startConversationWithMessage(user, input = {}) {
  const { peerProfileId, jobId, text } = input;
  const body = String(text ?? '').trim();

  if (!body) throw new AppError('Message text is required', 400);
  if (body.length > 4000) throw new AppError('Message is too long', 400);
  if (!isObjectId(peerProfileId)) throw new AppError('Invalid recipient', 400);

  const self = await resolveSelf(user);

  let employerProfile;
  let candidateProfile;
  let outreachToRecord = null;

  if (self.role === 'employer') {
    employerProfile = { _id: self.profileId, email: self.email, companyName: self.name };
    candidateProfile = await CandidateProfile.findById(peerProfileId)
      .select('_id email firstName lastName subscriptionTier subscriptionExpiresAt')
      .lean();
    if (!candidateProfile) throw new AppError('Candidate not found', 404);

    // Plan gate applies to NEW conversations only — replying in an existing
    // thread always works, even after a downgrade.
    const existing = await Conversation.findOne({
      employerProfile: self.profileId,
      candidateProfile: candidateProfile._id,
    })
      .select('_id')
      .lean();

    if (!existing) {
      const { effectiveFeatures } = await getEmployerContext(user);

      if (!effectiveFeatures.chatEnabled) {
        throw new AppError(
          'Chat with candidates is not included in your current plan. Upgrade to start conversations.',
          403,
          undefined,
          'FEATURE_NOT_IN_PLAN',
        );
      }

      // No identity leak: chatting reveals the candidate's name, so the
      // employer must already be entitled to see this profile.
      const unlockedSet = await getUnlockedCandidateIds(self.profileId, [candidateProfile._id]);

      if (!canEmployerViewCandidate({ effectiveFeatures, candidate: candidateProfile, unlockedSet })) {
        throw new AppError(
          'Unlock this profile to start a conversation with the candidate.',
          403,
          undefined,
          'PROFILE_LOCKED',
        );
      }
    }
  } else {
    candidateProfile = { _id: self.profileId, email: self.email, firstName: self.name };
    employerProfile = await EmployerProfile.findById(peerProfileId)
      .select('_id email companyName')
      .lean();
    if (!employerProfile) throw new AppError('Employer not found', 404);

    // EXCEL feature: starting a conversation with a NEW employer consumes one
    // of the 3 monthly outreach slots. Existing threads are always free.
    const existing = await Conversation.findOne({
      employerProfile: employerProfile._id,
      candidateProfile: self.profileId,
    })
      .select('_id')
      .lean();

    if (!existing) {
      const outreach = await assertCanDirectMessage(user, self.profileId, employerProfile._id);

      if (outreach.counted) {
        outreachToRecord = {
          candidateProfileId: self.profileId,
          employerProfileId: employerProfile._id,
          periodKey: outreach.periodKey,
        };
      }
    }
  }

  let jobContext = null;
  if (jobId && isObjectId(jobId)) {
    jobContext = await Job.findById(jobId).select('_id title').lean();
  }

  const conversation = await getOrCreateConversation(employerProfile, candidateProfile, jobContext, {
    candidateName: self.role === 'candidate' ? self.name : fullName(candidateProfile),
  });

  const result = await persistMessage(conversation, self, body);

  if (outreachToRecord) {
    await recordCandidateOutreach(
      outreachToRecord.candidateProfileId,
      outreachToRecord.employerProfileId,
      outreachToRecord.periodKey,
    );
  }

  return result;
}

/**
 * Atomically get-or-create the channel for an employer/candidate pair.
 * Shared with the auto-reply service, which starts conversations on behalf
 * of employers when a candidate applies.
 */
export async function getOrCreateConversation(employerProfile, candidateProfile, jobContext = null, names = {}) {
  return Conversation.findOneAndUpdate(
    { employerProfile: employerProfile._id, candidateProfile: candidateProfile._id },
    {
      $setOnInsert: {
        employerProfile: employerProfile._id,
        candidateProfile: candidateProfile._id,
        employerEmail: employerProfile.email,
        candidateEmail: candidateProfile.email,
        employerName: employerProfile.companyName || 'Employer',
        candidateName: names.candidateName || fullName(candidateProfile),
        ...(jobContext ? { job: jobContext._id, jobTitle: jobContext.title } : {}),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function sendMessageToConversation(user, conversationId, text) {
  const body = String(text ?? '').trim();
  if (!body) throw new AppError('Message text is required', 400);
  if (body.length > 4000) throw new AppError('Message is too long', 400);

  const { conversation, self } = await assertConversationAccess(user, conversationId);
  const conversationDoc = await Conversation.findById(conversation._id);
  return persistMessage(conversationDoc, self, body);
}

/** Persist a message + update the conversation summary/unread counters. */
export async function persistMessage(conversationDoc, self, body, { isAutoReply = false } = {}) {
  const message = await Message.create({
    conversation: conversationDoc._id,
    senderRole: self.role,
    senderEmail: self.email,
    text: body,
    isAutoReply,
  });

  conversationDoc.lastMessage = body;
  conversationDoc.lastMessageAt = message.createdAt;
  conversationDoc.lastMessageSender = self.role;
  if (self.role === 'employer') {
    conversationDoc.candidateUnread += 1;
  } else {
    conversationDoc.employerUnread += 1;
  }
  await conversationDoc.save();

  return {
    conversation: conversationDoc.toObject(),
    message: serializeMessage(message),
  };
}

export async function listMyConversations(user) {
  const self = await resolveSelf(user);
  const filter = self.role === 'employer'
    ? { employerProfile: self.profileId }
    : { candidateProfile: self.profileId };

  const conversations = await Conversation.find(filter)
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .lean();

  return conversations.map((conversation) => serializeConversation(conversation, self.role));
}

export async function getConversationMessages(user, conversationId) {
  const { conversation, self } = await assertConversationAccess(user, conversationId);

  const messages = await Message.find({ conversation: conversation._id })
    .sort({ createdAt: 1 })
    .lean();

  // Mark the peer's messages as read + reset my unread counter.
  await markConversationRead(self, conversation._id);

  return {
    conversation: serializeConversation({ ...conversation, [self.role === 'employer' ? 'employerUnread' : 'candidateUnread']: 0 }, self.role),
    messages: messages.map(serializeMessage),
  };
}

async function markConversationRead(self, conversationId) {
  const update = self.role === 'employer' ? { employerUnread: 0 } : { candidateUnread: 0 };
  await Promise.all([
    Conversation.updateOne({ _id: conversationId }, { $set: update }),
    Message.updateMany(
      { conversation: conversationId, senderRole: { $ne: self.role }, readByPeer: false },
      { $set: { readByPeer: true } },
    ),
  ]);
}

export async function markConversationReadByUser(user, conversationId) {
  const { self } = await assertConversationAccess(user, conversationId);
  await markConversationRead(self, conversationId);
  return { conversationId: String(conversationId) };
}

export async function getMyUnreadTotal(user) {
  const self = await resolveSelf(user).catch(() => null);
  if (!self) return { total: 0 };

  const field = self.role === 'employer' ? 'employerUnread' : 'candidateUnread';
  const filter = self.role === 'employer'
    ? { employerProfile: self.profileId }
    : { candidateProfile: self.profileId };

  const result = await Conversation.aggregate([
    { $match: { ...filter, [field]: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]);

  return { total: result[0]?.total ?? 0 };
}

// Re-exported for callers that want the viewer-aware serializer.
export { serializeConversation, mongoose };
