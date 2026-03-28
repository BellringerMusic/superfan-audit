import { WebPresenceData } from '@/types/platforms';

export async function scanWebPresence(websiteUrl: string, artistName: string): Promise<WebPresenceData> {
  try {
    const results: WebPresenceData = { found: false };

    // Check if their website is live
    if (websiteUrl) {
      try {
        const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SuperfanAudit/1.0)' },
          redirect: 'follow',
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          results.websiteActive = true;
          const html = await res.text();
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const descMatch = html.match(/<meta\s+(?:name|property)="description"\s+content="([^"]*)"/)
            || html.match(/<meta\s+content="([^"]*)"\s+(?:name|property)="description"/);
          results.websiteTitle = titleMatch?.[1]?.trim();
          results.websiteDescription = descMatch?.[1]?.trim()?.slice(0, 200);
          results.found = true;
        }
      } catch {
        results.websiteActive = false;
      }
    }

    // Google Custom Search for press mentions
    const apiKey = process.env.GOOGLE_CSE_API_KEY;
    const searchEngineId = process.env.GOOGLE_CSE_SEARCH_ENGINE_ID;

    if (apiKey && searchEngineId && artistName) {
      try {
        const query = `"${artistName}" musician OR artist OR music`;
        const res = await fetch(
          `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${searchEngineId}&num=10`
        );
        if (res.ok) {
          const data = await res.json();
          results.searchResultCount = parseInt(data.searchInformation?.totalResults || '0');
          const items = data.items || [];

          const musicDomains = [
            'spotify.com', 'apple.com/music', 'soundcloud.com', 'bandcamp.com',
            'deezer.com', 'tidal.com', 'audiomack.com',
          ];
          const pressDomains = [
            'billboard.com', 'rollingstone.com', 'pitchfork.com', 'nme.com',
            'consequence.net', 'stereogum.com', 'spin.com', 'complex.com',
            'hotnewhiphop.com', 'genius.com', 'hypebeast.com',
          ];

          results.pressMentions = items
            .filter((item: { link: string }) => pressDomains.some(d => item.link.includes(d)))
            .map((item: { displayLink: string }) => item.displayLink)
            .slice(0, 5);

          results.otherPlatforms = items
            .filter((item: { link: string }) => musicDomains.some(d => item.link.includes(d)))
            .map((item: { displayLink: string }) => item.displayLink)
            .slice(0, 5);

          results.found = true;
        }
      } catch {
        // Google search failed, continue without it
      }
    }

    return results;
  } catch (error) {
    return { found: false, error: error instanceof Error ? error.message : 'Web scan failed' };
  }
}
