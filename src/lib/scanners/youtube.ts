import { YouTubeData, YouTubeVideoStats } from '@/types/platforms';
import { extractYouTubeChannelIdentifier } from '@/lib/utils';

export async function scanYouTube(youtubeUrl: string, artistName: string): Promise<YouTubeData> {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error('YouTube API key not configured');

    let channelId: string | null = null;
    let dataSource: 'api' | 'search' = 'api';
    const identifier = extractYouTubeChannelIdentifier(youtubeUrl);

    if (identifier) {
      if (identifier.type === 'id') {
        channelId = identifier.value;
      } else {
        const param = identifier.type === 'handle' ? 'forHandle' : 'forUsername';
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=id&${param}=${encodeURIComponent(identifier.value)}&key=${apiKey}`
        );
        if (res.ok) {
          const data = await res.json();
          channelId = data.items?.[0]?.id || null;
        }
      }
    }

    // Only fall back to name search if no URL was provided at all
    if (!channelId && !youtubeUrl && artistName) {
      dataSource = 'search';
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(artistName + ' music')}&type=channel&maxResults=5&key=${apiKey}`
      );
      if (searchRes.ok) {
        const data = await searchRes.json();
        const items = data.items || [];
        // Only use a search result if the channel title closely matches the artist name
        const exactMatch = items.find(
          (item: { snippet: { title: string } }) =>
            item.snippet.title.toLowerCase().replace(/[^a-z0-9]/g, '') ===
            artistName.toLowerCase().replace(/[^a-z0-9]/g, '')
        );
        if (exactMatch) {
          channelId = exactMatch.id?.channelId || exactMatch.snippet?.channelId || null;
        }
      }
    }

    if (!channelId) {
      return { found: false, error: youtubeUrl
        ? 'Could not resolve YouTube channel from the URL provided. Please check the URL.'
        : 'YouTube channel not found. Try providing a direct channel URL for accurate results.' };
    }

    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`
    );
    if (!channelRes.ok) return { found: false, error: 'Could not fetch channel data' };
    const channelData = await channelRes.json();
    const channel = channelData.items?.[0];
    if (!channel) return { found: false, error: 'Channel data unavailable' };

    const stats = channel.statistics;
    const subscriberCount = parseInt(stats.subscriberCount || '0');
    const viewCount = parseInt(stats.viewCount || '0');
    const videoCount = parseInt(stats.videoCount || '0');

    const videosSearchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&order=date&maxResults=10&type=video&key=${apiKey}`
    );

    let recentVideos: YouTubeVideoStats[] = [];
    let avgViews = 0;
    let avgLikes = 0;
    let avgComments = 0;
    let engagementRate = 0;

    if (videosSearchRes.ok) {
      const videosSearchData = await videosSearchRes.json();
      const videoIds = (videosSearchData.items || [])
        .map((item: { id: { videoId: string } }) => item.id.videoId)
        .filter(Boolean)
        .join(',');

      if (videoIds) {
        const videoStatsRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`
        );

        if (videoStatsRes.ok) {
          const videoStatsData = await videoStatsRes.json();
          recentVideos = (videoStatsData.items || []).map(
            (v: { snippet: { title: string; publishedAt: string }; statistics: { viewCount: string; likeCount: string; commentCount: string } }) => ({
              title: v.snippet.title,
              viewCount: parseInt(v.statistics.viewCount || '0'),
              likeCount: parseInt(v.statistics.likeCount || '0'),
              commentCount: parseInt(v.statistics.commentCount || '0'),
              publishedAt: v.snippet.publishedAt,
            })
          );

          if (recentVideos.length > 0) {
            avgViews = Math.round(recentVideos.reduce((s, v) => s + v.viewCount, 0) / recentVideos.length);
            avgLikes = Math.round(recentVideos.reduce((s, v) => s + v.likeCount, 0) / recentVideos.length);
            avgComments = Math.round(recentVideos.reduce((s, v) => s + v.commentCount, 0) / recentVideos.length);
            engagementRate = subscriberCount > 0
              ? Math.round(((avgLikes + avgComments) / avgViews) * 10000) / 100
              : 0;
          }
        }
      }
    }

    return {
      found: true,
      channelId,
      channelTitle: channel.snippet.title,
      description: channel.snippet.description?.slice(0, 200),
      subscriberCount,
      viewCount,
      videoCount,
      thumbnailUrl: channel.snippet.thumbnails?.medium?.url,
      recentVideos,
      avgViews,
      avgLikes,
      avgComments,
      engagementRate,
      dataSource,
    };
  } catch (error) {
    return { found: false, error: error instanceof Error ? error.message : 'YouTube scan failed' };
  }
}
