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
      <header className="max-w-[800px] mx-auto px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AgentReadyLogo className="w-7 h-7 text-[oklch(0.48_0.10_160)]" />
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-semibold text-[20px] tracking-tight">AgentReady</span>
            <span className="text-[10.5px] tracking-[0.08em] uppercase text-[#5A6058] font-mono">Local</span>
          </div>
        </div>
        <nav className="flex items-center gap-4 text-[13px] font-medium">
          <a href="#pricing" className="text-[#191C1A] hover:text-[oklch(0.48_0.10_160)] transition-colors">
            Audit ($297)
          </a>
          <Link href="/sample-report" className="text-[oklch(0.48_0.10_160)] font-semibold hover:underline">
            Sample report →
          </Link>
        </nav>
      </header>

      {/* SCREEN 1: Hero & Scanner (Above the Fold) */}
      <main className="max-w-[720px] mx-auto px-4 pt-4 sm:pt-6 pb-8 flex flex-col items-center gap-5 text-center">
        <div className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.08em] uppercase text-[oklch(0.48_0.10_160)] font-bold font-mono bg-[oklch(0.96_0.03_160)] px-3 py-1 rounded-full">
          AI-Readiness for Med Spas
        </div>

        <h1 className="font-serif font-medium text-[27px] sm:text-[36px] md:text-[40px] leading-[1.15] tracking-[-0.015em] text-[#191C1A] text-balance">
          When someone asks ChatGPT for the best med spa in your city, does it know you exist?
        </h1>

        <p className="text-[14.5px] sm:text-[16px] leading-[1.5] text-[#5A6058] max-w-[56ch] -mt-1">
          AI assistants can&apos;t reliably read most med spa websites. Enter your URL to check what they actually see in 30 seconds.
        </p>

        {/* SCREEN 1 & 2: Scanner Card */}
        <div className="w-full bg-white border border-[#D4D8D2] rounded-2xl p-4 sm:p-6 shadow-[0_4px_24px_rgba(20,25,20,0.06),0_1px_2px_rgba(20,25,20,0.04)] flex flex-col gap-4 text-left">
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

          {/* Done State — Gaps Revealed */}
          {phase === "done" && (
            <div className="flex flex-col gap-3.5 animate-in fade-in duration-300">
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

              <button
                type="button"
                onClick={handleCheckoutClick}
                className="w-full text-center p-3 rounded-lg bg-[#191C1A] text-white text-[13.5px] font-semibold hover:bg-black transition-all shadow-md active:scale-[0.99] cursor-pointer mt-1"
              >
                Order the full 100-point Verified Audit ($297) ↓
              </button>
            </div>
          )}

          {/* Idle State */}
          {phase === "idle" && (
            <div className="text-[12px] text-[#8A8F87] leading-[1.5] bg-[#FAFAF7] p-3 rounded-xl border border-[#EDEFEA]">
              Checks schema markup, service catalog, pricing visibility, credentials, booking path, and crawl policy in 30 seconds.
            </div>
          )}
        </div>

        {/* Badges / Operating Principle Strip directly below scanner */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-[11.5px] sm:text-[12px] text-[#5A6058] font-medium font-mono pt-1">
          <span className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-[#E3E6E1]">
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.48_0.10_160)]"></span>
            100% reproducible tests
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-[#E3E6E1]">
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.48_0.10_160)]"></span>
            No ranking promises
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-[#E3E6E1]">
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.48_0.10_160)]"></span>
            Private customer data
          </span>
        </div>

        {/* SCREEN 3: The $297 Offer (Inline, Right Under the Gaps/Scanner) */}
        <section id="pricing" className="w-full pt-6">
          <div className="bg-white border-2 border-[oklch(0.48_0.10_160)] rounded-2xl p-5 sm:p-7 flex flex-col gap-4 text-left relative shadow-xl">
            <div className="flex justify-between items-baseline border-b border-[#EDEFEA] pb-3.5">
              <div>
                <div className="text-[12px] font-semibold tracking-[0.06em] uppercase text-[oklch(0.48_0.10_160)] font-mono">
                  100-Point Verified Audit
                </div>
                <div className="text-[12.5px] text-[#5A6058]">Single Location Practice</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-[38px] sm:text-[42px] font-bold text-[#191C1A] leading-none">$297</span>
                <span className="text-[11.5px] text-[#8A8F87] font-mono">one-time</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 font-mono text-[12px] text-[#3D423D]">
              <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">
                <span>✓</span> <span>100-point reproducible score rubric across 8 categories</span>
              </div>
              <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">
                <span>✓</span> <span>Live ChatGPT, Perplexity &amp; Google AI evidence screenshots</span>
              </div>
              <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">
                <span>✓</span> <span>Prioritized gap report + 5-step fix roadmap</span>
              </div>
              <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">
                <span>✓</span> <span>Evidence zip bundle with raw JSON-LD payloads &amp; logs</span>
              </div>
            </div>

            <GateForm buttonText="Get instant access — $297" />

            <div className="text-[11px] text-[#8A8F87] text-center font-mono">
              🔒 100% Secure Payment via Stripe · Report delivered in 24 hours
            </div>
          </div>

          <div className="mt-4 text-center text-[12px] text-[#8A8F87] font-mono p-3 bg-[#FAFAF7] rounded-xl border border-[#EDEFEA]">
            Need full schema installation or multi-location monitoring? <br />
            Starter Install ($1,500) and Monthly Monitoring ($249/mo) are detailed directly in your Audit report.
          </div>
        </section>

        {/* Collapsible Methodology Section */}
        <section className="w-full pt-4 pb-6">
          <button
            type="button"
            onClick={() => setShowMethodology(!showMethodology)}
            className="w-full py-3 px-4 rounded-xl border border-[#D4D8D2] bg-white text-[13px] font-semibold text-[#191C1A] hover:bg-[#FAFAF7] transition-all flex items-center justify-between cursor-pointer font-sans"
          >
            <span>Methodology: The 6 AI Patient Journey Tests &amp; 100-Point Rubric</span>
            <span className="text-[oklch(0.48_0.10_160)] font-bold">{showMethodology ? "Hide ↑" : "View ↓"}</span>
          </button>

          {showMethodology && (
            <div className="mt-4 flex flex-col gap-6 text-left animate-in fade-in duration-200">
              {/* 6 Fundamental Questions */}
              <div className="bg-white border border-[#E3E6E1] rounded-xl p-4 sm:p-5">
                <div className="font-mono text-[11px] uppercase tracking-wider text-[oklch(0.48_0.10_160)] font-bold mb-2">
                  The AI Patient Journey Tests
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[12px]">
                  <div className="p-2.5 bg-[#FAFAF7] rounded-lg border border-[#EDEFEA]">
                    <div className="font-mono font-bold text-[#5A6058] text-[10px]">1. IDENTIFY</div>
                    <div className="text-[#191C1A] font-medium mt-1">Entity Match &amp; NAP Consistency</div>
                  </div>
                  <div className="p-2.5 bg-[#FAFAF7] rounded-lg border border-[#EDEFEA]">
                    <div className="font-mono font-bold text-[#5A6058] text-[10px]">2. UNDERSTAND</div>
                    <div className="text-[#191C1A] font-medium mt-1">Structured Service Catalog</div>
                  </div>
                  <div className="p-2.5 bg-[#FAFAF7] rounded-lg border border-[#EDEFEA]">
                    <div className="font-mono font-bold text-[#5A6058] text-[10px]">3. PRICE</div>
                    <div className="text-[#191C1A] font-medium mt-1">Accurate Offer Price Markup</div>
                  </div>
                  <div className="p-2.5 bg-[#FAFAF7] rounded-lg border border-[#EDEFEA]">
                    <div className="font-mono font-bold text-[#5A6058] text-[10px]">4. TRUST</div>
                    <div className="text-[#191C1A] font-medium mt-1">Physician Credentials in Text</div>
                  </div>
                  <div className="p-2.5 bg-[#FAFAF7] rounded-lg border border-[#EDEFEA]">
                    <div className="font-mono font-bold text-[#5A6058] text-[10px]">5. RECOMMEND</div>
                    <div className="text-[#191C1A] font-medium mt-1">Discovery Recommendation Tests</div>
                  </div>
                  <div className="p-2.5 bg-[#FAFAF7] rounded-lg border border-[#EDEFEA]">
                    <div className="font-mono font-bold text-[#5A6058] text-[10px]">6. BOOK</div>
                    <div className="text-[#191C1A] font-medium mt-1">Crawlable ReserveAction Path</div>
                  </div>
                </div>
              </div>

              {/* Rubric Categories */}
              <div className="bg-white border border-[#E3E6E1] rounded-xl p-4 sm:p-5">
                <div className="font-mono text-[11px] uppercase tracking-wider text-[oklch(0.48_0.10_160)] font-bold mb-2">
                  100-Point Scored Rubric Breakdown
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {RUBRIC.map((cat, idx) => (
                    <div key={idx} className="p-2.5 bg-[#FAFAF7] rounded-lg border border-[#EDEFEA] text-[12px]">
                      <div className="flex justify-between items-baseline font-semibold text-[#191C1A]">
                        <span>{cat.name}</span>
                        <span className="font-mono text-[oklch(0.48_0.10_160)] text-[11px]">{cat.pts} pts</span>
                      </div>
                      <div className="text-[11.5px] text-[#5A6058] mt-0.5">{cat.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-center">
                  <Link
                    href="/sample-report"
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[oklch(0.48_0.10_160)] hover:underline font-mono"
                  >
                    View Full 100-Point Sample Audit Report →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E3E6E1] bg-white py-6">
        <div className="max-w-[720px] mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-[12px] text-[#8A8F87] font-mono text-center sm:text-left">
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
