"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  Database,
  Flame,
  Globe2,
  Layers,
  LineChart,
  Lock,
  Package,
  Plane,
  Radio,
  Search,
  Shield,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import DynamicIslandHero, {
  HomeHero,
  LandingNavbar,
} from "@/components/landing/DynamicIslandHero";

const JOURNEY_MILESTONES = [
  { step: "01", name: "Supplier", detail: "Origin & Lead Time", icon: Globe2 },
  { step: "02", name: "Warehouse", detail: "Warehouse stock", icon: Warehouse },
  { step: "03", name: "Inventory", detail: "Stock movements", icon: Boxes },
  { step: "04", name: "Order", detail: "Customer orders", icon: Layers },
  { step: "05", name: "Shipment", detail: "Carton Packing", icon: Package },
  { step: "06", name: "Transit", detail: "Delivery progress", icon: Truck },
  { step: "07", name: "Delivery", detail: "Delivered packages", icon: CheckCircle2 },
];

export default function LandingPage() {
  // Throttled scroll listener for progressive background blur and subtle scale
  React.useEffect(() => {
    let ticking = false;
    let frameId = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onScroll = () => {
      if (!reducedMotion.matches && !ticking) {
        frameId = window.requestAnimationFrame(() => {
          const scrollY = window.scrollY || 0;
          const blurPx = Math.min((scrollY / 600) * 12, 12);
          const scaleVal = 1.02 + Math.min((scrollY / 600) * 0.04, 0.04);
          document.documentElement.style.setProperty("--bg-blur", `${blurPx}px`);
          document.documentElement.style.setProperty("--bg-scale", `${scaleVal}`);
          ticking = false;
        });
        ticking = true;
      }
    };

    const updateMotionPreference = () => {
      window.cancelAnimationFrame(frameId);
      ticking = false;
      window.removeEventListener("scroll", onScroll);
      if (!reducedMotion.matches) {
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      }
    };

    reducedMotion.addEventListener("change", updateMotionPreference);
    updateMotionPreference();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frameId);
      reducedMotion.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  return (
    <div className="landing-page">
      {/* =========================================================================
          LAYER 1: Persistent Floating Dynamic Island Navigation
          ========================================================================= */}
      <LandingNavbar />

      {/* =========================================================================
          LAYER 2: Persistent Anchored Background Layer (Progressive Blur)
          ========================================================================= */}
      <div className="landing-backdrop-layer" aria-hidden="true">
        <div className="landing-backdrop-image" />
        <div className="landing-backdrop-shade" />

        <div className="landing-flight">
          <span className="landing-flight__trail" />
          <Plane className="landing-flight__plane" />
        </div>
      </div>

      {/* =========================================================================
          LAYER 3: Scrolling Content Flow
          ========================================================================= */}
      <main className="relative z-10">
        {/* Section 00: Home Hero (Natural In-Flow Scroll) */}
        <section
          id="hero"
          className="landing-section pt-24 sm:pt-32 pb-14 sm:pb-20 flex flex-col items-center justify-center min-h-[90vh] sm:min-h-[96vh] px-4"
        >
          <HomeHero />

          <div className="mt-8 sm:mt-12 flex flex-col items-center gap-2 text-white/40 text-xs font-mono tracking-widest uppercase animate-pulse">
            <span>Scroll to explore operations</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </div>
        </section>

        {/* Section 01: Features */}
        <section
          id="features"
          className="landing-section py-24 sm:py-32 border-t border-white/10"
        >
          <div className="scm-subpage-container">
            {/* Section Header */}
            <div className="max-w-3xl mb-16">
              <h2 className="scm-hero-title text-4xl sm:text-6xl lg:text-7xl">
                SUPPLY CHAIN,<br />
                MADE VISIBLE<span>.</span>
              </h2>
              <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed font-light">
                Track operations, monitor inventory, manage orders and shipments,
                and turn live supply-chain data into actionable insights.
              </p>
            </div>

            {/* Editorial 2-Column Technical Architecture */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left Column: Core Execution Engine */}
              <div className="space-y-6">
                <div className="text-xs font-mono uppercase tracking-widest text-white/50 pb-2 border-b border-white/10">
                  STOCK, ORDERS & DELIVERIES
                </div>

                {/* Feature 1 */}
                <div className="scm-panel p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-[#ff6865] font-bold">01.01</span>
                    <span className="scm-tag text-[9px]">STOCK HISTORY</span>
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2 flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-[#ff6865]" />
                    Inventory Control
                  </h3>
                  <p className="text-sm text-white/75 leading-relaxed font-sans mb-4">
                    Monitor inventory across warehouses with product-level stock counts,
                    safety thresholds, multi-facility scoping, and automatic low-stock alarms.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono text-white/60">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Reorder Levels</span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Stock Adjustments</span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Warehouse Access</span>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="scm-panel p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-blue-300 font-bold">01.02</span>
                    <span className="scm-tag text-[9px] bg-blue-500/10 text-blue-300 border-blue-400/20">
                      ORDER WORKFLOW
                    </span>
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-400" />
                    Order Management
                  </h3>
                  <p className="text-sm text-white/75 leading-relaxed font-sans mb-4">
                    Manage orders through controlled business workflows while keeping order status
                    strictly separate from physical transport packages:
                  </p>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white/80 space-y-1">
                    <div className="text-emerald-300">Placed → Confirmed → Fulfilled</div>
                    <div className="text-red-300">Placed → Cancelled</div>
                    <div className="text-red-300">Confirmed → Cancelled</div>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="scm-panel p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-emerald-300 font-bold">01.03</span>
                    <span className="scm-tag scm-tag--green text-[9px]">DELIVERY TIMELINE</span>
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-emerald-400" />
                    Shipment Tracking
                  </h3>
                  <p className="text-sm text-white/75 leading-relaxed font-sans mb-4">
                    Track shipments through a structured timeline (Packed → In Transit → Delivered).
                    Shipments are marked delayed after their expected delivery time.
                  </p>
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono text-emerald-300">
                    See when a shipment has passed its expected delivery date.
                  </div>
                </div>
              </div>

              {/* Right Column: Intelligence & Boundaries */}
              <div className="space-y-6">
                <div className="text-xs font-mono uppercase tracking-widest text-white/50 pb-2 border-b border-white/10">
                  TRACKING, REPORTS & ALERTS
                </div>

                {/* Feature 4 */}
                <div className="scm-panel p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-amber-300 font-bold">01.04</span>
                    <span className="scm-tag text-[9px] bg-amber-500/10 text-amber-300 border-amber-400/20">
                      CUSTOMER TRACKING
                    </span>
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2 flex items-center gap-2">
                    <Search className="w-5 h-5 text-amber-400" />
                    Public Package Tracking
                  </h3>
                  <p className="text-sm text-white/75 leading-relaxed font-sans mb-4">
                    Customers can enter a tracking number at <code>/track</code> without logging in.
                    The endpoint enforces a strict privacy boundary that protects internal assets.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-white/60 mb-4">
                    <span className="text-red-300">✕ No internal DB IDs</span>
                    <span className="text-red-300">✕ No supplier data</span>
                    <span className="text-red-300">✕ No stock quantities</span>
                    <span className="text-red-300">✕ No internal change logs</span>
                  </div>
                  <Link
                    href="/track"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-300 hover:underline"
                  >
                    <span>Test the public tracker at /track</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Feature 5 */}
                <div className="scm-panel p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-purple-300 font-bold">01.05</span>
                    <span className="scm-tag text-[9px]">CURRENT DATA</span>
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2 flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-purple-400" />
                    Live Analytics
                  </h3>
                  <p className="text-sm text-white/75 leading-relaxed font-sans mb-4">
                    Review delivery performance, supplier lead times and inventory levels using
                    current operational records:
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono text-white/60">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">On-Time Rates</span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Supplier Lead Times</span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Bottleneck Diagnosis</span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Inventory Velocity</span>
                  </div>
                </div>

                {/* Feature 6 */}
                <div className="scm-panel p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-[#ef302d] font-bold">01.06</span>
                    <span className="scm-tag scm-tag--red text-[9px]">STOCK & DELIVERY ALERTS</span>
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#ef302d]" />
                    Stock & Delivery Alerts
                  </h3>
                  <p className="text-sm text-white/75 leading-relaxed font-sans mb-4">
                    Find low stock and overdue shipments in one place. Alerts close automatically
                    when stock is replenished or a shipment is delivered.
                  </p>
                  <div className="flex items-center justify-between text-xs font-mono text-white/60 pt-2 border-t border-white/10">
                    <span>Repeated alerts are grouped</span>
                    <span className="text-emerald-400">Closes when resolved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 02: Solutions */}
        <section
          id="solutions"
          className="landing-section py-24 sm:py-32 border-t border-white/10 bg-[#061014]/50"
        >
          <div className="scm-subpage-container">
            {/* Section Header */}
            <div className="max-w-3xl mb-16">
              <h2 className="scm-hero-title text-4xl sm:text-6xl lg:text-7xl">
                ONE SYSTEM.<br />
                EVERY MOVEMENT<span>.</span>
              </h2>
              <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed font-light">
                Connect suppliers, warehouses, inventory, orders and shipments through tailored role
                interfaces backed by role-based access control.
              </p>
            </div>

            {/* 4 Role Quadrants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Role 1: Warehouse Managers */}
              <div className="scm-panel p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="scm-tag scm-tag--red text-[10px]">FACILITY WORKBENCH</span>
                    <span className="text-xs font-mono text-[#ff6865] uppercase">Warehouse Managers</span>
                  </div>
                  <h3 className="text-2xl font-bold uppercase tracking-tight text-white mb-3">
                    Warehouse Operations
                  </h3>
                  <p className="text-sm text-white/75 leading-relaxed font-sans mb-6">
                    Focused visibility into assigned warehouses and inventory. Manage physical stock counts,
                    execute adjustments, handle inter-warehouse transfers, pick orders, dispatch shipments,
                    and respond to local low-stock alerts.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10 text-xs font-mono text-white/60 flex items-center justify-between">
                  <span>Scope: Designated Facility Only</span>
                  <span className="text-emerald-400">Warehouse-Level Access</span>
                </div>
              </div>

              {/* Role 2: Supply Chain Managers */}
              <div className="scm-panel p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="scm-tag text-[10px] bg-blue-500/10 text-blue-300 border-blue-400/20">
                      NETWORK OVERVIEW
                    </span>
                    <span className="text-xs font-mono text-blue-300 uppercase">Supply Chain Managers</span>
                  </div>
                  <h3 className="text-2xl font-bold uppercase tracking-tight text-white mb-3">
                    Supply Chain Management
                  </h3>
                  <p className="text-sm text-white/75 leading-relaxed font-sans mb-6">
                    End-to-end operational visibility across vendors, master product definitions, customer
                    orders, and in-flight freight. Monitor cross-facility performance analytics and resolve
                    network-level alerts.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10 text-xs font-mono text-white/60 flex items-center justify-between">
                  <span>Scope: All Facilities & Lanes</span>
                  <span className="text-blue-300">Full Lifecycle Control</span>
                </div>
              </div>

              {/* Role 3: Analysts */}
              <div className="scm-panel p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="scm-tag scm-tag--green text-[10px]">READ-ONLY REPORTS</span>
                    <span className="text-xs font-mono text-emerald-300 uppercase">Analysts</span>
                  </div>
                  <h3 className="text-2xl font-bold uppercase tracking-tight text-white mb-3">
                    Analytics & Insights
                  </h3>
                  <p className="text-sm text-white/75 leading-relaxed font-sans mb-6">
                    Read-only access to operational intelligence without permission to mutate transactional
                    data. Diagnose transit bottlenecks, analyze inventory velocity, benchmark vendor lead times,
                    and audit alert resolution latency.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10 text-xs font-mono text-white/60 flex items-center justify-between">
                  <span>Scope: All Facilities</span>
                  <span className="text-emerald-400">Read-Only Access</span>
                </div>
              </div>

              {/* Role 4: Administrators */}
              <div className="scm-panel p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="scm-tag text-[10px] bg-amber-500/10 text-amber-300 border-amber-400/20">
                      ACCOUNT MANAGEMENT
                    </span>
                    <span className="text-xs font-mono text-amber-300 uppercase">Administrators</span>
                  </div>
                  <h3 className="text-2xl font-bold uppercase tracking-tight text-white mb-3">
                    System Administration
                  </h3>
                  <p className="text-sm text-white/75 leading-relaxed font-sans mb-6">
                    Manage user accounts and permissions, maintain product and warehouse records,
                    and review changes in the audit history.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10 text-xs font-mono text-white/60 flex items-center justify-between">
                  <span>Scope: User & System Settings</span>
                  <span className="text-amber-300">Role-Based Access</span>
                </div>
              </div>
            </div>

            {/* Governance Assurance Ribbon */}
            <div className="mt-10 p-5 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-white/70">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Access based on your team’s role
              </span>
              <span>Separate access for managers, analysts and administrators</span>
            </div>
          </div>
        </section>

        {/* Section 03: About & Architecture */}
        <section
          id="about"
          className="landing-section py-24 sm:py-32 border-t border-white/10"
        >
          <div className="scm-subpage-container">
            {/* Section Header */}
            <div className="max-w-3xl mb-16">
              <h2 className="scm-hero-title text-4xl sm:text-6xl lg:text-7xl">
                THE SUPPLY CHAIN<br />
                IS A JOURNEY<span>.</span>
              </h2>
              <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed font-light">
                SCM connects every stage of movement — from supplier to warehouse,
                from inventory to order, from shipment to delivery.
              </p>
            </div>

            {/* 7-Step Logistics Progression Pipeline */}
            <div className="mb-16">
              <span className="text-xs uppercase font-mono tracking-widest text-white/50 block mb-6">
                THE PHYSICAL & DIGITAL FLOW
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {JOURNEY_MILESTONES.map((item, idx) => {
                  const IconComp = item.icon;
                  return (
                    <div
                      key={item.step}
                      className="scm-panel p-4 flex flex-col hover:border-[#ef302d]/40 transition-colors"
                    >
                      <span className="font-mono text-[10px] text-[#ff6865] font-bold">
                        {item.step}
                      </span>
                      <div className="my-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white mb-2">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <strong className="text-sm font-bold uppercase text-white block">
                          {item.name}
                        </strong>
                        <span className="text-[11px] text-white/50 font-mono">
                          {item.detail}
                        </span>
                      </div>
                      {idx < JOURNEY_MILESTONES.length - 1 && (
                        <span className="hidden lg:block mt-auto text-right text-white/30 text-xs font-mono">→</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Architectural Rationale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Why SCM? */}
              <div className="scm-panel p-8">
                <span className="font-mono text-xs text-[#ff6865] font-bold block mb-2">OPERATIONAL PURPOSE</span>
                <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-3">
                  Why SCM?
                </h3>
                <p className="text-sm text-white/75 leading-relaxed font-sans mb-4">
                  Supply-chain information is often scattered across spreadsheets, manual records,
                  and disconnected systems. Teams suffer from inventory drift, delayed notifications,
                  and blind freight handoffs.
                </p>
                <p className="text-sm text-white/75 leading-relaxed font-sans">
                  SCM brings those operational flows together into a single unified system so teams can track,
                  manage, and understand movement from one place in real time.
                </p>
              </div>

              {/* Built Around Daily Work */}
              <div className="scm-panel p-8">
                <span className="font-mono text-xs text-emerald-400 font-bold block mb-2">DAILY OPERATIONS</span>
                <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-3">
                  Built Around Daily Work
                </h3>
                <p className="text-sm text-white/75 leading-relaxed font-sans mb-4">
                  The system is based around operational source-of-truth data rather than duplicated
                  analytics caches. Every state transition directly updates relational tables.
                </p>
                <div className="grid grid-cols-2 gap-2.5 text-xs font-mono text-white/75 pt-2">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Operational Data
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Live Analytics
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Reactive Alerts
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Role-Based Access
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Shipment Tracking
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Inventory Visibility
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 04: System Terminal (Final Interactive CTA) */}
        <section className="py-24 border-t border-white/10 bg-[#060e11]/80">
          <div className="scm-subpage-container flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div>
              <span className="scm-tag text-[10px] mb-3">GET STARTED</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
                Open your workspace
              </h2>
              <p className="text-sm text-white/70 mt-2 max-w-xl font-sans">
                Sign in to manage stock, orders and shipments, or track a package without an account.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/track"
                className="scm-button px-6 py-3 rounded-full border border-white/30 bg-white/5 text-white font-bold text-xs hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Track a Package</span>
              </Link>
              <Link
                href="/login"
                className="scm-button px-6 py-3 rounded-full bg-white text-[#172126] font-bold text-xs hover:bg-slate-200 transition-colors inline-flex items-center gap-2 shadow-lg"
              >
                <span>Log In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="scm-subpage-container mt-12 pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/50">
            <span className="flex items-center gap-2">
              Supply Chain Tracking & Analytics
            </span>
            <span>Inventory · Orders · Shipments</span>
          </div>
        </section>

        {/* Minimalist Footer */}
        <footer className="py-12 border-t border-white/10 bg-[#04090b]">
          <div className="scm-subpage-container flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-mono text-white/50">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-md border border-white/20 flex items-center justify-center rotate-12">
                <Boxes className="w-3.5 h-3.5 text-white -rotate-12" />
              </span>
              <span className="font-bold text-white tracking-widest">SCM PLATFORM</span>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <a href="#hero" className="hover:text-white transition-colors">Home</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
              <a href="#about" className="hover:text-white transition-colors">About</a>
              <Link href="/track" className="hover:text-white transition-colors">Track</Link>
              <Link href="/login" className="hover:text-white transition-colors">Log In</Link>
            </div>

            <div>
              © SCM · Supply Chain Tracking & Analytics System
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
