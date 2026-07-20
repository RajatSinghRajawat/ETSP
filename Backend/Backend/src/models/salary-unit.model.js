import mongoose from 'mongoose';

const salaryUnitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40, unique: true },
    value: { type: String, required: true, trim: true, maxlength: 40, unique: true, index: true },
    description: { type: String, trim: true, default: '', maxlength: 240 },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

salaryUnitSchema.index({ isActive: 1, order: 1 });

export const SalaryUnit = mongoose.model('SalaryUnit', salaryUnitSchema);
