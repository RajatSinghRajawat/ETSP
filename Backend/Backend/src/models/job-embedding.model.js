import mongoose from 'mongoose';

const jobEmbeddingSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      unique: true,
      index: true,
    },
    // Source text used to compute the embedding. Stored so we can detect when
    // the job has changed (sourceHash mismatch) and skip recomputing otherwise.
    sourceText: { type: String, required: true },
    sourceHash: { type: String, required: true, index: true },
    // text-embedding-3-small produces 1536-dim float vectors.
    vector: { type: [Number], required: true },
    // Light denormalised metadata so semantic search can filter without an
    // extra Job lookup per candidate match.
    status: { type: String, default: 'active', index: true },
    location: { type: String, default: '', index: true },
    type: { type: String, default: '', index: true },
    skills: { type: [String], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const JobEmbedding = mongoose.model('JobEmbedding', jobEmbeddingSchema);
