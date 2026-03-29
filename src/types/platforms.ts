export interface SpotifyData {
  found: boolean;
  artistId?: string;
  name?: string;
  followerCount?: number;
  popularity?: number;
  genres?: string[];
  images?: { url: string; width: number; height: number }[];
  externalUrl?: string;
  albumCount?: number;
  singleCount?: number;
  totalReleases?: number;
  latestRelease?: { name: string; releaseDate: string; type: string };
  dataSource?: 'api' | 'search';
  error?: string;
}

export interface YouTubeData {
  found: boolean;
  channelId?: string;
  channelTitle?: string;
  description?: string;
  subscriberCount?: number;
  viewCount?: number;
  videoCount?: number;
  thumbnailUrl?: string;
  recentVideos?: YouTubeVideoStats[];
  avgViews?: number;
  avgLikes?: number;
  avgComments?: number;
  engagementRate?: number;
  dataSource?: 'api' | 'search';
  error?: string;
}

export interface YouTubeVideoStats {
  title: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
}

export interface InstagramData {
  found: boolean;
  username?: string;
  fullName?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  isVerified?: boolean;
  dataSource?: 'api' | 'scrape' | 'unavailable';
  error?: string;
}

export interface TikTokData {
  found: boolean;
  username?: string;
  displayName?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  likeCount?: number;
  videoCount?: number;
  error?: string;
}

export interface WebPresenceData {
  found: boolean;
  websiteActive?: boolean;
  websiteTitle?: string;
  websiteDescription?: string;
  searchResultCount?: number;
  pressMentions?: string[];
  otherPlatforms?: string[];
  error?: string;
}

export interface ScanResults {
  spotify: SpotifyData | null;
  youtube: YouTubeData | null;
  instagram: InstagramData | null;
  tiktok: TikTokData | null;
  webPresence: WebPresenceData | null;
  errors: { platform: string; error: string }[];
}
