import Link from 'next/link';

const steps = [
  { num: '1', title: 'Enter Your Info', desc: 'Tell us about yourself and your music career.' },
  { num: '2', title: 'We Scan Your Presence', desc: 'Our system analyzes your Spotify, YouTube, Instagram, TikTok, and web presence.' },
  { num: '3', title: 'Get Your Report', desc: 'Download a personalized PDF with your Audience Strength Score, Superfan Potential, and action plan.' },
];

const features = [
  { title: 'Audience Strength Score', desc: 'A comprehensive 0-100 score measuring your reach, engagement, and cross-platform presence.' },
  { title: 'Platform-by-Platform Breakdown', desc: 'See exactly where you\'re strong, where you\'re weak, and what to do about it.' },
  { title: 'Superfan Potential Analysis', desc: 'Discover whether your audience is passively following or actively engaged.' },
  { title: 'Personalized Offer Strategy', desc: 'Based on your audience size AND income, get a specific monetization recommendation.' },
  { title: 'Top 3 Action Items', desc: 'Walk away with three specific moves to make this month to grow your superfan base.' },
  { title: 'Benchmark Comparison', desc: 'See how you stack up against other artists at your level.' },
];

const faqs = [
  { q: 'Is this really free?', a: 'Yes, 100% free. We built this to help independent artists understand their audience better. You\'ll get the full report at no cost.' },
  { q: 'How long does it take?', a: 'About 15-30 seconds. We scan your platforms in real-time and generate a personalized PDF report on the spot.' },
  { q: 'What data do you collect?', a: 'We only access publicly available data from your social and music profiles. We never log into your accounts or access private information.' },
  { q: 'Do I need to be on every platform?', a: 'No! You just need at least one link. The more platforms you share, the more comprehensive your report will be.' },
  { q: 'What happens with my email?', a: 'We\'ll send you your report and occasional tips on growing your music career. You can unsubscribe anytime.' },
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
            Free Audience Intelligence Report
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            How well do you{' '}
            <span className="gradient-text">actually know</span>{' '}
            your fans?
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            We scan your Spotify, YouTube, Instagram, and more to build a personalized
            Superfan Audit Report — showing you exactly who your biggest supporters are
            and how to monetize your music.
          </p>
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5"
          >
            Get My Free Superfan Audit
            <span aria-hidden="true">&rarr;</span>
          </Link>
          <p className="text-sm text-gray-500 mt-4">Takes 30 seconds. No credit card required.</p>
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
            A comprehensive 8-page PDF analyzing your music brand from every angle.
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
            Ready to Discover Your Superfans?
          </h2>
          <p className="text-gray-400 mb-8">
            Join thousands of independent artists who use the Superfan Audit to understand
            and monetize their audience.
          </p>
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5"
          >
            Get My Free Superfan Audit
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
