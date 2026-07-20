import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
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
    candidateEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    coverLetter: { type: String, trim: true, default: '', maxlength: 2000 },
    // Answers to the job's screening questions (paid employer plan feature).
    screeningAnswers: {
      type: [
        new mongoose.Schema(
          {
            question: { type: String, trim: true, maxlength: 300 },
            answer: { type: String, trim: true, maxlength: 1000 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    // Applied automatically by the AI auto-apply plan feature.
    isAutoApplied: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['new', 'reviewing', 'shortlisted', 'rejected', 'hired'],
      default: 'new',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

jobApplicationSchema.index({ job: 1, candidateEmail: 1 }, { unique: true });
jobApplicationSchema.index({ employerProfile: 1, status: 1, createdAt: -1 });

export const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
