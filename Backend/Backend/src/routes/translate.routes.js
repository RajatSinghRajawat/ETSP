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
    { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async (request) => {
      const { target, texts } = translateBodySchema.parse(request.body);
      const translations = await translateTexts(texts, target);
      return { success: true, data: { translations } };
    },
  );
}
