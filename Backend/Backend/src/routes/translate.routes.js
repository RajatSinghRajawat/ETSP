import { z } from 'zod';
import { SUPPORTED_TARGETS, translateTexts } from '../services/translation.service.js';

const translateBodySchema = z.object({
  target: z.enum(SUPPORTED_TARGETS),
  texts: z.array(z.string().min(1).max(2000)).min(1).max(200),
});

/**
 * Public (no auth): guests switch the site to Hindi too. The Google key stays
 * on the server; results are cached, and the route is rate limited so it
 * cannot be used as a free translation proxy.
 */
export async function translateRoutes(app) {
  app.post(
    '/',
    // A page load can fire several batches as sections render; 60/min was
    // hit by normal browsing (and by users sharing one office/mobile IP).
    { config: { rateLimit: { max: 300, timeWindow: '1 minute' } } },
    async (request) => {
      const { target, texts } = translateBodySchema.parse(request.body);
      const translations = await translateTexts(texts, target);
      return { success: true, data: { translations } };
    },
  );
}
