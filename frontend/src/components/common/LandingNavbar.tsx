"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Boxes, Menu, Search, X } from "lucide-react";
import { getLandingScrollBehavior } from "@/lib/landing-scroll";

export interface NavItem {
  label: string;
  href: string;
  sectionId: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", sectionId: "hero" },
  { label: "Features", href: "/features", sectionId: "features" },
  { label: "Solutions", href: "/solutions", sectionId: "solutions" },
  { label: "About", href: "/about", sectionId: "about" },
];

export function isItemActive(
  pathname: string | null,
  href: string,
  activeSection?: string
): boolean {
  if (activeSection) {
    if (href === "/" && activeSection === "hero") return true;
    if (href === "/features" && activeSection === "features") return true;
    if (href === "/solutions" && activeSection === "solutions") return true;
    if (href === "/about" && activeSection === "about") return true;
    return false;
  }
  if (!pathname) return false;
  if (href === "/") {
    return pathname === "/" || pathname === "/landing";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export default function LandingNavbar() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLandingPage = pathname === "/" || pathname === "/landing";

  useEffect(() => {
    if (!isLandingPage) return;

    // Check hash on mount
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.replace("#", "");
      if (["hero", "features", "solutions", "about"].includes(hash)) {
        setActiveSection(hash);
        const el = document.getElementById(hash);
        if (el) {
          setTimeout(() => el.scrollIntoView({ behavior: getLandingScrollBehavior() }), 100);
        }
      }
    }

    const sections = NAV_ITEMS.map((item) => document.getElementById(item.sectionId)).filter(
      Boolean
    ) as HTMLElement[];

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-25% 0px -55% 0px",
        threshold: 0,
      }
    );

    sections.forEach((sec) => observer.observe(sec));

    return () => {
      sections.forEach((sec) => observer.unobserve(sec));
    };
  }, [isLandingPage]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: NavItem
  ) => {
    if (isLandingPage) {
      e.preventDefault();
      if (item.sectionId === "hero") {
        window.scrollTo({ top: 0, behavior: getLandingScrollBehavior() });
        window.history.pushState(null, "", "/");
        setActiveSection("hero");
      } else {
        const el = document.getElementById(item.sectionId);
        if (el) {
          el.scrollIntoView({ behavior: getLandingScrollBehavior() });
          window.history.pushState(null, "", `#${item.sectionId}`);
          setActiveSection(item.sectionId);
        }
      }
      setMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`dynamic-island-nav transition-all duration-200 ${
        mobileMenuOpen ? "rounded-3xl" : ""
      }`}
      role="banner"
      aria-label="Primary Navigation"
    >
      <div className="flex items-center justify-between px-4 py-2.5 sm:px-6 sm:py-3">
        {/* Brand Logo */}
        <a
          href={isLandingPage ? "#hero" : "/#hero"}
          onClick={(e) => handleNavClick(e, NAV_ITEMS[0])}
          className="flex items-center gap-2.5 text-white font-extrabold tracking-wider hover:opacity-85 transition-opacity shrink-0"
          aria-label="SCM Home"
        >
          <span className="w-7 h-7 rounded-lg border border-white/30 flex items-center justify-center rotate-12 bg-white/5">
            <Boxes className="w-4 h-4 -rotate-12" aria-hidden="true" />
          </span>
          <span className="text-sm font-black tracking-widest">SCM</span>
        </a>

        {/* Center: Persistent Section Nav Links */}
        <nav
          className="hidden sm:flex items-center gap-5 md:gap-7"
          aria-label="Primary Navigation"
        >
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(pathname, item.href, activeSection);
            const targetHref = isLandingPage ? `#${item.sectionId}` : `/#${item.sectionId}`;

            return (
              <a
                key={item.label}
                href={targetHref}
                onClick={(e) => handleNavClick(e, item)}
                className={`text-xs font-mono tracking-wider uppercase transition-colors relative py-1 ${
                  active ? "text-white font-bold" : "text-white/60 hover:text-white"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ef302d] rounded-full" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/track"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Track a package"
            title="Track a package"
          >
            <Search className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="scm-button px-3.5 py-1.5 rounded-full bg-white text-[#172126] text-xs font-bold hover:bg-slate-200 transition-colors inline-flex items-center gap-1 shadow-sm"
          >
            <span>Sign up</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors ml-1"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-white/15 px-4 py-3 bg-[#081216]/95 backdrop-blur-xl rounded-b-3xl flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(pathname, item.href, activeSection);
            const targetHref = isLandingPage ? `#${item.sectionId}` : `/#${item.sectionId}`;

            return (
              <a
                key={item.label}
                href={targetHref}
                onClick={(e) => handleNavClick(e, item)}
                className={`px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                  active ? "bg-white/15 text-white font-bold" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </a>
            );
          })}
          <div className="pt-2 mt-1 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <Link
              href="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white/70 hover:text-white flex items-center gap-1 py-1"
            >
              <Search className="w-3 h-3" /> Track Package
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="scm-button px-3 py-1 rounded-full bg-white text-[#172126] font-bold text-xs"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
