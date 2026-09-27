import mongoose from 'mongoose';

/**
 * Cache of machine translations for UI text. The same button labels and
 * headings are requested by every visitor, so each unique string is sent to
 * Google once and served from here afterwards.
 */
const translationSchema = new mongoose.Schema(
  {
    // sha256 of `${target}:${text}` — keeps the unique index small for long strings.
    key: { type: String, required: true, unique: true },
    target: { type: String, required: true },
    source: { type: String, required: true },
    translated: { type: String, required: true },
  },
  { timestamps: true },
);

export const Translation = mongoose.model('Translation', translationSchema);
