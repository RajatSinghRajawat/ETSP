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

    // The employer's private triage mark from the applicant list (the ✓ / ? / ✗
    // buttons). Deliberately separate from `status`: it never notifies the
    // candidate and never moves the application through the hiring pipeline.
    employerInterest: {
      type: String,
      enum: ['', 'interested', 'undecided', 'not_interested'],
      default: '',
      index: true,
    },

    // Set the first time the employer opens the application detail page, so the
    // candidate can see that their application was actually looked at.
    viewedByEmployer: { type: Boolean, default: false, index: true },
    viewedAt: { type: Date, default: null },

    // The employer's latest note to the candidate — the rejection reason, the
    // shortlist note, or the message that came with the interview invite.
    employerMessage: { type: String, trim: true, default: '', maxlength: 1000 },

    // Interview details, filled when the employer accepts (shortlists/hires).
    interview: {
      scheduledAt: { type: Date, default: null },
      mode: {
        type: String,
        enum: ['in_person', 'video', 'phone', ''],
        default: '',
      },
      location: { type: String, trim: true, default: '', maxlength: 300 },
      message: { type: String, trim: true, default: '', maxlength: 1000 },
    },

    // Append-only trail of every stage move — this is what the candidate sees
    // as the application timeline.
    statusHistory: {
      type: [
        new mongoose.Schema(
          {
            status: {
              type: String,
              enum: ['new', 'reviewing', 'shortlisted', 'rejected', 'hired'],
              required: true,
            },
            message: { type: String, trim: true, default: '', maxlength: 1000 },
            interviewAt: { type: Date, default: null },
            changedAt: { type: Date, default: Date.now },
          },
          { _id: false },
        ),
      ],
      default: [],
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
