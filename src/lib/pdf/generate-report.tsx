import React from 'react';
import { Document, Page, View, Text, Svg, Circle, Link } from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';
import { AuditResult } from '@/types/audit';
import { styles, colors } from './styles';

function ScoreGauge({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? colors.green : score >= 40 ? colors.yellow : colors.red;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.border} strokeWidth={6} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={6} fill="none"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={{
        position: 'absolute', fontSize: 22, fontFamily: 'Helvetica-Bold',
        color: colors.textBright,
      }}>{score}</Text>
    </View>
  );
}

function RatingBadge({ rating }: { rating: string }) {
  const badgeStyle = rating === 'Strong' ? styles.badgeGreen
    : rating === 'Growing' ? styles.badgeYellow
    : rating === 'Not Found' ? styles.badgeRed
    : styles.badgeYellow;
  return <Text style={badgeStyle}>{rating}</Text>;
}

function CoverPage({ data }: { data: AuditResult }) {
  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={{ alignItems: 'center', padding: 60 }}>
        <Text style={{ fontSize: 12, color: colors.accent, fontFamily: 'Helvetica-Bold', marginBottom: 40, letterSpacing: 3 }}>
          SUPERFAN AUDIT
        </Text>
        <Text style={{ fontSize: 36, fontFamily: 'Helvetica-Bold', color: colors.textBright, marginBottom: 16, textAlign: 'center' }}>
          {data.artistName}
        </Text>
        <View style={{ width: 60, height: 2, backgroundColor: colors.accent, marginBottom: 24 }} />
        <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 8 }}>
          Personalized Audience Intelligence Report
        </Text>
        <Text style={{ fontSize: 11, color: colors.textMuted }}>
          Generated {new Date(data.scannedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
        <View style={{ marginTop: 60 }}>
          <ScoreGauge score={data.audienceStrengthScore} size={120} />
          <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 8 }}>
            Audience Strength Score
          </Text>
        </View>
      </View>
    </Page>
  );
}

function BrandSummaryPage({ data }: { data: AuditResult }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.h2}>Brand Summary</Text>
      <Text style={styles.body}>{data.brandSummary}</Text>
      <View style={styles.divider} />
      <View style={[styles.row, { gap: 16, marginBottom: 16 }]}>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.muted}>Genre</Text>
          <Text style={[styles.body, { fontFamily: 'Helvetica-Bold', color: colors.textBright }]}>{data.genre}</Text>
        </View>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.muted}>Monthly Income</Text>
          <Text style={[styles.body, { fontFamily: 'Helvetica-Bold', color: colors.textBright }]}>{data.monthlyIncome}</Text>
        </View>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.muted}>Years Active</Text>
          <Text style={[styles.body, { fontFamily: 'Helvetica-Bold', color: colors.textBright }]}>{data.yearsActive}</Text>
        </View>
      </View>
      <Text style={styles.h3}>Platforms Analyzed</Text>
      {data.platformBreakdowns.map((p, i) => (
        <View key={i} style={[styles.row, { marginBottom: 6, gap: 8 }]}>
          <Text style={{ fontSize: 14 }}>{p.icon}</Text>
          <Text style={styles.body}>{p.platform}</Text>
          <RatingBadge rating={p.strengthRating} />
        </View>
      ))}
      <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
    </Page>
  );
}

function ScorePage({ data }: { data: AuditResult }) {
  const breakdown = data.scoreBreakdown;
  const bars = [
    { label: 'YouTube', score: breakdown.youtube, max: 35, color: '#FF0000' },
    { label: 'Spotify', score: breakdown.spotify, max: 25, color: '#1DB954' },
    { label: 'Cross-Platform', score: breakdown.crossPlatform, max: 20, color: colors.accent },
    { label: 'Web Presence', score: breakdown.webPresence, max: 10, color: colors.accentPink },
    { label: 'Social Media', score: breakdown.social, max: 10, color: '#00BFFF' },
  ];

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.h2}>Audience Strength Score</Text>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <ScoreGauge score={data.audienceStrengthScore} size={100} />
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>out of 100</Text>
      </View>
      <Text style={styles.h3}>Score Breakdown</Text>
      {bars.map((bar, i) => (
        <View key={i} style={{ marginBottom: 12 }}>
          <View style={styles.spaceBetween}>
            <Text style={styles.body}>{bar.label}</Text>
            <Text style={[styles.body, { fontFamily: 'Helvetica-Bold' }]}>{bar.score}/{bar.max}</Text>
          </View>
          <View style={{ height: 8, backgroundColor: colors.bgCard, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{
              height: 8, width: `${(bar.score / bar.max) * 100}%`,
              backgroundColor: bar.color, borderRadius: 4,
            }} />
          </View>
        </View>
      ))}
      <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
    </Page>
  );
}

function PlatformBreakdownPage({ data }: { data: AuditResult }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.h2}>Platform-by-Platform Breakdown</Text>
      {data.platformBreakdowns.map((p, i) => (
        <View key={i} style={styles.card}>
          <View style={[styles.spaceBetween, { marginBottom: 8 }]}>
            <View style={styles.row}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>{p.icon}</Text>
              <Text style={[styles.body, { fontFamily: 'Helvetica-Bold', color: colors.textBright, marginBottom: 0 }]}>{p.platform}</Text>
            </View>
            <RatingBadge rating={p.strengthRating} />
          </View>
          {p.found && Object.entries(p.metrics).length > 0 && (
            <View style={[styles.row, { flexWrap: 'wrap', gap: 12, marginBottom: 8 }]}>
              {Object.entries(p.metrics).map(([key, value], j) => (
                <View key={j}>
                  <Text style={[styles.muted, { fontSize: 8, textTransform: 'uppercase' }]}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                  <Text style={[styles.body, { fontFamily: 'Helvetica-Bold', marginBottom: 0 }]}>{String(value)}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.muted}>{p.insight}</Text>
        </View>
      ))}
      <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
    </Page>
  );
}

function SuperfanAnalysisPage({ data }: { data: AuditResult }) {
  const analysis = data.superfanAnalysis;
  const tierColor = analysis.tier === 'High Superfan Potential' ? colors.green
    : analysis.tier === 'Growing Superfan Base' ? colors.yellow : colors.accentPink;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.h2}>Superfan Potential Analysis</Text>
      <View style={[styles.card, { borderColor: tierColor, borderWidth: 1 }]}>
        <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: tierColor, marginBottom: 8 }}>
          {analysis.tier}
        </Text>
        <Text style={styles.body}>{analysis.description}</Text>
      </View>
      {analysis.engagementRate > 0 && (
        <View style={[styles.card, { marginBottom: 16 }]}>
          <Text style={styles.muted}>Engagement Rate</Text>
          <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: colors.textBright }}>
            {analysis.engagementRate}%
          </Text>
        </View>
      )}
      <Text style={styles.h3}>Key Indicators</Text>
      {analysis.keyIndicators.map((indicator, i) => (
        <View key={i} style={[styles.row, { marginBottom: 8, gap: 8 }]}>
          <Text style={{ color: colors.accent }}>{'●'}</Text>
          <Text style={[styles.body, { flex: 1, marginBottom: 0 }]}>{indicator}</Text>
        </View>
      ))}
      <View style={{ marginTop: 16 }}>
        <Text style={styles.h3}>How You Compare</Text>
        <View style={styles.card}>
          <Text style={styles.muted}>{data.benchmarkComparison.tierLabel}</Text>
          <View style={[styles.row, { gap: 24, marginTop: 8 }]}>
            <View>
              <Text style={styles.muted}>Your Score</Text>
              <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: colors.accent }}>
                {data.benchmarkComparison.yourScore}
              </Text>
            </View>
            <View>
              <Text style={styles.muted}>Tier Average</Text>
              <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: colors.textMuted }}>
                {data.benchmarkComparison.avgScore}
              </Text>
            </View>
            <View>
              <Text style={styles.muted}>Top Performers</Text>
              <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: colors.green }}>
                {data.benchmarkComparison.topPerformerScore}
              </Text>
            </View>
          </View>
          {data.benchmarkComparison.insights.map((insight, i) => (
            <Text key={i} style={[styles.muted, { marginTop: 6 }]}>{insight}</Text>
          ))}
        </View>
      </View>
      <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
    </Page>
  );
}

function RecommendationsPage({ data }: { data: AuditResult }) {
  const offer = data.recommendedOffer;
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.h2}>Recommended Offer Strategy</Text>
      <View style={[styles.card, { borderColor: colors.accent, borderWidth: 1 }]}>
        <Text style={[styles.muted, { marginBottom: 4 }]}>{offer.tier}</Text>
        <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: colors.accent, marginBottom: 8 }}>
          {offer.title}
        </Text>
        <Text style={styles.body}>{offer.description}</Text>
      </View>
      <Text style={styles.h3}>Recommended Next Steps</Text>
      {offer.examples.map((example, i) => (
        <View key={i} style={[styles.row, { marginBottom: 8, gap: 8 }]}>
          <Text style={{ color: colors.accent, fontFamily: 'Helvetica-Bold' }}>{i + 1}.</Text>
          <Text style={[styles.body, { flex: 1, marginBottom: 0 }]}>{example}</Text>
        </View>
      ))}
      <View style={[styles.card, { marginTop: 16, backgroundColor: colors.bgCardAlt }]}>
        <Text style={styles.h3}>Why This Works For You</Text>
        <Text style={styles.body}>{offer.whyThisWorks}</Text>
      </View>
      <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
    </Page>
  );
}

function ActionItemsPage({ data }: { data: AuditResult }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.h2}>Your Top 3 Action Items</Text>
      <Text style={[styles.muted, { marginBottom: 16 }]}>
        These are your highest-impact moves for the next 30 days, prioritized by potential impact on your superfan growth.
      </Text>
      {data.actionItems.map((item) => {
        const priorityStyle = item.priority === 'High' ? styles.badgeRed
          : item.priority === 'Medium' ? styles.badgeYellow : styles.badge;
        return (
          <View key={item.number} style={[styles.card, { marginBottom: 16 }]}>
            <View style={[styles.spaceBetween, { marginBottom: 8 }]}>
              <View style={styles.row}>
                <View style={{
                  width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent,
                  justifyContent: 'center', alignItems: 'center', marginRight: 10,
                }}>
                  <Text style={{ color: colors.textBright, fontFamily: 'Helvetica-Bold', fontSize: 14 }}>
                    {item.number}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: colors.textBright }}>
                  {item.title}
                </Text>
              </View>
              <Text style={priorityStyle}>{item.priority}</Text>
            </View>
            <Text style={styles.body}>{item.description}</Text>
          </View>
        );
      })}
      <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
    </Page>
  );
}

function CTAPage() {
  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={{ alignItems: 'center', padding: 60 }}>
        <Text style={{ fontSize: 12, color: colors.accent, fontFamily: 'Helvetica-Bold', letterSpacing: 3, marginBottom: 30 }}>
          WHAT&apos;S NEXT?
        </Text>
        <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: colors.textBright, textAlign: 'center', marginBottom: 16, maxWidth: 400 }}>
          Ready to Turn Your Fans Into Superfans?
        </Text>
        <View style={{ width: 60, height: 2, backgroundColor: colors.accent, marginBottom: 24 }} />
        <Text style={{ fontSize: 12, color: colors.text, textAlign: 'center', maxWidth: 400, lineHeight: 1.8, marginBottom: 32 }}>
          This report is just the beginning. Take the next step and join a community of artists building real, sustainable music careers.
        </Text>

        {/* Global Launchpad Mastermind */}
        <View style={[styles.card, { width: 380, alignItems: 'center', padding: 24, marginBottom: 16 }]}>
          <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: colors.textBright, marginBottom: 8 }}>
            Global Launchpad Mastermind
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 1.6, marginBottom: 12 }}>
            Join a mastermind of independent artists scaling their music careers with proven strategies, accountability, and direct mentorship.
          </Text>
          <Link src="https://globallaunchpadmastermind.com" style={{ fontSize: 11, color: colors.accent, fontFamily: 'Helvetica-Bold' }}>
            globallaunchpadmastermind.com
          </Link>
        </View>

        {/* Wealth & Impact Accelerator */}
        <View style={[styles.card, { width: 380, alignItems: 'center', padding: 24, marginBottom: 16 }]}>
          <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: colors.textBright, marginBottom: 8 }}>
            Wealth &amp; Impact AI Accelerator
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 1.6, marginBottom: 12 }}>
            Learn how to leverage AI to build wealth, create impact, and accelerate your music business to new heights.
          </Text>
          <Link src="https://wealthandimpactai.com" style={{ fontSize: 11, color: colors.accent, fontFamily: 'Helvetica-Bold' }}>
            wealthandimpactai.com
          </Link>
        </View>

        <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 30, textAlign: 'center' }}>
          This report was generated by Superfan Audit{'\n'}superfanaudit.com
        </Text>
      </View>
    </Page>
  );
}

function ReportDocument({ data }: { data: AuditResult }) {
  return (
    <Document
      title={`Superfan Audit - ${data.artistName}`}
      author="Superfan Audit"
      subject="Personalized Audience Intelligence Report"
    >
      <CoverPage data={data} />
      <BrandSummaryPage data={data} />
      <ScorePage data={data} />
      <PlatformBreakdownPage data={data} />
      <SuperfanAnalysisPage data={data} />
      <RecommendationsPage data={data} />
      <ActionItemsPage data={data} />
      <CTAPage />
    </Document>
  );
}

export async function generateReport(data: AuditResult): Promise<Buffer> {
  const buffer = await renderToBuffer(<ReportDocument data={data} />);
  return Buffer.from(buffer);
}
