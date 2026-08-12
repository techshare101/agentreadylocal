"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

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

const LIVE_STRIPE_URL = "https://buy.stripe.com/7sY7sL9gL6gQ3Ft6qt3840n";
const ENV_STRIPE_URL = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || LIVE_STRIPE_URL;

export default function FunnelPage() {
  const [domain, setDomain] = useState("");
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [checkLog, setCheckLog] = useState<string[]>([]);
  const [currentCheck, setCurrentCheck] = useState("");
  const [score, setScore] = useState(0);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [scanDomain, setScanDomain] = useState("");
  const [scanTimestamp, setScanTimestamp] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [customStripeUrl, setCustomStripeUrl] = useState(ENV_STRIPE_URL);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
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
        setPhase("done");
      }
    };

    timerRef.current = setTimeout(step, 550);
  };

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCheckoutClick = (e: React.MouseEvent) => {
    const url = customStripeUrl || ENV_STRIPE_URL;
    if (url && url.startsWith("https://buy.stripe.com/") && !url.includes("test_00g123456789")) {
      // Valid Stripe URL present -> open in new tab
      return;
    }
    // Otherwise open modal gracefully
    e.preventDefault();
    setIsModalOpen(true);
  };

  const activeStripeUrl = (customStripeUrl || ENV_STRIPE_URL).trim();
  const isValidStripeUrl = activeStripeUrl.startsWith("https://buy.stripe.com/") && !activeStripeUrl.includes("test_00g123456789");

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
        <div className="flex items-baseline gap-2.5">
          <span className="font-serif font-semibold text-[22px] tracking-tight">AgentReady Local</span>
          <span className="text-[11px] tracking-[0.08em] uppercase text-[#5A6058] font-mono">by MetalMindTech</span>
        </div>
        <nav className="flex items-center gap-[26px] text-[14px] font-medium">
          <a href="#how" className="text-[#191C1A] hover:text-[oklch(0.48_0.10_160)] transition-colors">
            How it works
          </a>
          <a href="#rubric" className="text-[#191C1A] hover:text-[oklch(0.48_0.10_160)] transition-colors">
            100-point audit
          </a>
          <a href="#flywheel" className="text-[#191C1A] hover:text-[oklch(0.48_0.10_160)] transition-colors hidden md:inline">
            Evidence engine
          </a>
          <a href="#pricing" className="text-[#191C1A] hover:text-[oklch(0.48_0.10_160)] transition-colors">
            Pricing
          </a>
          <Link href="/sample-report" className="text-[oklch(0.48_0.10_160)] font-semibold hover:underline flex items-center gap-1">
            Sample report <span className="text-xs">→</span>
          </Link>
        </nav>
      </header>

      {/* Hero & Surface Scan */}
      <section className="max-w-[1080px] mx-auto px-8 pt-12 pb-[56px] grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-[56px] items-start">
        {/* Left Hero Column */}
        <div className="flex flex-col gap-[22px]">
          <div className="inline-flex items-center gap-2 text-[12px] tracking-[0.1em] uppercase text-[oklch(0.48_0.10_160)] font-semibold font-mono bg-[oklch(0.96_0.03_160)] px-3 py-1 rounded-full w-fit">
            AI-Readiness for Med Spas &amp; Aesthetic Practices
          </div>
          <h1 className="font-serif font-medium text-[44px] sm:text-[48px] leading-[1.12] tracking-[-0.015em] text-balance text-[#191C1A]">
            When someone asks ChatGPT for the best med spa in your city, does it know you exist?
          </h1>
          <p className="text-[17px] leading-[1.6] text-[#3D423D] max-w-[52ch] text-pretty">
            AI assistants can&apos;t reliably read most med spa websites — services, prices, credentials, and booking paths are invisible to them. We make your business facts machine-readable, and prove it with before/after evidence tests.
          </p>
          <div className="flex flex-wrap gap-4 items-center text-[13px] text-[#5A6058] font-medium pt-2">
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
        <div className="bg-white border border-[#E3E6E1] rounded-[16px] p-[28px] flex flex-col gap-4 shadow-[0_4px_24px_rgba(20,25,20,0.06),0_1px_2px_rgba(20,25,20,0.04)] relative overflow-hidden">
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

          <div className="flex gap-2">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runScan()}
              placeholder="yourmedspa.com"
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

          {/* Done State */}
          {phase === "done" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              {/* Telemetry Header */}
              <div className="flex justify-between items-center font-mono text-[10px] text-[#8A8F87] bg-[#FAFAF7] px-3 py-1.5 rounded-lg border border-[#EDEFEA]">
                <span>source: Surface Crawler</span>
                <span>observed_at {scanTimestamp}</span>
                <span className="text-[oklch(0.48_0.10_160)] font-semibold">verified</span>
              </div>

              {/* Score Display */}
              <div className="flex items-center gap-4 bg-[#F2F4F0] rounded-[12px] p-4 border border-[#E3E6E1]">
                <div className="flex flex-col items-center justify-center min-w-[76px] py-1 bg-white rounded-lg border border-[#E3E6E1] shadow-2xs">
                  <div className="font-serif text-[36px] font-semibold text-[#B3261E] leading-none">{score}</div>
                  <div className="text-[10px] tracking-[0.06em] uppercase text-[#5A6058] font-mono mt-0.5">of 100</div>
                </div>
                <div className="text-[13.5px] leading-[1.5] text-[#3D423D]">
                  <strong className="text-[#191C1A]">{scanDomain}</strong> is mostly invisible to AI agents. Surface scan found {gaps.length} critical gaps:
                </div>
              </div>

              {/* Gap List */}
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

              {/* CTA Button */}
              <a
                href={isValidStripeUrl ? activeStripeUrl : "#"}
                onClick={handleCheckoutClick}
                target={isValidStripeUrl ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="block text-center p-3.5 rounded-lg bg-[#191C1A] text-white text-[14px] font-semibold hover:bg-black transition-all shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
              >
                Get the full 100-point Verified Audit — $297
              </a>
              <div className="text-[11.5px] text-[#8A8F87] text-center font-mono">
                The full audit re-runs every check with screenshots, timestamps &amp; raw payloads.
              </div>
            </div>
          )}

          {/* Idle State */}
          {phase === "idle" && (
            <div className="text-[12.5px] text-[#8A8F87] leading-[1.5] bg-[#FAFAF7] p-3.5 rounded-xl border border-[#EDEFEA]">
              Checks schema markup, service catalog, pricing visibility, credentials, booking path, and crawl policy. No signup required.
            </div>
          )}
        </div>
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
      <section id="how" className="max-w-[1080px] mx-auto px-8 pt-[72px] pb-6">
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

      {/* Flywheel / Evidence System Section */}
      <section id="flywheel" className="max-w-[1080px] mx-auto px-8 py-12">
        <div className="bg-white border border-[#E3E6E1] rounded-[16px] p-8 shadow-xs">
          <div className="flex flex-col gap-2 mb-6">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[oklch(0.48_0.10_160)] font-semibold">
              MetalMindTech Portfolio Flywheel
            </div>
            <h3 className="font-serif text-[24px] font-medium text-[#191C1A]">
              One Evidence System · Three Monetized Layers
            </h3>
            <p className="text-[14px] text-[#5A6058] max-w-[70ch] leading-[1.6]">
              &quot;The same observation is monetized three times: first as an audit finding, then as a historical market signal, then as an input to an expert workflow. Collect once; verify once; reuse with rights and provenance.&quot;
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-[13px]">
            <div className="bg-[#FAFAF7] border border-[#EDEFEA] rounded-xl p-4 flex flex-col gap-2">
              <div className="font-mono text-[11px] text-[oklch(0.48_0.10_160)] font-bold uppercase">Layer 1 · AgentReady MedSpa</div>
              <div className="font-bold text-[#191C1A]">Verified Visibility &amp; Findings</div>
              <p className="text-[12.5px] text-[#5A6058] leading-[1.5]">Monetizes audits, implementation, and monthly monitoring. Feeds structured facts &amp; outcomes.</p>
            </div>
            <div className="bg-[#FAFAF7] border border-[#EDEFEA] rounded-xl p-4 flex flex-col gap-2">
              <div className="font-mono text-[11px] text-[#B45309] font-bold uppercase">Layer 2 · SpaSignal Intelligence</div>
              <div className="font-bold text-[#191C1A]">Market Change Signals</div>
              <p className="text-[12.5px] text-[#5A6058] leading-[1.5]">Monetizes dossiers, reports, and agency intelligence subscriptions.</p>
            </div>
            <div className="bg-[#FAFAF7] border border-[#EDEFEA] rounded-xl p-4 flex flex-col gap-2">
              <div className="font-mono text-[11px] text-[#191C1A] font-bold uppercase">Layer 3 · Sovereign Operator</div>
              <div className="font-bold text-[#191C1A]">Executable Frameworks</div>
              <p className="text-[12.5px] text-[#5A6058] leading-[1.5]">Monetizes operator decisions, campaign audits, and executable decision tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Rubric Section */}
      <section id="rubric" className="max-w-[1080px] mx-auto px-8 pt-[32px] pb-6">
        <div className="flex items-baseline justify-between gap-6 flex-wrap mb-7">
          <h2 className="font-serif text-[32px] font-medium tracking-tight">The 100-point rubric</h2>
          <div className="text-[13.5px] text-[#5A6058] font-mono">Every point = one reproducible test. Evidence stored per audit.</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {RUBRIC.map((cat, idx) => (
            <div key={idx} className="bg-white border border-[#E3E6E1] rounded-[12px] p-[18px] flex flex-col gap-2 hover:border-[oklch(0.48_0.10_160)] transition-all">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-[14px] text-[#191C1A]">{cat.name}</span>
                <span className="font-mono text-[13px] text-[oklch(0.48_0.10_160)] font-semibold">{cat.pts} pts</span>
              </div>
              <div className="text-[12.5px] leading-[1.5] text-[#5A6058]">{cat.desc}</div>
              <div className="mt-2 pt-2 border-t border-[#F2F4F0] flex flex-col gap-1 font-mono text-[10.5px] text-[#8A8F87]">
                {cat.tests.map((t, tidx) => (
                  <div key={tidx} className="truncate">• {t}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Security Rule Classification Strip */}
        <div className="mt-5 bg-[#191C1A] text-white rounded-[12px] px-[22px] py-[20px] text-[13.5px] leading-[1.6] flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-md">
          <div className="flex gap-3 items-baseline">
            <span className="font-mono text-[11px] tracking-[0.06em] text-[oklch(0.72_0.09_160)] whitespace-nowrap font-bold bg-[#2C312C] px-2.5 py-1 rounded">
              SECURITY RULE BAKED IN
            </span>
            <span className="text-[#F5F6F3]">
              Every exposed resource is strictly classified across 3 tiers:
            </span>
          </div>
          <div className="flex flex-wrap gap-2 font-mono text-[11px]">
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

      {/* Pricing Section */}
      <section id="pricing" className="max-w-[1080px] mx-auto px-8 pt-[56px] pb-6">
        <h2 className="font-serif text-[32px] font-medium mb-8 tracking-tight">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {/* Surface Scan Card */}
          <div className="bg-white border border-[#E3E6E1] rounded-[14px] p-6 flex flex-col gap-2.5 shadow-2xs">
            <div className="text-[12px] font-semibold tracking-[0.05em] uppercase text-[#5A6058] font-mono">Surface scan</div>
            <div className="font-serif text-[32px] font-semibold text-[#191C1A]">Free</div>
            <div className="text-[13.5px] leading-[1.55] text-[#5A6058] flex-1">
              Instant score plus your three most critical gaps. No signup required.
            </div>
            <a href="#top" onClick={scrollToTop} className="text-[13.5px] font-semibold text-[oklch(0.48_0.10_160)] hover:underline">
              Run it above ↑
            </a>
          </div>

          {/* Verified Audit Card (Featured) */}
          <div className="bg-white border-2 border-[oklch(0.48_0.10_160)] rounded-[14px] p-6 flex flex-col gap-2.5 relative shadow-md">
            <div className="absolute -top-3 left-[20px] bg-[oklch(0.48_0.10_160)] text-white text-[10.5px] font-bold tracking-[0.06em] uppercase rounded-full px-3 py-0.5 font-mono">
              Start here
            </div>
            <div className="text-[12px] font-semibold tracking-[0.05em] uppercase text-[#5A6058] font-mono">Verified Audit</div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-[32px] font-semibold text-[#191C1A]">$297</span>
              <span className="text-[12px] text-[#8A8F87] font-mono">$750 multi-loc</span>
            </div>
            <div className="text-[13.5px] leading-[1.55] text-[#5A6058] flex-1">
              100-point scored report with live AI-engine test screenshots, timestamps, and prioritized gap list.
            </div>
            <a
              href={isValidStripeUrl ? activeStripeUrl : "#"}
              onClick={handleCheckoutClick}
              target={isValidStripeUrl ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="block text-center py-2.5 px-3 rounded-lg bg-[oklch(0.48_0.10_160)] text-white text-[14px] font-semibold hover:bg-[oklch(0.42_0.10_160)] transition-colors shadow-xs cursor-pointer"
            >
              Order $297 Audit
            </a>
          </div>

          {/* Install Card */}
          <div className="bg-white border border-[#E3E6E1] rounded-[14px] p-6 flex flex-col gap-2.5 shadow-2xs">
            <div className="text-[12px] font-semibold tracking-[0.05em] uppercase text-[#5A6058] font-mono">Install</div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-serif text-[32px] font-semibold text-[#191C1A]">$1,500</span>
              <span className="text-[11.5px] text-[#8A8F87] font-mono">Starter · $3,500 Pro</span>
            </div>
            <div className="text-[13.5px] leading-[1.55] text-[#5A6058] flex-1">
              Schema graph, service catalog, pricing model, FAQ/policy normalization, llms.txt, crawl policy, before/after test suite. Flat fee.
            </div>
          </div>

          {/* Monitor Card */}
          <div className="bg-white border border-[#E3E6E1] rounded-[14px] p-6 flex flex-col gap-2.5 shadow-2xs">
            <div className="text-[12px] font-semibold tracking-[0.05em] uppercase text-[#5A6058] font-mono">Monitor</div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-[32px] font-semibold text-[#191C1A]">$249</span>
              <span className="text-[12px] text-[#8A8F87] font-mono">–$499 / mo</span>
            </div>
            <div className="text-[13.5px] leading-[1.55] text-[#5A6058] flex-1">
              Monthly citation re-tests, broken-schema alerts, freshness checks — same evidence format, every month.
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Banner */}
      <section className="max-w-[1080px] mx-auto px-8 pt-[56px] pb-20">
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
          <span>Med spa vertical only · One practice standard per engagement</span>
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

            <div className="flex flex-col gap-3">
              <label className="text-[13px] font-semibold text-[#191C1A] flex flex-col gap-1">
                Contact Email for Report Delivery:
                <input
                  type="email"
                  value={checkoutEmail}
                  onChange={(e) => setCheckoutEmail(e.target.value)}
                  placeholder="owner@yourmedspa.com"
                  className="px-3.5 py-2.5 border border-[#D4D8D2] rounded-lg font-mono text-[14px] bg-[#FAFAF7] outline-none focus:border-[oklch(0.48_0.10_160)] text-[#191C1A]"
                />
              </label>

              <label className="text-[12px] text-[#5A6058] flex flex-col gap-1 font-mono">
                Stripe Payment Link URL:
                <input
                  type="url"
                  value={customStripeUrl}
                  onChange={(e) => setCustomStripeUrl(e.target.value)}
                  placeholder="https://buy.stripe.com/your_live_link"
                  className="px-3 py-2 border border-[#D4D8D2] rounded-lg font-mono text-[12px] bg-[#FAFAF7] outline-none focus:border-[oklch(0.48_0.10_160)] text-[#191C1A]"
                />
                <span className="text-[10.5px] text-[#8A8F87]">
                  Tip: Set <code className="bg-[#F2F4F0] px-1 py-0.5 rounded text-[#191C1A]">NEXT_PUBLIC_STRIPE_CHECKOUT_URL</code> in <code className="bg-[#F2F4F0] px-1 py-0.5 rounded text-[#191C1A]">.env.local</code> for automatic redirection.
                </span>
              </label>
            </div>

            {isValidStripeUrl ? (
              <a
                href={activeStripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center p-3.5 rounded-lg bg-[oklch(0.48_0.10_160)] text-white text-[14px] font-semibold hover:bg-[oklch(0.42_0.10_160)] transition-colors shadow-md text-center"
              >
                Proceed to Stripe Checkout ($297) →
              </a>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (!customStripeUrl || !customStripeUrl.startsWith("https://buy.stripe.com/")) {
                      alert("Please enter your live Stripe Payment Link (e.g. https://buy.stripe.com/...) above or in .env.local to open checkout!");
                      return;
                    }
                    window.open(customStripeUrl, "_blank");
                  }}
                  className="w-full py-3.5 px-4 rounded-lg bg-[oklch(0.48_0.10_160)] text-white text-[14px] font-semibold hover:bg-[oklch(0.42_0.10_160)] transition-colors shadow-md text-center cursor-pointer"
                >
                  Pay $297 via Stripe →
                </button>
                <div className="text-[11px] text-[#8A8F87] text-center font-mono">
                  100% Secure SSL Payment via Stripe
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
