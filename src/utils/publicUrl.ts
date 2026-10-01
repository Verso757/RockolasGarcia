/**
 * Utility to obtain the true, public world-accessible URL for the Rockola
 * Ensures both PC and mobile connect to the SAME active backend server.
 */

export const CLOUD_RUN_DEV_URL = 'https://ais-dev-gabu2356ad3gt7v22gf6ak-325907120404.us-east1.run.app';
export const CUSTOM_DOMAIN = 'https://rafael.familiagarcia.site';

export function getPublicRockolaUrl(targetMode: 'tv' | 'guest' = 'guest'): string {
  if (typeof window === 'undefined') {
    return `${CLOUD_RUN_DEV_URL}/?mode=${targetMode}`;
  }

  const hostname = window.location.hostname.toLowerCase();

  // If currently browsing through the custom domain (once Hostinger DNS is live)
  if (hostname.includes('familiagarcia.site')) {
    try {
      const url = new URL(window.location.origin);
      url.searchParams.set('mode', targetMode);
      return url.toString();
    } catch {
      return `${CUSTOM_DOMAIN}/?mode=${targetMode}`;
    }
  }

  // If running on a live Cloud Run domain (ais-dev-...run.app or ais-pre-...run.app)
  if (hostname.endsWith('.run.app')) {
    try {
      const url = new URL(window.location.origin);
      url.searchParams.set('mode', targetMode);
      return url.toString();
    } catch {
      return `${CLOUD_RUN_DEV_URL}/?mode=${targetMode}`;
    }
  }

  // If running on localhost, 127.0.0.1, or private developer workstation:
  // Must use the live Cloud Run development URL so any phone scanning the QR
  // connects directly to this exact live instance!
  return `${CLOUD_RUN_DEV_URL}/?mode=${targetMode}`;
}
