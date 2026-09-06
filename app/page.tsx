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
  const [showMethodology, setShowMethodology] = useState(false);

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

  const handleCheckoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const pricingEl = document.getElementById("pricing");
    if (pricingEl) {
      pricingEl.scrollIntoView({ behavior: "smooth" });
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <div id="top" className="min-h-screen bg-[#FAFAF7] text-[#191C1A] font-sans antialiased selection:bg-[oklch(0.90_0.05_160)]">
      {/* Top Banner — Operating Principle */}
      <div className="bg-[#191C1A] text-[#A9AEA6] px-4 py-2 text-[12px] flex justify-between items-center border-b border-[#2C312C] font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[oklch(0.72_0.09_160)] animate-pulse"></span>
          <span className="text-white font-medium">MetalMindTech LLC</span>
          <span className="hidden sm:inline">· High-Growth Aesthetic Markets</span>
        </div>
        <div className="text-[11px] text-[#D4D8D2] tracking-wide italic hidden lg:block">
          &quot;Humans buy verified outcomes today; agents buy trusted resources tomorrow.&quot;
        </div>
        <div className="text-[11px] text-[oklch(0.72_0.09_160)] font-semibold">
          Phase 1: AgentReady MedSpa
        </div>
      </div>

      {/* Header */}
      <header className="max-w-[1080px] mx-auto px-8 py-[22px] flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <AgentReadyLogo className="w-8 h-8 text-[oklch(0.48_0.10_160)]" />
          <div className="flex items-baseline gap-2.5">
            <span className="font-serif font-semibold text-[22px] tracking-tight">AgentReady Local</span>
            <span className="text-[11px] tracking-[0.08em] uppercase text-[#5A6058] font-mono">by MetalMindTech</span>
          </div>
        </div>
        <nav className="flex items-center gap-3 md:gap-[26px] text-[13px] md:text-[14px] font-medium">
          <a href="#how" className="text-[#191C1A] hover:text-[oklch(0.48_0.10_160)] transition-colors hidden sm:inline">
            How it works
          </a>
          <a href="#pricing" className="text-[#191C1A] hover:text-[oklch(0.48_0.10_160)] transition-colors hidden sm:inline">
            Pricing
          </a>
          <Link href="/sample-report" className="text-[oklch(0.48_0.10_160)] font-semibold hover:underline flex items-center gap-1 whitespace-nowrap">
            Sample report <span className="text-xs">→</span>
          </Link>
        </nav>
      </header>

      {/* Hero & Surface Scan — ORIGINAL 2-COLUMN HERO (UNTOUCHED) */}
      <section className="max-w-[1080px] mx-auto px-4 sm:px-8 pt-8 sm:pt-12 pb-[56px] grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-[40px] lg:gap-[56px] items-start">
        {/* Left Hero Column */}
        <div className="flex flex-col gap-[22px]">
          <div className="inline-flex items-center gap-2 text-[12px] tracking-[0.1em] uppercase text-[oklch(0.48_0.10_160)] font-semibold font-mono bg-[oklch(0.96_0.03_160)] px-3 py-1 rounded-full w-fit">
            AI-Readiness for Med Spas &amp; Aesthetic Practices
          </div>
          <h1 className="font-serif font-medium text-[34px] sm:text-[44px] lg:text-[48px] leading-[1.12] tracking-[-0.015em] text-balance text-[#191C1A]">
            When someone asks ChatGPT for the best med spa in your city, does it know you exist?
          </h1>
          <p className="text-[15px] sm:text-[17px] leading-[1.6] text-[#3D423D] max-w-[52ch] text-pretty">
            AI assistants can&apos;t reliably read most med spa websites — services, prices, credentials, and booking paths are invisible to them. We make your business facts machine-readable, and prove it with before/after evidence tests.
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-4 items-center text-[12.5px] sm:text-[13px] text-[#5A6058] font-medium pt-2">
            <span className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E3E6E1] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[oklch(0.48_0.10_160)]"></span>
              Flat-fee builds
            </span>
            <span className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E3E6E1] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[oklch(0.48_0.10_160)]"></span>
              Evidence for every claim
            </span>
            <span className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E3E6E1] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[oklch(0.48_0.10_160)]"></span>
              No ranking promises
            </span>
          </div>
        </div>

        {/* Right Scan Card Column */}
        <div className="bg-white border border-[#E3E6E1] rounded-[16px] p-5 sm:p-[28px] flex flex-col gap-4 shadow-[0_4px_24px_rgba(20,25,20,0.06),0_1px_2px_rgba(20,25,20,0.04)] relative overflow-hidden">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <div className="font-bold text-[17px] text-[#191C1A]">Free surface scan</div>
              <span className="font-mono text-[10px] text-[oklch(0.48_0.10_160)] bg-[oklch(0.96_0.03_160)] px-2 py-0.5 rounded uppercase font-semibold">
                Live Scanner
              </span>
            </div>
            <div className="text-[13.5px] text-[#5A6058] leading-[1.5]">
              Enter your website. We check what AI agents can actually read — in about 30 seconds.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runScan()}
              placeholder="yourmedspa.com"
              style={{ fontSize: "16px" }}
              className="flex-1 min-w-0 px-3.5 py-3 border border-[#D4D8D2] rounded-lg text-[15px] font-mono bg-[#FAFAF7] text-[#191C1A] outline-none focus:border-[oklch(0.48_0.10_160)] focus:bg-white transition-all"
            />
            <button
              onClick={runScan}
              className="px-[20px] py-3 border-none rounded-lg bg-[oklch(0.48_0.10_160)] text-white text-[14px] font-semibold cursor-pointer font-sans whitespace-nowrap hover:bg-[oklch(0.42_0.10_160)] active:scale-[0.99] transition-all shadow-xs"
            >
              Scan free
            </button>
          </div>

          {/* Running State */}
          {phase === "running" && (
            <div className="flex flex-col gap-2 font-mono text-[12.5px] text-[#3D423D] bg-[#F2F4F0] rounded-xl p-4 border border-[#E3E6E1]">
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

          {/* Gated Email Capture State */}
          {phase === "gated" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-4 bg-[#F2F4F0] rounded-[12px] p-4 border border-[#E3E6E1]">
                <div className="flex flex-col items-center justify-center min-w-[76px] py-1 bg-white rounded-lg border border-[#E3E6E1] shadow-2xs">
                  <div className="font-serif text-[36px] font-semibold text-[#B3261E] leading-none">{score}</div>
                  <div className="text-[10px] tracking-[0.06em] uppercase text-[#5A6058] font-mono mt-0.5">of 100</div>
                </div>
                <div className="text-[13.5px] leading-[1.5] text-[#3D423D]">
                  <strong className="text-[#191C1A]">{scanDomain}</strong> scored <strong className="text-[#B3261E]">{score}/100</strong>. Surface scan found {gaps.length} critical gaps in schema, booking path &amp; pricing visibility.
                </div>
              </div>

              <ScanGateForm scanDomain={scanDomain} scanScore={score} onUnlock={() => setPhase("done")} />
            </div>
          )}

          {/* Done State */}
          {phase === "done" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center font-mono text-[10px] text-[#8A8F87] bg-[#FAFAF7] px-3 py-1.5 rounded-lg border border-[#EDEFEA]">
                <span>source: Surface Crawler</span>
                <span>observed_at {scanTimestamp}</span>
                <span className="text-[oklch(0.48_0.10_160)] font-semibold">verified</span>
              </div>

              <div className="flex items-center gap-4 bg-[#F2F4F0] rounded-[12px] p-4 border border-[#E3E6E1]">
                <div className="flex flex-col items-center justify-center min-w-[76px] py-1 bg-white rounded-lg border border-[#E3E6E1] shadow-2xs">
                  <div className="font-serif text-[36px] font-semibold text-[#B3261E] leading-none">{score}</div>
                  <div className="text-[10px] tracking-[0.06em] uppercase text-[#5A6058] font-mono mt-0.5">of 100</div>
                </div>
                <div className="text-[13.5px] leading-[1.5] text-[#3D423D]">
                  <strong className="text-[#191C1A]">{scanDomain}</strong> is mostly invisible to AI agents. Surface scan found {gaps.length} critical gaps:
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {gaps.map((gap, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start text-[13px] leading-[1.45] bg-[#FAFAF7] p-2.5 rounded-lg border border-[#EDEFEA]">
                    <span className="font-mono text-[10.5px] text-[#B3261E] bg-[oklch(0.95_0.02_25)] border border-[oklch(0.90_0.04_25)] rounded px-1.5 py-0.5 whitespace-nowrap font-medium">
                      {gap.code}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#191C1A] font-medium text-[12px] uppercase tracking-wide font-mono text-[#5A6058]">{gap.category}</span>
                      <span className="text-[#3D423D]">{gap.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCheckoutClick}
                className="w-full text-center p-3.5 rounded-lg bg-[#191C1A] text-white text-[14px] font-semibold hover:bg-black transition-all shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
              >
                Get the full 100-point Verified Audit — $297 ↓
              </button>
              <div className="text-[11.5px] text-[#8A8F87] text-center font-mono">
                The full audit re-runs every check with screenshots, timestamps &amp; raw payloads.
              </div>
            </div>
          )}

          {/* Idle State */}
          {phase === "idle" && (
            <div className="text-[12.5px] text-[#8A8F87] leading-[1.5] bg-[#FAFAF7] p-3.5 rounded-xl border border-[#EDEFEA]">
              Checks schema markup, service catalog, pricing visibility, credentials, booking path, and crawl policy in 30 seconds.
            </div>
          )}
        </div>
      </section>

      {/* CHANGE 2: $297 OFFER CARD MOVED UP, DIRECTLY UNDER SCANNER / GAPS */}
      <section id="pricing" className="max-w-[1080px] mx-auto px-4 sm:px-8 pt-2 pb-12">
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-[oklch(0.48_0.10_160)] font-mono bg-[oklch(0.96_0.03_160)] px-3 py-1 rounded-full">
            Single Flat-Fee Engagement
          </div>
          <h2 className="font-serif text-[34px] sm:text-[40px] font-medium tracking-tight text-[#191C1A]">
            Get Your 100-Point Verified Audit
          </h2>
          <p className="text-[15px] text-[#5A6058] max-w-[54ch]">
            Every gap tested with screenshots, timestamps, raw JSON-LD payloads, and a 5-step fix plan. One flat fee, zero recurring commitment.
          </p>
        </div>

        <div className="max-w-[560px] mx-auto bg-white border-2 border-[oklch(0.48_0.10_160)] rounded-[20px] p-6 sm:p-8 flex flex-col gap-5 relative shadow-xl">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[oklch(0.48_0.10_160)] text-white text-[11px] font-bold tracking-[0.08em] uppercase rounded-full px-4 py-1 font-mono shadow-xs">
            Most Popular Next Step
          </div>

          <div className="flex justify-between items-baseline border-b border-[#EDEFEA] pb-4">
            <div>
              <div className="text-[13px] font-semibold tracking-[0.05em] uppercase text-[#5A6058] font-mono">Verified Audit</div>
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

          <GateForm
            buttonText="Get instant access — $297"
            scannedDomain={scanDomain}
            scanScore={score}
          />

          <div className="text-[11.5px] text-[#8A8F87] text-center font-mono pt-1">
            🔒 100% Secure Payment via Stripe · Delivered within 24 hours
          </div>
        </div>

        {/* Secondary Enterprise Footnote */}
        <div className="mt-8 text-center text-[12.5px] text-[#8A8F87] font-mono max-w-[640px] mx-auto bg-[#FAFAF7] p-4 rounded-xl border border-[#EDEFEA]">
          Need full schema graph implementation or multi-location monitoring? <br />
          <span className="text-[#3D423D] font-medium">Starter Install ($1,500)</span> and <span className="text-[#3D423D] font-medium">Monthly Monitoring ($249/mo)</span> options are detailed directly in your Audit report.
        </div>
      </section>

      {/* CHANGE 3: COLLAPSIBLE METHODOLOGY ACCORDION (THE 6 AI PATIENT JOURNEY TESTS + 100-POINT RUBRIC) */}
      <section className="max-w-[1080px] mx-auto px-4 sm:px-8 pb-12">
        <button
          type="button"
          onClick={() => setShowMethodology(!showMethodology)}
          className="w-full py-4 px-5 rounded-2xl border border-[#D4D8D2] bg-white text-[14px] font-semibold text-[#191C1A] hover:bg-[#FAFAF7] transition-all flex items-center justify-between cursor-pointer font-sans shadow-2xs"
        >
          <span className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] text-[oklch(0.48_0.10_160)] bg-[oklch(0.96_0.03_160)] px-2.5 py-0.5 rounded font-bold uppercase">Methodology</span>
            <span>The 6 AI Patient Journey Tests &amp; 100-Point Scored Rubric</span>
          </span>
          <span className="text-[oklch(0.48_0.10_160)] font-mono font-bold text-[13px]">{showMethodology ? "Hide Details ↑" : "View Details ↓"}</span>
        </button>

        {showMethodology && (
          <div className="mt-6 flex flex-col gap-10 animate-in fade-in duration-300">
            {/* The 6 Fundamental AI Questions */}
            <div className="bg-[#F2F4F0] border border-[#E3E6E1] rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col gap-2 mb-6 text-center max-w-[680px] mx-auto">
                <span className="text-[11px] uppercase tracking-widest font-mono text-[oklch(0.48_0.10_160)] font-bold">
                  The AI Patient Journey Test
                </span>
                <h3 className="font-serif text-[24px] md:text-[28px] font-medium text-[#191C1A] leading-tight">
                  Can AI assistants guide new patients to your practice?
                </h3>
                <p className="text-[14px] text-[#5A6058] leading-[1.6]">
                  When prospective patients search ChatGPT, Perplexity, or Google AI for aesthetic treatments, AI systems evaluate 6 fundamental questions before making a recommendation:
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-white border border-[#E3E6E1] rounded-xl p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
                  <div className="font-mono text-[9.5px] font-bold text-[#5A6058] uppercase">1. IDENTIFY</div>
                  <div className="text-[12.5px] font-medium text-[#191C1A] leading-snug">Does AI recognize your exact business entity without mismatch?</div>
                  <span className="font-mono text-[9.5px] text-[#B3261E] bg-[#FEF2F2] border border-[#FCA5A5] rounded px-1.5 py-0.5 w-fit font-medium">Entity Match</span>
                </div>

                <div className="bg-white border border-[#E3E6E1] rounded-xl p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
                  <div className="font-mono text-[9.5px] font-bold text-[#5A6058] uppercase">2. UNDERSTAND</div>
                  <div className="text-[12.5px] font-medium text-[#191C1A] leading-snug">Can AI parse your complete service catalog in structured schema?</div>
                  <span className="font-mono text-[9.5px] text-[#B3261E] bg-[#FEF2F2] border border-[#FCA5A5] rounded px-1.5 py-0.5 w-fit font-medium">Service Schema</span>
                </div>

                <div className="bg-white border border-[#E3E6E1] rounded-xl p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
                  <div className="font-mono text-[9.5px] font-bold text-[#5A6058] uppercase">3. PRICE</div>
                  <div className="text-[12.5px] font-medium text-[#191C1A] leading-snug">Can AI accurately quote your pricing instead of competitor data?</div>
                  <span className="font-mono text-[9.5px] text-[#B3261E] bg-[#FEF2F2] border border-[#FCA5A5] rounded px-1.5 py-0.5 w-fit font-medium">Offer Markup</span>
                </div>

                <div className="bg-white border border-[#E3E6E1] rounded-xl p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
                  <div className="font-mono text-[9.5px] font-bold text-[#5A6058] uppercase">4. TRUST</div>
                  <div className="text-[12.5px] font-medium text-[#191C1A] leading-snug">Can AI verify practitioner licenses &amp; medical credentials?</div>
                  <span className="font-mono text-[9.5px] text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A] rounded px-1.5 py-0.5 w-fit font-medium">Person Schema</span>
                </div>

                <div className="bg-white border border-[#E3E6E1] rounded-xl p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
                  <div className="font-mono text-[9.5px] font-bold text-[#5A6058] uppercase">5. RECOMMEND</div>
                  <div className="text-[12.5px] font-medium text-[#191C1A] leading-snug">Does your practice surface when patients ask AI for top providers in your city?</div>
                  <span className="font-mono text-[9.5px] text-[#B3261E] bg-[#FEF2F2] border border-[#FCA5A5] rounded px-1.5 py-0.5 w-fit font-medium">Discovery Test</span>
                </div>

                <div className="bg-white border border-[#E3E6E1] rounded-xl p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
                  <div className="font-mono text-[9.5px] font-bold text-[#5A6058] uppercase">6. BOOK</div>
                  <div className="text-[12.5px] font-medium text-[#191C1A] leading-snug">Can AI surface a crawlable direct booking path for patients?</div>
                  <span className="font-mono text-[9.5px] text-[#B3261E] bg-[#FEF2F2] border border-[#FCA5A5] rounded px-1.5 py-0.5 w-fit font-medium">ReserveAction</span>
                </div>
              </div>
            </div>

            {/* Rubric Section */}
            <div className="bg-white border border-[#E3E6E1] rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-baseline justify-between gap-6 flex-wrap mb-4">
                <h3 className="font-serif text-[26px] font-medium tracking-tight">The 100-point rubric</h3>
                <div className="text-[13px] text-[#5A6058] font-mono">Every point = one reproducible test. Evidence stored per audit.</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
                {RUBRIC.map((cat, idx) => (
                  <div key={idx} className="bg-[#FAFAF7] border border-[#EDEFEA] rounded-[12px] p-[16px] flex flex-col gap-2 hover:border-[oklch(0.48_0.10_160)] transition-all">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold text-[13.5px] text-[#191C1A]">{cat.name}</span>
                      <span className="font-mono text-[12.5px] text-[oklch(0.48_0.10_160)] font-semibold">{cat.pts} pts</span>
                    </div>
                    <div className="text-[12px] leading-[1.5] text-[#5A6058]">{cat.desc}</div>
                    <div className="mt-2 pt-2 border-t border-[#E3E6E1] flex flex-col gap-1 font-mono text-[10px] text-[#8A8F87]">
                      {cat.tests.map((t, tidx) => (
                        <div key={tidx} className="truncate">• {t}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Security Rule Classification Strip */}
              <div className="mt-6 bg-[#191C1A] text-white rounded-[12px] px-[20px] py-[16px] text-[13px] leading-[1.6] flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-md">
                <div className="flex gap-3 items-baseline">
                  <span className="font-mono text-[10.5px] tracking-[0.06em] text-[oklch(0.72_0.09_160)] whitespace-nowrap font-bold bg-[#2C312C] px-2.5 py-1 rounded">
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

              <div className="mt-6 text-center">
                <Link
                  href="/sample-report"
                  className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[oklch(0.48_0.10_160)] hover:underline font-mono"
                >
                  View Full 100-Point Sample Audit Report →
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Promise Band */}
      <section className="bg-[#191C1A] text-[#F5F6F3]">
        <div className="max-w-[1080px] mx-auto px-8 py-[56px] flex flex-col gap-4.5">
          <div className="text-[12px] tracking-[0.1em] uppercase text-[oklch(0.72_0.09_160)] font-semibold font-mono">
            Our promise — verifiable, no dead claims
          </div>
          <p className="font-serif text-[26px] sm:text-[28px] leading-[1.4] font-normal max-w-[60ch] text-pretty text-white">
            &quot;Your services, prices, policies, credentials, and booking actions are presented accurately to machines — and we show you exactly what agents can and cannot understand, before and after.&quot;
          </p>
          <p className="text-[14px] text-[#A9AEA6] max-w-[64ch] leading-[1.6]">
            We do not promise rankings. AI engines are third parties we don&apos;t control. We promise implementation, monitoring, testing, and remediation — every stated fact carries its source, timestamp, and verification status.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="max-w-[1080px] mx-auto px-8 pt-[72px] pb-12">
        <h2 className="font-serif text-[32px] font-medium mb-8 tracking-tight">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#E3E6E1] rounded-[14px] p-[26px] flex flex-col gap-3 shadow-2xs hover:border-[oklch(0.48_0.10_160)] transition-all group">
            <div className="font-mono text-[12px] text-[oklch(0.48_0.10_160)] font-semibold">01 — AUDIT</div>
            <div className="font-bold text-[17px] text-[#191C1A]">See what agents see</div>
            <p className="text-[14px] leading-[1.6] text-[#5A6058] flex-1">
              100-point scored rubric. Every point is a reproducible test with screenshot evidence and timestamps — including live queries to ChatGPT, Perplexity, and Google AI.
            </p>
            <Link href="/sample-report" className="text-[13.5px] font-semibold text-[oklch(0.48_0.10_160)] group-hover:underline flex items-center gap-1">
              View a sample report →
            </Link>
          </div>

          <div className="bg-white border border-[#E3E6E1] rounded-[14px] p-[26px] flex flex-col gap-3 shadow-2xs hover:border-[oklch(0.48_0.10_160)] transition-all">
            <div className="font-mono text-[12px] text-[oklch(0.48_0.10_160)] font-semibold">02 — INSTALL</div>
            <div className="font-bold text-[17px]">Make your facts machine-readable</div>
            <p className="text-[14px] leading-[1.6] text-[#5A6058]">
              Schema graph, service catalog, pricing model, FAQ and policy normalization, llms.txt, crawl policy — built from verified records, delivered flat-fee with a before/after test suite.
            </p>
          </div>

          <div className="bg-white border border-[#E3E6E1] rounded-[14px] p-[26px] flex flex-col gap-3 shadow-2xs hover:border-[oklch(0.48_0.10_160)] transition-all">
            <div className="font-mono text-[12px] text-[oklch(0.48_0.10_160)] font-semibold">03 — MONITOR</div>
            <div className="font-bold text-[17px]">Stay accurate as engines change</div>
            <p className="text-[14px] leading-[1.6] text-[#5A6058]">
              Monthly citation re-tests, broken-schema alerts, and freshness checks. You get the same evidence format every month: what changed, what broke, what we fixed.
            </p>
          </div>
        </div>
      </section>

      {/* Live Demo Banner */}
      <section className="max-w-[1080px] mx-auto px-8 pt-4 pb-20">
        <div className="bg-white border border-[#E3E6E1] rounded-[16px] p-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center shadow-xs">
          <div className="flex flex-col gap-2.5">
            <h2 className="font-serif text-[26px] font-medium tracking-tight text-[#191C1A]">Watch it happen live</h2>
            <p className="text-[15px] leading-[1.6] text-[#5A6058] max-w-[58ch]">
              Book 20 minutes. We&apos;ll ask ChatGPT &quot;best med spa in your city&quot; while you watch, then show you exactly why it answered the way it did — and what changes it.
            </p>
          </div>
          <a
            href="#top"
            onClick={scrollToTop}
            className="px-[26px] py-3.5 rounded-lg bg-[#191C1A] text-white text-[15px] font-semibold whitespace-nowrap text-center hover:bg-black transition-all shadow-md active:scale-[0.99]"
          >
            Book the live demo
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E3E6E1] bg-white">
        <div className="max-w-[1080px] mx-auto px-8 py-[26px] flex justify-between gap-6 text-[12.5px] text-[#8A8F87] flex-wrap font-mono">
          <span>© 2026 MetalMindTech LLC · High-Growth Aesthetic Markets</span>
          <span>Customer Data = Strictly Private</span>
        </div>
      </footer>

      {/* Stripe Checkout Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-[520px] w-full shadow-2xl border border-[#E3E6E1] flex flex-col gap-5 relative">
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
              <p className="text-[13.5px] text-[#5A6058] leading-[1.5]">
                Target domain: <strong className="text-[#191C1A] font-mono">{scanDomain || "yourmedspa.com"}</strong>
              </p>
            </div>

            <div className="bg-[#FAFAF7] border border-[#EDEFEA] rounded-xl p-4 flex flex-col gap-2 font-mono text-[12px] text-[#3D423D]">
              <div className="font-bold text-[#191C1A] text-[12.5px]">What&apos;s included in this audit:</div>
              <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">✓ 100-point reproducible score rubric</div>
              <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">✓ Live ChatGPT, Perplexity &amp; Google AI evidence</div>
              <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">✓ Prioritized gap report + 5-step fix plan</div>
              <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">✓ Evidence zip bundle with screenshots &amp; payloads</div>
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
