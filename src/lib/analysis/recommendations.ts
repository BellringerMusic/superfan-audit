import { ScanResults } from '@/types/platforms';
import { RecommendedOffer, ActionItem } from '@/types/audit';
import { getIncomeIndex } from '@/lib/utils';

export function generateRecommendation(
  scanResults: ScanResults,
  monthlyIncome: string,
  audienceScore: number
): RecommendedOffer {
  const incomeIdx = getIncomeIndex(monthlyIncome);
  const totalFollowers = estimateTotalFollowers(scanResults);

  // Matrix: audience size x income level
  if (totalFollowers < 1000 || audienceScore < 20) {
    return {
      title: 'Foundation Builder',
      tier: 'Build Your Foundation',
      description: 'Before monetizing, you need to build a core audience of true fans. Focus on creating remarkable content consistently and building genuine connections with your early supporters. These first fans become your evangelists.',
      examples: [
        'Free download / sample pack to build email list',
        'Cover songs or collaborations to reach new audiences',
        'Behind-the-scenes content series on social media',
        'Local live performances and community building',
      ],
      whyThisWorks: 'At this stage, the most valuable thing you can build is trust and attention. Every superfan relationship starts with free value that makes someone think "I need to follow this artist."',
    };
  }

  if (totalFollowers < 10000 || (incomeIdx <= 1 && audienceScore < 50)) {
    return {
      title: 'Direct Fan Monetization',
      tier: 'Fan-Funded Growth',
      description: 'You have enough engaged fans to start generating revenue directly from your audience. The key is offering exclusive access and experiences that make fans feel like insiders.',
      examples: [
        'Paid Discord or community membership ($5-15/mo)',
        'Early access to new music and unreleased tracks',
        'Monthly live streams or Q&A sessions for supporters',
        'Limited-run merch drops (start small, 50-100 units)',
      ],
      whyThisWorks: `With ${totalFollowers < 5000 ? 'a few thousand' : 'several thousand'} followers, even a 2-3% conversion to a $10/month membership creates meaningful recurring revenue. Your engaged audience is ready for this.`,
    };
  }

  if (totalFollowers < 50000 || (incomeIdx <= 3 && audienceScore < 70)) {
    return {
      title: 'Product Stack Builder',
      tier: 'Scale With Products',
      description: 'Your audience is large enough to support multiple revenue streams. It\'s time to build a product ecosystem around your music that serves fans at different commitment levels.',
      examples: [
        'Full merchandise line with unique brand identity',
        'Online course teaching your craft or creative process',
        'Tiered membership (basic/premium/VIP access levels)',
        'Sync licensing and brand partnership outreach',
      ],
      whyThisWorks: `At your audience size, you can support a proper product ladder. Not every fan will buy everything, but having options at $10, $50, and $200+ price points maximizes the value of each superfan relationship.`,
    };
  }

  return {
    title: 'Full Monetization Stack',
    tier: 'Maximum Revenue',
    description: 'You have a significant audience and strong engagement. It\'s time to build a full business around your brand with multiple high-value revenue streams and strategic partnerships.',
    examples: [
      'High-ticket coaching or mastermind for aspiring artists',
      'Brand deals and sponsorship packages',
      'Touring strategy with VIP fan experiences',
      'Licensing catalog for film, TV, and advertising',
      'Digital products and templates in your niche',
    ],
    whyThisWorks: 'With your audience size and engagement level, you\'re leaving money on the table with a single revenue stream. Each of these channels can become a six-figure line of business.',
  };
}

export function generateActionItems(
  scanResults: ScanResults,
  monthlyIncome: string,
  audienceScore: number
): ActionItem[] {
  const items: ActionItem[] = [];
  const { youtube, spotify, instagram, tiktok, webPresence } = scanResults;
  const incomeIdx = getIncomeIndex(monthlyIncome);

  // Priority 1: Fix the biggest gap
  if (!youtube?.found && !spotify?.found) {
    items.push({
      number: 1,
      title: 'Establish Your Primary Platform',
      description: 'You need at least one strong platform to build superfan relationships. Start a YouTube channel or get your music on Spotify this week. YouTube is ideal for building personal connections through video content.',
      priority: 'High',
    });
  } else if (youtube?.found && (youtube.engagementRate || 0) < 2) {
    items.push({
      number: 1,
      title: 'Boost YouTube Engagement',
      description: 'Your videos are getting views but not enough interaction. End every video with a specific question. Pin a comment asking fans to share their thoughts. Reply to every comment for the next 30 days.',
      priority: 'High',
    });
  } else if (spotify?.found && (spotify.totalReleases || 0) < 5) {
    items.push({
      number: 1,
      title: 'Build Your Release Catalog',
      description: 'Aim for at least one release per month for the next 3 months. Singles are fine - consistency matters more than album-length projects at this stage. Each release is a new discovery opportunity.',
      priority: 'High',
    });
  } else {
    items.push({
      number: 1,
      title: 'Create a Fan Email List',
      description: 'Social platforms can change their algorithm overnight. An email list is the only audience you truly own. Offer a free exclusive track or behind-the-scenes video in exchange for email sign-ups.',
      priority: 'High',
    });
  }

  // Priority 2: Cross-platform or monetization
  const platformCount = [youtube?.found, spotify?.found, instagram?.found, tiktok?.found].filter(Boolean).length;

  if (platformCount < 2) {
    items.push({
      number: 2,
      title: 'Expand to a Second Platform',
      description: instagram?.found
        ? 'You\'re on Instagram but missing YouTube or Spotify. Music fans discover artists through streaming and video. Prioritize getting your music distributed to streaming platforms.'
        : 'Cross-platform presence multiplies your reach. Start with short-form video (TikTok or Instagram Reels) to repurpose your existing content into bite-sized clips.',
      priority: 'High',
    });
  } else if (incomeIdx <= 1 && audienceScore >= 30) {
    items.push({
      number: 2,
      title: 'Launch Your First Paid Offering',
      description: 'Your audience is ready to support you. Start with something simple: a $5/month community, a $20 merch item, or a $50 exclusive experience. Don\'t overthink it - your first offer just needs to exist.',
      priority: 'High',
    });
  } else {
    items.push({
      number: 2,
      title: 'Deepen Fan Relationships',
      description: 'Start a weekly behind-the-scenes series showing your creative process. Fans who feel connected to your journey become superfans. Share the messy, real moments - not just polished releases.',
      priority: 'Medium',
    });
  }

  // Priority 3: Growth or optimization
  if (!webPresence?.websiteActive) {
    items.push({
      number: 3,
      title: 'Build Your Own Website',
      description: 'A simple one-page site with your bio, music links, and email signup gives you a home base you control. Use it as your link-in-bio destination. Services like Carrd or Squarespace make this easy.',
      priority: 'Medium',
    });
  } else if (audienceScore >= 50) {
    items.push({
      number: 3,
      title: 'Create a Referral System',
      description: 'Your most engaged fans are your best marketers. Create a system where fans earn exclusive content or early access for referring friends. Even a simple "share this with 3 friends" CTA works.',
      priority: 'Medium',
    });
  } else {
    items.push({
      number: 3,
      title: 'Collaborate With Similar Artists',
      description: 'Find 3-5 artists at a similar level in your genre and propose collaborations. Feature swaps, joint live streams, or playlist exchanges expose you to each other\'s audiences at zero cost.',
      priority: 'Medium',
    });
  }

  return items;
}

function estimateTotalFollowers(scanResults: ScanResults): number {
  let total = 0;
  if (scanResults.youtube?.subscriberCount) total += scanResults.youtube.subscriberCount;
  if (scanResults.instagram?.followerCount) total += scanResults.instagram.followerCount;
  if (scanResults.tiktok?.followerCount) total += scanResults.tiktok.followerCount;
  return total;
}
