"use client";

import { useState, useEffect, FormEvent } from "react";

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface ScanGateFormProps {
  scanDomain: string;
  scanScore?: number;
  onUnlock: () => void;
}

export default function ScanGateForm({ scanDomain, scanScore, onUnlock }: ScanGateFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [queryParams, setQueryParams] = useState<{
    fbclid?: string | null;
    utm_campaign?: string | null;
    utm_content?: string | null;
    test_event_code?: string | null;
  }>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const qs = new URLSearchParams(window.location.search);
      setQueryParams({
        fbclid: qs.get("fbclid"),
        utm_campaign: qs.get("utm_campaign"),
        utm_content: qs.get("utm_content"),
        test_event_code: qs.get("test_event_code"),
      });
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your work email.");
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError("That address is missing an @ or a domain.");
      return;
    }

    setError("");
    setLoading(true);

    const eventId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Fire Meta Pixel Lead event
    if (typeof window !== "undefined" && window.fbq) {
      try {
        const testCode = queryParams.test_event_code || (process.env.NEXT_PUBLIC_META_TEST_EVENT_CODE as string);
        const pixelOptions = {
          eventID: eventId,
          ...(testCode ? { test_event_code: testCode } : {}),
        };

        window.fbq(
          "track",
          "Lead",
          { content_name: "AgentReady MedSpa Free Scan", value: 0, currency: "USD" },
          pixelOptions
        );
      } catch (pxErr) {
        console.error("Meta Pixel tracking error:", pxErr);
      }
    }

    try {
      // Save lead in Supabase via API route
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          eventId,
          product: "agentready",
          fbclid: queryParams.fbclid,
          utm_campaign: queryParams.utm_campaign,
          utm_content: queryParams.utm_content,
          scanned_domain: scanDomain,
          scan_score: scanScore,
          stage: "scanned",
          scanOnly: true, // Lead captured via scan unlock
        }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok || !resData.leadCaptured) {
        console.error("[CRITICAL] Scan gate lead capture failed:", resData);
      }

      setLoading(false);
      onUnlock();
    } catch (err: any) {
      console.error("[CRITICAL] Scan gate network exception:", err);
      setLoading(false);
      // Unlock anyway so user experience is smooth even if network fails
      onUnlock();
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-[#FAFAF7] rounded-xl p-4 sm:p-5 border border-[#EDEFEA] animate-in fade-in duration-300">
      <div className="flex flex-col gap-1">
        <div className="font-bold text-[#191C1A] text-[14.5px] flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.48_0.10_160)] animate-pulse"></span>
          Scan complete for <span className="font-mono text-[oklch(0.48_0.10_160)]">{scanDomain || "yourmedspa.com"}</span>
        </div>
        <p className="text-[13px] text-[#5A6058] leading-[1.5]">
          Enter your work email to reveal your practice&apos;s AI-readiness score and critical gap report.
        </p>
      </div>

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@yourmedspa.com"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          disabled={loading}
          style={{ fontSize: "16px" }} // iOS Safari auto-zoom prevention: strictly >= 16px
          className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4D8D2] bg-white font-sans text-[16px] text-[#191C1A] outline-none focus:border-[oklch(0.48_0.10_160)] focus:ring-2 focus:ring-[oklch(0.48_0.10_160)]/20 transition-all placeholder:text-[#8A8F87]"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-lg bg-[oklch(0.48_0.10_160)] text-white text-[14px] font-semibold hover:bg-[oklch(0.42_0.10_160)] transition-all shadow-sm active:scale-[0.99] disabled:opacity-75 cursor-pointer flex items-center justify-center gap-2 font-sans"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              Unlocking report…
            </>
          ) : (
            "Unlock my scan results →"
          )}
        </button>

        {error && (
          <p role="alert" className="text-[12px] text-[#B3261E] font-mono">
            {error}
          </p>
        )}
      </form>

      <div className="text-[11px] text-[#8A8F87] text-center font-mono">
        🔒 Private &amp; secure · No spam · Instant results
      </div>
    </div>
  );
}
