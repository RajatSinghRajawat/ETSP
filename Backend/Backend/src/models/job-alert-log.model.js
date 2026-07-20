import mongoose from 'mongoose';

/**
 * Dedupe ledger for job notification emails (matching-job alerts and
 * followed-employer updates) — one email per job per candidate per kind.
 */
const jobAlertLogSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    candidateProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
    },
    kind: { type: String, enum: ['alert', 'follow'], required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

jobAlertLogSchema.index({ job: 1, candidateProfile: 1, kind: 1 }, { unique: true });

export const JobAlertLog = mongoose.model('JobAlertLog', jobAlertLogSchema);
