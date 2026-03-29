import { InstagramData } from '@/types/platforms';
import { normalizeHandle } from '@/lib/utils';

export async function scanInstagram(handle: string): Promise<InstagramData> {
  if (!handle) return { found: false };

  const username = normalizeHandle(handle);

  // Strategy 1: Try direct Instagram scrape
  const directResult = await tryDirectScrape(username);
  if (directResult.found && directResult.followerCount) {
    return directResult;
  }

  // Strategy 2: Use Google Custom Search to find Instagram stats
  const googleResult = await tryGoogleSearch(username);
  if (googleResult.found && googleResult.followerCount) {
    return googleResult;
  }

  // Strategy 3: If we at least confirmed the profile exists via Google
  if (googleResult.found) {
    return googleResult;
  }

  // Return whatever we got from direct (may have partial data)
  if (directResult.found) {
    return directResult;
  }

  return {
    found: false,
    username,
    error: 'Instagram profile data could not be retrieved. The profile may be private or restricted.',
  };
}

async function tryDirectScrape(username: string): Promise<InstagramData> {
  try {
    const res = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return { found: false };
    }

    const html = await res.text();

    // Check if we got a login wall
    if (html.includes('loginForm') || html.includes('Log in to Instagram') || html.length < 5000) {
      return { found: false };
    }

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

async function tryGoogleSearch(username: string): Promise<InstagramData> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) {
    return { found: false };
  }

  try {
    // Search for the Instagram profile to get follower data from search snippets
    const query = `site:instagram.com "${username}" followers`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { found: false };

    const data = await res.json();
    const items = data.items || [];

    let followerCount: number | undefined;
    let followingCount: number | undefined;
    let postCount: number | undefined;
    let fullName: string | undefined;
    let bio: string | undefined;
    let profileFound = false;

    for (const item of items) {
      const link: string = item.link || '';
      const snippet: string = item.snippet || '';
      const title: string = item.title || '';

      // Check if this is the actual Instagram profile
      if (link.includes(`instagram.com/${username}`) ||
          link.includes(`instagram.com/p/`) && snippet.toLowerCase().includes(username.toLowerCase())) {
        profileFound = true;

        // Extract metrics from snippet (Google often shows "1.2M Followers, 500 Following, 200 Posts")
        const fMatch = snippet.match(/([\d,.]+[KMB]?)\s*Followers/i);
        const foMatch = snippet.match(/([\d,.]+[KMB]?)\s*Following/i);
        const pMatch = snippet.match(/([\d,.]+[KMB]?)\s*Posts?/i);

        if (fMatch && !followerCount) followerCount = parseMetricString(fMatch[1]);
        if (foMatch && !followingCount) followingCount = parseMetricString(foMatch[1]);
        if (pMatch && !postCount) postCount = parseMetricString(pMatch[1]);

        // Try to get name from title like "Artist Name (@username) • Instagram"
        if (!fullName && title) {
          const nameMatch = title.match(/^(.+?)\s*[(@•|]/);
          if (nameMatch) fullName = nameMatch[1].trim();
        }
      }
    }

    // Also try a broader search for Instagram stats from third-party sites
    if (!followerCount) {
      const broadQuery = `"${username}" instagram followers`;
      const broadUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(broadQuery)}&num=5`;
      const broadRes = await fetch(broadUrl, { signal: AbortSignal.timeout(8000) });

      if (broadRes.ok) {
        const broadData = await broadRes.json();
        for (const item of (broadData.items || [])) {
          const snippet: string = item.snippet || '';
          const fMatch = snippet.match(/([\d,.]+[KMB]?)\s*(?:Instagram\s+)?[Ff]ollowers/i);
          if (fMatch && !followerCount) {
            followerCount = parseMetricString(fMatch[1]);
            profileFound = true;
          }
        }
      }
    }

    if (!profileFound) {
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
