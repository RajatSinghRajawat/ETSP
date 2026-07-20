import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80, unique: true },
    value: { type: String, required: true, trim: true, maxlength: 80, unique: true, index: true },
    description: { type: String, trim: true, default: '', maxlength: 240 },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

skillSchema.index({ isActive: 1, order: 1 });

export const Skill = mongoose.model('Skill', skillSchema);
