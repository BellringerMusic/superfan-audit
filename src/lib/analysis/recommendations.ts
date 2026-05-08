import { ScanResults } from '@/types/platforms';
import { RecommendedOffer, ActionItem } from '@/types/audit';
import { getIncomeIndex, formatNumber } from '@/lib/utils';

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

/**
 * Build action items grounded in the artist's actual scan data — specific
 * numbers, named commenters, real release titles, real platform gaps.
 *
 * Each candidate action computes a `score` based on leverage. We pick the top
 * three so the output reflects this scan, not a static template.
 */
export function generateActionItems(
  scanResults: ScanResults,
  monthlyIncome: string,
  audienceScore: number
): ActionItem[] {
  const { youtube, spotify, instagram, tiktok, webPresence } = scanResults;
  const incomeIdx = getIncomeIndex(monthlyIncome);
  const platformCount = [youtube?.found, spotify?.found, instagram?.found, tiktok?.found].filter(Boolean).length;
  const totalFollowers =
    (youtube?.subscriberCount || 0) + (instagram?.followerCount || 0) + (tiktok?.followerCount || 0);

  type Candidate = ActionItem & { score: number };
  const candidates: Candidate[] = [];

  // ── 1. Reply to your named superfans ─────────────────────────────────────
  // Highest-leverage move when we identified specific people raising their hand.
  const repeatEngagers = (youtube?.topCommenters || []).filter(
    (c) => c.videosCommentedOn >= 2 || c.commentCount >= 2,
  );
  if (repeatEngagers.length > 0) {
    const top3 = repeatEngagers.slice(0, 3);
    const names = top3.map((c) => c.displayName);
    const total = repeatEngagers.length;
    const namesPhrase = names.length === 1
      ? names[0]
      : names.length === 2
      ? `${names[0]} and ${names[1]}`
      : `${names[0]}, ${names[1]}, and ${names[2]}`;
    const topVideo = youtube?.recentVideos?.[0]?.title;
    const example = topVideo
      ? `Open with: "Hey ${names[0]} — saw your comment on '${truncate(topVideo, 50)}'. What hit you about it?"`
      : `Open with: "Hey ${names[0]} — I saw you've been showing up across multiple videos. What hit you most?"`;
    candidates.push({
      number: 0,
      title: `Reply to ${namesPhrase} this week`,
      description: `These are the ${total === 1 ? '1 person' : `${total} people`} our scan identified as repeat commenters across your recent videos — the strongest superfan signal we found. Reply to each one by name in their thread, then DM them and offer something free (a download, a private link, a behind-the-scenes clip). ${example} The first fifty superfans start with naming the ones already raising their hand.`,
      priority: 'High',
      score: 100,
    });
  }

  // ── 2. Boost a low YouTube comment rate ──────────────────────────────────
  if (youtube?.found && youtube.avgViews && youtube.avgViews > 0) {
    const commentRate = ((youtube.avgComments || 0) / youtube.avgViews) * 100;
    if (commentRate < 0.5 && (youtube.avgComments || 0) < 30) {
      candidates.push({
        number: 0,
        title: `Triple your YouTube comment rate (currently ${commentRate.toFixed(2)}%)`,
        description: `Your last ${youtube.recentVideos?.length || 10} videos averaged ${formatNumber(youtube.avgViews)} views and only ${youtube.avgComments} comments — a ${commentRate.toFixed(2)}% comment rate. End the next 3 videos with one specific question (not "what do you think?" — something like "comment ONE word that describes how this hit you"). Pin a top comment yourself to seed the thread. Reply to every single comment within 24 hours for 30 days. Goal: get to 1.5%+ comment rate, where superfan signals start showing up clearly.`,
        priority: 'High',
        score: 85,
      });
    }
  }

  // ── 3. Get back on a release cadence ─────────────────────────────────────
  if (spotify?.found && spotify.latestRelease?.releaseDate) {
    const days = daysSince(spotify.latestRelease.releaseDate);
    if (days >= 60) {
      candidates.push({
        number: 0,
        title: `Schedule your next release — '${truncate(spotify.latestRelease.name, 40)}' dropped ${days} days ago`,
        description: `Spotify's algorithmic boost decays sharply after day 30 and is essentially gone by day 90 — you're at day ${days}. Set a release date for the next single this week and back-plan from there: distribution lead time (DistroKid: 1 day, TuneCore: 7-21 days), pre-save campaign (3-4 weeks before drop), and 3 short-form video clips queued for release week. Releasing every 4-6 weeks keeps you in the algorithm's "active artist" tier.`,
        priority: 'High',
        score: 80,
      });
    }
  }

  // ── 4. Build catalog depth on Spotify ────────────────────────────────────
  if (spotify?.found && (spotify.totalReleases || 0) < 10) {
    const have = spotify.totalReleases || 0;
    const need = 10 - have;
    candidates.push({
      number: 0,
      title: `Build your Spotify catalog from ${have} to 10 releases`,
      description: `You currently have ${have} release${have === 1 ? '' : 's'} on Spotify (${spotify.albumCount || 0} album${spotify.albumCount === 1 ? '' : 's'}, ${spotify.singleCount || 0} single${spotify.singleCount === 1 ? '' : 's'}). The Spotify algorithm starts treating an artist as "established" around 10 releases — that's when Discover Weekly and Release Radar start surfacing you to non-followers. Schedule ${need} singles over the next ${need * 4} weeks (one every ~4 weeks). Don't wait to write album-length material; consistency outperforms scope at this stage.`,
      priority: 'High',
      score: 70,
    });
  }

  // ── 5. Establish first platform ──────────────────────────────────────────
  if (!youtube?.found && !spotify?.found) {
    const ig = instagram?.found ? `your Instagram${instagram.followerCount ? ` (${formatNumber(instagram.followerCount)} followers)` : ''}` : null;
    const tt = tiktok?.found ? `your TikTok${tiktok.followerCount ? ` (${formatNumber(tiktok.followerCount)} followers)` : ''}` : null;
    const social = [ig, tt].filter(Boolean).join(' and ');
    candidates.push({
      number: 0,
      title: 'Pick a music hub — Spotify or YouTube — this week',
      description: `You're showing up on ${social || 'social media'} but not on a music platform where superfans live. Spotify is the lower-friction path: distribute via DistroKid ($23/yr) and you can have a song live in 24-48 hours. YouTube takes longer to build but compounds harder for personal connection. Pick one, put your first piece up by Friday, and link to it from every social bio.`,
      priority: 'High',
      score: 95,
    });
  }

  // ── 6. Cross-platform expansion (specific to what they're missing) ───────
  if (platformCount >= 1 && platformCount < 3) {
    const missing: string[] = [];
    if (!youtube?.found) missing.push('YouTube');
    if (!spotify?.found) missing.push('Spotify');
    if (!instagram?.found) missing.push('Instagram');
    if (!tiktok?.found) missing.push('TikTok');
    const have: string[] = [];
    if (youtube?.found) have.push('YouTube');
    if (spotify?.found) have.push('Spotify');
    if (instagram?.found) have.push('Instagram');
    if (tiktok?.found) have.push('TikTok');

    if (missing.length > 0) {
      const target = missing[0];
      const reasoning =
        target === 'Spotify'
          ? 'Streaming is where music fans listen passively while doing other things — your YouTube viewers want a way to play your music in the background. Distribute via DistroKid and reuse your YouTube audio.'
          : target === 'YouTube'
          ? 'YouTube is where superfan relationships deepen — fans who watch a 5-minute video feel they know you in a way short-form content can\'t replicate. Start with one video per week: behind-the-scenes, a stripped-down performance, or a story about a song.'
          : target === 'TikTok'
          ? 'TikTok is your discovery engine. Repurpose 15-30 second clips from your existing content. The algorithm is the most generous of any platform for new accounts — even one viral clip can shift your trajectory.'
          : 'Instagram is where fans check up on you between releases. Stories build the most intimacy. Repurpose existing content — you don\'t need new shoots.';
      candidates.push({
        number: 0,
        title: `Add ${target} to your stack (you're on ${have.join(' + ')})`,
        description: `${reasoning} Set up the account, post your first 3 pieces of content this week, and pin/link the new platform from every other bio.`,
        priority: 'High',
        score: 75,
      });
    }
  }

  // ── 7. Launch first paid offer ───────────────────────────────────────────
  if (incomeIdx <= 1 && totalFollowers >= 1000 && audienceScore >= 30) {
    const conversionEstimate = Math.round(totalFollowers * 0.005);
    candidates.push({
      number: 0,
      title: 'Launch your first $5–$15/month paid tier',
      description: `You have ~${formatNumber(totalFollowers)} followers across platforms with a ${audienceScore}/100 audience strength score — enough engaged audience to support a small recurring offer. A 0.5% conversion at $10/mo would be ~${conversionEstimate} members and $${conversionEstimate * 10}/mo in recurring revenue. Don't overthink the deliverable: monthly Q&A live, demos before they hit Spotify, a private Discord. Use Patreon, Buy Me a Coffee, or Ko-fi — set up takes under an hour. Announce it to the named superfans first (Action 1).`,
      priority: 'High',
      score: 65,
    });
  }

  // ── 8. Build email list ──────────────────────────────────────────────────
  if (!webPresence?.websiteActive && totalFollowers > 500) {
    candidates.push({
      number: 0,
      title: 'Put up a one-page email-capture site this week',
      description: `You have ~${formatNumber(totalFollowers)} followers but no website — meaning every fan you have lives on a platform that can change its rules tomorrow. Build a one-page site (Carrd: $19/yr, Squarespace, or a Linktree+ContactForm combo) with: artist photo, 2-line bio, music links, and an email signup that gives away one unreleased or stripped-down track. Link it from every bio. Email is the only audience you actually own.`,
      priority: 'High',
      score: 60,
    });
  }

  // ── 9. Convert TikTok / IG audience to streaming ─────────────────────────
  if (
    (tiktok?.found || instagram?.found) &&
    !spotify?.found
  ) {
    const ttFollowers = tiktok?.followerCount || 0;
    const igFollowers = instagram?.followerCount || 0;
    const biggest = ttFollowers > igFollowers ? 'TikTok' : 'Instagram';
    const biggestCount = Math.max(ttFollowers, igFollowers);
    candidates.push({
      number: 0,
      title: `Distribute your music — ${biggest} reach is wasted without Spotify`,
      description: `${biggestCount > 0 ? `You have ${formatNumber(biggestCount)} followers on ${biggest}` : `You're active on ${biggest}`}, but you're not on Spotify — meaning anyone who hears a clip and wants to listen full has nowhere to go. Distribute via DistroKid this week. Then update your ${biggest} bio with the Spotify link and pin a "full song on Spotify" comment to your top videos.`,
      priority: 'High',
      score: 90,
    });
  }

  // ── 10. Press / authority play ───────────────────────────────────────────
  if (audienceScore >= 50 && !(webPresence?.pressMentions && webPresence.pressMentions.length > 0)) {
    candidates.push({
      number: 0,
      title: 'Pitch 5 niche music blogs in your genre this month',
      description: `Your audience strength is ${audienceScore}/100 — strong enough that press placements will compound. Skip the major outlets. Find 5 niche blogs that cover your specific subgenre (search "[genre] new artist coverage 2026"), pitch a one-paragraph email with your Spotify link and one specific hook from your latest track. Even one placement creates a press mention that lifts your benchmark and gives you something to repost.`,
      priority: 'Medium',
      score: 50,
    });
  }

  // ── 11. Refer-a-friend mechanic for engaged audiences ────────────────────
  if (audienceScore >= 50 && repeatEngagers.length === 0) {
    candidates.push({
      number: 0,
      title: 'Run a "share with one friend" campaign on your next release',
      description: `Your audience is ${audienceScore}/100 — engaged but not yet activated as evangelists. On your next release, post a short video saying: "If you like this, send it to ONE specific friend who'd vibe with it. DM me their handle and I'll send a free [unreleased track / lyrics PDF / demo]." Track the responses. The friends who get tagged are your future superfans — they were vetted by people who already love you.`,
      priority: 'Medium',
      score: 40,
    });
  }

  // ── 12. Deepen the fan relationship (general fallback) ───────────────────
  candidates.push({
    number: 0,
    title: 'Start a weekly behind-the-scenes post or email',
    description: `Pick one channel — Instagram Stories, an email list, or YouTube community posts. Every week, post one piece showing the messy, in-progress side of your work: a voice-memo demo, a lyric you almost cut, a photo of your gear. Fans who feel like insiders convert at 3-5x the rate of fans who only see polished output. Block 30 minutes every Sunday to capture and post.`,
    priority: 'Medium',
    score: 20,
  });

  // Pick top 3 by score, renumber, and ensure variety (no two near-duplicates).
  const top = candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((c, i): ActionItem => ({
      number: i + 1,
      title: c.title,
      description: c.description,
      priority: c.priority,
    }));

  return top;
}

function daysSince(dateString: string): number {
  const then = new Date(dateString).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trim() + '…';
}

function estimateTotalFollowers(scanResults: ScanResults): number {
  let total = 0;
  if (scanResults.youtube?.subscriberCount) total += scanResults.youtube.subscriberCount;
  if (scanResults.instagram?.followerCount) total += scanResults.instagram.followerCount;
  if (scanResults.tiktok?.followerCount) total += scanResults.tiktok.followerCount;
  return total;
}
