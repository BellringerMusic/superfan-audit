export function extractSpotifyArtistId(url: string): string | null {
  const match = url.match(/spotify\.com\/(?:intl-[a-z]+\/)?artist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export function extractYouTubeChannelIdentifier(url: string): { type: 'id' | 'handle' | 'custom'; value: string } | null {
  let match = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
  if (match) return { type: 'id', value: match[1] };

  match = url.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
  if (match) return { type: 'handle', value: match[1] };

  match = url.match(/youtube\.com\/c\/([a-zA-Z0-9_.-]+)/);
  if (match) return { type: 'custom', value: match[1] };

  return null;
}

export function normalizeHandle(handle: string): string {
  return handle.startsWith('@') ? handle.slice(1) : handle;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function getIncomeIndex(income: string): number {
  const tiers = ['$0 - $500', '$500 - $2K', '$2K - $5K', '$5K - $10K', '$10K - $25K', '$25K+'];
  return tiers.indexOf(income);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Normalize anything a user might paste as a URL into a clean https:// form.
 * Handles: marcus.com → https://marcus.com
 *          www.marcus.com → https://www.marcus.com
 *          http://marcus.com → http://marcus.com (preserved)
 *          https://marcus.com/ → https://marcus.com (trailing slash stripped)
 *          marcus.com/about → https://marcus.com/about
 * Whitespace is trimmed. Empty strings stay empty (so the field can stay optional).
 */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  // Drop trailing slashes from the URL itself, but only on the path (not the protocol).
  return withProtocol.replace(/\/+$/, '');
}

/**
 * Pull a social handle out of whatever the user pasted: a bare handle ("@me"
 * or "me"), a profile URL ("instagram.com/me"), a full URL with extras
 * ("https://www.instagram.com/me/?hl=en"), or a TikTok URL with a video path
 * ("https://www.tiktok.com/@me/video/123"). Returns the bare handle without
 * the leading @, ready to feed back into the existing handle pattern.
 */
export function extractSocialHandle(
  input: string,
  platform: 'instagram' | 'tiktok',
): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // If it doesn't look like a URL or domain, treat as a bare handle.
  const looksLikeUrl = /\.(com|net|org)/i.test(trimmed) || /^https?:\/\//i.test(trimmed);
  if (!looksLikeUrl) {
    return trimmed.replace(/^@/, '').replace(/\/+$/, '');
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(candidate);
    const host = u.hostname.toLowerCase();
    const expectedHost = platform === 'instagram' ? 'instagram.com' : 'tiktok.com';
    if (!host.endsWith(expectedHost)) {
      // Not actually a URL for this platform — fall back to bare handle parsing.
      return trimmed.replace(/^@/, '').replace(/\/+$/, '');
    }
    const segments = u.pathname.split('/').filter(Boolean);
    const first = segments[0] || '';
    return first.replace(/^@/, '');
  } catch {
    return trimmed.replace(/^@/, '').replace(/\/+$/, '');
  }
}
