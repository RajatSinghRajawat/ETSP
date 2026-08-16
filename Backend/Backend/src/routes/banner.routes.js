import { getPublicBanners, postBannerClick } from '../controllers/banner.controller.js';

/** Public banner slots — read by the website for anonymous and signed-in visitors alike. */
export async function bannerRoutes(app) {
  app.get('/', getPublicBanners);
  app.post('/:id/click', postBannerClick);
}
