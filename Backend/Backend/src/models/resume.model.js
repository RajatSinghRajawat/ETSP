import mongoose from 'mongoose';

/**
 * A candidate's resume. Two ways to have one, and a candidate may hold both:
 *  - `ai`     — generated (and hand-editable) HTML in `htmlContent`
 *  - `upload` — a PDF/DOC the candidate uploaded themselves
 *
 * `source` decides which of the two employers actually see.
 */
const resumeSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
      unique: true,
      index: true,
    },
    // Empty until the AI builder runs — an upload-only candidate never has it.
    htmlContent: { type: String, default: '' },
    uploadedFile: {
      url: { type: String, default: '' },
      fileName: { type: String, default: '' },
      originalName: { type: String, default: '' },
      mimeType: { type: String, default: '' },
      size: { type: Number, default: 0 },
      uploadedAt: { type: Date, default: null },
    },
    source: { type: String, enum: ['ai', 'upload'], default: 'ai' },
  },
  { timestamps: true, versionKey: false },
);

export const Resume = mongoose.model('Resume', resumeSchema);
