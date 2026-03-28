import { ScanResults } from '@/types/platforms';
import { AuditFormData } from '@/types/audit';

export function generateBrandSummary(scanResults: ScanResults, formData: AuditFormData): string {
  const parts: string[] = [];
  const { spotify, youtube, instagram, tiktok, webPresence } = scanResults;

  parts.push(`${formData.artistName} is a ${formData.genre.toLowerCase()} artist who has been active for ${formData.yearsActive.toLowerCase()}.`);

  const platformNames: string[] = [];
  if (spotify?.found) platformNames.push('Spotify');
  if (youtube?.found) platformNames.push('YouTube');
  if (instagram?.found) platformNames.push('Instagram');
  if (tiktok?.found) platformNames.push('TikTok');

  if (platformNames.length > 0) {
    parts.push(`We found an active presence on ${platformNames.join(', ')}.`);
  } else {
    parts.push('We found limited online presence across major music and social platforms.');
  }

  if (youtube?.found && youtube.subscriberCount) {
    parts.push(`On YouTube, they have ${youtube.subscriberCount.toLocaleString()} subscribers across ${youtube.videoCount || 0} videos, averaging ${(youtube.avgViews || 0).toLocaleString()} views per recent upload.`);
  }

  if (spotify?.found) {
    const releaseInfo = [];
    if (spotify.albumCount) releaseInfo.push(`${spotify.albumCount} album${spotify.albumCount > 1 ? 's' : ''}`);
    if (spotify.singleCount) releaseInfo.push(`${spotify.singleCount} single${spotify.singleCount > 1 ? 's' : ''}`);
    if (releaseInfo.length > 0) {
      parts.push(`Their Spotify catalog includes ${releaseInfo.join(' and ')}.`);
    }
    if (spotify.genres && spotify.genres.length > 0) {
      parts.push(`Spotify categorizes their sound as ${spotify.genres.slice(0, 3).join(', ')}.`);
    }
  }

  if (instagram?.found && instagram.followerCount) {
    parts.push(`Their Instagram has ${instagram.followerCount.toLocaleString()} followers.`);
  }

  if (tiktok?.found && tiktok.followerCount) {
    parts.push(`They have ${tiktok.followerCount.toLocaleString()} followers on TikTok.`);
  }

  if (webPresence?.websiteActive) {
    parts.push('They have an active personal website, which is a strong foundation for direct fan relationships.');
  }

  if (webPresence?.pressMentions && webPresence.pressMentions.length > 0) {
    parts.push(`We found press mentions on ${webPresence.pressMentions.slice(0, 3).join(', ')}, indicating growing industry visibility.`);
  }

  return parts.join(' ');
}
