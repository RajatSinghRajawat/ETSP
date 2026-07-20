import mongoose from 'mongoose';

/**
 * Generic key/value application settings managed from the admin panel
 * (e.g. key: 'stripe'). Secret fields inside `value` are stored encrypted
 * (AES-256-GCM, `v1:...` format) — see utils/crypto.js.
 */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Setting = mongoose.model('Setting', settingSchema);
