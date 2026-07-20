import mongoose from 'mongoose';

const screeningQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false },
);

const jobSchema = new mongoose.Schema(
  {
    employerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile',
      required: true,
      index: true,
    },
    employerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    companyName: { type: String, required: true, trim: true, maxlength: 120 },
    title: { type: String, required: true, trim: true, maxlength: 140, index: true },
    type: { type: String, required: true, trim: true, maxlength: 40 },
    location: { type: String, required: true, trim: true, maxlength: 120, index: true },
    salary: { type: String, trim: true, default: '' },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    skills: { type: [String], default: [], index: true },
    experience: { type: String, required: true, trim: true, maxlength: 40 },
    education: { type: String, required: true, trim: true, maxlength: 120 },
    benefits: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed', 'expired'],
      default: 'active',
      index: true,
    },
    // Plan-driven validity: set from the plan's jobValidityDays (or the job
    // credit's validityDays) when the job is posted/reactivated. null = never
    // expires (grandfathered pre-subscription jobs).
    expiresAt: { type: Date, default: null, index: true },
    // Premium plan feature — featured jobs are pinned first in listings.
    isFeatured: { type: Boolean, default: false, index: true },
    // Paid add-on (₹199) — urgent hiring tag shown on the job card.
    isUrgent: { type: Boolean, default: false },
    // Which entitlement posted this job. Pay-per-job posts don't count against
    // the base plan's concurrent-active limit.
    postedVia: { type: String, enum: ['free', 'pay_per_job', 'premium'], default: 'free' },
    jobCredit: { type: mongoose.Schema.Types.ObjectId, ref: 'JobCredit', default: null },
    // Per-job profile-unlock pool, snapshotted from the plan/credit at posting.
    unlockCreditsTotal: { type: Number, default: 0 },
    unlockCreditsUsed: { type: Number, default: 0 },
    // Paid-plan feature: questions candidates answer while applying (max 5).
    screeningQuestions: { type: [screeningQuestionSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

jobSchema.index({ employerEmail: 1, status: 1, createdAt: -1 });
jobSchema.index({ employerProfile: 1, status: 1, postedVia: 1 });

export const Job = mongoose.model('Job', jobSchema);
