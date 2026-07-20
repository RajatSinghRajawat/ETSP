import mongoose from 'mongoose';

/**
 * Records that an employer has unlocked a candidate's full profile (name,
 * contact, resume). Unlocks are permanent and global per employer×candidate —
 * the unique index makes double-spending impossible.
 */
const profileUnlockSchema = new mongoose.Schema(
  {
    employerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile',
      required: true,
    },
    candidateProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
      index: true,
    },
    // Audit only — which job's pool the credit came from (null = account balance).
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
    source: { type: String, enum: ['job_pool', 'account_balance'], required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

profileUnlockSchema.index({ employerProfile: 1, candidateProfile: 1 }, { unique: true });

export const ProfileUnlock = mongoose.model('ProfileUnlock', profileUnlockSchema);
