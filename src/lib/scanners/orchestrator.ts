import { AuditFormData } from '@/types/audit';
import { ScanResults } from '@/types/platforms';
import { scanSpotify } from './spotify';
import { scanYouTube } from './youtube';
import { scanInstagram } from './instagram';
import { scanTikTok } from './tiktok';
import { scanWebPresence } from './web-presence';

type ProgressCallback = (progress: number, step: string) => Promise<void>;

export async function runAllScanners(
  formData: AuditFormData,
  onProgress?: ProgressCallback
): Promise<ScanResults> {
  const errors: { platform: string; error: string }[] = [];

  await onProgress?.(10, 'Starting platform scans...');

  const scanPromises = [
    formData.spotifyUrl || formData.artistName
      ? scanSpotify(formData.spotifyUrl, formData.artistName)
      : Promise.resolve(null),
    formData.youtubeUrl || formData.artistName
      ? scanYouTube(formData.youtubeUrl, formData.artistName)
      : Promise.resolve(null),
    formData.instagramHandle
      ? scanInstagram(formData.instagramHandle)
      : Promise.resolve(null),
    formData.tiktokHandle
      ? scanTikTok(formData.tiktokHandle)
      : Promise.resolve(null),
    formData.websiteUrl || formData.artistName
      ? scanWebPresence(formData.websiteUrl, formData.artistName)
      : Promise.resolve(null),
  ];

  await onProgress?.(20, 'Scanning your platforms...');

  const results = await Promise.allSettled(scanPromises);

  await onProgress?.(60, 'Processing scan results...');

  const spotify = results[0].status === 'fulfilled' ? results[0].value : null;
  const youtube = results[1].status === 'fulfilled' ? results[1].value : null;
  const instagram = results[2].status === 'fulfilled' ? results[2].value : null;
  const tiktok = results[3].status === 'fulfilled' ? results[3].value : null;
  const webPresence = results[4].status === 'fulfilled' ? results[4].value : null;

  if (results[0].status === 'rejected') errors.push({ platform: 'Spotify', error: results[0].reason?.message || 'Unknown error' });
  if (results[1].status === 'rejected') errors.push({ platform: 'YouTube', error: results[1].reason?.message || 'Unknown error' });
  if (results[2].status === 'rejected') errors.push({ platform: 'Instagram', error: results[2].reason?.message || 'Unknown error' });
  if (results[3].status === 'rejected') errors.push({ platform: 'TikTok', error: results[3].reason?.message || 'Unknown error' });
  if (results[4].status === 'rejected') errors.push({ platform: 'Web', error: results[4].reason?.message || 'Unknown error' });

  return { spotify, youtube, instagram, tiktok, webPresence, errors };
}
