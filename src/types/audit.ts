export interface AuditFormData {
  name: string;
  email: string;
  consent: boolean;
  artistName: string;
  genre: string;
  monthlyIncome: string;
  yearsActive: string;
  spotifyUrl: string;
  youtubeUrl: string;
  instagramHandle: string;
  instagramFollowers?: string;
  tiktokHandle: string;
  websiteUrl: string;
}

export interface AuditJob {
  id: string;
  status: 'processing' | 'complete' | 'error';
  progress: number;
  currentStep: string;
  formData: AuditFormData;
  result?: AuditResult;
  pdfUrl?: string;
  error?: string;
  createdAt: string;
}

export interface AuditResult {
  artistName: string;
  genre: string;
  monthlyIncome: string;
  yearsActive: string;
  brandSummary: string;
  audienceStrengthScore: number;
  scoreBreakdown: ScoreBreakdown;
  platformBreakdowns: PlatformBreakdown[];
  superfanAnalysis: SuperfanAnalysis;
  superfanList?: SuperfanList;
  recommendedOffer: RecommendedOffer;
  actionItems: ActionItem[];
  benchmarkComparison: BenchmarkComparison;
  scannedAt: string;
}

export interface SuperfanList {
  /** Headline summary (e.g. "We found 8 people raising their hand on YouTube") */
  headline: string;
  /** Source description ("based on N comments across M videos") */
  source: string;
  /** Whether the list is empty + why (so the result page can explain) */
  emptyReason?: string;
  people: SuperfanPerson[];
}

export interface SuperfanPerson {
  name: string;
  channelUrl?: string;
  profileImageUrl?: string;
  /** Why we picked them (e.g. "5 comments across 3 videos · 12 likes earned") */
  signalSummary: string;
  /** Source platform (currently always 'YouTube' but reserved for future) */
  source: 'YouTube';
  /** Whether this person also appears to follow you on IG/TikTok by handle match */
  crossPlatform?: boolean;
}

export interface ScoreBreakdown {
  youtube: number;
  spotify: number;
  crossPlatform: number;
  webPresence: number;
  social: number;
  total: number;
}

export interface PlatformBreakdown {
  platform: string;
  icon: string;
  found: boolean;
  metrics: Record<string, string | number>;
  strengthRating: 'Strong' | 'Growing' | 'Needs Work' | 'Not Found' | 'Scan Limited';
  insight: string;
  score: number;
}

export interface SuperfanAnalysis {
  tier: 'High Superfan Potential' | 'Growing Superfan Base' | 'Untapped Superfan Potential';
  engagementRate: number;
  description: string;
  keyIndicators: string[];
}

export interface RecommendedOffer {
  title: string;
  tier: string;
  description: string;
  examples: string[];
  whyThisWorks: string;
}

export interface ActionItem {
  number: number;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface BenchmarkComparison {
  tier: string;
  tierLabel: string;
  yourScore: number;
  avgScore: number;
  topPerformerScore: number;
  insights: string[];
}
