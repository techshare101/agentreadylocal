"use client";

import { useState, useEffect, FormEvent } from "react";

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface GateFormProps {
  buttonText?: string;
  className?: string;
  onSuccess?: () => void;
}

export default function GateForm({
  buttonText = "Run My Verified Audit — $297",
  className = "",
  onSuccess,
}: GateFormProps) {
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

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError("That address is missing an @ or a domain.");
      return;
    }

    setError("");
    setLoading(true);

    // eventID must match the server-side event_id for Meta deduplication
    const eventId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Fire Meta Pixel browser events
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
          { content_name: "AgentReady MedSpa", value: 297, currency: "USD" },
          pixelOptions
        );
        window.fbq(
          "track",
          "InitiateCheckout",
          { content_name: "AgentReady MedSpa", value: 297, currency: "USD" },
          testCode ? { test_event_code: testCode } : undefined
        );
      } catch (pxErr) {
        console.error("Meta Pixel tracking error:", pxErr);
      }
    }

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          eventId,
          fbclid: queryParams.fbclid,
          utm_campaign: queryParams.utm_campaign,
          utm_content: queryParams.utm_content,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize checkout session.");
      }

      if (onSuccess) onSuccess();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned.");
      }
    } catch (err: any) {
      setError(
        (err.message || "An unexpected error occurred.") +
          " Reload and try again — your email was saved."
      );
      setLoading(false);
    }
  };

  return (
    <form id="gate" noValidate onSubmit={handleSubmit} className={`flex flex-col gap-3 w-full ${className}`}>
      <div className="flex flex-col gap-1">
        <label className="sr-only" htmlFor="gate-email">
          Work email
        </label>
        <input
          id="gate-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@yourmedspa.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          style={{ fontSize: "16px" }} // Mobile-first sizing: strictly >= 16px to prevent iOS Safari auto-zoom
          className="w-full px-4 py-3 rounded-lg border border-[#D4D8D2] bg-white font-sans text-[16px] text-[#191C1A] outline-none focus:border-[oklch(0.48_0.10_160)] focus:ring-2 focus:ring-[oklch(0.48_0.10_160)]/20 transition-all placeholder:text-[#8A8F87]"
        />
      </div>

      <button
        type="submit"
        id="go"
        disabled={loading}
        className="w-full py-3.5 px-4 rounded-lg bg-[oklch(0.48_0.10_160)] text-white text-[15px] font-semibold hover:bg-[oklch(0.42_0.10_160)] transition-all shadow-md active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
            Opening secure checkout…
          </>
        ) : (
          buttonText
        )}
      </button>

      {error && (
        <p id="err" role="alert" className="text-[13px] text-[#B3261E] bg-[#FDF2F2] border border-[#F8B4B4] rounded-lg px-3 py-2 font-mono">
          {error}
        </p>
      )}
    </form>
  );
}
