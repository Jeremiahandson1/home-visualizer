'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-950" />}>
      <SuccessPageInner />
    </Suspense>
  );
}

function SuccessPageInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [session, setSession] = useState(null);

  useEffect(() => {
    // We could fetch session details, but the webhook handles provisioning.
    // Just show a confirmation.
    if (sessionId) {
      setSession({ id: sessionId });
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-6">
          <span className="text-green-400 text-3xl">✓</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">You're All Set!</h1>
        <p className="text-stone-400 mb-8">
          Your HomeVisualizer account is being provisioned. You'll receive a confirmation email
          with login details and setup instructions shortly.
        </p>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 text-left mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">Next Steps</h2>
          <ol className="space-y-3 text-sm text-stone-300">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <span>Check your email for admin dashboard access</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <span>Upload your logo and customize your brand colors</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">3</span>
              <span>Add the embed code to your website</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">4</span>
              <span>Start capturing leads from day one</span>
            </li>
          </ol>
        </div>

        <div className="space-y-3">
          <a
            href="/admin/setup"
            className="block w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 rounded-lg text-sm transition no-underline text-center"
          >
            Set Up Your Visualizer →
          </a>
          <p className="text-xs text-stone-600">
            Questions? Email support@homevisualizer.app
          </p>
        </div>
      </div>
    </div>
  );
}
