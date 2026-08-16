import { z } from 'zod';
import { BANNER_PLACEMENT_KEYS } from '../constants/banner-placements.js';

// Bare field schemas (no defaults). Defaults are applied only on create —
// zod defaults fire even through .partial(), which would silently reset
// omitted fields on updates.
const titleSchema = z.string().trim().min(1, 'Title is required').max(120);
const altTextSchema = z.string().trim().max(160);

/** Uploaded through our own endpoint, so it must be a URL we serve. */
const imageUrlSchema = z
  .string()
  .trim()
  .min(1, 'Upload a banner image')
  .refine((value) => value.includes('/uploads/banners/'), {
    message: 'Banner image must be uploaded through the banner upload endpoint',
  });

/**
 * Clicking a banner sends a visitor off-site, so only http(s) is accepted —
 * this is what blocks a javascript: or data: URL from reaching the markup.
 */
const linkUrlSchema = z
  .string()
  .trim()
  .min(1, 'Link is required')
  .max(2000)
  .refine((value) => /^https?:\/\//i.test(value), {
    message: 'Link must start with http:// or https://',
  });

const placementsSchema = z
  .array(z.enum(BANNER_PLACEMENT_KEYS))
  .min(1, 'Pick at least one place to show the banner');

// Accepts an ISO string or an empty value, which clears the bound.
const dateSchema = z
  .union([z.string().trim(), z.null()])
  .transform((value) => (value ? new Date(value) : null))
  .refine((value) => value === null || !Number.isNaN(value.getTime()), {
    message: 'Enter a valid date',
  });

const bannerFields = {
  title: titleSchema,
  imageUrl: imageUrlSchema,
  linkUrl: linkUrlSchema,
  altText: altTextSchema,
  placements: placementsSchema,
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
  startsAt: dateSchema,
  endsAt: dateSchema,
};

/** A campaign that ends before it starts would never render. */
const withOrderedSchedule = (schema) =>
  schema.refine(
    (value) => !value.startsAt || !value.endsAt || value.endsAt >= value.startsAt,
    { message: 'End date must be after the start date', path: ['endsAt'] },
  );

export const createBannerSchema = withOrderedSchedule(
  z.object({
    ...bannerFields,
    altText: altTextSchema.default(''),
    isActive: z.boolean().default(true),
    sortOrder: bannerFields.sortOrder.default(0),
    startsAt: dateSchema.default(null),
    endsAt: dateSchema.default(null),
  }),
);

export const updateBannerSchema = withOrderedSchedule(z.object(bannerFields).partial());
