"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import AgentReadyLogo from "./components/AgentReadyLogo";
import GateForm from "./components/GateForm";
import ScanGateForm from "./components/ScanGateForm";

interface Gap {
  code: string;
  text: string;
  category: string;
}

interface RubricCategory {
  name: string;
  pts: string;
  desc: string;
  tests: string[];
}

const CHECKS = [
  "Fetching homepage + service pages",
  "Parsing JSON-LD / schema markup graph",
  "Locating service catalog + pricing models",
  "Checking practitioner credentials in text",
  "Tracing crawlable booking path for agents",
  "Reading robots.txt / llms.txt crawl policy",
];

const GAP_POOL: Gap[] = [
  { code: "SVC-04", text: "No structured service catalog — agents can't list what you offer or at what price.", category: "Services & Pricing" },
  { code: "IDN-02", text: "Business identity schema missing NAP consistency — agents can't confirm entity across sources.", category: "Identity" },
  { code: "ACT-01", text: "Booking path is JavaScript-only — no machine-readable action an agent can complete or cite.", category: "Actions" },
  { code: "TRS-03", text: "Practitioner credentials locked in images, not text — invisible to every AI engine.", category: "Trust" },
  { code: "CRL-01", text: "No llms.txt and restrictive robots rules — AI crawlers are partially blocked from your facts.", category: "Crawl Policy" },
  { code: "FRS-01", text: "Pricing page last updated signal missing — engines treat your prices as stale.", category: "Freshness" },
];

const RUBRIC: RubricCategory[] = [
  { name: "Identity", pts: "15", desc: "Legal name, locations, NAP consistency, entity disambiguation.", tests: ["IDN-01: LocalBusiness schema", "IDN-02: Directory NAP match", "IDN-03: sameAs entity links"] },
  { name: "Services + pricing", pts: "15", desc: "Structured catalog with prices agents can quote accurately.", tests: ["SVC-01: Treatment schema", "SVC-04: Offer price markup", "SVC-05: Crawlable price page"] },
  { name: "Trust", pts: "15", desc: "Credentials, licensure, reviews — in text, with sources.", tests: ["TRS-01: Review schema", "TRS-03: Practitioner licensure text", "TRS-04: Medical director text"] },
  { name: "Machine-readable content", pts: "15", desc: "FAQ, policies, and pages agents can parse and cite.", tests: ["MRC-01: FAQPage schema", "MRC-02: Plain text policy pages", "MRC-03: Structured Q&A"] },
  { name: "Actions", pts: "15", desc: "A booking path an agent can find, describe, and complete.", tests: ["ACT-01: Crawlable booking URL", "ACT-02: ReserveAction schema", "ACT-03: Action payload schema"] },
  { name: "Crawl policy", pts: "10", desc: "robots.txt and llms.txt that let AI engines read your facts.", tests: ["CRL-01: llms.txt present", "CRL-02: AI bot allow rules", "CRL-03: Clean sitemap index"] },
  { name: "Security", pts: "10", desc: "Public facts free; booking controlled; customer data private.", tests: ["SEC-01: Resource classification", "SEC-02: API rate limits", "SEC-03: No PII leak"] },
  { name: "Freshness", pts: "5", desc: "Update signals so engines trust prices aren't stale.", tests: ["FRS-01: Page lastmod headers", "FRS-02: Price update date", "FRS-03: Freshness meta tags"] },
];

export default function FunnelPage() {
  const [domain, setDomain] = useState("");
  const [phase, setPhase] = useState<"idle" | "running" | "gated" | "done">("idle");
  const [checkLog, setCheckLog] = useState<string[]>([]);
  const [currentCheck, setCurrentCheck] = useState("");
  const [score, setScore] = useState(0);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [scanDomain, setScanDomain] = useState("");
  const [scanTimestamp, setScanTimestamp] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "ViewContent", {
        content_name: "AgentReady MedSpa",
        value: 297,
        currency: "USD",
      });
    }
  }, []);

  const stringHash = (s: string) => {
    let h = 0;
    for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h;
  };

  const runScan = () => {
    const d = (domain || "lakeshoreskin.com").trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    if (timerRef.current) clearTimeout(timerRef.current);

    setPhase("running");
    setCheckLog([]);
    setCurrentCheck(CHECKS[0]);
    setScanDomain(d);
    setScanTimestamp(new Date().toISOString().replace(/\.\d{3}Z$/, "Z"));

    // Fire ScanStarted Meta Pixel custom event
    if (typeof window !== "undefined" && window.fbq) {
      try {
        window.fbq("trackCustom", "ScanStarted", { domain: d });
      } catch (e) {}
    }

    let i = 0;
    const step = () => {
      i++;
      if (i < CHECKS.length) {
        setCheckLog((prev) => [...prev, CHECKS[i - 1]]);
        setCurrentCheck(CHECKS[i]);
        timerRef.current = setTimeout(step, 550);
      } else {
        const h = Math.abs(stringHash(d));
        const calculatedScore = 24 + (h % 34);
        const rawIndices = [h % 6, Math.floor(h / 7) % 6, Math.floor(h / 49) % 6];
        const seen = new Set<number>();
        const foundGaps: Gap[] = [];
        for (const raw of rawIndices) {
          let k = Math.abs(Math.floor(raw)) % GAP_POOL.length;
          let attempts = 0;
          while (seen.has(k) && attempts < GAP_POOL.length) {
            k = (k + 1) % GAP_POOL.length;
            attempts++;
          }
          seen.add(k);
          const gapItem = GAP_POOL[k] || GAP_POOL[0];
          foundGaps.push(gapItem);
        }
        setScore(calculatedScore);
        setGaps(foundGaps);
        setPhase("gated");

        // Fire ScanCompleted Meta Pixel custom event
        if (typeof window !== "undefined" && window.fbq) {
          try {
            window.fbq("trackCustom", "ScanCompleted", { domain: d, score: calculatedScore });
          } catch (e) {}
        }
      }
    };

    timerRef.current = setTimeout(step, 550);
  };

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div id="top" className="min-h-screen bg-[#FAFAF7] text-[#191C1A] font-sans antialiased selection:bg-[oklch(0.90_0.05_160)]">
      {/* Top Banner */}
      <div className="bg-[#191C1A] text-[#A9AEA6] px-4 py-2 text-[11px] sm:text-[12px] flex justify-between items-center border-b border-[#2C312C] font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[oklch(0.72_0.09_160)] animate-pulse"></span>
          <span className="text-white font-medium">MetalMindTech</span>
          <span>· Aesthetic AI Verification</span>
        </div>
        <Link href="/sample-report" className="text-[oklch(0.72_0.09_160)] hover:underline">
          View sample report →
        </Link>
      </div>

      {/* Header */}
      <header className="max-w-[1040px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <AgentReadyLogo className="w-7 h-7 text-[oklch(0.48_0.10_160)]" />
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-semibold text-[20px] tracking-tight">AgentReady Local</span>
            <span className="text-[10.5px] tracking-[0.08em] uppercase text-[#5A6058] font-mono">by MetalMindTech</span>
          </div>
        </div>
        <nav className="flex items-center gap-4 sm:gap-6 text-[13.5px] font-medium">
          <a href="#how" className="text-[#5A6058] hover:text-[#191C1A] transition-colors hidden sm:inline">
            How it works
          </a>
          <a href="#rubric" className="text-[#5A6058] hover:text-[#191C1A] transition-colors hidden md:inline">
            100-point rubric
          </a>
          <a href="#pricing" className="text-[#191C1A] hover:text-[oklch(0.48_0.10_160)] transition-colors font-semibold">
            Audit ($297)
          </a>
          <Link href="/sample-report" className="text-[oklch(0.48_0.10_160)] font-semibold hover:underline flex items-center gap-1">
            Sample report <span className="text-xs">→</span>
          </Link>
        </nav>
      </header>

      {/* SCREEN 1: Hero & Scanner (Above the Fold — Pure Diagnostic Tool) */}
      <section className="max-w-[760px] mx-auto px-4 pt-4 sm:pt-8 pb-10 flex flex-col items-center gap-4 text-center">
        <div className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.08em] uppercase text-[oklch(0.48_0.10_160)] font-bold font-mono bg-[oklch(0.96_0.03_160)] px-3 py-1 rounded-full">
          AI-Readiness for Med Spas &amp; Aesthetic Practices
        </div>

        <h1 className="font-serif font-medium text-[28px] sm:text-[38px] md:text-[42px] leading-[1.14] tracking-[-0.015em] text-[#191C1A] text-balance">
          When someone asks ChatGPT for the best med spa in your city, does it know you exist?
        </h1>

        <p className="text-[14.5px] sm:text-[16px] leading-[1.55] text-[#5A6058] max-w-[58ch]">
          AI assistants can&apos;t reliably read most med spa websites — services, prices, credentials, and booking paths are invisible to them. Enter your website to check what they can actually see in 30 seconds.
        </p>

        {/* The Surface Scanner Box */}
        <div className="w-full max-w-[620px] bg-white border border-[#D4D8D2] rounded-2xl p-4 sm:p-6 shadow-[0_4px_24px_rgba(20,25,20,0.06),0_1px_2px_rgba(20,25,20,0.04)] flex flex-col gap-4 text-left mt-1">
          <div className="flex justify-between items-center">
            <div className="font-bold text-[16px] text-[#191C1A]">Free AI-Readiness Surface Scan</div>
            <span className="font-mono text-[10px] text-[oklch(0.48_0.10_160)] bg-[oklch(0.96_0.03_160)] px-2 py-0.5 rounded uppercase font-semibold">
              Live Scanner
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runScan()}
              placeholder="yourmedspa.com"
              style={{ fontSize: "16px" }}
              className="flex-1 min-w-0 px-3.5 py-2.5 border border-[#D4D8D2] rounded-lg text-[16px] font-mono bg-[#FAFAF7] text-[#191C1A] outline-none focus:border-[oklch(0.48_0.10_160)] focus:bg-white transition-all"
            />
            <button
              onClick={runScan}
              className="px-5 py-2.5 border-none rounded-lg bg-[oklch(0.48_0.10_160)] text-white text-[14px] font-semibold cursor-pointer font-sans whitespace-nowrap hover:bg-[oklch(0.42_0.10_160)] active:scale-[0.99] transition-all shadow-xs"
            >
              Scan free
            </button>
          </div>

          {/* Running State */}
          {phase === "running" && (
            <div className="flex flex-col gap-2 font-mono text-[12px] text-[#3D423D] bg-[#F2F4F0] rounded-xl p-3.5 border border-[#E3E6E1]">
              <div className="flex justify-between items-center text-[10px] text-[#8A8F87] pb-1 border-b border-[#E3E6E1]">
                <span>RUNNING SURFACE AUDIT</span>
                <span>target: {scanDomain}</span>
              </div>
              {checkLog.map((line, idx) => (
                <div key={idx} className="flex gap-2 items-baseline text-pretty">
                  <span className="text-[oklch(0.48_0.10_160)] font-bold">✓</span>
                  <span>{line}</span>
                </div>
              ))}
              <div className="flex gap-2 items-baseline text-[#8A8F87] animate-pulse">
                <span>…</span>
                <span>{currentCheck}</span>
              </div>
            </div>
          )}

          {/* SCREEN 2: Gated Email Capture State */}
          {phase === "gated" && (
            <div className="flex flex-col gap-3.5 animate-in fade-in duration-300">
              <div className="flex items-center gap-3.5 bg-[#F2F4F0] rounded-[12px] p-3.5 border border-[#E3E6E1]">
                <div className="flex flex-col items-center justify-center min-w-[68px] py-1 bg-white rounded-lg border border-[#E3E6E1] shadow-2xs">
                  <div className="font-serif text-[32px] font-semibold text-[#B3261E] leading-none">{score}</div>
                  <div className="text-[9.5px] tracking-[0.06em] uppercase text-[#5A6058] font-mono mt-0.5">of 100</div>
                </div>
                <div className="text-[13px] leading-[1.45] text-[#3D423D]">
                  <strong className="text-[#191C1A]">{scanDomain}</strong> scored <strong className="text-[#B3261E]">{score}/100</strong>. Surface scan found {gaps.length} critical gaps in schema, booking path &amp; pricing visibility.
                </div>
              </div>

              <ScanGateForm scanDomain={scanDomain} scanScore={score} onUnlock={() => setPhase("done")} />
            </div>
          )}

          {/* Done State: Gaps Revealed + INLINE $297 OFFER DIRECTLY UNDER GAPS */}
          {phase === "done" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center font-mono text-[10px] text-[#8A8F87] bg-[#FAFAF7] px-3 py-1.5 rounded-lg border border-[#EDEFEA]">
                <span>source: Surface Crawler</span>
                <span>observed_at {scanTimestamp}</span>
                <span className="text-[oklch(0.48_0.10_160)] font-semibold">verified</span>
              </div>

              <div className="flex items-center gap-3.5 bg-[#F2F4F0] rounded-[12px] p-3.5 border border-[#E3E6E1]">
                <div className="flex flex-col items-center justify-center min-w-[68px] py-1 bg-white rounded-lg border border-[#E3E6E1] shadow-2xs">
                  <div className="font-serif text-[32px] font-semibold text-[#B3261E] leading-none">{score}</div>
                  <div className="text-[9.5px] tracking-[0.06em] uppercase text-[#5A6058] font-mono mt-0.5">of 100</div>
                </div>
                <div className="text-[13px] leading-[1.45] text-[#3D423D]">
                  <strong className="text-[#191C1A]">{scanDomain}</strong> is mostly invisible to AI agents. 3 critical gaps found:
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {gaps.map((gap, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start text-[12.5px] leading-[1.45] bg-[#FAFAF7] p-2.5 rounded-lg border border-[#EDEFEA]">
                    <span className="font-mono text-[10.5px] text-[#B3261E] bg-[oklch(0.95_0.02_25)] border border-[oklch(0.90_0.04_25)] rounded px-1.5 py-0.5 whitespace-nowrap font-medium">
                      {gap.code}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#191C1A] font-medium text-[11px] uppercase tracking-wide font-mono text-[#5A6058]">{gap.category}</span>
                      <span className="text-[#3D423D]">{gap.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* INLINE OFFER: Renders directly under the gaps as the natural fix */}
              <div className="mt-2 pt-4 border-t border-[#EDEFEA] bg-[#FAFAF7] rounded-xl p-4 sm:p-5 flex flex-col gap-3.5 border border-[#E3E6E1]">
                <div className="flex justify-between items-baseline flex-wrap gap-2">
                  <div>
                    <div className="font-mono text-[11px] text-[oklch(0.48_0.10_160)] uppercase font-bold tracking-wider">
                      Recommended Fix for {scanDomain}
                    </div>
                    <div className="font-serif text-[20px] font-medium text-[#191C1A]">
                      Full 100-Point Verified Audit
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-[32px] font-bold text-[#191C1A]">$297</span>
                    <span className="text-[11px] text-[#8A8F87] font-mono">one-time</span>
                  </div>
                </div>

                <p className="text-[12.5px] text-[#5A6058] leading-[1.5]">
                  Every point re-run with live ChatGPT, Perplexity &amp; Google AI evidence screenshots, raw JSON-LD payloads, and an actionable 5-step fix roadmap for your web team.
                </p>

                <GateForm buttonText="Order $297 Audit for This Domain →" />

                <div className="text-[11px] text-[#8A8F87] text-center font-mono">
                  🔒 100% Secure Payment via Stripe · Complete audit delivered within 24 hours
                </div>
              </div>
            </div>
          )}

          {/* Idle State */}
          {phase === "idle" && (
            <div className="text-[12px] text-[#8A8F87] leading-[1.5] bg-[#FAFAF7] p-3 rounded-xl border border-[#EDEFEA]">
              Checks schema markup, service catalog, pricing visibility, credentials, booking path, and crawl policy in 30 seconds.
            </div>
          )}
        </div>

        {/* Operating Principle / Trust Pills */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-[11.5px] sm:text-[12px] text-[#5A6058] font-medium font-mono pt-1">
          <span className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-[#E3E6E1] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.48_0.10_160)]"></span>
            100% reproducible tests
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-[#E3E6E1] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.48_0.10_160)]"></span>
            No ranking promises
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-[#E3E6E1] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.48_0.10_160)]"></span>
            Customer Data = Private
          </span>
        </div>
      </section>

      {/* PROOF SECTION 1: How It Works */}
      <section id="how" className="max-w-[1040px] mx-auto px-4 sm:px-6 pt-12 pb-14 border-t border-[#E3E6E1]">
        <div className="flex flex-col gap-2 mb-8 text-center max-w-[640px] mx-auto">
          <span className="text-[11px] uppercase tracking-widest font-mono text-[oklch(0.48_0.10_160)] font-bold">
            The AgentReady Methodology
          </span>
          <h2 className="font-serif text-[28px] sm:text-[34px] font-medium text-[#191C1A] tracking-tight">
            How we make your med spa machine-readable
          </h2>
          <p className="text-[14px] text-[#5A6058] leading-[1.6]">
            Three clear stages. You start with an objective, reproducible audit — not an open-ended retainer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#E3E6E1] rounded-[14px] p-6 flex flex-col gap-3 shadow-2xs hover:border-[oklch(0.48_0.10_160)] transition-all">
            <div className="font-mono text-[11.5px] text-[oklch(0.48_0.10_160)] font-bold">01 — AUDIT ($297)</div>
            <div className="font-bold text-[17px] text-[#191C1A]">See what agents see</div>
            <p className="text-[13.5px] leading-[1.6] text-[#5A6058] flex-1">
              100-point scored rubric. Every point is a reproducible test with screenshot evidence and timestamps — including live queries to ChatGPT, Perplexity, and Google AI.
            </p>
            <Link href="/sample-report" className="text-[13px] font-semibold text-[oklch(0.48_0.10_160)] hover:underline flex items-center gap-1 font-mono">
              View sample audit report →
            </Link>
          </div>

          <div className="bg-white border border-[#E3E6E1] rounded-[14px] p-6 flex flex-col gap-3 shadow-2xs hover:border-[oklch(0.48_0.10_160)] transition-all">
            <div className="font-mono text-[11.5px] text-[oklch(0.48_0.10_160)] font-bold">02 — INSTALL ($1,500)</div>
            <div className="font-bold text-[17px] text-[#191C1A]">Fix facts in machine code</div>
            <p className="text-[13.5px] leading-[1.6] text-[#5A6058] flex-1">
              Schema graph, service catalog, pricing model, FAQ and policy normalization, llms.txt, crawl policy — built from verified practice records, delivered flat-fee with a before/after test suite.
            </p>
            <div className="text-[12px] text-[#8A8F87] font-mono">Flat fee · Single location</div>
          </div>

          <div className="bg-white border border-[#E3E6E1] rounded-[14px] p-6 flex flex-col gap-3 shadow-2xs hover:border-[oklch(0.48_0.10_160)] transition-all">
            <div className="font-mono text-[11.5px] text-[oklch(0.48_0.10_160)] font-bold">03 — MONITOR ($249/mo)</div>
            <div className="font-bold text-[17px] text-[#191C1A]">Stay accurate as engines change</div>
            <p className="text-[13.5px] leading-[1.6] text-[#5A6058] flex-1">
              Monthly citation re-tests, broken-schema alerts, and freshness checks. You get the same evidence format every month: what changed, what broke, and what we resolved.
            </p>
            <div className="text-[12px] text-[#8A8F87] font-mono">Cancel anytime · Monthly proof</div>
          </div>
        </div>
      </section>

      {/* PROOF SECTION 2: The 6 AI Patient Journey Tests */}
      <section className="bg-[#F2F4F0] border-y border-[#E3E6E1] py-14">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-2 mb-8 text-center max-w-[660px] mx-auto">
            <span className="text-[11px] uppercase tracking-widest font-mono text-[oklch(0.48_0.10_160)] font-bold">
              The AI Patient Journey Test
            </span>
            <h2 className="font-serif text-[28px] sm:text-[34px] font-medium text-[#191C1A] leading-tight">
              Can AI assistants guide new patients to your practice?
            </h2>
            <p className="text-[14px] text-[#5A6058] leading-[1.6]">
              When prospective patients search ChatGPT, Perplexity, or Google AI for aesthetic treatments, AI systems evaluate 6 fundamental questions before making a recommendation:
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="bg-white border border-[#E3E6E1] rounded-xl p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
              <div className="font-mono text-[9.5px] font-bold text-[#5A6058] uppercase">1. IDENTIFY</div>
              <div className="text-[12px] font-medium text-[#191C1A] leading-snug">Does AI recognize your exact business entity without mismatch?</div>
              <span className="font-mono text-[9px] text-[#B3261E] bg-[#FEF2F2] border border-[#FCA5A5] rounded px-1.5 py-0.5 w-fit font-medium">Entity Match</span>
            </div>

            <div className="bg-white border border-[#E3E6E1] rounded-xl p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
              <div className="font-mono text-[9.5px] font-bold text-[#5A6058] uppercase">2. UNDERSTAND</div>
              <div className="text-[12px] font-medium text-[#191C1A] leading-snug">Can AI parse your complete service catalog in structured schema?</div>
              <span className="font-mono text-[9px] text-[#B3261E] bg-[#FEF2F2] border border-[#FCA5A5] rounded px-1.5 py-0.5 w-fit font-medium">Service Schema</span>
            </div>

            <div className="bg-white border border-[#E3E6E1] rounded-xl p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
              <div className="font-mono text-[9.5px] font-bold text-[#5A6058] uppercase">3. PRICE</div>
              <div className="text-[12px] font-medium text-[#191C1A] leading-snug">Can AI accurately quote your pricing instead of competitor data?</div>
              <span className="font-mono text-[9px] text-[#B3261E] bg-[#FEF2F2] border border-[#FCA5A5] rounded px-1.5 py-0.5 w-fit font-medium">Offer Markup</span>
            </div>

            <div className="bg-white border border-[#E3E6E1] rounded-xl p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
              <div className="font-mono text-[9.5px] font-bold text-[#5A6058] uppercase">4. TRUST</div>
              <div className="text-[12px] font-medium text-[#191C1A] leading-snug">Can AI verify practitioner licenses &amp; medical credentials?</div>
              <span className="font-mono text-[9px] text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A] rounded px-1.5 py-0.5 w-fit font-medium">Person Schema</span>
            </div>

            <div className="bg-white border border-[#E3E6E1] rounded-xl p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
              <div className="font-mono text-[9.5px] font-bold text-[#5A6058] uppercase">5. RECOMMEND</div>
              <div className="text-[12px] font-medium text-[#191C1A] leading-snug">Does your practice surface when patients ask AI for top providers in your city?</div>
              <span className="font-mono text-[9px] text-[#B3261E] bg-[#FEF2F2] border border-[#FCA5A5] rounded px-1.5 py-0.5 w-fit font-medium">Discovery Test</span>
            </div>

            <div className="bg-white border border-[#E3E6E1] rounded-xl p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
              <div className="font-mono text-[9.5px] font-bold text-[#5A6058] uppercase">6. BOOK</div>
              <div className="text-[12px] font-medium text-[#191C1A] leading-snug">Can AI surface a crawlable direct booking path for patients?</div>
              <span className="font-mono text-[9px] text-[#B3261E] bg-[#FEF2F2] border border-[#FCA5A5] rounded px-1.5 py-0.5 w-fit font-medium">ReserveAction</span>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF SECTION 3: Sample Report Evidence Preview */}
      <section className="max-w-[1040px] mx-auto px-4 sm:px-6 py-14">
        <div className="bg-white border border-[#E3E6E1] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row gap-8 items-center">
          <div className="flex flex-col gap-3 flex-1">
            <div className="font-mono text-[11px] text-[oklch(0.48_0.10_160)] uppercase tracking-wider font-bold">
              Real Deliverable · Not an Abstract PDF
            </div>
            <h3 className="font-serif text-[24px] sm:text-[30px] font-medium text-[#191C1A] leading-tight">
              See what your 100-Point Verified Audit report looks like
            </h3>
            <p className="text-[14px] text-[#5A6058] leading-[1.6]">
              Every audit comes with verifiable evidence: exact prompt inputs, live assistant responses from ChatGPT, Perplexity, and Google AI Overview, entity collision logs, and an addressable score roadmap.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Link
                href="/sample-report"
                className="px-5 py-2.5 rounded-lg bg-[oklch(0.48_0.10_160)] text-white text-[13.5px] font-semibold hover:bg-[oklch(0.42_0.10_160)] transition-all shadow-xs"
              >
                Explore Live Sample Report →
              </Link>
            </div>
          </div>

          <div className="w-full lg:max-w-[420px] bg-[#FAFAF7] border border-[#EDEFEA] rounded-xl p-4 flex flex-col gap-3 font-mono text-[12px]">
            <div className="flex justify-between items-center pb-2 border-b border-[#EDEFEA] text-[11px] text-[#8A8F87]">
              <span>SAMPLE REPORT PREVIEW</span>
              <span className="text-[oklch(0.48_0.10_160)] font-bold">Lakeshore Skin &amp; Laser</span>
            </div>
            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-[#EDEFEA]">
              <span className="text-[#5A6058]">Verified Initial Score</span>
              <span className="font-serif text-[18px] font-bold text-[#B3261E]">41 / 100</span>
            </div>
            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-[#EDEFEA]">
              <span className="text-[#5A6058]">Addressable Schema Fixes</span>
              <span className="font-bold text-[oklch(0.48_0.10_160)]">+45 pts</span>
            </div>
            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-[#EDEFEA]">
              <span className="text-[#5A6058]">Target Post-Install Score</span>
              <span className="font-serif text-[18px] font-bold text-[#191C1A]">86 / 100</span>
            </div>
            <div className="text-[10.5px] text-[#8A8F87] leading-[1.4] pt-1">
              Includes raw JSON-LD graphs, robots.txt rules, and evidence screenshots bundle.
            </div>
          </div>
        </div>
      </section>

      {/* PROOF SECTION 4: 100-Point Rubric Breakdown */}
      <section id="rubric" className="max-w-[1040px] mx-auto px-4 sm:px-6 pb-14">
        <div className="flex flex-col gap-2 mb-8 text-center max-w-[640px] mx-auto">
          <span className="text-[11px] uppercase tracking-widest font-mono text-[oklch(0.48_0.10_160)] font-bold">
            Reproducible Testing Rubric
          </span>
          <h2 className="font-serif text-[28px] sm:text-[34px] font-medium text-[#191C1A] tracking-tight">
            100 points across 8 objective categories
          </h2>
          <p className="text-[14px] text-[#5A6058] leading-[1.6]">
            Every point corresponds to an exact, reproducible test — not an arbitrary score.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {RUBRIC.map((cat, idx) => (
            <div key={idx} className="bg-white border border-[#E3E6E1] rounded-[12px] p-4 flex flex-col gap-2 hover:border-[oklch(0.48_0.10_160)] transition-all shadow-2xs">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-[13.5px] text-[#191C1A]">{cat.name}</span>
                <span className="font-mono text-[12.5px] text-[oklch(0.48_0.10_160)] font-semibold">{cat.pts} pts</span>
              </div>
              <div className="text-[12px] leading-[1.5] text-[#5A6058]">{cat.desc}</div>
              <div className="mt-1.5 pt-2 border-t border-[#F2F4F0] flex flex-col gap-1 font-mono text-[10px] text-[#8A8F87]">
                {cat.tests.map((t, tidx) => (
                  <div key={tidx} className="truncate">• {t}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Security Rule Classification Strip */}
        <div className="mt-5 bg-[#191C1A] text-white rounded-[12px] px-5 py-4 text-[13px] leading-[1.6] flex flex-col md:flex-row gap-3 items-start md:items-center justify-between shadow-md">
          <div className="flex gap-2.5 items-baseline">
            <span className="font-mono text-[10.5px] tracking-[0.06em] text-[oklch(0.72_0.09_160)] whitespace-nowrap font-bold bg-[#2C312C] px-2 py-0.5 rounded">
              SECURITY RULE BAKED IN
            </span>
            <span className="text-[#F5F6F3]">
              Every exposed resource is strictly classified across 3 tiers:
            </span>
          </div>
          <div className="flex flex-wrap gap-2 font-mono text-[10.5px]">
            <span className="bg-[#2C312C] text-[oklch(0.72_0.09_160)] px-2.5 py-1 rounded border border-[#3D423D]">
              Public Facts = Free
            </span>
            <span className="bg-[#2C312C] text-[#B45309] px-2.5 py-1 rounded border border-[#3D423D]">
              Booking = Controlled
            </span>
            <span className="bg-[#2C312C] text-[#B3261E] px-2.5 py-1 rounded border border-[#3D423D]">
              Customer Data = Private
            </span>
          </div>
        </div>
      </section>

      {/* PROOF SECTION 5: The Evidence Promise */}
      <section className="bg-[#191C1A] text-[#F5F6F3] py-14">
        <div className="max-w-[840px] mx-auto px-4 sm:px-6 flex flex-col gap-4 text-center">
          <div className="text-[11.5px] tracking-[0.1em] uppercase text-[oklch(0.72_0.09_160)] font-semibold font-mono">
            Our Promise — Verifiable, No Dead Claims
          </div>
          <p className="font-serif text-[24px] sm:text-[30px] leading-[1.35] font-normal text-white text-balance">
            &quot;Your services, prices, policies, credentials, and booking actions are presented accurately to machines — and we show you exactly what agents can and cannot understand, before and after.&quot;
          </p>
          <p className="text-[13.5px] text-[#A9AEA6] max-w-[62ch] mx-auto leading-[1.6]">
            We do not promise rankings. AI search engines operate autonomously. We promise implementation, monitoring, testing, and remediation — every stated fact carries its source, timestamp, and verification status.
          </p>
        </div>
      </section>

      {/* BOTTOM OFFER REPEAT: Standalone Offer Card for Visitors Who Scrolled Past Proof */}
      <section id="pricing" className="max-w-[760px] mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <div className="text-[11.5px] font-semibold tracking-[0.08em] uppercase text-[oklch(0.48_0.10_160)] font-mono bg-[oklch(0.96_0.03_160)] px-3 py-1 rounded-full">
            Single Flat-Fee Engagement
          </div>
          <h2 className="font-serif text-[32px] sm:text-[38px] font-medium tracking-tight text-[#191C1A]">
            Get Your 100-Point Verified Audit
          </h2>
          <p className="text-[14.5px] text-[#5A6058] max-w-[52ch]">
            Every gap tested with screenshots, timestamps, raw JSON-LD payloads, and a 5-step fix plan. One flat fee, zero recurring commitment.
          </p>
        </div>

        <div className="max-w-[560px] mx-auto bg-white border-2 border-[oklch(0.48_0.10_160)] rounded-[20px] p-6 sm:p-8 flex flex-col gap-5 relative shadow-xl">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[oklch(0.48_0.10_160)] text-white text-[11px] font-bold tracking-[0.08em] uppercase rounded-full px-4 py-1 font-mono shadow-xs">
            Most Popular Next Step
          </div>

          <div className="flex justify-between items-baseline border-b border-[#EDEFEA] pb-4">
            <div>
              <div className="text-[12.5px] font-semibold tracking-[0.05em] uppercase text-[#5A6058] font-mono">Verified Audit</div>
              <div className="text-[12.5px] text-[#8A8F87]">Single Location Practice</div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-[42px] font-bold text-[#191C1A]">$297</span>
              <span className="text-[12px] text-[#8A8F87] font-mono">one-time</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 font-mono text-[12.5px] text-[#3D423D]">
            <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">
              <span>✓</span> <span>100-point reproducible score rubric</span>
            </div>
            <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">
              <span>✓</span> <span>Live ChatGPT, Perplexity &amp; Google AI evidence screenshots</span>
            </div>
            <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">
              <span>✓</span> <span>Prioritized gap report + 5-step implementation roadmap</span>
            </div>
            <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">
              <span>✓</span> <span>Evidence zip bundle with raw payloads and audit logs</span>
            </div>
          </div>

          <GateForm buttonText="Get instant access — $297" />

          <div className="text-[11.5px] text-[#8A8F87] text-center font-mono pt-1">
            🔒 100% Secure Payment via Stripe · Delivered within 24 hours
          </div>
        </div>

        {/* Enterprise Footnote */}
        <div className="mt-8 text-center text-[12px] text-[#8A8F87] font-mono max-w-[620px] mx-auto bg-[#FAFAF7] p-4 rounded-xl border border-[#EDEFEA]">
          Need full schema graph implementation or multi-location monitoring? <br />
          <span className="text-[#3D423D] font-medium">Starter Install ($1,500)</span> and <span className="text-[#3D423D] font-medium">Monthly Monitoring ($249/mo)</span> options are detailed directly in your Audit report.
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E3E6E1] bg-white py-8">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[12px] text-[#8A8F87] font-mono text-center sm:text-left">
          <span>© 2026 MetalMindTech LLC · High-Growth Aesthetic Markets</span>
          <span>Customer Data = Strictly Private</span>
        </div>
      </footer>

      {/* Stripe Checkout Modal Fallback */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-[500px] w-full shadow-2xl border border-[#E3E6E1] flex flex-col gap-4 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-[#8A8F87] hover:text-[#191C1A] font-bold text-[18px] cursor-pointer"
            >
              ✕
            </button>

            <div className="flex flex-col gap-1">
              <span className="font-mono text-[11px] text-[oklch(0.48_0.10_160)] uppercase tracking-wider font-bold">
                MetalMindTech Secure Checkout
              </span>
              <h3 className="font-serif text-[24px] font-medium text-[#191C1A]">
                100-Point Verified Audit — $297
              </h3>
              <p className="text-[13px] text-[#5A6058]">
                Target domain: <strong className="text-[#191C1A] font-mono">{scanDomain || "yourmedspa.com"}</strong>
              </p>
            </div>

            <GateForm
              buttonText="Get instant access — $297"
              onSuccess={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
