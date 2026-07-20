import mongoose from 'mongoose';

const candidateExperienceSchema = new mongoose.Schema(
  {
    jobTitle: { type: String, trim: true, default: '' },
    employmentType: { type: String, trim: true, default: '' },
    organizationName: { type: String, trim: true, default: '' },
    joiningDate: { type: String, trim: true, default: '' },
    endDate: { type: String, trim: true, default: '' },
    roleDescription: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const candidateProfileSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    phone: { type: String, required: true, trim: true, maxlength: 20, unique: true },
    address: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    pincode: { type: String, trim: true, default: '' },
    currentLocation: { type: String, required: true, trim: true },
    gender: { type: String, trim: true, default: '' },
    aadhaarVerified: { type: Boolean, default: false },
    preferredLocations: { type: [String], default: [] },
    profileSummary: { type: String, trim: true, default: '' },
    photoUrl: { type: String, trim: true, default: '' },
    degree: { type: String, required: true, trim: true },
    educationLevel: { type: String, required: true, trim: true },
    specialization: { type: String, trim: true, default: '' },
    courseType: { type: String, trim: true, default: '' },
    courseStartDate: { type: String, trim: true, default: '' },
    courseEndDate: { type: String, trim: true, default: '' },
    grade: { type: String, trim: true, default: '' },
    educationCountry: { type: String, trim: true, default: 'India' },
    educationCity: { type: String, trim: true, default: '' },
    additionalDetails: { type: String, trim: true, default: '' },
    certifications: { type: [String], default: [] },
    professionalLicenses: { type: String, trim: true, default: '' },
    currentJobTitle: { type: String, required: true, trim: true },
    employmentType: { type: String, trim: true, default: '' },
    organizationName: { type: String, required: true, trim: true },
    currentSalary: { type: String, trim: true, default: '' },
    salaryFormat: { type: String, trim: true, default: 'per annum' },
    skills: { type: [String], default: [], index: true },
    experiences: { type: [candidateExperienceSchema], default: [] },
    // Plan feature (AI auto job apply): when on, the platform automatically
    // applies to jobs matching the candidate's skills and locations.
    autoApplyEnabled: { type: Boolean, default: false, index: true },
    // Set when the email OTP login succeeds / the phone OTP flow completes.
    // The EXCEL verified badge requires both.
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    // EXCEL-only toggle — free profiles are always open to recruiters, so this
    // is forced true unless the plan has visibilityToggleEnabled.
    profileVisible: { type: Boolean, default: true, index: true },
    // EXCEL feature: email alerts for newly posted matching jobs.
    jobAlertsEnabled: { type: Boolean, default: false, index: true },
    // Paid resume-builder credits (₹25 each) for free-plan candidates.
    resumeCreditBalance: { type: Number, default: 0, min: 0 },
    // Denormalized from the live subscription (written on activation, cleared
    // by the periodic sweep) so employer-facing queries never need a join.
    subscriptionTier: { type: String, enum: ['free', 'excel'], default: 'free', index: true },
    subscriptionExpiresAt: { type: Date, default: null },
    // Search-ranking weight — 100 while EXCEL is active, 0 otherwise.
    searchBoost: { type: Number, default: 0, index: true },
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

export const CandidateProfile = mongoose.model('CandidateProfile', candidateProfileSchema);
