"use client";

import { PointerEvent, ReactNode, useRef } from "react";

interface TiltProps {
  children: ReactNode;
  rotationFactor?: number;
  isRevese?: boolean;
}

export function Tilt({ children, rotationFactor = 8, isRevese = false }: TiltProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const updateTransform = (rotateX: number, rotateY: number) => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      if (frameRef.current) {
        frameRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
    });
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !frameRef.current) return;

    const bounds = frameRef.current.getBoundingClientRect();
    const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
    const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;
    const direction = isRevese ? -1 : 1;

    updateTransform(
      vertical * -rotationFactor * direction,
      horizontal * rotationFactor * direction,
    );
  };

  const handlePointerLeave = () => {
    updateTransform(0, 0);
  };

  return (
    <div
      ref={frameRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ transformStyle: "preserve-3d", transition: "transform 180ms ease-out" }}
    >
      {children}
    </div>
  );
}
