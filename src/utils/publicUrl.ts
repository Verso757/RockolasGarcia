/**
 * Utility to obtain the true, public world-accessible URL for the Rockola
 * so that any external mobile phone scanning the QR code or opening the link
 * can connect without hitting "localhost" or private internal workstation 404s.
 */

const PUBLIC_FALLBACK_URL = 'https://ais-dev-gabu2356ad3gt7v22gf6ak-325907120404.us-east1.run.app';

export function getPublicRockolaUrl(targetMode: 'tv' | 'guest' = 'guest'): string {
  if (typeof window === 'undefined') {
    return `${PUBLIC_FALLBACK_URL}/?mode=${targetMode}`;
  }

  const hostname = window.location.hostname.toLowerCase();

  // If the browser is running on localhost, 127.0.0.1, or a private internal development cluster
  // (which other phones on 4G/Wi-Fi cannot access directly):
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('cloudworkstations.dev') ||
    hostname.includes('webcontainer')
  ) {
    return `${PUBLIC_FALLBACK_URL}/?mode=${targetMode}`;
  }

  // Otherwise we are on the public deployment (e.g. .run.app or custom domain)
  try {
    const url = new URL(window.location.origin);
    url.searchParams.set('mode', targetMode);
    return url.toString();
  } catch {
    return `${PUBLIC_FALLBACK_URL}/?mode=${targetMode}`;
  }
}
