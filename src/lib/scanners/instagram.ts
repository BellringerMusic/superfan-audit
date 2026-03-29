import { InstagramData } from '@/types/platforms';
import { normalizeHandle } from '@/lib/utils';

export async function scanInstagram(handle: string): Promise<InstagramData> {
  if (!handle) return { found: false };

  const username = normalizeHandle(handle);

  // Strategy 1: Try fetching Instagram profile page with browser-like headers
  const directResult = await tryDirectScrape(username);
  if (directResult.found && directResult.followerCount) {
    return directResult;
  }

  // Strategy 2: Try the Instagram web API endpoint
  const webApiResult = await tryWebApi(username);
  if (webApiResult.found && webApiResult.followerCount) {
    return webApiResult;
  }

  // Strategy 3: Use YouTube Data API to search for artist Instagram stats
  // (YouTube descriptions often contain social media links and stats)
  const searchResult = await tryGoogleSearch(username);
  if (searchResult.found) {
    return searchResult;
  }

  // If we confirmed the profile exists from any strategy, return partial data
  if (directResult.found || webApiResult.found) {
    return {
      found: true,
      username,
      followerCount: directResult.followerCount || webApiResult.followerCount,
      fullName: directResult.fullName || webApiResult.fullName,
      bio: directResult.bio || webApiResult.bio,
      postCount: directResult.postCount || webApiResult.postCount,
      followingCount: directResult.followingCount || webApiResult.followingCount,
    };
  }

  return {
    found: false,
    username,
    error: 'Instagram profile could not be scanned. The profile may be private.',
  };
}

async function tryDirectScrape(username: string): Promise<InstagramData> {
  try {
    // Use mobile user agent - Instagram sometimes returns more data to mobile clients
    const res = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Mode': 'navigate',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return { found: false };

    const html = await res.text();

    // Check for login wall
    if (html.includes('loginForm') || html.includes('"LoginAndSignupPage"') || html.length < 5000) {
      return { found: false };
    }

    let followerCount: number | undefined;
    let followingCount: number | undefined;
    let postCount: number | undefined;
    let bio: string | undefined;
    let fullName: string | undefined;

    // Try og:description meta tag (most reliable when available)
    const ogDesc = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/)
      || html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:description"/);
    const descMeta = html.match(/<meta\s+(?:property|name)="description"\s+content="([^"]*)"/)
      || html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="description"/);
    const ogTitle = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*)"/)
      || html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:title"/);

    const descContent = ogDesc?.[1] || descMeta?.[1] || '';

    const followerMatch = descContent.match(/([\d,.]+[KMB]?)\s*Followers/i);
    const followingMatch = descContent.match(/([\d,.]+[KMB]?)\s*Following/i);
    const postMatch = descContent.match(/([\d,.]+[KMB]?)\s*Posts?/i);

    if (followerMatch) followerCount = parseMetricString(followerMatch[1]);
    if (followingMatch) followingCount = parseMetricString(followingMatch[1]);
    if (postMatch) postCount = parseMetricString(postMatch[1]);

    // Try JSON-LD data
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        if (jsonLd.mainEntityofPage?.interactionStatistic) {
          for (const stat of jsonLd.mainEntityofPage.interactionStatistic) {
            if (stat.interactionType === 'http://schema.org/FollowAction') {
              followerCount = followerCount || Number(stat.userInteractionCount);
            }
          }
        }
        fullName = fullName || jsonLd.name;
        bio = bio || jsonLd.description;
      } catch { /* ignore parse errors */ }
    }

    // Try extracting from page title
    if (ogTitle?.[1]) {
      const titleParts = ogTitle[1].split(/[(@]/);
      fullName = fullName || titleParts[0]?.trim();
    }

    if (!followerCount && !postCount && !fullName) {
      return { found: false };
    }

    return {
      found: true,
      username,
      fullName,
      bio,
      followerCount,
      followingCount,
      postCount,
    };
  } catch {
    return { found: false };
  }
}

async function tryWebApi(username: string): Promise<InstagramData> {
  try {
    // Try the web profile info endpoint
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
    };
  } catch {
    return { found: false };
  }
}

async function tryGoogleSearch(username: string): Promise<InstagramData> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) return { found: false };

  try {
    // Search for Instagram profile stats
    const query = `"${username}" instagram followers site:instagram.com OR site:socialblade.com OR site:socialtracker.io`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=10`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { found: false };

    const data = await res.json();
    const items = data.items || [];

    let followerCount: number | undefined;
    let fullName: string | undefined;

    for (const item of items) {
      const snippet: string = item.snippet || '';
      const title: string = item.title || '';

      // Extract follower counts from snippets
      const fMatch = snippet.match(/([\d,.]+[KMB]?)\s*(?:Instagram\s+)?[Ff]ollowers/i);
      if (fMatch && !followerCount) {
        followerCount = parseMetricString(fMatch[1]);
      }

      // Extract name from Instagram title pattern: "Name (@username)"
      if (!fullName && title.toLowerCase().includes(username.toLowerCase())) {
        const nameMatch = title.match(/^(.+?)\s*[(@•|]/);
        if (nameMatch) fullName = nameMatch[1].trim();
      }
    }

    if (!followerCount && !fullName) return { found: false };

    return {
      found: true,
      username,
      fullName,
      followerCount,
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
