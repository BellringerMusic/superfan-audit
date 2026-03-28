import { BenchmarkComparison } from '@/types/audit';

interface TierBenchmark {
  label: string;
  avgScore: number;
  topScore: number;
  avgPlatforms: number;
  avgReleases: number;
  avgEngagement: number;
}

const benchmarks: Record<string, TierBenchmark> = {
  emerging: {
    label: 'Emerging Artist (0-1K followers)',
    avgScore: 22,
    topScore: 45,
    avgPlatforms: 2,
    avgReleases: 3,
    avgEngagement: 3.5,
  },
  growing: {
    label: 'Growing Artist (1K-10K followers)',
    avgScore: 42,
    topScore: 68,
    avgPlatforms: 3,
    avgReleases: 12,
    avgEngagement: 3.0,
  },
  established: {
    label: 'Established Artist (10K-50K followers)',
    avgScore: 58,
    topScore: 82,
    avgPlatforms: 4,
    avgReleases: 25,
    avgEngagement: 2.5,
  },
  professional: {
    label: 'Professional Artist (50K+ followers)',
    avgScore: 72,
    topScore: 95,
    avgPlatforms: 5,
    avgReleases: 40,
    avgEngagement: 2.0,
  },
};

export function generateBenchmarkComparison(
  audienceScore: number,
  totalFollowers: number
): BenchmarkComparison {
  let tier: string;
  if (totalFollowers >= 50000) tier = 'professional';
  else if (totalFollowers >= 10000) tier = 'established';
  else if (totalFollowers >= 1000) tier = 'growing';
  else tier = 'emerging';

  const benchmark = benchmarks[tier];
  const insights: string[] = [];

  if (audienceScore > benchmark.avgScore) {
    const pctAbove = Math.round(((audienceScore - benchmark.avgScore) / benchmark.avgScore) * 100);
    insights.push(`You're scoring ${pctAbove}% above the average for artists in your tier`);
  } else if (audienceScore < benchmark.avgScore) {
    const pctBelow = Math.round(((benchmark.avgScore - audienceScore) / benchmark.avgScore) * 100);
    insights.push(`You're ${pctBelow}% below the average for your tier - there's clear room for growth`);
  } else {
    insights.push('You\'re right at the average for your tier - a few strategic moves can push you ahead');
  }

  if (audienceScore >= benchmark.topScore * 0.8) {
    insights.push('You\'re approaching top-performer territory in your tier');
  }

  const gap = benchmark.topScore - audienceScore;
  if (gap > 20) {
    insights.push(`Top performers in your tier score around ${benchmark.topScore} - closing this gap means focusing on your weakest platform`);
  }

  return {
    tier,
    tierLabel: benchmark.label,
    yourScore: audienceScore,
    avgScore: benchmark.avgScore,
    topPerformerScore: benchmark.topScore,
    insights,
  };
}
