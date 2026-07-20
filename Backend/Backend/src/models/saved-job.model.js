import mongoose from 'mongoose';

const savedJobSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// A candidate can save a given job only once.
savedJobSchema.index({ job: 1, candidateProfile: 1 }, { unique: true });

export const SavedJob = mongoose.model('SavedJob', savedJobSchema);
