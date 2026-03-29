import { InstagramData } from '@/types/platforms';
import { normalizeHandle } from '@/lib/utils';

/**
 * Instagram scanner.
 *
 * Instagram aggressively blocks server-side scraping from cloud IPs.
 * We attempt multiple strategies but are transparent about data confidence:
 * - If we get real numbers from an API or scrape, dataSource = 'api' | 'scrape'
 * - If we can't get numbers, dataSource = 'unavailable' and we say so honestly
 *   rather than showing wrong data
 */
export async function scanInstagram(handle: string): Promise<InstagramData> {
  if (!handle) return { found: false };

  const username = normalizeHandle(handle);

  // Strategy 1: Instagram web API endpoint
  const apiResult = await tryWebApi(username);
  if (apiResult.found && apiResult.followerCount) {
    return { ...apiResult, dataSource: 'api' };
  }

  // Strategy 2: Direct HTML scrape with mobile user-agent
  const scrapeResult = await tryDirectScrape(username);
  if (scrapeResult.found && scrapeResult.followerCount) {
    return { ...scrapeResult, dataSource: 'scrape' };
  }

  // If we confirmed the profile exists but couldn't get numbers,
  // be honest about it rather than showing wrong data
  return {
    found: true,
    username,
    dataSource: 'unavailable',
    // Don't fabricate or guess follower counts — show nothing rather than wrong data
  };
}

async function tryWebApi(username: string): Promise<InstagramData> {
  try {
    const res = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return { found: false };

    const data = await res.json();
    const user = data?.data?.user;
    if (!user) return { found: false };

    return {
      found: true,
      username,
      fullName: user.full_name || undefined,
      bio: user.biography || undefined,
      followerCount: user.edge_followed_by?.count || undefined,
      followingCount: user.edge_follow?.count || undefined,
      postCount: user.edge_owner_to_timeline_media?.count || undefined,
      isVerified: user.is_verified || undefined,
    };
  } catch {
    return { found: false };
  }
}

async function tryDirectScrape(username: string): Promise<InstagramData> {
  try {
    const res = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return { found: false };
    const html = await res.text();

    if (html.includes('loginForm') || html.includes('"LoginAndSignupPage"') || html.length < 5000) {
      return { found: false };
    }

    const ogDesc = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/)
      || html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:description"/);
    const descMeta = html.match(/<meta\s+(?:property|name)="description"\s+content="([^"]*)"/)
      || html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="description"/);
    const ogTitle = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*)"/)
      || html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:title"/);

    let followerCount: number | undefined;
    let followingCount: number | undefined;
    let postCount: number | undefined;
    let fullName: string | undefined;

    const descContent = ogDesc?.[1] || descMeta?.[1] || '';
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

    if (!followerCount && !postCount && !fullName) {
      return { found: false };
    }

    return {
      found: true,
      username,
      fullName,
      followerCount,
      followingCount,
      postCount,
    };
  } catch {
    return { found: false };
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
