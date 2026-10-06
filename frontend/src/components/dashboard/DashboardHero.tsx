"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

interface DashboardHeroProps {
  title: string;
  subtitle: string;
  loading: boolean;
  onRefresh: () => void;
}

export default function DashboardHero({ title, subtitle, loading, onRefresh }: DashboardHeroProps) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section aria-label="Dashboard overview" className="relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-[#eef1f2] shadow-sm">
      <div className="absolute inset-0 -z-10 bg-cover bg-[position:72%_center] sm:bg-center" style={{ backgroundImage: "url('/dashboard-truck-hero.jpg')" }} aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#faf8f3]/95 via-[#faf8f3]/90 to-[#faf8f3]/70 sm:via-[#faf8f3]/75 sm:to-transparent" aria-hidden="true" />
      <div className="flex min-h-[300px] flex-col justify-between gap-6 p-6 sm:min-h-[320px] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Supply chain control · {title}</p>
          <button onClick={onRefresh} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white/90 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">
            <TrendingUp className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Refresh Analytics
          </button>
        </div>
        <div className="max-w-lg">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#211f1b] sm:text-4xl">
            Everything in motion.<br />
            <span className="text-[#747d86]">Right where it should be.</span>
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">{subtitle}</p>
        </div>
        {now && (
          <time dateTime={now.toISOString()} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-slate-600" aria-label="Current time in India">
            <span>{new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(now)}</span>
            <span className="font-semibold tabular-nums text-slate-800">{new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true }).format(now)} IST</span>
          </time>
        )}
      </div>
    </section>
  );
}
