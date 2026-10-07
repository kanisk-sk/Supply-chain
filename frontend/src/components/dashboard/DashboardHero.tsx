"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import styles from "./dashboard.module.css";
import { focusNavigationSearch } from "@/components/common/navigation-search";

interface DashboardHeroProps {
  title: string;
  subtitle?: string;
  loading: boolean;
  onRefresh: () => void;
}

export default function DashboardHero({ title, subtitle = "Stock levels, open orders, shipments and alerts across your warehouses.", loading, onRefresh }: DashboardHeroProps) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 30000);
      return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        focusNavigationSearch();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <header className={styles.toolbar}>
      <div>
        <p className={styles.eyebrow}>Supply chain control · {title}</p>
        <h1 className={styles.title}>Everything in motion.<br /><span className={styles.heroSecondary}>Right where it should be.</span></h1>
        <p className={styles.heroDescription}>{subtitle}</p>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={focusNavigationSearch} className={styles.button} aria-keyshortcuts="Meta+K Control+K"><Search size={13} aria-hidden="true" />Find page <kbd className="text-[10px] text-slate-500">⌘K</kbd></button>
        {now && <time className={styles.mono} dateTime={now.toISOString()}>{new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(now)} IST</time>}
        <button type="button" onClick={onRefresh} disabled={loading} className={styles.button}>
          <RefreshCw size={13} aria-hidden="true" /> {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </header>
  );
}
