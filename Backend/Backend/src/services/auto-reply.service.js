import OpenAI from 'openai';
import { env } from '../config/env.js';
import { CandidateProfile } from '../models/candidate-profile.model.js';
import { EmployerProfile } from '../models/employer-profile.model.js';
import { User } from '../models/user.model.js';
import { logger } from '../utils/logger.js';
import {
  canEmployerViewCandidate,
  getUnlockedCandidateIds,
} from './candidate-masking.service.js';
import { getEmployerContext, getEntitlementsByEmail } from './entitlement.service.js';
import { getOrCreateConversation, persistMessage } from './chat.service.js';
import { emitConversationUpdate, emitNewMessage } from '../socket/socket.js';

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

const MAX_MESSAGE_LENGTH = 4000;

async function generateAckText(jobTitle) {
  const fallback = `Thank you for applying${jobTitle ? ` to "${jobTitle}"` : ''}! We have received your application and will review it shortly.`;

  if (!openai) {
    return fallback;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Write a short, warm acknowledgment (2 sentences max) from an employer to a candidate who just applied${jobTitle ? ` for the "${jobTitle}" position` : ''}. Thank them and say the application will be reviewed soon. No placeholders, no subject line, no signature.`,
        },
      ],
      max_tokens: 120,
      temperature: 0.7,
    });

    const text = completion.choices?.[0]?.message?.content?.trim();
    return text ? text.slice(0, MAX_MESSAGE_LENGTH) : fallback;
  } catch (error) {
    logger.warn('Auto-reply generation failed, using template', { message: error.message });
    return fallback;
  }
}

/**
 * Plan feature (employer): when a candidate applies, send an automatic AI
 * acknowledgment from the employer in chat. Fire-and-forget — never fails or
 * delays the application request. Auto-replies are flagged `isAutoReply` and
 * never trigger further automation.
 */
export function sendEmployerApplicationAck({ job, candidateProfileId }) {
  setImmediate(async () => {
    try {
      if (!job?.employerEmail) return;

      const entitlements = await getEntitlementsByEmail(job.employerEmail, 'employer');
      if (!entitlements?.features?.autoReplyEnabled) return;

      const [employerProfile, candidateProfile] = await Promise.all([
        EmployerProfile.findOne({ email: job.employerEmail })
          .select('_id email companyName')
          .lean(),
        CandidateProfile.findById(candidateProfileId)
          .select('_id email firstName lastName subscriptionTier subscriptionExpiresAt')
          .lean(),
      ]);

      if (!employerProfile || !candidateProfile) return;

      // Don't leak a locked candidate's name into chat via the auto-ack: only
      // acknowledge applicants the employer is entitled to see.
      const employerUser = await User.findOne({ email: job.employerEmail })
        .select('_id')
        .lean();

      if (!employerUser) return;

      const { effectiveFeatures } = await getEmployerContext({
        id: String(employerUser._id),
        email: job.employerEmail,
        role: 'employer',
      });

      if (!effectiveFeatures.chatEnabled) return;

      const unlockedSet = await getUnlockedCandidateIds(employerProfile._id, [candidateProfile._id]);

      if (
        !canEmployerViewCandidate({
          effectiveFeatures,
          candidate: candidateProfile,
          unlockedSet,
        })
      ) {
        return;
      }

      const conversation = await getOrCreateConversation(
        employerProfile,
        candidateProfile,
        job.title ? { _id: job._id, title: job.title } : null,
      );

      const text = await generateAckText(job.title);

      const { conversation: updated, message } = await persistMessage(
        conversation,
        { role: 'employer', email: employerProfile.email },
        text,
        { isAutoReply: true },
      );

      emitNewMessage(updated._id, message);
      emitConversationUpdate(updated);
    } catch (error) {
      logger.warn('Employer auto-ack failed', { message: error.message });
    }
  });
}
