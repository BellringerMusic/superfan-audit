import { TikTokData } from '@/types/platforms';
import { normalizeHandle } from '@/lib/utils';

export async function scanTikTok(handle: string): Promise<TikTokData> {
  if (!handle) return { found: false };

  try {
    const username = normalizeHandle(handle);
    const res = await fetch(`https://www.tiktok.com/@${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SuperfanAudit/1.0)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return { found: false, error: 'TikTok profile not accessible' };
    }

    const html = await res.text();

    const ogDesc = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/)
      || html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:description"/);
    const ogTitle = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*)"/)
      || html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:title"/);

    let followerCount: number | undefined;
    let likeCount: number | undefined;
    let displayName: string | undefined;

    const descContent = ogDesc?.[1] || '';
    const followerMatch = descContent.match(/([\d,.]+[KMB]?)\s*Followers/i);
    const likeMatch = descContent.match(/([\d,.]+[KMB]?)\s*Likes/i);

    if (followerMatch) followerCount = parseMetricString(followerMatch[1]);
    if (likeMatch) likeCount = parseMetricString(likeMatch[1]);

    if (ogTitle?.[1]) {
      displayName = ogTitle[1].split(/[(@|]/)[0]?.trim();
    }

    return {
      found: !!(followerCount || displayName),
      username,
      displayName,
      followerCount,
      likeCount,
    };
  } catch (error) {
    return { found: false, error: error instanceof Error ? error.message : 'TikTok scan failed' };
  }
}

function parseMetricString(str: string): number {
  const cleaned = str.replace(/,/g, '');
  const multiplierMatch = cleaned.match(/([\d.]+)([KMB])?/i);
  if (!multiplierMatch) return 0;
  const num = parseFloat(multiplierMatch[1]);
  const suffix = (multiplierMatch[2] || '').toUpperCase();
  if (suffix === 'K') return Math.round(num * 1_000);
  if (suffix === 'M') return Math.round(num * 1_000_000);
  if (suffix === 'B') return Math.round(num * 1_000_000_000);
  return Math.round(num);
}
