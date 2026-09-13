"use client";

import { useState, useEffect, FormEvent } from "react";

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface ScanGateFormProps {
  scanDomain: string;
  scanScore?: number;
  failedCount: number;
  scanStatus?: "success" | "blocked" | "unreachable";
  onUnlock: (unlockedFindings: any[]) => void;
}

export default function ScanGateForm({
  scanDomain,
  scanScore,
  failedCount,
  scanStatus = "success",
  onUnlock,
}: ScanGateFormProps) {
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

    const eventId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Fire Meta Pixel Lead event with value: 297 USD
    if (typeof window !== "undefined" && window.fbq) {
      try {
        const testCode =
          queryParams.test_event_code || (process.env.NEXT_PUBLIC_META_TEST_EVENT_CODE as string);
        const pixelOptions = {
          eventID: eventId,
          ...(testCode ? { test_event_code: testCode } : {}),
        };

        window.fbq(
          "track",
          "Lead",
          {
            content_name: "AgentReady MedSpa Free Scan",
            value: 297,
            currency: "USD",
          },
          pixelOptions
        );
      } catch (pxErr) {
        console.error("Meta Pixel tracking error:", pxErr);
      }
    }

    try {
      // Save lead in Supabase via API route and fetch unlocked findings
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
          stage: scanStatus === "blocked" ? "blocked_scan" : "scanned",
          scanOnly: true,
        }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok || !resData.leadCaptured) {
        console.error("[CRITICAL] Scan gate lead capture failed:", resData);
      }

      setLoading(false);
      onUnlock(resData.unlockedFindings || []);
    } catch (err: any) {
      console.error("[CRITICAL] Scan gate network exception:", err);
      setLoading(false);
      // Unlock anyway so user experience does not freeze
      onUnlock([]);
    }
  };

  // Determine dynamic copy based on scan status and failedCount
  let heading = "";
  let body = "";
  let buttonText = "";
  let microcopy = "🔒 Private & secure · No spam · Instant results";

  if (scanStatus === "blocked") {
    heading = `Request a Verified Manual Crawl for ${scanDomain || "your clinic"}.`;
    body = `Your firewall (Cloudflare, Wordfence, or WAF) blocks surface crawlers. That often means AI assistants like ChatGPT, Perplexity, and Claude are also being blocked from reading your clinic's business facts.`;
    buttonText = "Request verified manual crawl →";
    microcopy = "🔒 Private & secure · Verified analysis · No spam";
  } else if (scanStatus === "unreachable") {
    heading = `Verify connection to ${scanDomain || "your domain"}.`;
    body = `We were unable to establish a connection to this domain. Enter your work email to have our crawler retry and generate a diagnostic report.`;
    buttonText = "Send me connection diagnostic →";
  } else if (failedCount === 0) {
    heading = `${scanDomain || "Your practice"} passed all 6 surface checks.`;
    body = `Your surface data is machine-readable. Download your verified summary report and see how to maintain your visibility across ongoing AI model updates.`;
    buttonText = "Send me the verification report →";
  } else if (failedCount === 1) {
    heading = `1 gap is hiding ${scanDomain || "your practice"} from AI assistants.`;
    body = `Your score is above. The full report names the gap, shows what ChatGPT currently returns for your practice instead, and gives you the fix in order of impact.`;
    buttonText = "Send me the 1 fix →";
  } else {
    heading = `${failedCount} gaps are hiding ${scanDomain || "your practice"} from AI assistants.`;
    body = `Your score is above. The full report names each gap, shows what ChatGPT currently returns for your practice instead, and gives you the fixes in order of impact.`;
    buttonText = `Send me the ${failedCount} fixes →`;
  }

  return (
    <div className="flex flex-col gap-3.5 bg-[#FAFAF7] rounded-xl p-4 sm:p-5 border border-[#EDEFEA] animate-in fade-in duration-300">
      <div className="flex flex-col gap-1.5">
        <h3 className="font-bold text-[#191C1A] text-[15.5px] sm:text-[16px] leading-[1.35] tracking-tight">
          {heading}
        </h3>
        <p className="text-[13px] sm:text-[13.5px] text-[#5A6058] leading-[1.5]">
          {body}
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
          style={{ fontSize: "16px" }} // Prevents iOS Safari auto-zoom
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
            buttonText
          )}
        </button>

        {error && (
          <p role="alert" className="text-[12px] text-[#B3261E] font-mono">
            {error}
          </p>
        )}
      </form>

      <div className="text-[11px] text-[#8A8F87] text-center font-mono">
        {microcopy}
      </div>
    </div>
  );
}
