import { NextRequest, NextResponse } from 'next/server';
import { fullFormSchema } from '@/lib/validators';
import { runAllScanners } from '@/lib/scanners/orchestrator';
import { calculateScores } from '@/lib/analysis/scoring';
import { analyzeSuperfanPotential } from '@/lib/analysis/superfan-potential';
import { buildSuperfanList } from '@/lib/analysis/superfan-list';
import { generateRecommendation, generateActionItems } from '@/lib/analysis/recommendations';
import { generateBenchmarkComparison } from '@/lib/analysis/benchmarks';
import { generateBrandSummary } from '@/lib/analysis/brand-summary';
import { generateReport } from '@/lib/pdf/generate-report';
import { subscribeToConvertKit } from '@/lib/convertkit';
import { sendLeadNotification, sendFullReportNotification, sendReportToArtist } from '@/lib/notifications';
import { AuditFormData, AuditResult } from '@/types/audit';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = fullFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const formData = parsed.data as AuditFormData;

    // Fire-and-forget: subscribe to ConvertKit + send lead notification
    // All email subscribers go to ConvertKit (Kit) — manage at https://app.kit.com
    subscribeToConvertKit({
      email: formData.email,
      firstName: formData.name,
      fields: {
        artist_name: formData.artistName,
        monthly_income: formData.monthlyIncome,
        genre: formData.genre,
      },
    }).catch(err => console.error('ConvertKit error:', err));

    // Notify bellringerproductions@gmail.com about the new lead
    sendLeadNotification({
      email: formData.email,
      artistName: formData.artistName,
      name: formData.name,
      monthlyIncome: formData.monthlyIncome,
    }).catch(err => console.error('Lead notification error:', err));

    // Run all platform scanners in parallel
    const scanResults = await runAllScanners(formData);

    // Analyze results
    const { scoreBreakdown, platformBreakdowns } = calculateScores(scanResults);
    const superfanAnalysis = analyzeSuperfanPotential(scanResults);
    const superfanList = buildSuperfanList(scanResults);
    const recommendedOffer = generateRecommendation(scanResults, formData.monthlyIncome, scoreBreakdown.total);
    const actionItems = generateActionItems(scanResults, formData.monthlyIncome, scoreBreakdown.total);
    const brandSummary = generateBrandSummary(scanResults, formData);
    const totalFollowers = (scanResults.youtube?.subscriberCount || 0) +
      (scanResults.instagram?.followerCount || 0) +
      (scanResults.tiktok?.followerCount || 0);
    const benchmarkComparison = generateBenchmarkComparison(scoreBreakdown.total, totalFollowers);

    const result: AuditResult = {
      artistName: formData.artistName,
      genre: formData.genre,
      monthlyIncome: formData.monthlyIncome,
      yearsActive: formData.yearsActive,
      brandSummary,
      audienceStrengthScore: scoreBreakdown.total,
      scoreBreakdown,
      platformBreakdowns,
      superfanAnalysis,
      superfanList,
      recommendedOffer,
      actionItems,
      benchmarkComparison,
      scannedAt: new Date().toISOString(),
    };

    // Generate PDF and convert to base64 for client download
    let pdfBase64: string | null = null;
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await generateReport(result);
      pdfBase64 = pdfBuffer.toString('base64');
    } catch (err) {
      console.error('PDF generation error:', err);
    }

    // Email the artist their PDF report so they keep it in their inbox.
    // Note: Resend's test sender (onboarding@resend.dev) only sends to the
    // verified account owner. Set up a verified domain in Resend to enable
    // sending to arbitrary lead emails. Failures are logged but never block
    // the response so the user still gets their browser-based report.
    if (pdfBuffer) {
      sendReportToArtist({ formData, result, pdfBuffer }).catch(err =>
        console.error('Artist report email error:', err)
      );
    }

    // Update ConvertKit with audit score (fire-and-forget)
    subscribeToConvertKit({
      email: formData.email,
      firstName: formData.name,
      fields: {
        artist_name: formData.artistName,
        audit_score: String(scoreBreakdown.total),
        primary_platform: platformBreakdowns.reduce((best, p) => p.score > (best?.score || 0) ? p : best, platformBreakdowns[0])?.platform || 'none',
        monthly_income: formData.monthlyIncome,
        genre: formData.genre,
      },
    }).catch(err => console.error('ConvertKit update error:', err));

    // Email Marcus the FULL audit data — every input, every score, every metric.
    // Fire-and-forget so a slow email API doesn't delay the response.
    sendFullReportNotification({ formData, result }).catch(err =>
      console.error('Full-report notification error:', err)
    );

    return NextResponse.json({
      status: 'complete',
      result,
      pdfBase64,
    });
  } catch (error) {
    console.error('Audit error:', error);
    return NextResponse.json(
      { error: 'Failed to process audit', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
