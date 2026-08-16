import mongoose from 'mongoose';
import { BANNER_PLACEMENTS, isBannerPlacement } from '../constants/banner-placements.js';
import { Banner } from '../models/banner.model.js';
import { AppError } from '../utils/app-error.js';
import { deleteBannerImage } from './banner-upload.service.js';

const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

async function findBannerOr404(id) {
  if (!isObjectId(id)) throw new AppError('Banner not found', 404);
  const banner = await Banner.findById(id);
  if (!banner) throw new AppError('Banner not found', 404);
  return banner;
}

export function listPlacements() {
  return BANNER_PLACEMENTS;
}

export async function listBannersAdmin(query = {}) {
  const filters = {};
  if (query.placement) {
    if (!isBannerPlacement(query.placement)) throw new AppError('Unknown placement', 400);
    filters.placements = query.placement;
  }
  if (query.isActive === 'true') filters.isActive = true;
  if (query.isActive === 'false') filters.isActive = false;

  return Banner.find(filters).sort({ sortOrder: 1, createdAt: -1 }).lean();
}

export async function createBanner(input) {
  const banner = await Banner.create(input);
  return banner.toObject();
}

export async function updateBanner(id, input) {
  const banner = await findBannerOr404(id);
  const previousImageUrl = banner.imageUrl;

  Object.assign(banner, input);
  await banner.save();

  // Only once the new image is safely persisted do we drop the old file.
  if (input.imageUrl && input.imageUrl !== previousImageUrl) {
    await deleteBannerImage(previousImageUrl);
  }

  return banner.toObject();
}

export async function deleteBanner(id) {
  const banner = await findBannerOr404(id);
  await banner.deleteOne();
  await deleteBannerImage(banner.imageUrl);
  return { id };
}

/**
 * Banners the public site should render in one placement right now: active,
 * inside their schedule, best-ranked first. Only display fields are returned —
 * the internal title and click count stay in the admin.
 */
export async function listPublicBanners(placement) {
  if (!isBannerPlacement(placement)) throw new AppError('Unknown placement', 400);

  const now = new Date();

  return Banner.find({
    placements: placement,
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  })
    .sort({ sortOrder: 1, createdAt: -1 })
    .select('imageUrl linkUrl altText')
    .lean();
}

/**
 * Counts a click and hands back the destination. Resolving the URL server-side
 * keeps the redirect target tied to the record the admin actually configured.
 */
export async function registerBannerClick(id) {
  if (!isObjectId(id)) throw new AppError('Banner not found', 404);

  // The pre-update document is enough — the click only changes the counter.
  const banner = await Banner.findByIdAndUpdate(
    id,
    { $inc: { clickCount: 1 } },
    { projection: { linkUrl: 1 } },
  ).lean();

  if (!banner) throw new AppError('Banner not found', 404);
  return { linkUrl: banner.linkUrl };
}
