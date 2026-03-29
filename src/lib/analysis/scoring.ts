import { ScanResults } from '@/types/platforms';
import { ScoreBreakdown, PlatformBreakdown } from '@/types/audit';
import { formatNumber } from '@/lib/utils';

function tierScore(count: number): number {
  if (count >= 100_000) return 25;
  if (count >= 50_000) return 20;
  if (count >= 10_000) return 15;
  if (count >= 1_000) return 10;
  if (count >= 100) return 5;
  return 2;
}

export function calculateScores(scanResults: ScanResults): {
  scoreBreakdown: ScoreBreakdown;
  platformBreakdowns: PlatformBreakdown[];
} {
  const { spotify, youtube, instagram, tiktok, webPresence } = scanResults;
  const platformBreakdowns: PlatformBreakdown[] = [];

  // YouTube scoring (max 35 points)
  let youtubeScore = 0;
  if (youtube?.found) {
    const subScore = tierScore(youtube.subscriberCount || 0);
    const engScore = Math.min(10, Math.round((youtube.engagementRate || 0) * 2));
    youtubeScore = subScore + engScore;
    platformBreakdowns.push({
      platform: 'YouTube',
      icon: '▶',
      found: true,
      metrics: {
        subscribers: formatNumber(youtube.subscriberCount || 0),
        totalViews: formatNumber(youtube.viewCount || 0),
        videos: youtube.videoCount || 0,
        avgViews: formatNumber(youtube.avgViews || 0),
        engagementRate: `${youtube.engagementRate || 0}%`,
      },
      strengthRating: youtubeScore >= 25 ? 'Strong' : youtubeScore >= 15 ? 'Growing' : 'Needs Work',
      insight: generateYouTubeInsight(youtube),
      score: youtubeScore,
    });
  } else {
    platformBreakdowns.push({
      platform: 'YouTube',
      icon: '▶',
      found: false,
      metrics: {},
      strengthRating: 'Not Found',
      insight: 'No YouTube channel found. Video content is one of the strongest ways to build superfan connections.',
      score: 0,
    });
  }

  // Spotify scoring (max 25 points)
  let spotifyScore = 0;
  if (spotify?.found) {
    // Use followers for scoring (direct from API — accurate)
    const followers = spotify.followerCount || 0;
    spotifyScore += tierScore(followers);
    const releases = spotify.totalReleases || 0;
    spotifyScore += Math.min(5, Math.round(releases * 0.25));
    spotifyScore = Math.min(25, spotifyScore);
    platformBreakdowns.push({
      platform: 'Spotify',
      icon: '♫',
      found: true,
      metrics: {
        followers: followers > 0 ? formatNumber(followers) : 'N/A',
        popularity: spotify.popularity || 0,
        genres: (spotify.genres || []).slice(0, 3).join(', ') || 'Not categorized',
        albums: spotify.albumCount || 0,
        singles: spotify.singleCount || 0,
        totalReleases: spotify.totalReleases || 0,
        latestRelease: spotify.latestRelease?.name || 'N/A',
      },
      strengthRating: spotifyScore >= 18 ? 'Strong' : spotifyScore >= 10 ? 'Growing' : 'Needs Work',
      insight: generateSpotifyInsight(spotify),
      score: spotifyScore,
    });
  } else {
    platformBreakdowns.push({
      platform: 'Spotify',
      icon: '♫',
      found: false,
      metrics: {},
      strengthRating: 'Not Found',
      insight: 'No Spotify profile found. Having your music on streaming platforms is essential for discoverability.',
      score: 0,
    });
  }

  // Cross-platform scoring (max 20 points)
  const activePlatforms = [
    spotify?.found, youtube?.found, instagram?.found,
    tiktok?.found, webPresence?.websiteActive,
  ].filter(Boolean).length;
  const platformCountScore = Math.min(10, activePlatforms * 2);

  // Brand consistency (check if name matches across platforms)
  let consistencyScore = 0;
  const names = [
    spotify?.name, youtube?.channelTitle, instagram?.fullName,
    tiktok?.displayName,
  ].filter(Boolean) as string[];
  if (names.length >= 2) {
    const lowerNames = names.map(n => n.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const allMatch = lowerNames.every(n => n === lowerNames[0]);
    consistencyScore = allMatch ? 10 : 5;
  }
  const crossPlatformScore = platformCountScore + consistencyScore;

  // Web presence scoring (max 10 points)
  let webScore = 0;
  if (webPresence?.found) {
    if (webPresence.websiteActive) webScore += 5;
    if ((webPresence.pressMentions?.length || 0) > 0) webScore += Math.min(5, (webPresence.pressMentions?.length || 0));
    platformBreakdowns.push({
      platform: 'Website',
      icon: '🌐',
      found: webPresence.websiteActive || false,
      metrics: {
        websiteActive: webPresence.websiteActive ? 'Yes' : 'No',
        pressMentions: webPresence.pressMentions?.length || 0,
        searchResults: webPresence.searchResultCount || 0,
      },
      strengthRating: webScore >= 8 ? 'Strong' : webScore >= 4 ? 'Growing' : 'Needs Work',
      insight: generateWebInsight(webPresence),
      score: webScore,
    });
  }

  // Social scoring (max 10 points)
  let socialScore = 0;
  if (instagram?.found) {
    const igHasData = instagram.dataSource !== 'unavailable' && instagram.followerCount;
    if (igHasData) {
      socialScore += 5;
    } else {
      socialScore += 2; // presence credit only — we know the account exists
    }
    platformBreakdowns.push({
      platform: 'Instagram',
      icon: '📷',
      found: true,
      metrics: {
        followers: igHasData ? formatNumber(instagram.followerCount!) : 'Could not retrieve — Instagram restricts server access',
        posts: instagram.postCount || (igHasData ? 0 : 'Could not retrieve'),
      },
      strengthRating: igHasData
        ? ((instagram.followerCount || 0) >= 10000 ? 'Strong' : (instagram.followerCount || 0) >= 1000 ? 'Growing' : 'Needs Work')
        : 'Scan Limited',
      insight: igHasData
        ? generateInstagramInsight(instagram)
        : 'Instagram restricts automated access. Your profile was confirmed but detailed metrics could not be retrieved. This does not affect your overall score significantly.',
      score: Math.min(5, socialScore),
    });
  }
  if (tiktok?.found) {
    socialScore += 5;
    platformBreakdowns.push({
      platform: 'TikTok',
      icon: '♪',
      found: true,
      metrics: {
        followers: tiktok.followerCount ? formatNumber(tiktok.followerCount) : 'Unknown',
        likes: tiktok.likeCount ? formatNumber(tiktok.likeCount) : 'Unknown',
      },
      strengthRating: (tiktok.followerCount || 0) >= 10000 ? 'Strong' : (tiktok.followerCount || 0) >= 1000 ? 'Growing' : 'Needs Work',
      insight: generateTikTokInsight(tiktok),
      score: Math.min(5, 5),
    });
  }

  const total = Math.min(100, youtubeScore + spotifyScore + crossPlatformScore + webScore + socialScore);

  return {
    scoreBreakdown: {
      youtube: youtubeScore,
      spotify: spotifyScore,
      crossPlatform: crossPlatformScore,
      webPresence: webScore,
      social: socialScore,
      total,
    },
    platformBreakdowns,
  };
}

function generateYouTubeInsight(yt: NonNullable<ScanResults['youtube']>): string {
  if ((yt.engagementRate || 0) >= 5) return 'Excellent engagement rate. Your audience is highly active and likely to convert into superfans.';
  if ((yt.engagementRate || 0) >= 2) return 'Good engagement. Focus on building deeper connections through community posts and call-to-actions.';
  if ((yt.subscriberCount || 0) >= 10000) return 'Strong subscriber base. Consider more interactive content to boost engagement with existing fans.';
  return 'Room to grow. Consistent uploading and engaging thumbnails will help build your YouTube presence.';
}

function generateSpotifyInsight(sp: NonNullable<ScanResults['spotify']>): string {
  const followers = sp.followerCount || 0;
  const releases = sp.totalReleases || 0;
  if (followers >= 10000 && releases >= 10) return `${formatNumber(followers)} followers with ${releases} releases. Strong catalog depth that keeps fans engaged and drives algorithmic recommendations.`;
  if (followers >= 1000) return `${formatNumber(followers)} followers. Growing presence — consistent releases and playlist placements will accelerate growth.`;
  if (releases >= 5) return `${releases} releases building your catalog. Focus on playlist submissions and fan engagement to grow your follower base.`;
  return 'Early stages on Spotify. Focus on building a catalog of at least 10-15 tracks to establish credibility and trigger algorithmic recommendations.';
}

function generateWebInsight(web: NonNullable<ScanResults['webPresence']>): string {
  if (web.websiteActive && (web.pressMentions?.length || 0) > 0) return 'Great web presence with press coverage. This establishes authority and attracts industry attention.';
  if (web.websiteActive) return 'Having your own website is a strong foundation. Consider pursuing press features to boost credibility.';
  return 'A dedicated website gives you full control of your brand narrative. Consider building one as a hub for your music.';
}

function generateInstagramInsight(ig: NonNullable<ScanResults['instagram']>): string {
  if ((ig.followerCount || 0) >= 10000) return 'Strong Instagram presence. Leverage Stories and Reels to deepen fan relationships.';
  if ((ig.followerCount || 0) >= 1000) return 'Growing audience. Focus on behind-the-scenes content and personal stories to build superfan connections.';
  return 'Early stage Instagram presence. Consistent posting of authentic content will help grow your following.';
}

function generateTikTokInsight(tt: NonNullable<ScanResults['tiktok']>): string {
  if ((tt.followerCount || 0) >= 10000) return 'Strong TikTok presence. Use trending sounds and challenges to keep momentum.';
  if ((tt.followerCount || 0) >= 1000) return 'Growing TikTok audience. Short-form music content and behind-the-scenes clips can accelerate growth.';
  return 'TikTok is a discovery engine. Even one viral clip can dramatically grow your audience overnight.';
}
