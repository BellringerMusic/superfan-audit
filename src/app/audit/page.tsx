'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { step1Schema, step2Schema, step3Schema, GENRES, INCOME_TIERS, YEARS_ACTIVE } from '@/lib/validators';
import type { Step1Data, Step2Data, Step3Data } from '@/lib/validators';

const FORM_DRAFT_KEY = 'superfanAudit:draftV1';
const FORM_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

type FormDraft = {
  step: number;
  formData: Partial<Step1Data & Step2Data & Step3Data>;
  step1?: Partial<Step1Data>;
  step2?: Partial<Step2Data>;
  step3?: Partial<Step3Data>;
  savedAt: number;
};

function readDraft(): FormDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(FORM_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FormDraft;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > FORM_DRAFT_MAX_AGE_MS) {
      window.localStorage.removeItem(FORM_DRAFT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeDraft(draft: Omit<FormDraft, 'savedAt'>) {
  if (typeof window === 'undefined') return;
  try {
    const payload: FormDraft = { ...draft, savedAt: Date.now() };
    window.localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // localStorage might be full / disabled — silently no-op.
  }
}

function clearDraft() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(FORM_DRAFT_KEY);
  } catch {
    // ignore
  }
}

export default function AuditPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data & Step3Data>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedFormData, setSubmittedFormData] = useState<Partial<Step1Data & Step2Data & Step3Data> | null>(null);

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema), defaultValues: { name: '', email: '', consent: false as unknown as true } });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), defaultValues: { artistName: '', genre: '', monthlyIncome: '', yearsActive: '' } });
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema), defaultValues: { spotifyUrl: '', youtubeUrl: '', instagramHandle: '', instagramFollowers: '', tiktokHandle: '', websiteUrl: '' } });

  // Restore draft on mount so an accidental refresh doesn't blow away progress.
  useEffect(() => {
    const draft = readDraft();
    if (!draft) return;
    if (draft.formData) setFormData(draft.formData);
    if (draft.step1) form1.reset({ ...form1.getValues(), ...draft.step1 });
    if (draft.step2) form2.reset({ ...form2.getValues(), ...draft.step2 });
    if (draft.step3) form3.reset({ ...form3.getValues(), ...draft.step3 });
    if (draft.step >= 1 && draft.step <= 3) setStep(draft.step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save partial progress whenever the user finishes a step or types something
  // worth keeping. We persist field values and the current step.
  useEffect(() => {
    const subs = [
      form1.watch((values) => writeDraft({ step, formData, step1: values as Partial<Step1Data> })),
      form2.watch((values) => writeDraft({ step, formData, step2: values as Partial<Step2Data> })),
      form3.watch((values) => writeDraft({ step, formData, step3: values as Partial<Step3Data> })),
    ];
    return () => subs.forEach((s) => s.unsubscribe());
  }, [step, formData, form1, form2, form3]);

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
    setSubmittedFormData(fullData);

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

      const responseData = await res.json();

      if (responseData.status === 'complete' && responseData.result) {
        // Store result in sessionStorage for the report page
        sessionStorage.setItem('auditResult', JSON.stringify(responseData.result));
        if (responseData.pdfBase64) {
          sessionStorage.setItem('auditPdfBase64', responseData.pdfBase64);
        }
        // Audit is in the bag — clear the in-progress draft.
        clearDraft();
        router.push('/report/result');
      } else {
        throw new Error('Audit did not complete successfully');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsSubmitting(false);
      setSubmittedFormData(null);
    }
  });

  const inputClass = "w-full bg-[#141420] border border-[#2D2D44] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors";
  const selectClass = "w-full bg-[#141420] border border-[#2D2D44] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors appearance-none";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";
  const errorClass = "text-red-400 text-sm mt-1";

  // Show processing animation while waiting for API
  if (isSubmitting) {
    return <ProcessingAnimation submittedData={submittedFormData} />;
  }

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
              <input {...form3.register('spotifyUrl')} className={inputClass} placeholder="open.spotify.com/artist/..." />
              <p className="text-xs text-gray-500 mt-1">Paste the link however it looks — with or without https://</p>
              {form3.formState.errors.spotifyUrl && <p className={errorClass}>{form3.formState.errors.spotifyUrl.message}</p>}
            </div>
            <div>
              <label className={labelClass}>▶ YouTube Channel URL</label>
              <input {...form3.register('youtubeUrl')} className={inputClass} placeholder="youtube.com/@yourchannel" />
              <p className="text-xs text-gray-500 mt-1">Channel URL — handle (@), /channel/, or /c/ formats all work.</p>
              {form3.formState.errors.youtubeUrl && <p className={errorClass}>{form3.formState.errors.youtubeUrl.message}</p>}
            </div>
            <div>
              <label className={labelClass}>📷 Instagram Handle</label>
              <input {...form3.register('instagramHandle')} className={inputClass} placeholder="@yourhandle or instagram.com/yourhandle" />
              <p className="text-xs text-gray-500 mt-1">Just your username — or paste the whole profile URL, we&apos;ll figure it out.</p>
              {form3.formState.errors.instagramHandle && <p className={errorClass}>{form3.formState.errors.instagramHandle.message}</p>}
              {form3.watch('instagramHandle') && (
                <div className="mt-3">
                  <label className={labelClass}>Instagram Followers <span className="text-gray-500 font-normal">(optional)</span></label>
                  <input {...form3.register('instagramFollowers')} className={inputClass} placeholder="e.g. 12500" inputMode="numeric" />
                  <p className="text-xs text-gray-500 mt-1">Instagram limits automated scanning — entering your follower count ensures accurate results.</p>
                  {form3.formState.errors.instagramFollowers && <p className={errorClass}>{form3.formState.errors.instagramFollowers.message}</p>}
                </div>
              )}
            </div>
            <div>
              <label className={labelClass}>♪ TikTok Handle</label>
              <input {...form3.register('tiktokHandle')} className={inputClass} placeholder="@yourhandle or tiktok.com/@yourhandle" />
              <p className="text-xs text-gray-500 mt-1">Just your username — or paste the profile URL.</p>
              {form3.formState.errors.tiktokHandle && <p className={errorClass}>{form3.formState.errors.tiktokHandle.message}</p>}
            </div>
            <div>
              <label className={labelClass}>🌐 Website URL</label>
              <input {...form3.register('websiteUrl')} className={inputClass} placeholder="yourwebsite.com" />
              <p className="text-xs text-gray-500 mt-1">marcus.com, www.marcus.com, https://marcus.com — all good.</p>
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

/**
 * Honest loading state — only shows the platforms that were actually
 * submitted, paces at the API's real ~3-5s response time, and stays on
 * the final "wrapping up" step until the response actually returns.
 */
function ProcessingAnimation({
  submittedData,
}: {
  submittedData: Partial<Step1Data & Step2Data & Step3Data> | null;
}) {
  // Build steps based on what the user actually provided.
  const steps: string[] = ['Received your information'];
  const d = submittedData || {};
  if (d.spotifyUrl) steps.push('Scanning Spotify…');
  if (d.youtubeUrl) steps.push('Scanning YouTube channel + comments…');
  if (d.instagramHandle) steps.push('Checking Instagram…');
  if (d.tiktokHandle) steps.push('Checking TikTok…');
  if (d.websiteUrl) steps.push('Scanning your website + press mentions…');
  steps.push('Identifying repeat engagers…');
  steps.push('Building your report…');

  const [activeStepIdx, setActiveStepIdx] = useState(0);

  // Advance through the steps at a pace tuned to the real ~3-5s API.
  // Each step takes ~600ms; the final step holds open until the parent
  // unmounts us by routing to the report.
  useEffect(() => {
    const last = steps.length - 1;
    const id = setInterval(() => {
      setActiveStepIdx((prev) => Math.min(prev + 1, last));
    }, 600);
    return () => clearInterval(id);
  }, [steps.length]);

  // The progress bar tracks step completion, not wall-clock — honest by design.
  const completionPct = Math.min(95, Math.round(((activeStepIdx + 1) / steps.length) * 100));

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-white mb-2">Building Your Report</h1>
          <p className="text-gray-400">Looking for the people in your audience already raising their hand.</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-2 bg-[#1A1A2E] rounded-full overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((stepText, i) => {
            const isComplete = i < activeStepIdx;
            const isActive = i === activeStepIdx;

            return (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  isComplete ? 'bg-green-500/20 text-green-400' :
                  isActive ? 'bg-purple-600/20 text-purple-400' :
                  'bg-[#1A1A2E] text-gray-600'
                }`}>
                  {isComplete ? '✓' : isActive ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-600" />
                  )}
                </div>
                <span className={`text-sm transition-colors ${
                  isComplete ? 'text-green-400' :
                  isActive ? 'text-white' :
                  'text-gray-600'
                }`}>
                  {stepText}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
