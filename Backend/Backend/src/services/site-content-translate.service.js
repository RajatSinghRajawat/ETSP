import OpenAI from 'openai';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
import { LOCALE_SECTION_KEYS } from '../constants/site-content.defaults.js';
import { getSiteContent, updateSiteContent } from './settings.service.js';

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

const SYSTEM_PROMPT = `You translate website CMS JSON from English to Hindi (Devanagari script).

Rules:
- Return ONLY valid minified JSON with the same structure as the input.
- Translate all user-facing text fields to natural Hindi.
- Do NOT translate or change these technical fields: email, phone, hiringCtaPath, primaryCtaPath, secondaryCtaPath, ctaPrimaryPath, ctaSecondaryPath, missionImageUrl, id, searchQuery, color, bgColor, iconKey, image, year, value (in stats — keep numbers like "10,000+" as-is; only translate "label").
- Keep URLs, paths, IDs, colors, icon keys, and email/phone exactly as given.
- Preserve array lengths and object keys exactly.
- Do not add markdown, commentary, or code fences.`;

/**
 * Re-apply non-translatable fields from the English source after the model runs,
 * so paths/IDs/colors never get mangled.
 */
function restoreTechnicalFields(source, translated) {
  if (!translated || typeof translated !== 'object') return source;

  const next = { ...translated };

  if (source.contact && next.contact) {
    next.contact = {
      ...next.contact,
      email: source.contact.email,
      phone: source.contact.phone,
    };
  }

  if (source.hero && next.hero) {
    next.hero = {
      ...next.hero,
      hiringCtaPath: source.hero.hiringCtaPath,
    };
  }

  if (source.about && next.about) {
    next.about = {
      ...next.about,
      primaryCtaPath: source.about.primaryCtaPath,
      secondaryCtaPath: source.about.secondaryCtaPath,
      missionImageUrl: source.about.missionImageUrl,
      ctaPrimaryPath: source.about.ctaPrimaryPath,
      ctaSecondaryPath: source.about.ctaSecondaryPath,
      stats: Array.isArray(next.about.stats)
        ? next.about.stats.map((stat, index) => ({
            ...stat,
            value: source.about.stats?.[index]?.value ?? stat.value,
          }))
        : source.about.stats,
      values: Array.isArray(next.about.values)
        ? next.about.values.map((item, index) => ({
            ...item,
            id: source.about.values?.[index]?.id ?? item.id,
            iconKey: source.about.values?.[index]?.iconKey ?? item.iconKey,
          }))
        : source.about.values,
      milestones: Array.isArray(next.about.milestones)
        ? next.about.milestones.map((item, index) => ({
            ...item,
            year: source.about.milestones?.[index]?.year ?? item.year,
          }))
        : source.about.milestones,
      team: Array.isArray(next.about.team)
        ? next.about.team.map((member, index) => ({
            ...member,
            image: source.about.team?.[index]?.image ?? member.image,
          }))
        : source.about.team,
    };
  }

  if (Array.isArray(source.jobProfiles?.items) && Array.isArray(next.jobProfiles?.items)) {
    next.jobProfiles = {
      ...next.jobProfiles,
      items: next.jobProfiles.items.map((item, index) => {
        const src = source.jobProfiles.items[index] ?? {};
        return {
          ...item,
          id: src.id ?? item.id,
          searchQuery: src.searchQuery ?? item.searchQuery,
          color: src.color ?? item.color,
          bgColor: src.bgColor ?? item.bgColor,
          iconKey: src.iconKey ?? item.iconKey,
        };
      }),
    };
  }

  for (const legalKey of ['privacy', 'terms', 'cookies']) {
    if (!source[legalKey] || !next[legalKey]) continue;
    const srcSections = source[legalKey].sections ?? [];
    const dstSections = Array.isArray(next[legalKey].sections) ? next[legalKey].sections : [];
    next[legalKey] = {
      ...next[legalKey],
      sections: dstSections.map((section, index) => ({
        ...section,
        id: srcSections[index]?.id ?? section.id,
      })),
    };
  }

  return next;
}

/**
 * Translate English CMS copy → Hindi with OpenAI and persist under `hi`.
 * @param {{ sections?: string[] }} [options]
 */
export async function translateSiteContentToHindi({ sections } = {}) {
  if (!openai || !env.OPENAI_API_KEY) {
    throw new AppError(
      'OpenAI is not configured. Set OPENAI_API_KEY to enable AI translation.',
      503,
    );
  }

  const content = await getSiteContent();
  const keys = Array.isArray(sections) && sections.length
    ? sections.filter((key) => LOCALE_SECTION_KEYS.includes(key))
    : [...LOCALE_SECTION_KEYS];

  if (!keys.length) {
    throw new AppError('No valid sections to translate', 400);
  }

  const payload = {};
  for (const key of keys) {
    payload[key] = content.en[key];
  }

  let translated;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Translate this CMS JSON from English to Hindi. Keep the same keys:\n${JSON.stringify(payload)}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      throw new AppError('OpenAI returned an empty translation', 502);
    }

    translated = JSON.parse(raw);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Site content translation failed');
    throw new AppError(
      error?.message?.includes('JSON')
        ? 'AI returned invalid JSON for translation'
        : 'Failed to translate site content with OpenAI',
      502,
    );
  }

  const hiPatch = restoreTechnicalFields(payload, translated);
  return updateSiteContent({ hi: hiPatch });
}
