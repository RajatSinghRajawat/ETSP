import mongoose from 'mongoose';
import { BANNER_PLACEMENT_KEYS } from '../constants/banner-placements.js';

/**
 * An advertisement banner the admin uploads: an image that links somewhere.
 * One banner can occupy several placements at once, so the same creative can
 * run site-wide without being uploaded again.
 *
 * A banner is shown only while `isActive` is true and the current time falls
 * inside its optional schedule; within a placement, lower `sortOrder` wins.
 */
const bannerSchema = new mongoose.Schema(
  {
    // Internal name, shown in the admin list only — never on the public site.
    title: { type: String, required: true, trim: true, maxlength: 120 },
    imageUrl: { type: String, required: true, trim: true },
    linkUrl: { type: String, required: true, trim: true },
    // Describes the creative for screen readers and broken-image fallbacks.
    altText: { type: String, trim: true, maxlength: 160, default: '' },
    placements: {
      type: [{ type: String, enum: BANNER_PLACEMENT_KEYS }],
      required: true,
      validate: {
        validator: (values) => Array.isArray(values) && values.length > 0,
        message: 'Pick at least one placement for the banner',
      },
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    // Optional campaign window; null on either side means "no bound".
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    clickCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

// Serves the public per-placement lookup: filter by placement + isActive, then sort.
bannerSchema.index({ placements: 1, isActive: 1, sortOrder: 1 });

export const Banner = mongoose.model('Banner', bannerSchema);
