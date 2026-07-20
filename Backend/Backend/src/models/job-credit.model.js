import mongoose from 'mongoose';

/**
 * A paid "Pay Per Job" credit: one credit = one job post. The validity and
 * per-job unlock pool are snapshotted from the Pay Per Job plan at purchase
 * time so later plan edits don't change already-bought credits.
 */
const jobCreditSchema = new mongoose.Schema(
  {
    employerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile',
      required: true,
      index: true,
    },
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', required: true },
    status: { type: String, enum: ['available', 'consumed'], default: 'available', index: true },
    validityDays: { type: Number, default: 14, min: 1 },
    unlockCreditsPerJob: { type: Number, default: 15, min: 0 },
    consumedByJob: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
    consumedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

jobCreditSchema.index({ employerProfile: 1, status: 1 });

export const JobCredit = mongoose.model('JobCredit', jobCreditSchema);
