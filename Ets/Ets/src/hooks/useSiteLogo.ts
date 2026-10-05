import { useEffect, useState } from 'react';
import { useGetSiteContentQuery } from '../store/api/siteContentApi';

/** Bundled logo, shown until an admin uploads one (and if theirs fails to load). */
export const DEFAULT_LOGO = '/Logo.png';

const STORAGE_KEY = 'ets-site-logo';

function readCachedLogo(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

/**
 * The website logo managed from the admin panel (Site Content → Logo).
 *
 * The last known URL is cached so a returning visitor sees the right logo
 * immediately instead of the default one flashing while site content loads.
 */
export function useSiteLogo() {
  const { data } = useGetSiteContentQuery();
  const [cachedLogo] = useState(readCachedLogo);
  const [failedLogo, setFailedLogo] = useState<string | null>(null);

  const loaded = data?.data !== undefined;
  const serverLogo = data?.data?.branding?.logoUrl?.trim() ?? '';
  const customLogo = loaded ? serverLogo : cachedLogo;

  useEffect(() => {
    if (!loaded) return;
    try {
      if (serverLogo) localStorage.setItem(STORAGE_KEY, serverLogo);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage blocked — the logo still comes from the API on each visit.
    }
  }, [loaded, serverLogo]);

  const isCustom = Boolean(customLogo) && failedLogo !== customLogo;

  return {
    logoSrc: isCustom ? customLogo : DEFAULT_LOGO,
    /** False while the bundled default logo is showing. */
    isCustom,
    /** Pass to the <img> so a missing upload falls back to the default logo. */
    onLogoError: () => {
      if (isCustom) setFailedLogo(customLogo);
    },
  };
}
