import { randomBytes } from 'node:crypto';
import { SupportTicket, TICKET_STATUSES } from '../models/support-ticket.model.js';
import { User } from '../models/user.model.js';
import { CandidateProfile } from '../models/candidate-profile.model.js';
import { EmployerProfile } from '../models/employer-profile.model.js';
import { AppError } from '../utils/app-error.js';
import { emailService } from './email.service.js';
import { logger } from '../utils/logger.js';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

function ensureValidId(id) {
  if (!OBJECT_ID_REGEX.test(String(id))) {
    throw new AppError('Ticket not found', 404);
  }
}

/** Short, human-quotable reference like `TKT-7F3A21`. */
function buildReference() {
  return `TKT-${randomBytes(3).toString('hex').toUpperCase()}`;
}

/** Best-effort display name for the ticket owner, from whichever profile exists. */
async function resolveDisplayName(user) {
  if (user?.name) return user.name;

  const email = user?.email;
  if (!email) return '';

  if (user.role === 'employer') {
    const employer = await EmployerProfile.findOne({ email }).select('companyName firstName lastName').lean();
    if (employer) {
      return employer.companyName || [employer.firstName, employer.lastName].filter(Boolean).join(' ');
    }
  }

  const candidate = await CandidateProfile.findOne({ email }).select('firstName lastName').lean();
  if (candidate) {
    return [candidate.firstName, candidate.lastName].filter(Boolean).join(' ');
  }

  return '';
}

/**
 * Address for the "new ticket" alert. Falls back through the configured SMTP
 * sender so an alert still goes somewhere when no admin user exists yet.
 */
async function resolveAdminRecipient() {
  const admin = await User.findOne({ role: 'admin' }).select('email').sort({ createdAt: 1 }).lean();
  return admin?.email || '';
}

/** Emails must never fail the request that triggered them. */
function fireAndForget(promise, context) {
  Promise.resolve(promise).catch((error) => {
    logger.error(`Support ticket email failed (${context})`, error);
  });
}

export async function createTicket(user, input) {
  if (!user?.email) {
    throw new AppError('Authentication required', 401);
  }

  const subject = String(input?.subject ?? '').trim();
  const body = String(input?.message ?? '').trim();

  if (subject.length < 3) throw new AppError('Please enter a subject', 400);
  if (body.length < 10) throw new AppError('Please describe your issue in at least 10 characters', 400);

  const userName = await resolveDisplayName(user);
  const reference = buildReference();

  const ticket = await SupportTicket.create({
    reference,
    subject,
    category: input?.category ?? 'other',
    priority: input?.priority ?? 'normal',
    status: 'open',
    user: user.id,
    userEmail: user.email,
    userName,
    userRole: user.role ?? '',
    messages: [
      {
        body,
        authorRole: 'user',
        authorName: userName,
        authorEmail: user.email,
      },
    ],
    lastMessageAt: new Date(),
    unreadForUser: false,
  });

  fireAndForget(
    emailService.sendTicketCreatedEmail(user.email, { reference, subject, name: userName }),
    'created-confirmation',
  );

  const adminEmail = await resolveAdminRecipient();
  if (adminEmail) {
    fireAndForget(
      emailService.sendTicketAdminAlertEmail(adminEmail, {
        reference,
        subject,
        fromName: userName,
        fromEmail: user.email,
        category: ticket.category,
        priority: ticket.priority,
        body,
      }),
      'admin-alert',
    );
  } else {
    logger.warn('No admin user found — skipping new-ticket alert email');
  }

  return ticket.toObject();
}

export async function listMyTickets(user) {
  if (!user?.email) throw new AppError('Authentication required', 401);

  const items = await SupportTicket.find({ userEmail: user.email })
    .sort({ lastMessageAt: -1 })
    .lean();

  return {
    items,
    openCount: items.filter((t) => t.status === 'open' || t.status === 'in_progress').length,
    unreadCount: items.filter((t) => t.unreadForUser).length,
  };
}

export async function getMyTicket(user, ticketId) {
  ensureValidId(ticketId);
  const ticket = await SupportTicket.findOne({ _id: ticketId, userEmail: user?.email }).lean();
  if (!ticket) throw new AppError('Ticket not found', 404);

  // Opening the thread clears the "new reply" badge.
  if (ticket.unreadForUser) {
    await SupportTicket.updateOne({ _id: ticket._id }, { $set: { unreadForUser: false } });
    ticket.unreadForUser = false;
  }

  return ticket;
}

export async function replyToMyTicket(user, ticketId, message) {
  ensureValidId(ticketId);
  const body = String(message ?? '').trim();
  if (body.length < 2) throw new AppError('Please enter a message', 400);

  const ticket = await SupportTicket.findOne({ _id: ticketId, userEmail: user?.email });
  if (!ticket) throw new AppError('Ticket not found', 404);
  if (ticket.status === 'closed') {
    throw new AppError('This ticket is closed. Please raise a new one.', 400);
  }

  ticket.messages.push({
    body,
    authorRole: 'user',
    authorName: ticket.userName,
    authorEmail: ticket.userEmail,
  });
  ticket.lastMessageAt = new Date();
  // A user reply re-opens a resolved ticket so it returns to the admin queue.
  if (ticket.status === 'resolved') ticket.status = 'open';
  await ticket.save();

  return ticket.toObject();
}

export async function closeMyTicket(user, ticketId) {
  ensureValidId(ticketId);
  const ticket = await SupportTicket.findOneAndUpdate(
    { _id: ticketId, userEmail: user?.email },
    { $set: { status: 'closed', closedAt: new Date() } },
    { new: true },
  ).lean();
  if (!ticket) throw new AppError('Ticket not found', 404);
  return ticket;
}

/* ------------------------------------------------------------------ admin */

export async function listTicketsAdmin(query = {}) {
  const filters = {};

  if (query.status && TICKET_STATUSES.includes(String(query.status))) {
    filters.status = String(query.status);
  }
  if (query.category) filters.category = String(query.category);
  if (query.priority) filters.priority = String(query.priority);

  if (query.search) {
    const keyword = String(query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (keyword) {
      const regex = new RegExp(keyword, 'i');
      filters.$or = [
        { reference: regex },
        { subject: regex },
        { userEmail: regex },
        { userName: regex },
      ];
    }
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const [items, total, openCount] = await Promise.all([
    SupportTicket.find(filters).sort({ lastMessageAt: -1 }).skip(skip).limit(limit).lean(),
    SupportTicket.countDocuments(filters),
    SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
  ]);

  return {
    items,
    openCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getTicketAdmin(ticketId) {
  ensureValidId(ticketId);
  const ticket = await SupportTicket.findById(ticketId).lean();
  if (!ticket) throw new AppError('Ticket not found', 404);
  return ticket;
}

/**
 * Admin reply and/or status change. Either may be supplied on its own; the
 * owner is emailed whenever something actually changed.
 */
export async function respondToTicketAdmin(ticketId, { message, status } = {}, adminUser) {
  ensureValidId(ticketId);

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);

  const body = String(message ?? '').trim();
  const nextStatus = status && TICKET_STATUSES.includes(status) ? status : null;

  if (!body && !nextStatus) {
    throw new AppError('Provide a reply or a status change', 400);
  }

  if (body) {
    ticket.messages.push({
      body,
      authorRole: 'admin',
      authorName: adminUser?.name || 'Support team',
      authorEmail: adminUser?.email ?? '',
    });
    ticket.lastMessageAt = new Date();
  }

  if (nextStatus) {
    ticket.status = nextStatus;
    ticket.closedAt = nextStatus === 'closed' ? new Date() : null;
  } else if (body && ticket.status === 'open') {
    // Replying to an untouched ticket implicitly picks it up.
    ticket.status = 'in_progress';
  }

  ticket.unreadForUser = true;
  await ticket.save();

  fireAndForget(
    emailService.sendTicketReplyEmail(ticket.userEmail, {
      reference: ticket.reference,
      subject: ticket.subject,
      name: ticket.userName,
      replyBody: body,
      status: ticket.status,
    }),
    'admin-reply',
  );

  return ticket.toObject();
}

export async function deleteTicketAdmin(ticketId) {
  ensureValidId(ticketId);
  const deleted = await SupportTicket.findByIdAndDelete(ticketId).lean();
  if (!deleted) throw new AppError('Ticket not found', 404);
  return deleted;
}
