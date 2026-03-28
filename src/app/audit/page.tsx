'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { step1Schema, step2Schema, step3Schema, GENRES, INCOME_TIERS, YEARS_ACTIVE } from '@/lib/validators';
import type { Step1Data, Step2Data, Step3Data } from '@/lib/validators';

export default function AuditPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data & Step3Data>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema), defaultValues: { name: '', email: '', consent: false as unknown as true } });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), defaultValues: { artistName: '', genre: '', monthlyIncome: '', yearsActive: '' } });
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema), defaultValues: { spotifyUrl: '', youtubeUrl: '', instagramHandle: '', tiktokHandle: '', websiteUrl: '' } });

  const handleStep1 = form1.handleSubmit((data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(2);
  });

  const handleStep2 = form2.handleSubmit((data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(3);
  });

  const handleStep3 = form3.handleSubmit(async (data) => {
    setIsSubmitting(true);
    setError('');
    const fullData = { ...formData, ...data };

    try {
      const res = await fetch('/api/audit/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Something went wrong');
      }

      const { jobId } = await res.json();
      router.push(`/processing?jobId=${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  });

  const inputClass = "w-full bg-[#141420] border border-[#2D2D44] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors";
  const selectClass = "w-full bg-[#141420] border border-[#2D2D44] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors appearance-none";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";
  const errorClass = "text-red-400 text-sm mt-1";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                s === step ? 'bg-purple-600 text-white' :
                s < step ? 'bg-purple-600/30 text-purple-300' :
                'bg-[#1A1A2E] text-gray-500'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${s < step ? 'bg-purple-600/50' : 'bg-[#1A1A2E]'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Let&apos;s Start Your Audit</h1>
              <p className="text-gray-400">We&apos;ll send your personalized report to your email.</p>
            </div>
            <div>
              <label className={labelClass}>Your Name</label>
              <input {...form1.register('name')} className={inputClass} placeholder="Your name" />
              {form1.formState.errors.name && <p className={errorClass}>{form1.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Email Address</label>
              <input {...form1.register('email')} type="email" className={inputClass} placeholder="you@example.com" />
              {form1.formState.errors.email && <p className={errorClass}>{form1.formState.errors.email.message}</p>}
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input {...form1.register('consent')} type="checkbox" className="mt-1 w-4 h-4 rounded border-gray-600 bg-[#141420] text-purple-600 focus:ring-purple-500" />
              <span className="text-sm text-gray-400">I agree to receive my Superfan Audit report and occasional tips on growing my music career via email.</span>
            </label>
            {form1.formState.errors.consent && <p className={errorClass}>{form1.formState.errors.consent.message}</p>}
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-lg transition-colors">
              Continue
            </button>
          </form>
        )}

        {/* Step 2: Artist Info */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">About Your Music</h1>
              <p className="text-gray-400">This helps us personalize your audit and recommendations.</p>
            </div>
            <div>
              <label className={labelClass}>Artist / Band Name</label>
              <input {...form2.register('artistName')} className={inputClass} placeholder="Your artist or band name" />
              {form2.formState.errors.artistName && <p className={errorClass}>{form2.formState.errors.artistName.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Genre</label>
              <select {...form2.register('genre')} className={selectClass}>
                <option value="">Select your genre</option>
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              {form2.formState.errors.genre && <p className={errorClass}>{form2.formState.errors.genre.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Monthly Music / Entertainment Income</label>
              <select {...form2.register('monthlyIncome')} className={selectClass}>
                <option value="">Select your income range</option>
                {INCOME_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">This helps us recommend the right monetization strategy for your level.</p>
              {form2.formState.errors.monthlyIncome && <p className={errorClass}>{form2.formState.errors.monthlyIncome.message}</p>}
            </div>
            <div>
              <label className={labelClass}>How Long Have You Been Making Music?</label>
              <select {...form2.register('yearsActive')} className={selectClass}>
                <option value="">Select</option>
                {YEARS_ACTIVE.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              {form2.formState.errors.yearsActive && <p className={errorClass}>{form2.formState.errors.yearsActive.message}</p>}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-3 rounded-lg border border-[#2D2D44] text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
                Back
              </button>
              <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-lg transition-colors">
                Continue
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Links */}
        {step === 3 && (
          <form onSubmit={handleStep3} className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Your Online Presence</h1>
              <p className="text-gray-400">Share your links so we can scan your platforms. At least one is required.</p>
            </div>
            <div>
              <label className={labelClass}>♫ Spotify Artist URL</label>
              <input {...form3.register('spotifyUrl')} className={inputClass} placeholder="https://open.spotify.com/artist/..." />
              {form3.formState.errors.spotifyUrl && <p className={errorClass}>{form3.formState.errors.spotifyUrl.message}</p>}
            </div>
            <div>
              <label className={labelClass}>▶ YouTube Channel URL</label>
              <input {...form3.register('youtubeUrl')} className={inputClass} placeholder="https://youtube.com/@yourchannel" />
              {form3.formState.errors.youtubeUrl && <p className={errorClass}>{form3.formState.errors.youtubeUrl.message}</p>}
            </div>
            <div>
              <label className={labelClass}>📷 Instagram Handle</label>
              <input {...form3.register('instagramHandle')} className={inputClass} placeholder="@yourhandle" />
              {form3.formState.errors.instagramHandle && <p className={errorClass}>{form3.formState.errors.instagramHandle.message}</p>}
            </div>
            <div>
              <label className={labelClass}>♪ TikTok Handle</label>
              <input {...form3.register('tiktokHandle')} className={inputClass} placeholder="@yourhandle" />
              {form3.formState.errors.tiktokHandle && <p className={errorClass}>{form3.formState.errors.tiktokHandle.message}</p>}
            </div>
            <div>
              <label className={labelClass}>🌐 Website URL</label>
              <input {...form3.register('websiteUrl')} className={inputClass} placeholder="https://yourwebsite.com" />
              {form3.formState.errors.websiteUrl && <p className={errorClass}>{form3.formState.errors.websiteUrl.message}</p>}
            </div>
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="px-6 py-3 rounded-lg border border-[#2D2D44] text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Starting Audit...' : 'Run My Superfan Audit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
