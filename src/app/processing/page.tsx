'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const STEPS = [
  'Received your information',
  'Scanning Spotify...',
  'Scanning YouTube...',
  'Scanning social media...',
  'Analyzing your audience...',
  'Generating your report...',
];

function ProcessingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('jobId');

  const [progress, setProgress] = useState(5);
  const [currentStep, setCurrentStep] = useState('Initializing...');
  const [error, setError] = useState('');
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  const pollStatus = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/audit/status/${jobId}`);
      if (!res.ok) throw new Error('Failed to check status');
      const data = await res.json();

      setProgress(data.progress);
      setCurrentStep(data.currentStep);

      // Map progress to step index
      if (data.progress >= 85) setActiveStepIdx(5);
      else if (data.progress >= 70) setActiveStepIdx(4);
      else if (data.progress >= 50) setActiveStepIdx(3);
      else if (data.progress >= 30) setActiveStepIdx(2);
      else if (data.progress >= 15) setActiveStepIdx(1);
      else setActiveStepIdx(0);

      if (data.status === 'complete') {
        router.push(`/report/${jobId}`);
        return true;
      }
      if (data.status === 'error') {
        setError(data.error || 'Something went wrong.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [jobId, router]);

  useEffect(() => {
    if (!jobId) {
      router.push('/audit');
      return;
    }

    const interval = setInterval(async () => {
      const done = await pollStatus();
      if (done) clearInterval(interval);
    }, 2000);

    // Also poll immediately
    pollStatus();

    return () => clearInterval(interval);
  }, [jobId, router, pollStatus]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">✕</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Something Went Wrong</h1>
          <p className="text-gray-400 mb-8">{error}</p>
          <button
            onClick={() => router.push('/audit')}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold text-white mb-2">Building Your Report</h1>
          <p className="text-gray-400">This usually takes about 15-30 seconds.</p>
        </div>

        {/* Progress bar */}
        <div className="mb-10">
          <div className="h-2 bg-[#1A1A2E] rounded-full overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">{progress}%</p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {STEPS.map((stepText, i) => {
            const isComplete = i < activeStepIdx;
            const isActive = i === activeStepIdx;

            return (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  isComplete ? 'bg-green-500/20 text-green-400' :
                  isActive ? 'bg-purple-600/20 text-purple-400' :
                  'bg-[#1A1A2E] text-gray-600'
                }`}>
                  {isComplete ? '✓' : isActive ? (
                    <span className="w-3 h-3 rounded-full bg-purple-400 animate-pulse" />
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

        <p className="text-xs text-gray-600 text-center mt-8">{currentStep}</p>
      </div>
    </main>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </main>
    }>
      <ProcessingContent />
    </Suspense>
  );
}
