'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuditResult } from '@/types/audit';

export default function ReportResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AuditResult | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('auditResult');
      const storedPdf = sessionStorage.getItem('auditPdfBase64');
      if (stored) {
        setResult(JSON.parse(stored));
        setPdfBase64(storedPdf);
      }
    } catch {
      // sessionStorage not available
    }
    setLoading(false);
  }, []);

  const handleDownloadPdf = () => {
    if (!pdfBase64 || !result) return;
    const binary = atob(pdfBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Superfan-Audit-${result.artistName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading your report...</div>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Report Not Found</h1>
          <p className="text-gray-400 mb-8">This report may have expired or you navigated here directly.</p>
          <Link href="/audit" className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            Start a New Audit
          </Link>
        </div>
      </main>
    );
  }

  const scoreColor = result.audienceStrengthScore >= 70 ? 'text-green-400' :
    result.audienceStrengthScore >= 40 ? 'text-yellow-400' : 'text-red-400';

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-purple-400 mb-4">
            Your Superfan Audit Report
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{result.artistName}</h1>
          <p className="text-gray-400">
            Generated {new Date(result.scannedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Raising-their-hand callout — the core framing */}
        <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/30 rounded-xl p-6 sm:p-8 mb-10">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-purple-300 mb-3">
            Who&apos;s raising their hand
          </p>
          <p className="text-white text-lg sm:text-xl font-semibold leading-snug mb-2">
            {result.superfanAnalysis.tier}
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            {result.superfanAnalysis.description}
          </p>
          {result.superfanAnalysis.keyIndicators.length > 0 && (
            <div className="mt-5 pt-5 border-t border-purple-500/20">
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-purple-300/80 mb-3">
                Signals we picked up
              </p>
              <ul className="space-y-2">
                {result.superfanAnalysis.keyIndicators.map((indicator, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-300">
                    <span className="text-purple-400 mt-0.5 flex-shrink-0">→</span>
                    <span>{indicator}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Download button */}
        {pdfBase64 && (
          <div className="text-center mb-12">
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all hover:shadow-lg hover:shadow-purple-500/25"
            >
              Download Full PDF Report
              <span aria-hidden="true">&darr;</span>
            </button>
            <p className="text-sm text-gray-500 mt-2">8-page personalized PDF</p>
          </div>
        )}

        {/* Score overview */}
        <div className="bg-[#141420] border border-[#2D2D44] rounded-xl p-8 mb-8 text-center">
          <p className="text-sm text-gray-500 mb-2">Audience Strength Score</p>
          <p className={`text-6xl font-bold ${scoreColor} mb-2`}>
            {result.audienceStrengthScore}
          </p>
          <p className="text-gray-400">out of 100</p>
        </div>

        {/* Quick summary cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#141420] border border-[#2D2D44] rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Superfan Potential</p>
            <p className="text-white font-semibold text-sm">{result.superfanAnalysis.tier}</p>
          </div>
          <div className="bg-[#141420] border border-[#2D2D44] rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Recommended Strategy</p>
            <p className="text-white font-semibold text-sm">{result.recommendedOffer.title}</p>
          </div>
          <div className="bg-[#141420] border border-[#2D2D44] rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Your Tier</p>
            <p className="text-white font-semibold text-sm">{result.benchmarkComparison.tierLabel}</p>
          </div>
        </div>

        {/* Brand Summary */}
        {result.brandSummary && (
          <div className="bg-[#141420] border border-[#2D2D44] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-3">Brand Summary</h2>
            <p className="text-gray-300 text-sm leading-relaxed">{result.brandSummary}</p>
          </div>
        )}

        {/* Platform breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Platform Breakdown</h2>
          <div className="space-y-3">
            {result.platformBreakdowns.map((p, i) => (
              <div key={i} className="bg-[#141420] border border-[#2D2D44] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{p.icon} {p.platform}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    p.strengthRating === 'Strong' ? 'bg-green-500/20 text-green-400' :
                    p.strengthRating === 'Growing' ? 'bg-yellow-500/20 text-yellow-400' :
                    p.strengthRating === 'Not Found' ? 'bg-red-500/20 text-red-400' :
                    p.strengthRating === 'Scan Limited' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {p.strengthRating}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{p.insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Offer */}
        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-500/30 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-2">Recommended Monetization Strategy</h2>
          <h3 className="text-lg text-purple-300 font-semibold mb-3">{result.recommendedOffer.title}</h3>
          <p className="text-gray-300 text-sm mb-4">{result.recommendedOffer.description}</p>
        </div>

        {/* Action items */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Your Top 3 Action Items</h2>
          <div className="space-y-4">
            {result.actionItems.map((item) => (
              <div key={item.number} className="bg-[#141420] border border-[#2D2D44] rounded-lg p-5">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {item.number}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Download CTA */}
        {pdfBase64 && (
          <div className="text-center py-12 border-t border-[#2D2D44]">
            <p className="text-gray-400 mb-4">Want the complete analysis? Download the full 8-page report.</p>
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Download PDF Report
            </button>
          </div>
        )}

        {/* Next Steps */}
        <div className="py-12 border-t border-[#2D2D44]">
          <h3 className="text-center text-lg font-bold text-white mb-2">Ready to Take Action?</h3>
          <p className="text-center text-gray-400 text-sm mb-8">This report is just the beginning. Take the next step in your music career.</p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
            <a
              href="https://globallaunchpadmastermind.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#141420] border border-[#2D2D44] hover:border-purple-500/50 rounded-lg p-6 text-center transition-colors group"
            >
              <p className="text-white font-semibold mb-2 group-hover:text-purple-400 transition-colors">Global Launchpad Mastermind</p>
              <p className="text-gray-500 text-sm">Join a mastermind of independent artists scaling their careers with proven strategies and direct mentorship.</p>
            </a>
            <a
              href="https://wealthandimpactai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#141420] border border-[#2D2D44] hover:border-purple-500/50 rounded-lg p-6 text-center transition-colors group"
            >
              <p className="text-white font-semibold mb-2 group-hover:text-purple-400 transition-colors">Wealth &amp; Impact AI Accelerator</p>
              <p className="text-gray-500 text-sm">Leverage AI to build wealth, create impact, and accelerate your music business to new heights.</p>
            </a>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">Know another artist who could use this?</p>
            <Link
              href="/"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Share the Superfan Audit →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
