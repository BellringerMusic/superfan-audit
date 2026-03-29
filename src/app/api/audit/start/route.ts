import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { fullFormSchema } from '@/lib/validators';
import { runAllScanners } from '@/lib/scanners/orchestrator';
import { calculateScores } from '@/lib/analysis/scoring';
import { analyzeSuperfanPotential } from '@/lib/analysis/superfan-potential';
import { generateRecommendation, generateActionItems } from '@/lib/analysis/recommendations';
import { generateBenchmarkComparison } from '@/lib/analysis/benchmarks';
import { generateBrandSummary } from '@/lib/analysis/brand-summary';
import { generateReport } from '@/lib/pdf/generate-report';
import { subscribeToConvertKit } from '@/lib/convertkit';
import { sendLeadNotification } from '@/lib/notifications';
import { setJob, storePdf } from '@/lib/storage';
import { AuditFormData, AuditJob, AuditResult } from '@/types/audit';

export const maxDuration = 60;

async function processAuditInBackground(jobId: string, formData: AuditFormData) {
  const job: AuditJob = {
    id: jobId,
    status: 'processing',
    progress: 5,
    currentStep: 'Initializing your audit...',
    formData,
    createdAt: new Date().toISOString(),
  };

  try {
    // Subscribe to ConvertKit (fire-and-forget)
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

    // Notify bellringerproductions@gmail.com about the new lead (fire-and-forget)
    sendLeadNotification({
      email: formData.email,
      artistName: formData.artistName,
      name: formData.name,
      monthlyIncome: formData.monthlyIncome,
    }).catch(err => console.error('Lead notification error:', err));

    // Run scanners
    const updateProgress = async (progress: number, step: string) => {
      job.progress = progress;
      job.currentStep = step;
      await setJob(jobId, { ...job });
    };

    const scanResults = await runAllScanners(formData, updateProgress);

    // Analyze
    await updateProgress(70, 'Analyzing your audience...');
    const { scoreBreakdown, platformBreakdowns } = calculateScores(scanResults);
    const superfanAnalysis = analyzeSuperfanPotential(scanResults);
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
      recommendedOffer,
      actionItems,
      benchmarkComparison,
      scannedAt: new Date().toISOString(),
    };

    // Generate PDF
    await updateProgress(85, 'Generating your report...');
    const pdfBuffer = await generateReport(result);
    const pdfUrl = await storePdf(jobId, pdfBuffer);

    // Update ConvertKit with score
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

    // Mark complete
    job.status = 'complete';
    job.progress = 100;
    job.currentStep = 'Your report is ready!';
    job.result = result;
    job.pdfUrl = pdfUrl;
    await setJob(jobId, job);
  } catch (error) {
    console.error('Audit background processing error:', error);
    job.status = 'error';
    job.progress = 0;
    job.currentStep = 'Something went wrong';
    job.error = error instanceof Error ? error.message : 'An unexpected error occurred';
    await setJob(jobId, job);
  }
}

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
    const jobId = nanoid(12);

    // Store initial job state immediately
    const job: AuditJob = {
      id: jobId,
      status: 'processing',
      progress: 5,
      currentStep: 'Initializing your audit...',
      formData,
      createdAt: new Date().toISOString(),
    };
    await setJob(jobId, job);

    // Kick off background processing using after() to keep the
    // serverless function alive after the response is sent
    after(async () => {
      try {
        await processAuditInBackground(jobId, formData);
      } catch (err) {
        console.error('Unhandled audit background error:', err);
      }
    });

    // Return jobId immediately so client can start polling
    return NextResponse.json({ jobId, status: 'processing' });
  } catch (error) {
    console.error('Audit error:', error);
    return NextResponse.json(
      { error: 'Failed to process audit', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
