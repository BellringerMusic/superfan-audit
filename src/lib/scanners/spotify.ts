import { SpotifyData } from '@/types/platforms';
import { extractSpotifyArtistId } from '@/lib/utils';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Spotify credentials not configured');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error(`Spotify auth failed: ${res.status}`);
  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

export async function scanSpotify(spotifyUrl: string, artistName: string): Promise<SpotifyData> {
  try {
    const token = await getAccessToken();
    const headers = { Authorization: `Bearer ${token}` };

    let artistId = extractSpotifyArtistId(spotifyUrl);

    if (!artistId && artistName) {
      const searchRes = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=5`,
        { headers }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const artists = searchData.artists?.items || [];
        const match = artists.find(
          (a: { name: string }) => a.name.toLowerCase() === artistName.toLowerCase()
        ) || artists[0];
        if (match) artistId = match.id;
      }
    }

    if (!artistId) {
      return { found: false, error: 'Artist not found on Spotify' };
    }

    const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, { headers });
    if (!artistRes.ok) return { found: false, error: 'Could not fetch artist data' };
    const artist = await artistRes.json();

    const albumsRes = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=50`,
      { headers }
    );
    let albumCount = 0;
    let singleCount = 0;
    let latestRelease: SpotifyData['latestRelease'] = undefined;

    if (albumsRes.ok) {
      const albumsData = await albumsRes.json();
      const items = albumsData.items || [];
      albumCount = items.filter((a: { album_group: string }) => a.album_group === 'album').length;
      singleCount = items.filter((a: { album_group: string }) => a.album_group === 'single').length;
      if (items.length > 0) {
        const latest = items[0];
        latestRelease = {
          name: latest.name,
          releaseDate: latest.release_date,
          type: latest.album_group,
        };
      }
    }

    return {
      found: true,
      artistId,
      name: artist.name,
      genres: artist.genres || [],
      images: artist.images || [],
      externalUrl: artist.external_urls?.spotify,
      albumCount,
      singleCount,
      totalReleases: albumCount + singleCount,
      latestRelease,
    };
  } catch (error) {
    return { found: false, error: error instanceof Error ? error.message : 'Spotify scan failed' };
  }
}
