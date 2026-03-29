import { AuditFormData } from '@/types/audit';
import { ScanResults, SpotifyData, YouTubeData, InstagramData, TikTokData, WebPresenceData } from '@/types/platforms';
import { scanSpotify } from './spotify';
import { scanYouTube } from './youtube';
import { scanInstagram } from './instagram';
import { scanTikTok } from './tiktok';
import { scanWebPresence } from './web-presence';

export async function runAllScanners(
  formData: AuditFormData,
): Promise<ScanResults> {
  const errors: { platform: string; error: string }[] = [];

  // Run all scanners in parallel with individual error handling
  const [spotifyResult, youtubeResult, instagramResult, tiktokResult, webResult] = await Promise.allSettled([
    formData.spotifyUrl || formData.artistName
      ? scanSpotify(formData.spotifyUrl, formData.artistName)
      : Promise.resolve(null),
    formData.youtubeUrl || formData.artistName
      ? scanYouTube(formData.youtubeUrl, formData.artistName)
      : Promise.resolve(null),
    formData.instagramHandle
      ? scanInstagram(formData.instagramHandle, formData.instagramFollowers)
      : Promise.resolve(null),
    formData.tiktokHandle
      ? scanTikTok(formData.tiktokHandle)
      : Promise.resolve(null),
    formData.websiteUrl || formData.artistName
      ? scanWebPresence(formData.websiteUrl, formData.artistName)
      : Promise.resolve(null),
  ]);

  const spotify: SpotifyData | null = spotifyResult.status === 'fulfilled' ? spotifyResult.value : null;
  const youtube: YouTubeData | null = youtubeResult.status === 'fulfilled' ? youtubeResult.value : null;
  const instagram: InstagramData | null = instagramResult.status === 'fulfilled' ? instagramResult.value : null;
  const tiktok: TikTokData | null = tiktokResult.status === 'fulfilled' ? tiktokResult.value : null;
  const webPresence: WebPresenceData | null = webResult.status === 'fulfilled' ? webResult.value : null;

  if (spotifyResult.status === 'rejected') errors.push({ platform: 'Spotify', error: spotifyResult.reason?.message || 'Unknown error' });
  if (youtubeResult.status === 'rejected') errors.push({ platform: 'YouTube', error: youtubeResult.reason?.message || 'Unknown error' });
  if (instagramResult.status === 'rejected') errors.push({ platform: 'Instagram', error: instagramResult.reason?.message || 'Unknown error' });
  if (tiktokResult.status === 'rejected') errors.push({ platform: 'TikTok', error: tiktokResult.reason?.message || 'Unknown error' });
  if (webResult.status === 'rejected') errors.push({ platform: 'Web', error: webResult.reason?.message || 'Unknown error' });

  return { spotify, youtube, instagram, tiktok, webPresence, errors };
}
