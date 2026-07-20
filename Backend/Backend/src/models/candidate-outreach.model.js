import mongoose from 'mongoose';

/**
 * Ledger of employers a candidate has messaged first in a given billing
 * period — backs the EXCEL "direct messaging to 3 employers/month" quota.
 * The unique index makes repeat messages to the same employer free.
 */
const candidateOutreachSchema = new mongoose.Schema(
  {
    candidateProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
    },
    employerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile',
      required: true,
    },
    // 'YYYY-MM' for calendar periods, or the subscription periodStart ISO date.
    periodKey: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

candidateOutreachSchema.index(
  { candidateProfile: 1, employerProfile: 1, periodKey: 1 },
  { unique: true },
);

export const CandidateOutreach = mongoose.model('CandidateOutreach', candidateOutreachSchema);
