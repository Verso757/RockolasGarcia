/**
 * Utility to obtain the true, public world-accessible URL for the Rockola
 * Supports custom domain rafael.familiagarcia.site as the primary domain
 * and falls back gracefully to Cloud Run development/production URLs.
 */

export const CUSTOM_DOMAIN = 'https://rafael.familiagarcia.site';
export const CLOUD_RUN_DEV_URL = 'https://ais-dev-gabu2356ad3gt7v22gf6ak-325907120404.us-east1.run.app';

export function getPublicRockolaUrl(targetMode: 'tv' | 'guest' = 'guest'): string {
  if (typeof window === 'undefined') {
    return `${CUSTOM_DOMAIN}/?mode=${targetMode}`;
  }

  const hostname = window.location.hostname.toLowerCase();

  // If user is accessing via the custom domain rafael.familiagarcia.site
  if (hostname.includes('familiagarcia.site')) {
    try {
      const url = new URL(window.location.origin);
      url.searchParams.set('mode', targetMode);
      return url.toString();
    } catch {
      return `${CUSTOM_DOMAIN}/?mode=${targetMode}`;
    }
  }

  // If the browser is running on localhost, 127.0.0.1, or a private internal development cluster:
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('cloudworkstations.dev') ||
    hostname.includes('webcontainer')
  ) {
    // Prefer custom domain if configured, or the live cloud run url
    return `${CUSTOM_DOMAIN}/?mode=${targetMode}`;
  }

  // If already on Cloud Run (.run.app) or another live public domain
  try {
    const url = new URL(window.location.origin);
    url.searchParams.set('mode', targetMode);
    return url.toString();
  } catch {
    return `${CUSTOM_DOMAIN}/?mode=${targetMode}`;
  }
}
