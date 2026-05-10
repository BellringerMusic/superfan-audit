import Link from 'next/link';

const steps = [
  { num: '1', title: 'Connect Your Platforms', desc: 'Drop in your Spotify, YouTube, Instagram, TikTok, website — whatever you have. One link is enough; the more you share, the sharper the signal.' },
  { num: '2', title: 'We Scan For Superfan Signals', desc: 'Not just follower counts. We look at repeat engagement, comment patterns, who shows up across multiple platforms, and who is buying versus just streaming.' },
  { num: '3', title: 'See Who\'s Raising Their Hand', desc: 'Get a personalized PDF that surfaces the people in your audience already showing real affinity — and a clear next move to deepen the relationship.' },
];

const features = [
  { title: 'The exact people raising their hand', desc: 'Their names. Their handles. Links to their channels. Pulled from real comment data — not just stats.' },
  { title: 'Your Audience Strength Score', desc: '0–100. We weigh engagement quality, cross-platform overlap, and catalog depth. Not just reach.' },
  { title: 'Platform-by-platform diagnosis', desc: 'Where you have signal. Where you have noise. What to do about each one — specific to you.' },
  { title: 'The buyer-vs-streamer split', desc: 'Who&apos;s casually listening. Who&apos;d actually pay. The gap most artists never see in their dashboard.' },
  { title: 'Your monetization next move', desc: 'Calibrated to your audience size, engagement quality, and current income. Specific. Not generic.' },
  { title: 'Three actions calibrated to your data', desc: 'Not "post more." Real moves grounded in YOUR comment counts, YOUR release dates, YOUR named superfans.' },
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
            Free Tool · 30-Second Audit
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Your fifty biggest fans are{' '}
            <span className="gradient-text">hiding in your audience</span>{' '}
            right now.
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Follower counts lie. Monthly listeners are noise. We scan your
            platforms for the actual signals — repeat commenters, cross-platform
            overlap, who buys versus who streams — and show you the specific
            people in your audience already raising their hand.{' '}
            <span className="text-white">By name.</span>
          </p>
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5"
          >
            Show Me My Superfans
            <span aria-hidden="true">&rarr;</span>
          </Link>
          <p className="text-sm text-gray-500 mt-4">Free. 30 seconds. Your report on the next screen — not in an email later.</p>
        </div>
      </section>

      {/* Why This Exists — Marcus's voice */}
      <section className="py-20 px-4 border-t border-[#1A1A2E]">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-purple-400 mb-6 text-center">
            Why this exists
          </p>
          <div className="space-y-5 text-gray-300 text-lg leading-relaxed">
            <p className="text-white text-xl font-semibold">
              Most artists have no idea who their superfans are.
            </p>
            <p>
              They obsess over their follower count. They check their monthly listeners.
              They watch their saves tick up.
            </p>
            <p>
              None of those numbers tell you which{' '}
              <span className="text-white font-semibold">fifty people</span> in your
              audience would buy anything you put out.
            </p>
            <p>
              Those fifty people exist in your audience right now. You just haven&apos;t
              identified them.
            </p>
            <p>
              That&apos;s what this audit does. You connect your platforms. We scan for
              the signals that actually matter — repeat engagement, comment patterns, who
              shows up across multiple platforms, who&apos;s buying versus who&apos;s just
              streaming.
            </p>
            <p>
              Then we show you the people who are{' '}
              <span className="text-white font-semibold">raising their hand. By name.</span>
            </p>
            <p className="text-white">
              That&apos;s where your music career starts compounding.
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
            They&apos;re already in your audience. Stop guessing — start naming names.
          </p>
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5"
          >
            Show Me My Superfans
            <span aria-hidden="true">&rarr;</span>
          </Link>
          <p className="text-sm text-gray-500 mt-4">Free. 30 seconds. No card required.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-[#1A1A2E] text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Superfan Audit. All rights reserved.</p>
      </footer>
    </main>
  );
}
