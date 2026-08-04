import mongoose from 'mongoose';

export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
export const TICKET_PRIORITIES = ['low', 'normal', 'high'];
export const TICKET_CATEGORIES = [
  'account',
  'billing',
  'jobs',
  'applications',
  'technical',
  'other',
];

/** One message on a ticket — from the ticket owner or from an admin. */
const ticketMessageSchema = new mongoose.Schema(
  {
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    authorRole: { type: String, required: true, enum: ['user', 'admin'] },
    authorName: { type: String, trim: true, default: '', maxlength: 160 },
    authorEmail: { type: String, trim: true, lowercase: true, default: '', maxlength: 200 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true, versionKey: false },
);

const supportTicketSchema = new mongoose.Schema(
  {
    // Human-facing reference shown to the user and quoted in emails.
    reference: { type: String, required: true, unique: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, enum: TICKET_CATEGORIES, default: 'other', index: true },
    priority: { type: String, enum: TICKET_PRIORITIES, default: 'normal', index: true },
    status: { type: String, enum: TICKET_STATUSES, default: 'open', index: true },

    // Ticket owner. Denormalised so admin lists and emails need no extra joins.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    userName: { type: String, trim: true, default: '', maxlength: 160 },
    userRole: { type: String, trim: true, default: '', maxlength: 40 },

    messages: { type: [ticketMessageSchema], default: [] },

    lastMessageAt: { type: Date, default: Date.now, index: true },
    // Drives the "new reply" badge in the user's dashboard.
    unreadForUser: { type: Boolean, default: false },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

supportTicketSchema.index({ userEmail: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, lastMessageAt: -1 });

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
