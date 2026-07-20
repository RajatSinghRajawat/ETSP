import mongoose from 'mongoose';

/**
 * A 1:1 chat channel between an employer and a candidate.
 * Created lazily on the first message — never pre-created, so empty channels
 * never exist. One channel per (employerProfile, candidateProfile) pair; the
 * related job is kept only as display context.
 */
const conversationSchema = new mongoose.Schema(
  {
    employerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile',
      required: true,
      index: true,
    },
    candidateProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
      index: true,
    },
    employerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    candidateEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    employerName: { type: String, default: '' },
    candidateName: { type: String, default: '' },

    // Display context — the job that connected them (first job they interacted on).
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
    jobTitle: { type: String, default: '' },

    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: null, index: true },
    lastMessageSender: { type: String, enum: ['employer', 'candidate', null], default: null },

    // Unread counters per side.
    employerUnread: { type: Number, default: 0 },
    candidateUnread: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

conversationSchema.index({ employerProfile: 1, candidateProfile: 1 }, { unique: true });

export const Conversation = mongoose.model('Conversation', conversationSchema);
