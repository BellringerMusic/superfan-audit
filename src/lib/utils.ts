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
