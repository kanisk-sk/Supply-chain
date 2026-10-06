"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  Clock,
  Database,
  Flame,
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
import LandingNavbar from "@/components/common/LandingNavbar";

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Sticky Navigation Bar */}
      <LandingNavbar />

      {/* Hero Section */}
      <section id="hero" className="landing-hero landing-section">
        <div className="landing-page__backdrop" aria-hidden="true" />
        <div className="landing-page__shade" aria-hidden="true" />

        <div className="landing-flight" aria-hidden="true">
          <span className="landing-flight__trail" />
          <Plane className="landing-flight__plane" />
        </div>

        <div className="landing-hero-content" aria-labelledby="landing-heading">
          <p className="landing-eyebrow">TRACK · MANAGE · ANALYZE</p>
          <h1 id="landing-heading">
            THE SUPPLY<br />
            CHAIN<span>.</span>
          </h1>
          <p className="landing-description">
            Real-time tracking. Smarter decisions.<br />
            A connected supply chain.
          </p>
          <div className="landing-actions">
            <Link href="/login" className="landing-action landing-action--primary">
              Login in <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/track" className="landing-action landing-action--secondary">
              Track My Package <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="landing-stats" aria-label="Supply chain statistics">
          <div className="landing-stat">
            <strong>500+</strong>
            <span>Shipments Tracked</span>
          </div>
          <div className="landing-stat">
            <strong>120+</strong>
            <span>Global Partners</span>
          </div>
          <div className="landing-stat">
            <strong>99.9%</strong>
            <span>System Uptime</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="landing-section py-24 sm:py-32 border-t border-white/10 relative"
      >
        <div className="scm-subpage-container">
          <div className="max-w-3xl mb-16">
            <span className="scm-tag scm-tag--red mb-4">01 · CORE PLATFORM</span>
            <h2 className="scm-hero-title text-4xl sm:text-6xl lg:text-7xl">
              SUPPLY CHAIN,<br />
              MADE VISIBLE<span>.</span>
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed font-light">
              Track operations, monitor inventory, manage orders and shipments,
              and turn live supply-chain data into actionable insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 01 - Inventory Control */}
            <div className="scm-panel p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    <Warehouse className="w-5 h-5 text-[#ff6865]" />
                  </div>
                  <span className="font-mono text-xs text-white/50">01</span>
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2">
                  Inventory Control
                </h3>
                <p className="text-sm text-white/70 leading-relaxed font-sans mb-4">
                  Product-level stock visibility across warehouses with reorder thresholds,
                  facility scoping, and automatic low-stock alerts.
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 text-xs font-mono text-white/50 flex items-center justify-between">
                <span>Atomic Transactions</span>
                <span className="text-[#4ade80]">Live Ledgers</span>
              </div>
            </div>

            {/* 02 - Order Management */}
            <div className="scm-panel p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    <Layers className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="font-mono text-xs text-white/50">02</span>
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2">
                  Order Management
                </h3>
                <p className="text-sm text-white/70 leading-relaxed font-sans mb-4">
                  Controlled FSM workflows (Placed → Confirmed → Fulfilled / Cancelled) kept
                  strictly separate from physical shipment progression.
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 text-xs font-mono text-white/50 flex items-center justify-between">
                <span>Deterministic FSM</span>
                <span className="text-blue-300">Decoupled State</span>
              </div>
            </div>

            {/* 03 - Shipment Tracking */}
            <div className="scm-panel p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    <Truck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="font-mono text-xs text-white/50">03</span>
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2">
                  Shipment Tracking
                </h3>
                <p className="text-sm text-white/70 leading-relaxed font-sans mb-4">
                  Milestone timeline (Packed → In Transit → Delivered). Delayed status is derived
                  dynamically from expected delivery time without manual mutation.
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 text-xs font-mono text-white/50 flex items-center justify-between">
                <span>Dynamic Delay Logic</span>
                <span className="text-emerald-300">Milestone SLA</span>
              </div>
            </div>

            {/* 04 - Public Package Tracking */}
            <div className="scm-panel p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    <Search className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="font-mono text-xs text-white/50">04</span>
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2">
                  Public Package Tracking
                </h3>
                <p className="text-sm text-white/70 leading-relaxed font-sans mb-4">
                  Zero-auth customer portal at <code>/track</code>. Redacts internal IDs, supplier info,
                  quantities, and audit logs to present clean public timelines.
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 text-xs font-mono text-white/50 flex items-center justify-between">
                <Link href="/track" className="text-amber-300 hover:underline flex items-center gap-1">
                  Try /track <ArrowRight className="w-3 h-3" />
                </Link>
                <span>Zero Login</span>
              </div>
            </div>

            {/* 05 - Live Analytics */}
            <div className="scm-panel p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    <LineChart className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="font-mono text-xs text-white/50">05</span>
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2">
                  Live Analytics
                </h3>
                <p className="text-sm text-white/70 leading-relaxed font-sans mb-4">
                  Real-time intelligence computed directly from operational tables: delivery performance,
                  supplier reliability, bottleneck detection, and stock turnover.
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 text-xs font-mono text-white/50 flex items-center justify-between">
                <span>Zero Stale Batching</span>
                <span className="text-purple-300">Fast SQL Aggs</span>
              </div>
            </div>

            {/* 06 - Proactive Alerts */}
            <div className="scm-panel p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    <Flame className="w-5 h-5 text-[#ef302d]" />
                  </div>
                  <span className="font-mono text-xs text-white/50">06</span>
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2">
                  Reactive Alerts Engine
                </h3>
                <p className="text-sm text-white/70 leading-relaxed font-sans mb-4">
                  Automated detection for low-stock balances and overdue shipments with in-process
                  deduplication and auto-resolution when physical conditions clear.
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 text-xs font-mono text-white/50 flex items-center justify-between">
                <span>Auto-Resolution</span>
                <span className="text-[#ff6865]">Zero Duplicate Floods</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section
        id="solutions"
        className="landing-section py-24 sm:py-32 border-t border-white/10 bg-[#071114]/60 relative"
      >
        <div className="scm-subpage-container">
          <div className="max-w-3xl mb-16">
            <span className="scm-tag mb-4">02 · USER ROLES</span>
            <h2 className="scm-hero-title text-4xl sm:text-6xl lg:text-7xl">
              ONE SYSTEM.<br />
              EVERY MOVEMENT<span>.</span>
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed font-light">
              Connect suppliers, warehouses, inventory, orders and shipments through tailored role
              workflows and strict access control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Role 1 - Warehouse Managers */}
            <div className="scm-panel p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="scm-tag scm-tag--red text-[10px]">FACILITY WORKBENCH</span>
                <span className="text-xs font-mono text-[#ff6865] uppercase">Warehouse Managers</span>
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-tight text-white mb-3">
                Warehouse Operations
              </h3>
              <p className="text-sm text-white/75 leading-relaxed font-sans mb-6">
                Focused visibility into assigned warehouses and inventory. Manage local stock adjustments,
                inter-warehouse transfers, order picking queues, dispatch docks, and local low-stock alerts.
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-mono text-white/70">
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Scoped Facility Access</span>
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Stock Adjustments</span>
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Picking Queue</span>
              </div>
            </div>

            {/* Role 2 - Supply Chain Managers */}
            <div className="scm-panel p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="scm-tag text-[10px] bg-blue-500/10 text-blue-300 border-blue-400/20">
                  NETWORK RADAR
                </span>
                <span className="text-xs font-mono text-blue-300 uppercase">Supply Chain Managers</span>
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-tight text-white mb-3">
                Supply Chain Management
              </h3>
              <p className="text-sm text-white/75 leading-relaxed font-sans mb-6">
                End-to-end visibility across the entire enterprise. Oversee supplier directories, product catalogs,
                order lifecycles, in-flight shipments, global analytics, and high-severity network alerts.
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-mono text-white/70">
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Supplier Contracts</span>
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Master Catalog</span>
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Freight Oversight</span>
              </div>
            </div>

            {/* Role 3 - Analysts */}
            <div className="scm-panel p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="scm-tag scm-tag--green text-[10px]">INTELLIGENCE ONLY</span>
                <span className="text-xs font-mono text-emerald-300 uppercase">Analysts</span>
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-tight text-white mb-3">
                Analytics & Insights
              </h3>
              <p className="text-sm text-white/75 leading-relaxed font-sans mb-6">
                Read-only access to operational intelligence. Diagnose transit bottlenecks, analyze inventory
                turnover, benchmark supplier lead-time variances, and inspect alert resolution trends.
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-mono text-white/70">
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Zero Mutation Privileges</span>
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Lead-Time Modeling</span>
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">Carrier Scorecards</span>
              </div>
            </div>

            {/* Role 4 - Administrators */}
            <div className="scm-panel p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="scm-tag text-[10px] bg-amber-500/10 text-amber-300 border-amber-400/20">
                  SYSTEM GOVERNANCE
                </span>
                <span className="text-xs font-mono text-amber-300 uppercase">Administrators</span>
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-tight text-white mb-3">
                System Administration
              </h3>
              <p className="text-sm text-white/75 leading-relaxed font-sans mb-6">
                Full administrative authority over user provisioning, RBAC assignments, warehouse definitions,
                product categories, background scheduler daemons, and immutable audit logging.
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-mono text-white/70">
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">RBAC Enforcement</span>
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">User Governance</span>
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">System Audit Trail</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="landing-section py-24 sm:py-32 border-t border-white/10 relative"
      >
        <div className="scm-subpage-container">
          <div className="max-w-3xl mb-16">
            <span className="scm-tag scm-tag--red mb-4">03 · ARCHITECTURE</span>
            <h2 className="scm-hero-title text-4xl sm:text-6xl lg:text-7xl">
              THE SUPPLY CHAIN<br />
              IS A JOURNEY<span>.</span>
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed font-light">
              SCM connects every stage of movement — from supplier to warehouse,
              from inventory to order, from shipment to delivery.
            </p>
          </div>

          {/* 7-Step Journey Pipeline */}
          <div className="mb-16">
            <span className="text-xs uppercase font-mono tracking-widest text-white/50 block mb-6">
              THE OPERATIONAL FLOW
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { step: "01", name: "Supplier", detail: "Origin" },
                { step: "02", name: "Warehouse", detail: "Facility" },
                { step: "03", name: "Inventory", detail: "Stock" },
                { step: "04", name: "Order", detail: "Demand" },
                { step: "05", name: "Shipment", detail: "Packing" },
                { step: "06", name: "Transit", detail: "In Motion" },
                { step: "07", name: "Delivery", detail: "Destination" },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className="scm-panel p-4 flex flex-col justify-between border-white/10 hover:border-[#ef302d]/40 transition-colors"
                >
                  <span className="font-mono text-[10px] text-[#ff6865] font-bold">
                    {item.step}
                  </span>
                  <div className="my-2">
                    <strong className="text-sm font-bold uppercase text-white block">
                      {item.name}
                    </strong>
                    <span className="text-[11px] text-white/50 font-mono">
                      {item.detail}
                    </span>
                  </div>
                  {index < 6 && (
                    <span className="hidden lg:block text-right text-white/30 text-xs">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Why SCM & Real Operations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="scm-panel p-8">
              <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-3">
                Why SCM?
              </h3>
              <p className="text-sm text-white/75 leading-relaxed font-sans mb-4">
                Supply-chain information is often scattered across spreadsheets, manual records,
                and disconnected systems.
              </p>
              <p className="text-sm text-white/75 leading-relaxed font-sans">
                SCM brings those operational flows together into a single unified platform so teams
                can track, manage, and understand physical movement from one place in real time.
              </p>
            </div>

            <div className="scm-panel p-8">
              <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-3">
                Built Around Real Operations
              </h3>
              <p className="text-sm text-white/75 leading-relaxed font-sans mb-4">
                The system is founded on operational source-of-truth data rather than stale or
                duplicated analytics stores.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-white/70 pt-2">
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

      {/* Minimalist Footer */}
      <footer className="py-12 border-t border-white/10 bg-[#060e11]">
        <div className="scm-subpage-container flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="landing-brand__mark">
              <Boxes className="w-4 h-4 text-white" />
            </span>
            <span className="text-sm font-bold tracking-widest text-white">SCM PLATFORM</span>
            <span className="text-xs text-white/40 font-mono">· Live Operational Tracking</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-white/60 font-mono">
            <a href="#hero" className="hover:text-white transition-colors">Home</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <Link href="/track" className="hover:text-white transition-colors">Track</Link>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
          </div>

          <div className="text-xs text-white/40 font-mono">
            © SCM · Tracking & Analytics System
          </div>
        </div>
      </footer>
    </div>
  );
}
