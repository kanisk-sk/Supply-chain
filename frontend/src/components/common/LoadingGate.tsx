"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import LoadingScreen from "@/components/common/LoadingScreen";

export default function LoadingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const handleComplete = useCallback(() => setIsLoading(false), []);

  const shouldShowLoading = pathname === "/" || pathname === "/login";

  if (shouldShowLoading && isLoading) {
    return (
      <LoadingScreen
        onComplete={handleComplete}
      />
    );
  }

  return children;
}