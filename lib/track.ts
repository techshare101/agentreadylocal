"use client";

const MARKS = [25, 50, 75, 100];

export function initFunnelTracking() {
  if (typeof window === "undefined") return;

  const seen = new Set<number>();

  // --- Scroll Depth Listener ---
  const handleScroll = () => {
    const docElem = document.documentElement;
    const scrollTotal = docElem.scrollHeight - docElem.clientHeight;
    if (scrollTotal <= 0) return;

    const pct = Math.round((window.scrollY / scrollTotal) * 100);

    for (const m of MARKS) {
      if (pct >= m && !seen.has(m)) {
        seen.add(m);
        if (window.fbq) {
          window.fbq("trackCustom", "ScrollDepth", { depth: m });
        }
      }
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });

  // --- Time on Page Telemetry ---
  const t0 = performance.now();

  const handlePageHide = () => {
    const ms = Math.round(performance.now() - t0);
    const depth = seen.size ? Math.max(...Array.from(seen)) : 0;
    const payload = JSON.stringify({
      path: window.location.pathname,
      ms,
      depth,
      product: 'agentready',
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/timing", payload);
    } else {
      fetch("/api/timing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  };

  window.addEventListener("pagehide", handlePageHide);

  return () => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("pagehide", handlePageHide);
  };
}
