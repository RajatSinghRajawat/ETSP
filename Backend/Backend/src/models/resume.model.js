import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
      unique: true,
      index: true,
    },
    htmlContent: { type: String, required: true },
  },
  { timestamps: true, versionKey: false },
);

export const Resume = mongoose.model('Resume', resumeSchema);
