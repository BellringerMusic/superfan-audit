import { InstagramData } from '@/types/platforms';
import { normalizeHandle } from '@/lib/utils';

export async function scanInstagram(handle: string): Promise<InstagramData> {
  if (!handle) return { found: false };

  try {
    const username = normalizeHandle(handle);
    const res = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SuperfanAudit/1.0)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return { found: false, error: 'Instagram profile not accessible' };
    }

    const html = await res.text();

    const ogDesc = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/)
      || html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:description"/);
    const ogTitle = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*)"/)
      || html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:title"/);
    const descriptionMeta = html.match(/<meta\s+(?:property|name)="description"\s+content="([^"]*)"/)
      || html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="description"/);

    let followerCount: number | undefined;
    let followingCount: number | undefined;
    let postCount: number | undefined;
    let bio: string | undefined;
    let fullName: string | undefined;

    const descContent = ogDesc?.[1] || descriptionMeta?.[1] || '';
    const followerMatch = descContent.match(/([\d,.]+[KMB]?)\s*Followers/i);
    const followingMatch = descContent.match(/([\d,.]+[KMB]?)\s*Following/i);
    const postMatch = descContent.match(/([\d,.]+[KMB]?)\s*Posts?/i);

    if (followerMatch) followerCount = parseMetricString(followerMatch[1]);
    if (followingMatch) followingCount = parseMetricString(followingMatch[1]);
    if (postMatch) postCount = parseMetricString(postMatch[1]);

    if (ogTitle?.[1]) {
      const titleParts = ogTitle[1].split(/[(@]/);
      fullName = titleParts[0]?.trim();
    }

    const bioMatch = descContent.match(/[-–—]\s*[""]?(.+?)[""]?\s*$/);
    if (bioMatch) bio = bioMatch[1].trim();

    return {
      found: true,
      username,
      fullName,
      bio,
      followerCount,
      followingCount,
      postCount,
    };
  } catch (error) {
    return { found: false, error: error instanceof Error ? error.message : 'Instagram scan failed' };
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
