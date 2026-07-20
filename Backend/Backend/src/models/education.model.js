import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120, unique: true },
    value: { type: String, required: true, trim: true, maxlength: 60, unique: true, index: true },
    description: { type: String, trim: true, default: '', maxlength: 240 },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

educationSchema.index({ isActive: 1, order: 1 });

export const Education = mongoose.model('Education', educationSchema);
