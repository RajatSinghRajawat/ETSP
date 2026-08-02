import { useTranslation } from 'react-i18next';
import {
  useGetSiteContentQuery,
  type LocalizedSiteContent,
  type SiteContent,
  type SiteLocaleContent,
} from '../store/api/siteContentApi';

function isBilingual(data: SiteContent | SiteLocaleContent | undefined): data is SiteContent {
  return Boolean(data && 'en' in data && 'hi' in data);
}

/**
 * Returns CMS copy for the active UI language (en / hi).
 * Falls back to English when Hindi is missing; also accepts legacy flat payloads.
 */
export function useLocalizedSiteContent() {
  const { i18n } = useTranslation();
  const query = useGetSiteContentQuery();
  const lang = i18n.language?.toLowerCase().startsWith('hi') ? 'hi' : 'en';

  const raw = query.data?.data;
  let localized: LocalizedSiteContent | undefined;

  if (isBilingual(raw)) {
    const locale = raw[lang] ?? raw.en;
    localized = { social: raw.social, ...locale };
  } else if (raw && 'contact' in raw) {
    // Legacy flat shape (pre-bilingual API).
    const flat = raw as unknown as SiteLocaleContent & { social?: LocalizedSiteContent['social'] };
    localized = {
      social: flat.social ?? { facebook: '', twitter: '', linkedin: '', instagram: '' },
      contact: flat.contact,
      about: flat.about,
      hero: flat.hero,
      jobProfiles: flat.jobProfiles,
      privacy: flat.privacy,
      terms: flat.terms,
      cookies: flat.cookies,
    };
  }

  return {
    ...query,
    lang,
    content: localized,
  };
}
