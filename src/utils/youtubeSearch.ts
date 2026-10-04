import { CATALOGO_FAMILIAR_DON_RAFA } from '../data/catalogo';

export interface SearchVideoResult {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: string;
}

// Extract YouTube ID from link, parameter, or raw text
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const str = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+?&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/,
    /([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  }
  return null;
}

// List of public CORS-friendly YouTube / Invidious search mirrors
const CORS_INVIDIOUS_MIRRORS = [
  'https://invidious.f5.si',
  'https://inv.tux.pizza',
  'https://invidious.drgns.space',
  'https://invidious.einfachzocken.eu',
];

export async function searchYouTubeUniversal(query: string): Promise<SearchVideoResult[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  // 1. Direct YouTube link or 11-char ID
  const directId = extractYouTubeId(cleanQuery);
  if (directId) {
    return [
      {
        videoId: directId,
        title: `Video de YouTube (${directId})`,
        artist: 'YouTube',
        thumbnail: `https://img.youtube.com/vi/${directId}/hqdefault.jpg`,
        duration: '',
      },
    ];
  }

  // 2. Try local Node.js backend (/api/youtube-search or /api/search)
  for (const endpoint of ['/api/youtube-search', '/api/search']) {
    try {
      const localRes = await fetch(`${endpoint}?q=${encodeURIComponent(query.trim())}`, {
        signal: AbortSignal.timeout(3500),
      });
      if (localRes.ok) {
        const data = await localRes.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          // Normalize thumbnails and deduplicate without altering YouTube relevance order
          const seen = new Set<string>();
          const results: SearchVideoResult[] = [];

          for (const r of data.results as SearchVideoResult[]) {
            if (r.videoId && !seen.has(r.videoId)) {
              seen.add(r.videoId);
              results.push({
                ...r,
                thumbnail: `https://img.youtube.com/vi/${r.videoId}/hqdefault.jpg`,
              });
            }
          }

          if (results.length > 0) {
            return results;
          }
        }
      }
    } catch {
      // Backend /api/ is not available (e.g. static hosting on Hostinger/Vercel)
    }
  }

  // 3. Fallback: Client-side direct query to high-availability Invidious search mirrors
  for (const mirror of CORS_INVIDIOUS_MIRRORS) {
    try {
      const mirrorRes = await fetch(
        `${mirror}/api/v1/search?q=${encodeURIComponent(query.trim())}&type=video`,
        {
          signal: AbortSignal.timeout(4000),
        }
      );
      if (mirrorRes.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawResults = (await mirrorRes.json()) as any[];
        if (Array.isArray(rawResults) && rawResults.length > 0) {
          const mapped: SearchVideoResult[] = rawResults.slice(0, 18).map((item) => ({
            videoId: item.videoId,
            title: item.title || 'Video',
            artist: item.author || 'YouTube',
            thumbnail: `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`,
            duration: item.lengthSeconds
              ? `${Math.floor(item.lengthSeconds / 60)}:${String(item.lengthSeconds % 60).padStart(2, '0')}`
              : '',
          }));

          if (mapped.length > 0) {
            return mapped;
          }
        }
      }
    } catch {
      // Try next mirror
    }
  }

  // 4. Offline / No-network fallback: strictly match local catalog ONLY if relevant
  if (cleanQuery.length >= 2) {
    const scoredMatches = CATALOGO_FAMILIAR_DON_RAFA
      .map((item) => {
        const titleLower = item.title.toLowerCase();
        const artistLower = item.artist.toLowerCase();
        let score = 0;

        if (titleLower === cleanQuery || artistLower === cleanQuery) {
          score = 100;
        } else if (titleLower.startsWith(cleanQuery) || artistLower.startsWith(cleanQuery)) {
          score = 80;
        } else if (titleLower.includes(cleanQuery) || artistLower.includes(cleanQuery)) {
          score = 50;
        }

        return { item, score };
      })
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((m) => ({
        videoId: m.item.videoId,
        title: m.item.title,
        artist: m.item.artist,
        thumbnail: `https://img.youtube.com/vi/${m.item.videoId}/hqdefault.jpg`,
        duration: m.item.duration || '',
      }));

    return scoredMatches;
  }

  return [];
}
