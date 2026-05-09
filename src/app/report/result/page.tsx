'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuditResult } from '@/types/audit';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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

        {/* The actual people raising their hand */}
        {result.superfanList && (
          <div className="bg-[#141420] border border-[#2D2D44] rounded-xl p-6 sm:p-8 mb-10">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-purple-400 mb-3">
              The people raising their hand
            </p>
            <h2 className="text-white text-xl font-semibold mb-2">
              {result.superfanList.headline}
            </h2>
            <p className="text-sm text-gray-500 mb-6">{result.superfanList.source}</p>

            {result.superfanList.people.length > 0 ? (
              <ul className="divide-y divide-[#2D2D44]">
                {result.superfanList.people.map((person, i) => (
                  <li key={i} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 text-sm font-bold overflow-hidden">
                      {person.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={person.profileImageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{getInitials(person.name)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {person.channelUrl ? (
                          <a
                            href={person.channelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white font-medium text-sm hover:text-purple-300 transition-colors truncate"
                          >
                            {person.name}
                          </a>
                        ) : (
                          <span className="text-white font-medium text-sm truncate">{person.name}</span>
                        )}
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 bg-[#1A1A2E] px-2 py-0.5 rounded">
                          {person.source}
                        </span>
                        {person.crossPlatform && (
                          <span className="text-[10px] uppercase tracking-wider text-purple-300 bg-purple-600/20 px-2 py-0.5 rounded">
                            cross-platform
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{person.signalSummary}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg bg-[#0D0D14] border border-[#2D2D44] p-4 text-sm text-gray-400">
                {result.superfanList.emptyReason}
              </div>
            )}

            {result.superfanList.people.length > 0 && (
              <p className="text-xs text-gray-500 mt-6 leading-relaxed">
                These are the people in your audience already raising their hand.
                Reply to one of their comments by name. Send a free download.
                Invite them into your inner circle. The first fifty start here.
              </p>
            )}
          </div>
        )}

        {/* Score-tiered hero CTA — surfaces the right next-step for THIS lead */}
        <PrimaryCta score={result.audienceStrengthScore} />

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
            <p className="text-sm text-gray-500 mt-2">9-page personalized PDF</p>
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
        <div className="mb-8" id="action-items">
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

        {/* Other ways to go deeper (secondary — primary CTA is up top) */}
        <div className="py-12 border-t border-[#2D2D44]">
          <p className="text-center text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-6">
            Other ways to go deeper
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
            <a
              href="https://globallaunchpadmastermind.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#141420] border border-[#2D2D44] hover:border-purple-500/50 rounded-lg p-6 text-center transition-colors group"
            >
              <p className="text-white font-semibold mb-2 group-hover:text-purple-400 transition-colors">Global Launchpad Mastermind</p>
              <p className="text-gray-500 text-sm">Mastermind of independent artists scaling their careers with proven strategies and direct mentorship.</p>
            </a>
            <a
              href="https://wealthandimpactai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#141420] border border-[#2D2D44] hover:border-purple-500/50 rounded-lg p-6 text-center transition-colors group"
            >
              <p className="text-white font-semibold mb-2 group-hover:text-purple-400 transition-colors">Wealth &amp; Impact AI Accelerator</p>
              <p className="text-gray-500 text-sm">Leverage AI to build wealth, create impact, and accelerate your music business.</p>
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

/**
 * Score-tiered hero CTA. The lead's audience strength determines which next
 * step they see right under the named-superfans section — hot leads get
 * routed to the high-ticket mastermind, mid leads to the recurring
 * accelerator, cold leads get a "build first, come back" framing instead
 * of a premature upsell.
 */
function PrimaryCta({ score }: { score: number }) {
  if (score >= 70) {
    return (
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 sm:p-8 mb-12 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-purple-200 mb-3">
          Your audience is ready for the next level
        </p>
        <h2 className="text-white text-2xl sm:text-3xl font-bold mb-3">
          You scored a {score}. Let&apos;s get you a mastermind.
        </h2>
        <p className="text-purple-100 text-sm sm:text-base leading-relaxed mb-6 max-w-xl mx-auto">
          A {score}/100 score means you have real signal — fans engaging across
          multiple platforms, repeat commenters, the building blocks of a
          full-time music career. The Global Launchpad Mastermind is for
          artists at exactly this stage who want to convert that signal into
          revenue with proven strategies and direct mentorship.
        </p>
        <a
          href="https://globallaunchpadmastermind.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-purple-700 hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg text-base transition-all"
        >
          Apply to Global Launchpad Mastermind
          <span aria-hidden="true">→</span>
        </a>
      </div>
    );
  }

  if (score >= 40) {
    return (
      <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/30 border border-purple-500/40 rounded-xl p-6 sm:p-8 mb-12 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-purple-300 mb-3">
          You have signal worth scaling
        </p>
        <h2 className="text-white text-2xl sm:text-3xl font-bold mb-3">
          You scored a {score}. Time to leverage AI to grow.
        </h2>
        <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6 max-w-xl mx-auto">
          You&apos;ve got the foundation. The fastest way to compound from here
          is to use AI to multiply your output and reach. That&apos;s exactly
          what the Wealth &amp; Impact AI Accelerator is built for — artists
          and creators turning early traction into a real business.
        </p>
        <a
          href="https://wealthandimpactai.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-lg text-base transition-all"
        >
          See the Wealth &amp; Impact AI Accelerator
          <span aria-hidden="true">→</span>
        </a>
      </div>
    );
  }

  // Cold tier — under 40. The branding fundamentals are what's actually
  // missing here, so route to the Branding Bible (offers from free to $997)
  // rather than a high-ticket mastermind they're not ready for.
  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/30 rounded-xl p-6 sm:p-8 mb-12 text-center">
      <p className="text-xs font-semibold tracking-[0.2em] uppercase text-purple-300 mb-3">
        Start with the brand foundation
      </p>
      <h2 className="text-white text-2xl sm:text-3xl font-bold mb-3">
        You scored a {score}. Build the foundation first.
      </h2>
      <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6 max-w-xl mx-auto">
        A {score}/100 means the brand fundamentals aren&apos;t yet in place to
        attract superfans at scale. Don&apos;t skip ahead to monetization —
        the artists who build a real superfan base nail the brand first.
        The Bellringer Branding Bible is exactly that: the playbook that
        turns a creator into a brand people commit to.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href="https://bellringerbrandingbible.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-lg text-base transition-all"
        >
          Get the Branding Bible
          <span aria-hidden="true">→</span>
        </a>
        <a
          href="#action-items"
          className="text-gray-300 hover:text-purple-300 text-sm font-medium transition-colors px-4 py-3"
        >
          See my action items ↓
        </a>
      </div>
    </div>
  );
}
