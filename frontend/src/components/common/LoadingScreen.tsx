"use client";

import { useEffect, useRef } from "react";
import { createTimeline, scrambleText, stagger } from "animejs";
import { useRouter } from "next/navigation";

const INTRO_LINES = [
  "INTRODUCING",
  "THE NEW",
  "ADVANCED",
  "SUPPLY CHAIN",
  "MANAGEMENT SYSTEM",
];

interface LoadingScreenProps {
  destination?: string;
  onComplete?: () => void;
}

export default function LoadingScreen({ destination = "/landing", onComplete }: LoadingScreenProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;

    let cancelled = false;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      if (cancelled) return;
      if (onComplete) {
        onComplete();
      } else {
        router.replace(destination);
      }
    };

    if (reducedMotion) {
      const timeoutId = window.setTimeout(finish, 450);
      return () => {
        cancelled = true;
        window.clearTimeout(timeoutId);
      };
    }

    const timeline = createTimeline({
      defaults: {
        ease: "out(4)",
      },
      onComplete: finish,
    });

    timeline
      .add(screen, {
        opacity: { from: 0, to: 1, duration: 500, ease: "linear" },
        backgroundColor: { from: "#d8c9b4", to: "#20241f", duration: 1400, ease: "inOut(3)" },
      })
      .add(".loading-kicker-char", {
        opacity: { from: 0, to: 1, duration: 500 },
        translateY: { from: "0.8em", to: 0, duration: 850, ease: "out(4)" },
      }, stagger(42, { start: 100 }))
    INTRO_LINES.forEach((line, index) => {
      timeline.add(`.loading-line-${index}`, {
        opacity: { from: 0, to: 1, duration: 300 },
        scale: { from: 0.92, to: 1, duration: 700, ease: "out(3)" },
        innerHTML: scrambleText({
          text: line,
          override: " ",
          from: "center",
          duration: 620,
          revealDelay: 100,
          cursor: "░▒",
          perturbation: 0.18,
        }),
      }, index * 720);
    });

    timeline
      .add(".loading-line", {
        color: { from: "#e8dfd2", to: "#f0b35a", duration: 520 },
        translateY: { from: "0.2em", to: 0, duration: 600 },
      }, stagger(145, { from: "first", start: "-=360" }))
      .add(".loading-line", {
        opacity: { to: 0, duration: 420, ease: "in(3)" },
        translateY: { to: "-0.4em", duration: 520, ease: "in(3)" },
      }, stagger(95, { from: "last", start: "+=520" }))
      .add(screen, {
        backgroundColor: { to: "#f0b35a", duration: 650, ease: "inOut(3)" },
        opacity: { to: 0, duration: 650, ease: "in(3)" },
      }, "+=650");

    timeline.init();

    return () => {
      cancelled = true;
      timeline.pause();
    };
  }, [destination, onComplete, router]);

  return (
    <main ref={screenRef} className="loading-screen" aria-label="Loading supply chain management system">
      <div className="loading-frame">
        <p className="loading-kicker" aria-hidden="true">
          {"SUPPLY CHAIN / 01".split("").map((character, index) => (
            <span className="loading-kicker-char" key={`${character}-${index}`}>
              {character === " " ? "\u00a0" : character}
            </span>
          ))}
        </p>
        <div className="loading-lines" aria-live="polite">
          {INTRO_LINES.map((line, index) => (
            <p className={`loading-line loading-line-${index}`} data-text={line} key={line} />
          ))}
        </div>
        <span className="loading-index" aria-hidden="true">NETWORK INITIALIZING</span>
      </div>
    </main>
  );
}
