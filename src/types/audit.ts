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
  recommendedOffer: RecommendedOffer;
  actionItems: ActionItem[];
  benchmarkComparison: BenchmarkComparison;
  scannedAt: string;
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
