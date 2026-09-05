"use client";

import { useEffect } from "react";
import { initFunnelTracking } from "@/lib/track";

export default function FunnelTracker() {
  useEffect(() => {
    const cleanup = initFunnelTracking();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return null;
}
