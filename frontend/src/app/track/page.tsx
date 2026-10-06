"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import FeedbackAlert from "@/components/common/FeedbackAlert";
import { Tilt } from "@/components/core/tilt";
import { normalizeTrackingNumber, isValidTrackingNumberFormat } from "@/lib/tracking";

// Public page: no ProtectedRoute, no AppLayout, no login required.
export default function TrackPage() {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeTrackingNumber(trackingNumber);
    if (!normalized) {
      setError("Please enter a tracking number.");
      return;
    }
    if (!isValidTrackingNumberFormat(normalized)) {
      setError("Tracking numbers look like TRK-1A2B3C4D. Please check and try again.");
      return;
    }
    setError(null);
    router.push(`/tracking/${encodeURIComponent(normalized)}`);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-slate-900">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/ags-logistics.jpg')" }} aria-hidden="true">
        <div className="absolute inset-0 bg-slate-900/30 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-900/10 to-slate-900/90" />
      </div>
      <header className="dynamic-island-nav flex items-center justify-between gap-3 px-4 py-3 sm:px-6" aria-label="Package tracking navigation">
        <Link href="/" aria-label="SCM Home" className="inline-flex items-center gap-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <span className="text-sm font-bold tracking-[0.16em]">SCM</span>
          <span className="hidden border-l border-white/20 pl-3 text-[10px] font-mono uppercase tracking-widest text-white/60 sm:inline">Package tracking</span>
        </Link>
        <Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-[#211f1b] hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Staff login
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-12 pt-28 sm:px-8 lg:justify-end lg:px-16 xl:px-32">
        <div className="w-full max-w-lg">
          <Tilt rotationFactor={8} isRevese>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl">
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to home
              </Link>
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-xl font-bold tracking-[0.16em] text-slate-900">SCM</span>
                <span className="max-w-[70%] text-right text-[10px] font-semibold uppercase tracking-[0.18em] leading-relaxed text-slate-500">Package tracking</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight leading-none text-slate-900">
                Track package<span className="text-[#ef302d]" aria-hidden="true">.</span>
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Enter the tracking number shared with you.<br />
                <span className="text-xs">For example: TRK-1A2B3C4D</span>
              </p>

              {error && (
                <div className="mt-4">
                  <FeedbackAlert type="error" message={error} onDismiss={() => setError(null)} />
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="tracking-number" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Tracking number
                  </label>
                  <input
                    id="tracking-number"
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="TRK-________"
                    autoComplete="off"
                    spellCheck={false}
                    className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 font-mono text-sm uppercase text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900"
                >
                  Track package <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </Tilt>
        </div>
      </main>
    </div>
  );
}
