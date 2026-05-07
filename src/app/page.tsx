import Link from 'next/link';

const steps = [
  { num: '1', title: 'Connect Your Platforms', desc: 'Drop in your Spotify, YouTube, Instagram, TikTok, website — whatever you have. One link is enough; the more you share, the sharper the signal.' },
  { num: '2', title: 'We Scan For Superfan Signals', desc: 'Not just follower counts. We look at repeat engagement, comment patterns, who shows up across multiple platforms, and who is buying versus just streaming.' },
  { num: '3', title: 'See Who\'s Raising Their Hand', desc: 'Get a personalized PDF that surfaces the people in your audience already showing real affinity — and a clear next move to deepen the relationship.' },
];

const features = [
  { title: 'The Superfan Signal', desc: 'A read on whether your audience is passively listening or actively raising their hand — the only metric that predicts who will actually buy.' },
  { title: 'Audience Strength Score', desc: 'A 0–100 score that goes beyond reach — combining engagement quality, cross-platform overlap, and catalog depth.' },
  { title: 'Platform-by-Platform Breakdown', desc: 'See exactly where you have signal, where you have noise, and what to do about each platform.' },
  { title: 'Buyer-vs-Streamer Read', desc: 'Surface who is engaging at a level that says "I would buy something from you" — not just "I let your song play."' },
  { title: 'Personalized Offer Strategy', desc: 'Based on your audience size, engagement, and current income — get a specific monetization recommendation that actually fits where you are.' },
  { title: 'Top 3 Action Items', desc: 'Three specific moves you can make this month to convert raising-hand fans into paying superfans.' },
];

const faqs = [
  { q: 'Why does this exist?', a: 'Most artists know their follower count and their monthly listeners. They have no idea which fifty people in their audience would buy anything they put out. Those fifty people exist right now — you just haven\'t identified them. This audit identifies them.' },
  { q: 'Is this really free?', a: 'Yes, 100% free. No credit card. No upsell to see your results. The whole report is yours.' },
  { q: 'How long does it take?', a: 'About 15–30 seconds. We scan your platforms in real time and generate the personalized PDF on the spot.' },
  { q: 'What data do you actually look at?', a: 'Only public data from your social and music profiles. We never log into your accounts. The signal we care about isn\'t private — it\'s the engagement pattern that\'s already visible if you know where to look.' },
  { q: 'Do I need to be on every platform?', a: 'No. One link is enough. The more platforms you share, the sharper the cross-platform overlap signal — but a single platform is fine.' },
  { q: 'What happens with my email?', a: 'We email you the report and occasional notes on growing your superfan base. Unsubscribe anytime.' },
];

export default function LandingPage() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-purple-400 mb-6">
            Free Superfan Intelligence Report
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Find the fifty fans who&apos;d{' '}
            <span className="gradient-text">buy anything</span>{' '}
            you put out.
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Most artists know their follower count. They have no idea which fans
            would actually pay them. We scan your platforms for the signals that
            separate passive listeners from real superfans — repeat engagement,
            comment patterns, cross-platform overlap, who&apos;s buying versus who&apos;s
            just streaming.
          </p>
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5"
          >
            Run My Free Superfan Audit
            <span aria-hidden="true">&rarr;</span>
          </Link>
          <p className="text-sm text-gray-500 mt-4">30 seconds. No credit card. Full report on the spot.</p>
        </div>
      </section>

      {/* Why This Exists — Marcus's voice */}
      <section className="py-20 px-4 border-t border-[#1A1A2E]">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-purple-400 mb-6 text-center">
            Why this exists
          </p>
          <div className="space-y-5 text-gray-300 text-lg leading-relaxed">
            <p>
              Most artists have no idea who their superfans are. They know their follower
              count. They know their monthly listeners. They don&apos;t know which{' '}
              <span className="text-white font-semibold">fifty people</span> in their
              audience would buy anything they put out.
            </p>
            <p>
              Those fifty people exist in your audience right now. You just haven&apos;t
              identified them.
            </p>
            <p>
              That&apos;s what this audit does. You connect your platforms. We scan for
              superfan signals — not just follower numbers. Things like repeat engagement,
              comment patterns, who&apos;s showing up across multiple platforms, who&apos;s
              buying versus just streaming.
            </p>
            <p>
              When the results come back you&apos;re looking at the signals from the people
              who are{' '}
              <span className="text-white font-semibold">raising their hand</span> —
              not casually listening, but engaging in a way that tells you there&apos;s
              real affinity. That&apos;s where you start.
            </p>
          </div>
        </div>
      </section>

      {/* Platform logos */}
      <section className="py-12 border-t border-b border-[#1A1A2E]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 mb-6">We analyze your presence across</p>
          <div className="flex flex-wrap justify-center gap-8 text-gray-400 text-sm font-medium">
            <span className="flex items-center gap-2">♫ Spotify</span>
            <span className="flex items-center gap-2">▶ YouTube</span>
            <span className="flex items-center gap-2">📷 Instagram</span>
            <span className="flex items-center gap-2">♪ TikTok</span>
            <span className="flex items-center gap-2">🌐 Website</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-12 h-12 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-lg mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you'll learn */}
      <section className="py-20 px-4 bg-[#0D0D14]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">What&apos;s In Your Report</h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            A personalized PDF that tells you who&apos;s already raising their hand — and how to turn them into paying superfans.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-[#141420] border border-[#2D2D44] rounded-lg p-6">
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b border-[#2D2D44] pb-6">
                <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                <p className="text-gray-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Find Your Fifty.
          </h2>
          <p className="text-gray-400 mb-8">
            They&apos;re already in your audience. Stop guessing who they are.
          </p>
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5"
          >
            Run My Free Superfan Audit
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-[#1A1A2E] text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Superfan Audit. All rights reserved.</p>
      </footer>
    </main>
  );
}
