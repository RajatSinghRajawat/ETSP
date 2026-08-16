import * as bannerService from '../services/banner.service.js';
import { uploadBannerImage } from '../services/banner-upload.service.js';

function ok(message, data) {
  return { success: true, message, data };
}

// ---- admin ----

export async function getBannerPlacements() {
  return ok('Banner placements fetched successfully', bannerService.listPlacements());
}

export async function getBanners(request) {
  const data = await bannerService.listBannersAdmin(request.query);
  return ok('Banners fetched successfully', data);
}

export async function postBannerImage(request, reply) {
  const file = await request.file();
  const upload = await uploadBannerImage(file);
  return reply.code(201).send(ok('Banner image uploaded successfully', upload));
}

export async function postBanner(request, reply) {
  const data = await bannerService.createBanner(request.body);
  return reply.code(201).send(ok('Banner created successfully', data));
}

export async function patchBanner(request) {
  const data = await bannerService.updateBanner(request.params.id, request.body);
  return ok('Banner updated successfully', data);
}

export async function removeBanner(request) {
  const data = await bannerService.deleteBanner(request.params.id);
  return ok('Banner deleted successfully', data);
}

// ---- public ----

export async function getPublicBanners(request) {
  const data = await bannerService.listPublicBanners(request.query.placement);
  return ok('Banners fetched successfully', data);
}

export async function postBannerClick(request) {
  const data = await bannerService.registerBannerClick(request.params.id);
  return ok('Banner click recorded successfully', data);
}
