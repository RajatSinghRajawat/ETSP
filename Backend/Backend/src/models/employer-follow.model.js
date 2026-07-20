import mongoose from 'mongoose';

/**
 * EXCEL candidate feature: follow an employer to get an email whenever they
 * post a new job.
 */
const employerFollowSchema = new mongoose.Schema(
  {
    candidateProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
    },
    candidateEmail: { type: String, required: true, lowercase: true, trim: true },
    employerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

employerFollowSchema.index({ candidateProfile: 1, employerProfile: 1 }, { unique: true });

export const EmployerFollow = mongoose.model('EmployerFollow', employerFollowSchema);
