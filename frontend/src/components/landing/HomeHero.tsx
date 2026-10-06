"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

export default function HomeHero() {
  return (
    <div
      className="landing-hero-card"
      role="region"
      aria-label="Supply Chain Platform Hero"
    >
      {/* Top Beacon Badge inside Hero Card */}
      <div className="flex items-center justify-center pt-8 pb-3 px-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono tracking-widest text-white/70 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Autonomous Stream</span>
        </div>
      </div>

      {/* Hero Body Content */}
      <div className="px-6 pb-8 pt-2 sm:px-10 sm:pb-10 flex flex-col items-center text-center">
        {/* Eyebrow */}
        <p className="landing-eyebrow text-[10px] sm:text-xs tracking-widest text-white/60 mb-3">
          TRACK · MANAGE · ANALYZE
        </p>

        {/* Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-[0.88] max-w-3xl">
          THE SUPPLY<br />
          CHAIN<span className="text-[#ef302d]">.</span>
        </h1>

        {/* Description */}
        <p className="mt-5 text-sm sm:text-base text-white/75 max-w-md font-light leading-relaxed">
          Real-time tracking. Smarter decisions.<br />
          A connected operational network across all facilities.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="px-6 py-3 rounded-full bg-white text-[#172126] font-bold text-xs sm:text-sm hover:bg-slate-200 transition-colors inline-flex items-center gap-2 shadow-md"
          >
            <span>Log in</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/track"
            className="px-6 py-3 rounded-full border border-white/30 bg-white/5 text-white font-bold text-xs sm:text-sm hover:bg-white/10 transition-colors inline-flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Track My Package</span>
          </Link>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="mt-8 pt-6 border-t border-white/10 w-full grid grid-cols-3 gap-2 text-center font-mono">
          <div>
            <strong className="block text-base sm:text-lg text-white font-bold">500+</strong>
            <span className="text-[10px] sm:text-xs text-white/50 uppercase">Shipments Tracked</span>
          </div>
          <div>
            <strong className="block text-base sm:text-lg text-white font-bold">120+</strong>
            <span className="text-[10px] sm:text-xs text-white/50 uppercase">Global Partners</span>
          </div>
          <div>
            <strong className="block text-base sm:text-lg text-emerald-400 font-bold">99.9%</strong>
            <span className="text-[10px] sm:text-xs text-white/50 uppercase">System Uptime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
