import mongoose from 'mongoose';
import { LOOKUP_CATEGORIES, LOOKUP_STATUSES } from '../constants/lookup-categories.js';

const lookupOptionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: LOOKUP_CATEGORIES,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    value: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, default: '', maxlength: 240 },
    order: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: LOOKUP_STATUSES,
      default: 'approved',
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    proposedByEmail: { type: String, trim: true, default: '', maxlength: 200 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, default: '', maxlength: 400 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

lookupOptionSchema.index({ category: 1, value: 1 }, { unique: true });
lookupOptionSchema.index({ category: 1, name: 1 }, { unique: true });
lookupOptionSchema.index({ category: 1, status: 1, isActive: 1, order: 1 });

export const LookupOption = mongoose.model('LookupOption', lookupOptionSchema);
