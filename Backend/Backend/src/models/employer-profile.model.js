import mongoose from 'mongoose';

const employerProfileSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true, maxlength: 120, index: true },
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    phoneNumber: { type: String, required: true, trim: true, maxlength: 20, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    website: { type: String, trim: true, default: '' },
    organizationType: { type: String, required: true, trim: true, maxlength: 80 },
    foundedYear: { type: String, trim: true, default: '' },
    teamSize: { type: String, required: true, trim: true, maxlength: 40 },
    headquarters: { type: String, required: true, trim: true, maxlength: 120 },
    activeJobs: { type: String, trim: true, default: '' },
    workplaceModel: { type: String, trim: true, default: 'On-site' },
    hiringUrgency: { type: String, trim: true, default: 'Standard' },
    logoUrl: { type: String, trim: true, default: '' },
    overview: { type: String, required: true, trim: true, maxlength: 2000 },
    specialties: { type: [String], default: [], index: true },
    benefits: { type: [String], default: [] },
    hiringRegions: { type: [String], default: [], index: true },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    // Account-wide profile-unlock credits bought via add-ons (₹199 → +20,
    // per-CV ₹25/₹75). Per-job pools on the Job document are spent first.
    unlockCreditBalance: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['draft', 'submitted'],
      default: 'submitted',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const EmployerProfile = mongoose.model('EmployerProfile', employerProfileSchema);
