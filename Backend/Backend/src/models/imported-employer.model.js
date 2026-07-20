import mongoose from 'mongoose';

const importedEmployerSchema = new mongoose.Schema(
  {
    companyName: { type: String, trim: true, maxlength: 200, default: '', index: true },
    category: { type: String, trim: true, maxlength: 120, default: '' },
    state: { type: String, trim: true, maxlength: 120, default: '' },
    cities: { type: [String], default: [] },
    firstName: { type: String, trim: true, maxlength: 80, default: '' },
    lastName: { type: String, trim: true, maxlength: 80, default: '' },
    designation: { type: String, trim: true, maxlength: 120, default: '' },
    contactNumber: { type: String, trim: true, maxlength: 30, default: '' },
    whatsappNumber: { type: String, trim: true, maxlength: 30, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '', index: true },
    website: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, maxlength: 500, default: '' },
    pincode: { type: String, trim: true, maxlength: 12, default: '' },
    aboutUs: { type: String, trim: true, maxlength: 2000, default: '' },
    staffSize: { type: String, trim: true, maxlength: 40, default: '' },
    contactNumberDigits: { type: String, trim: true, default: '', index: true },
    whatsappNumberDigits: { type: String, trim: true, default: '', index: true },
    status: {
      type: String,
      enum: ['imported', 'registered'],
      default: 'imported',
      index: true,
    },
    registeredProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile',
      default: null,
    },
    sourceFileName: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const ImportedEmployer = mongoose.model('ImportedEmployer', importedEmployerSchema);
