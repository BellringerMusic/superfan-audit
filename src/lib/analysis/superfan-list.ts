import { ScanResults } from '@/types/platforms';
import { SuperfanList, SuperfanPerson } from '@/types/audit';

/**
 * Build the "actual people raising their hand" list from scan results.
 *
 * Today this is sourced from YouTube comment threads — the most public,
 * accessible signal of real fan affinity (someone took the time to type
 * a thought into a comment box). Future sources (Spotify followers,
 * Instagram commenters, TikTok stitch authors) can be merged in here.
 */
export function buildSuperfanList(scanResults: ScanResults): SuperfanList | undefined {
  const yt = scanResults.youtube;

  if (!yt?.found) {
    return {
      headline: 'No public superfan signals found yet',
      source: 'A YouTube channel is the easiest place to surface specific superfans by name.',
      emptyReason: 'Connect a YouTube channel to see who is engaging by name.',
      people: [],
    };
  }

  const commenters = yt.topCommenters || [];

  if (commenters.length === 0) {
    return {
      headline: 'No commenters surfaced on this scan',
      source: `Scanned ${yt.commentsScanned || 0} top-level comments across recent videos.`,
      emptyReason: (yt.avgComments || 0) === 0
        ? 'Recent videos have no comments — every comment you get from here forward is a superfan signal.'
        : 'Your recent videos have comments but none repeat across multiple videos yet. Keep posting consistently — repeat commenters are the strongest fan signal.',
      people: [],
    };
  }

  // People who commented on multiple videos OR commented multiple times = highest tier.
  const repeatEngagers = commenters.filter(c => c.videosCommentedOn >= 2 || c.commentCount >= 2);
  const oneOffEngagers = commenters.filter(c => c.videosCommentedOn < 2 && c.commentCount < 2);

  // Prefer repeat engagers, fall back to one-offs sorted by likes earned.
  const finalList = (repeatEngagers.length > 0 ? repeatEngagers : oneOffEngagers).slice(0, 12);

  const people: SuperfanPerson[] = finalList.map(c => {
    const parts: string[] = [];
    if (c.videosCommentedOn >= 2) {
      parts.push(`${c.commentCount} comment${c.commentCount === 1 ? '' : 's'} across ${c.videosCommentedOn} videos`);
    } else {
      parts.push(`${c.commentCount} comment${c.commentCount === 1 ? '' : 's'} on a recent video`);
    }
    if (c.totalLikes > 0) {
      parts.push(`${c.totalLikes} like${c.totalLikes === 1 ? '' : 's'} earned`);
    }
    if (c.crossPlatformMatch) {
      parts.push('also matches your IG/TikTok handle');
    }

    return {
      name: c.displayName,
      channelUrl: c.channelUrl,
      profileImageUrl: c.profileImageUrl,
      signalSummary: parts.join(' · '),
      source: 'YouTube',
      crossPlatform: c.crossPlatformMatch || undefined,
    };
  });

  const repeatCount = repeatEngagers.length;
  const headline = repeatCount > 0
    ? `${repeatCount} ${repeatCount === 1 ? 'person is' : 'people are'} raising their hand on YouTube`
    : `${people.length} commenters worth watching`;

  const source = `Based on ${yt.commentsScanned || 0} top-level comments across ${yt.videosScannedForComments || 0} recent videos.`;

  return { headline, source, people };
}
