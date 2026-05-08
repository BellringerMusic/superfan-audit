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
  topCommenters?: YouTubeCommenter[];
  commentsScanned?: number;
  videosScannedForComments?: number;
  dataSource?: 'api' | 'search';
  error?: string;
}

export interface YouTubeCommenter {
  /** Display name from the comment author */
  displayName: string;
  /** Channel URL of the commenter (if available) */
  channelUrl?: string;
  /** Profile image of the commenter */
  profileImageUrl?: string;
  /** Number of separate comments left across the scanned videos */
  commentCount: number;
  /** Number of distinct videos this person commented on */
  videosCommentedOn: number;
  /** Total likes their comments received (signal of fan-of-fans status) */
  totalLikes: number;
  /** Whether they appear to also be on the artist's listed Instagram/TikTok (loose match) */
  crossPlatformMatch?: boolean;
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
