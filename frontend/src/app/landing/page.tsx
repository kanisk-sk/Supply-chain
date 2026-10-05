"use client";

import Link from "next/link";
import { ArrowRight, Boxes, Plane, Search } from "lucide-react";

const navigation = [
  { label: "Home", href: "/landing", active: true },
  { label: "Features", href: "/track" },
  { label: "Solutions", href: "/analytics" },
  { label: "About", href: "/landing" },
];

export default function LandingPage() {
  return (
    <main id="hero" className="landing-page">
      <div className="landing-page__backdrop" aria-hidden="true" />
      <div className="landing-page__shade" aria-hidden="true" />

      <header className="landing-header">
        <Link href="/landing" className="landing-brand" aria-label="SCM home">
          <span className="landing-brand__mark"><Boxes aria-hidden="true" /></span>
          <span>SCM</span>
        </Link>

        <nav className="landing-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={item.active ? "landing-nav__link landing-nav__link--active" : "landing-nav__link"}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="landing-header__actions">
          <Link href="/track" className="landing-search" aria-label="Track a package">
            <Search aria-hidden="true" />
          </Link>
          <Link href="/login" className="landing-signup">
            Sign up <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="landing-flight" aria-hidden="true">
        <span className="landing-flight__trail" />
        <Plane className="landing-flight__plane" />
      </div>

      <section className="landing-hero-content" aria-labelledby="landing-heading">
        <p className="landing-eyebrow">TRACK · MANAGE · ANALYZE</p>
        <h1 id="landing-heading">THE SUPPLY<br />CHAIN<span>.</span></h1>
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
      </section>

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
    </main>
  );
}
