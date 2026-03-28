import { ScanResults } from '@/types/platforms';
import { SuperfanAnalysis } from '@/types/audit';

export function analyzeSuperfanPotential(scanResults: ScanResults): SuperfanAnalysis {
  const { youtube, instagram, tiktok, spotify } = scanResults;

  let engagementRate = 0;
  let engagementSignals = 0;
  let totalSignals = 0;
  const keyIndicators: string[] = [];

  // YouTube engagement analysis
  if (youtube?.found) {
    totalSignals++;
    if (youtube.engagementRate && youtube.engagementRate > 0) {
      engagementRate = youtube.engagementRate;
      if (youtube.engagementRate >= 5) {
        engagementSignals += 2;
        keyIndicators.push('High YouTube engagement rate signals a dedicated viewer base');
      } else if (youtube.engagementRate >= 2) {
        engagementSignals += 1;
        keyIndicators.push('Moderate YouTube engagement shows growing viewer loyalty');
      }
    }
    if ((youtube.avgComments || 0) > 10) {
      keyIndicators.push(`Average of ${youtube.avgComments} comments per video shows active community`);
    }
  }

  // Multi-platform presence
  const platforms = [youtube?.found, spotify?.found, instagram?.found, tiktok?.found].filter(Boolean).length;
  totalSignals++;
  if (platforms >= 3) {
    engagementSignals += 2;
    keyIndicators.push(`Active on ${platforms} platforms - fans can connect with you in multiple ways`);
  } else if (platforms >= 2) {
    engagementSignals += 1;
    keyIndicators.push(`Present on ${platforms} platforms - expanding to more increases fan touchpoints`);
  }

  // Instagram engagement signals
  if (instagram?.found && instagram.followerCount && instagram.postCount) {
    totalSignals++;
    const postsPerFollower = instagram.postCount / Math.max(instagram.followerCount, 1);
    if (postsPerFollower > 0.01) {
      engagementSignals += 1;
      keyIndicators.push('Consistent Instagram posting keeps fans engaged between releases');
    }
  }

  // Spotify catalog depth
  if (spotify?.found && (spotify.totalReleases || 0) > 5) {
    totalSignals++;
    engagementSignals += 1;
    keyIndicators.push(`${spotify.totalReleases} releases give fans a catalog to explore and share`);
  }

  // Determine tier
  const ratio = totalSignals > 0 ? engagementSignals / totalSignals : 0;

  let tier: SuperfanAnalysis['tier'];
  let description: string;

  if (ratio >= 0.6 || engagementRate >= 5) {
    tier = 'High Superfan Potential';
    description = 'Your audience shows strong signs of deep engagement. These aren\'t just passive listeners - they\'re actively interacting with your content, which means they\'re primed to support you through purchases, memberships, and word-of-mouth. Your next step is to give them a clear way to go deeper with you.';
  } else if (ratio >= 0.3 || engagementRate >= 2) {
    tier = 'Growing Superfan Base';
    description = 'You\'re building something real. Your audience is starting to show loyalty signals, but there\'s significant room to deepen those connections. Focus on creating more opportunities for two-way interaction - ask questions, share behind-the-scenes moments, and make your fans feel like insiders.';
  } else {
    tier = 'Untapped Superfan Potential';
    description = 'You have an audience, but they may not yet feel a personal connection to your brand. This is actually a huge opportunity. By shifting from broadcasting to relationship-building - personal stories, direct fan engagement, exclusive access - you can transform passive followers into passionate supporters.';
  }

  if (keyIndicators.length === 0) {
    keyIndicators.push('Limited engagement data available - focus on building presence across platforms');
    keyIndicators.push('Start with one platform and create consistently before expanding');
  }

  return {
    tier,
    engagementRate: Math.round(engagementRate * 100) / 100,
    description,
    keyIndicators: keyIndicators.slice(0, 5),
  };
}
