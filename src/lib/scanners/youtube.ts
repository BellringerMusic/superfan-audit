import { YouTubeData, YouTubeVideoStats, YouTubeCommenter } from '@/types/platforms';
import { extractYouTubeChannelIdentifier } from '@/lib/utils';

const MAX_VIDEOS_FOR_COMMENT_SCAN = 8;
const MAX_THREADS_PER_VIDEO = 50;
const COMMENT_FETCH_TIMEOUT_MS = 6000;

interface CommentAuthor {
  displayName: string;
  channelId?: string;
  channelUrl?: string;
  profileImageUrl?: string;
}

interface CommentTallyEntry {
  author: CommentAuthor;
  comments: number;
  videosCommentedOn: Set<string>;
  totalLikes: number;
}

async function fetchCommentThreads(
  videoId: string,
  apiKey: string,
  ownerChannelId: string,
): Promise<{ author: CommentAuthor; likes: number }[]> {
  const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=${MAX_THREADS_PER_VIDEO}&order=relevance&textFormat=plainText&key=${apiKey}`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), COMMENT_FETCH_TIMEOUT_MS);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.items || [];

    return items
      .map((thread: {
        snippet: {
          topLevelComment: {
            snippet: {
              authorDisplayName: string;
              authorChannelUrl?: string;
              authorChannelId?: { value: string };
              authorProfileImageUrl?: string;
              likeCount?: number;
            };
          };
        };
      }) => {
        const c = thread.snippet?.topLevelComment?.snippet;
        if (!c) return null;
        return {
          author: {
            displayName: c.authorDisplayName,
            channelId: c.authorChannelId?.value,
            channelUrl: c.authorChannelUrl,
            profileImageUrl: c.authorProfileImageUrl,
          },
          likes: c.likeCount || 0,
        };
      })
      .filter((c: { author: CommentAuthor; likes: number } | null): c is { author: CommentAuthor; likes: number } =>
        c !== null && c.author.channelId !== ownerChannelId,
      );
  } catch {
    return [];
  }
}

function aggregateTopCommenters(
  perVideo: { videoId: string; entries: { author: CommentAuthor; likes: number }[] }[],
  artistHandles: { instagram?: string; tiktok?: string },
): { commenters: YouTubeCommenter[]; totalScanned: number } {
  const tally = new Map<string, CommentTallyEntry>();
  let totalScanned = 0;

  for (const { videoId, entries } of perVideo) {
    totalScanned += entries.length;
    for (const { author, likes } of entries) {
      // Use channelId as primary key; fall back to display name (rare).
      const key = author.channelId || `name:${author.displayName.toLowerCase()}`;
      const existing = tally.get(key);
      if (existing) {
        existing.comments += 1;
        existing.videosCommentedOn.add(videoId);
        existing.totalLikes += likes;
      } else {
        tally.set(key, {
          author,
          comments: 1,
          videosCommentedOn: new Set([videoId]),
          totalLikes: likes,
        });
      }
    }
  }

  const igHandle = normalizeHandle(artistHandles.instagram);
  const tiktokHandle = normalizeHandle(artistHandles.tiktok);

  const commenters: YouTubeCommenter[] = Array.from(tally.values())
    .map((e) => {
      const normalizedName = normalizeHandle(e.author.displayName);
      const cross = Boolean(
        (igHandle && normalizedName.includes(igHandle)) ||
        (tiktokHandle && normalizedName.includes(tiktokHandle)),
      );
      return {
        displayName: e.author.displayName,
        channelUrl: e.author.channelUrl,
        profileImageUrl: e.author.profileImageUrl,
        commentCount: e.comments,
        videosCommentedOn: e.videosCommentedOn.size,
        totalLikes: e.totalLikes,
        crossPlatformMatch: cross || undefined,
      };
    })
    // Score: repeat across multiple videos > total comments > likes earned.
    .sort((a, b) => {
      if (b.videosCommentedOn !== a.videosCommentedOn) return b.videosCommentedOn - a.videosCommentedOn;
      if (b.commentCount !== a.commentCount) return b.commentCount - a.commentCount;
      return b.totalLikes - a.totalLikes;
    })
    // Only people who commented on at least 1 video, with bias toward repeats.
    .filter((c) => c.commentCount >= 1)
    .slice(0, 15);

  return { commenters, totalScanned };
}

function normalizeHandle(s?: string): string {
  if (!s) return '';
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function scanYouTube(
  youtubeUrl: string,
  artistName: string,
  artistHandles: { instagram?: string; tiktok?: string } = {},
): Promise<YouTubeData> {
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

    let topCommenters: YouTubeCommenter[] = [];
    let commentsScanned = 0;
    let videosScannedForComments = 0;

    if (videosSearchRes.ok) {
      const videosSearchData = await videosSearchRes.json();
      const videoIdList: string[] = (videosSearchData.items || [])
        .map((item: { id: { videoId: string } }) => item.id.videoId)
        .filter(Boolean);
      const videoIds = videoIdList.join(',');

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

        // Pull comment threads from the most-commented recent videos to find
        // the actual people raising their hand. Skip if comment count is 0.
        const videosForCommentScan = videoIdList
          .map((id, i) => ({ id, comments: recentVideos[i]?.commentCount || 0 }))
          .filter((v) => v.comments > 0)
          .sort((a, b) => b.comments - a.comments)
          .slice(0, MAX_VIDEOS_FOR_COMMENT_SCAN);

        if (videosForCommentScan.length > 0) {
          const commentBatches = await Promise.all(
            videosForCommentScan.map(async ({ id }) => ({
              videoId: id,
              entries: await fetchCommentThreads(id, apiKey, channelId!),
            }))
          );
          videosScannedForComments = commentBatches.filter((b) => b.entries.length > 0).length;
          const aggregated = aggregateTopCommenters(commentBatches, artistHandles);
          topCommenters = aggregated.commenters;
          commentsScanned = aggregated.totalScanned;
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
      topCommenters,
      commentsScanned,
      videosScannedForComments,
      dataSource,
    };
  } catch (error) {
    return { found: false, error: error instanceof Error ? error.message : 'YouTube scan failed' };
  }
}
