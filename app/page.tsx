"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import AgentReadyLogo from "./components/AgentReadyLogo";
import GateForm from "./components/GateForm";
import ScanGateForm from "./components/ScanGateForm";



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

interface CheckItem {
  id: string;
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  publicSummary: string;
}

interface UnlockedGap {
  checkId: string;
  name: string;
  code: string;
  category: string;
  defect: string;
  chatGptObservation: string;
  oneLineFix: string;
}

export default function FunnelPage() {
  const [domain, setDomain] = useState("");
  const [phase, setPhase] = useState<"idle" | "running" | "gated" | "done" | "blocked" | "unreachable">("idle");
  const [checkLog, setCheckLog] = useState<string[]>([]);
  const [currentCheck, setCurrentCheck] = useState("");
  const [score, setScore] = useState(0);
  const [scoreHeadline, setScoreHeadline] = useState("");
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [failedCount, setFailedCount] = useState(0);
  const [unlockedGaps, setUnlockedGaps] = useState<UnlockedGap[]>([]);
  const [scanDomain, setScanDomain] = useState("");
  const [scanTimestamp, setScanTimestamp] = useState("");
  const [scanStatus, setScanStatus] = useState<"success" | "blocked" | "unreachable">("success");
  const [showMethodology, setShowMethodology] = useState(false);
  const [showScopeIntake, setShowScopeIntake] = useState(false);

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

  const runScan = async () => {
    const raw = (domain || "lakeshoreskin.com").trim();
    const d = raw
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "")
      .replace(/^www\./i, "");

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

    // Progress animation steps alongside API probe
    let i = 0;
    const animationPromise = new Promise<void>((resolve) => {
      const step = () => {
        i++;
        if (i < CHECKS.length) {
          setCheckLog((prev) => [...prev, CHECKS[i - 1]]);
          setCurrentCheck(CHECKS[i]);
          timerRef.current = setTimeout(step, 600);
        } else {
          resolve();
        }
      };
      timerRef.current = setTimeout(step, 600);
    });

    try {
      const [scanRes] = await Promise.all([
        fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: d }),
        }).then((r) => r.json()),
        animationPromise,
      ]);

      if (scanRes.status === "blocked") {
        setScanStatus("blocked");
        setScore(0);
        setScoreHeadline(scanRes.scoreHeadline || `We couldn't scan ${d} automatically — your site is blocking automated requests.`);
        setFailedCount(6);
        setChecks([]);
        setPhase("blocked");
        return;
      }

      if (scanRes.status === "unreachable") {
        setScanStatus("unreachable");
        setScore(0);
        setScoreHeadline(scanRes.scoreHeadline || `Couldn't reach ${d} — host is unreachable or offline.`);
        setFailedCount(6);
        setChecks([]);
        setPhase("unreachable");
        return;
      }

      // Success
      setScanStatus("success");
      setScore(scanRes.score);
      setScoreHeadline(scanRes.scoreHeadline);
      setChecks(scanRes.checks || []);
      setFailedCount(scanRes.failedCount ?? 0);
      setPhase("gated");

      // Fire ScanCompleted Meta Pixel custom event
      if (typeof window !== "undefined" && window.fbq) {
        try {
          window.fbq("trackCustom", "ScanCompleted", { domain: d, score: scanRes.score });
        } catch (e) {}
      }
    } catch (err) {
      console.error("Scan fetch error:", err);
      setScanStatus("unreachable");
      setScore(0);
      setScoreHeadline(`Couldn't reach ${d} — connection timed out or host is offline.`);
      setFailedCount(6);
      setChecks([]);
      setPhase("unreachable");
    }
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

      {/* Hero & Surface Scan */}
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
            Your future patient may never visit Google or your website. Their AI assistant may choose who gets considered, compared and booked. We test whether your clinic survives that decision.
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

          {/* State 3: Gated Email Capture State */}
          {phase === "gated" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              {/* 3.1 Score Block */}
              <div className="flex items-center gap-4 bg-[#F2F4F0] rounded-[12px] p-4 border border-[#E3E6E1]">
                <div className="flex flex-col items-center justify-center min-w-[76px] py-1 bg-white rounded-lg border border-[#E3E6E1] shadow-2xs">
                  <div className="font-serif text-[36px] font-semibold text-[#B3261E] leading-none">{score}</div>
                  <div className="text-[10px] tracking-[0.06em] uppercase text-[#5A6058] font-mono mt-0.5">of 100</div>
                </div>
                <div className="text-[13.5px] leading-[1.5] text-[#3D423D]">
                  {scoreHeadline}
                </div>
              </div>

              {/* 3.2 Six Check Results List */}
              <div className="flex flex-col gap-1.5 bg-[#FAFAF7] p-3 sm:p-3.5 rounded-xl border border-[#EDEFEA] font-mono text-[12.5px]">
                <div className="text-[10.5px] tracking-wider uppercase text-[#8A8F87] font-semibold pb-1 border-b border-[#EDEFEA] flex justify-between">
                  <span>SURFACE CRITERIA</span>
                  <span>STATUS</span>
                </div>
                {checks.map((check) => (
                  <div key={check.id} className="flex items-center justify-between py-1.5 border-b border-[#F0F2ED] last:border-0">
                    <div className="flex items-center gap-2">
                      {check.passed ? (
                        <span className="text-[oklch(0.48_0.10_160)] font-bold text-[14px]">✓</span>
                      ) : (
                        <span className="text-[#B3261E] font-bold text-[14px]">✗</span>
                      )}
                      <span className="text-[#191C1A] font-sans font-medium text-[13px]">{check.name}</span>
                    </div>
                    <div className="text-[12px] text-right font-sans">
                      {check.passed ? (
                        <span className="text-[#5A6058]">{check.publicSummary}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#8A8F87] bg-[#ECEEE9] px-2 py-0.5 rounded text-[11px] font-medium font-mono">
                          🔒 Locked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* State 4: Email Gate Form */}
              <ScanGateForm
                scanDomain={scanDomain}
                scanScore={score}
                failedCount={failedCount}
                scanStatus={scanStatus}
                onUnlock={(findings) => {
                  setUnlockedGaps(findings);
                  setPhase("done");
                }}
              />
            </div>
          )}

          {/* Blocked by WAF State */}
          {phase === "blocked" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex flex-col gap-2 bg-[oklch(0.98_0.02_45)] border border-[oklch(0.88_0.05_45)] rounded-xl p-4 text-[#4A3820]">
                <div className="flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-[#A04000]">
                  <span>⚠️ Automated Scan Blocked by Firewall</span>
                </div>
                <div className="text-[13px] leading-[1.5] text-[#3D423D]">
                  <strong className="text-[#191C1A]">{scanDomain}</strong> is actively blocking automated crawler requests via Cloudflare, Wordfence, or WAF rules. That often means AI assistants (ChatGPT, Claude, Perplexity) are also barred from reading your clinic&apos;s business facts.
                </div>
              </div>

              <ScanGateForm
                scanDomain={scanDomain}
                scanScore={0}
                failedCount={6}
                scanStatus="blocked"
                onUnlock={(findings) => {
                  setUnlockedGaps(findings);
                  setPhase("done");
                }}
              />
            </div>
          )}

          {/* Unreachable State */}
          {phase === "unreachable" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex flex-col gap-2 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl p-4 text-[#8C1D18]">
                <div className="flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-[#B3261E]">
                  <span>Host Unreachable</span>
                </div>
                <div className="text-[13px] leading-[1.5] text-[#3D423D]">
                  We couldn&apos;t reach <strong className="text-[#191C1A]">{scanDomain}</strong>. Please confirm the website is online and spelled correctly.
                </div>
              </div>

              <ScanGateForm
                scanDomain={scanDomain}
                scanScore={0}
                failedCount={6}
                scanStatus="unreachable"
                onUnlock={(findings) => {
                  setUnlockedGaps(findings);
                  setPhase("done");
                }}
              />
            </div>
          )}

          {/* Done State: Post-Submit Inline Unlock */}
          {phase === "done" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center font-mono text-[10px] text-[#8A8F87] bg-[#FAFAF7] px-3 py-1.5 rounded-lg border border-[#EDEFEA]">
                <span>source: AgentReady Surface Crawler</span>
                <span>observed_at {scanTimestamp}</span>
                <span className="text-[oklch(0.48_0.10_160)] font-semibold">unlocked</span>
              </div>

              {scanStatus === "success" && (
                <div className="flex items-center gap-4 bg-[#F2F4F0] rounded-[12px] p-4 border border-[#E3E6E1]">
                  <div className="flex flex-col items-center justify-center min-w-[76px] py-1 bg-white rounded-lg border border-[#E3E6E1] shadow-2xs">
                    <div className="font-serif text-[36px] font-semibold text-[#B3261E] leading-none">{score}</div>
                    <div className="text-[10px] tracking-[0.06em] uppercase text-[#5A6058] font-mono mt-0.5">of 100</div>
                  </div>
                  <div className="text-[13.5px] leading-[1.5] text-[#3D423D]">
                    {scoreHeadline}
                  </div>
                </div>
              )}

              {/* Zero-Gap Success Banner */}
              {failedCount === 0 && (
                <div className="flex flex-col gap-2 bg-[oklch(0.96_0.03_160)] border border-[oklch(0.85_0.06_160)] rounded-xl p-4 text-[#1E4A35]">
                  <div className="font-bold text-[14.5px] flex items-center gap-2 text-[oklch(0.38_0.12_160)]">
                    <span>✓ All 6 surface checks passed</span>
                  </div>
                  <p className="text-[13px] text-[#2C5240] leading-[1.5]">
                    Your domain provides clean machine-readable surface data. As AI search engines refresh their training pipelines and retrieval algorithms monthly, keeping these facts synchronized requires continuous verification.
                  </p>
                </div>
              )}

              {/* Unlocked Gap Findings List */}
              {unlockedGaps.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <div className="text-[12px] font-mono uppercase text-[#5A6058] font-semibold">
                    Identified Gaps ({unlockedGaps.length}):
                  </div>
                  {unlockedGaps.map((gap, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5 text-[13px] leading-[1.45] bg-[#FAFAF7] p-3 rounded-lg border border-[#EDEFEA]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10.5px] text-[#B3261E] bg-[oklch(0.95_0.02_25)] border border-[oklch(0.90_0.04_25)] rounded px-1.5 py-0.5 whitespace-nowrap font-medium">
                            {gap.code}
                          </span>
                          <span className="text-[#191C1A] font-semibold text-[13px]">{gap.name}</span>
                        </div>
                        <span className="text-[10px] uppercase font-mono text-[#8A8F87]">{gap.category}</span>
                      </div>
                      <div className="text-[12.5px] text-[#3D423D]">
                        <strong>Defect:</strong> {gap.defect}
                      </div>
                      <div className="text-[12.5px] text-[#5A6058] bg-white p-2 rounded border border-[#EDEFEA] font-sans">
                        <strong>AI Assistant View:</strong> &ldquo;{gap.chatGptObservation}&rdquo;
                      </div>
                      <div className="text-[12px] text-[oklch(0.40_0.10_160)] font-medium font-mono">
                        → Fix: {gap.oneLineFix}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* $297 Offer CTA Directly Below Unlocked Findings */}
              <button
                type="button"
                onClick={handleCheckoutClick}
                className="w-full text-center p-3.5 rounded-lg bg-[#191C1A] text-white text-[14px] font-semibold hover:bg-black transition-all shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
              >
                Get the full 100-point Verified Audit — $297 ↓
              </button>
              <div className="text-[11.5px] text-[#8A8F87] text-center font-mono">
                The full audit inspects markup and runs live query tests with timestamps &amp; evidence captures.
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

      {/* $297 OFFER CARD MOVED UP, DIRECTLY UNDER SCANNER / GAPS */}
      <section id="pricing" className="max-w-[1080px] mx-auto px-4 sm:px-8 pt-2 pb-12">
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-[oklch(0.48_0.10_160)] font-mono bg-[oklch(0.96_0.03_160)] px-3 py-1 rounded-full">
            Single Flat-Fee Engagement
          </div>
          <h2 className="font-serif text-[34px] sm:text-[40px] font-medium tracking-tight text-[#191C1A]">
            Get Your 100-Point Verified Audit
          </h2>
          <p className="text-[15px] text-[#5A6058] max-w-[54ch]">
            Public markup review, attempted live AI query tests, evidence captures, and a prioritized 5-step remediation roadmap. One flat fee, zero recurring commitment.
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
              <span>✓</span> <span>100-point rubric covering identity, pricing, trust &amp; crawl policy</span>
            </div>
            <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">
              <span>✓</span> <span>Attempted ChatGPT, Perplexity &amp; Google AI query tests</span>
            </div>
            <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">
              <span>✓</span> <span>Prioritized gap report + 5-step remediation roadmap</span>
            </div>
            <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">
              <span>✓</span> <span>Evidence ZIP with source captures, manifest &amp; artifact hashes</span>
            </div>
          </div>

          <GateForm
            buttonText="Order Verified Audit — $297"
            scannedDomain={scanDomain}
            scanScore={score}
          />

          <div className="text-[13px] text-[#3D423D] text-center font-mono pt-2 font-medium leading-snug">
            Payment via Stripe · Target delivery within 24 hours after payment and required intake.
          </div>
        </div>

        {/* Scope Note Below Offer */}
        <div className="mt-6 text-center text-[13px] text-[#3D423D] font-sans max-w-[620px] mx-auto bg-[#FAFAF7] px-5 py-3.5 rounded-xl border border-[#EDEFEA] leading-relaxed">
          Covers one practice location. Website implementation and ongoing monitoring are purchased separately. Inaccessible engine tests are marked pending; incomplete evidence does not receive a complete audit score.
        </div>

        {/* Secondary Enterprise Footnote */}
        <div className="mt-3 text-center text-[12px] text-[#8A8F87] font-mono max-w-[620px] mx-auto">
          Need full schema graph implementation or multi-location monitoring? <br />
          <span className="text-[#3D423D] font-medium">Starter Install ($1,500)</span> and <span className="text-[#3D423D] font-medium">Monthly Monitoring ($249/mo)</span> options are detailed directly in your Audit report.
        </div>
      </section>

      {/* Expandable Section: Audit Scope & Intake */}
      <section className="max-w-[1080px] mx-auto px-4 sm:px-8 pb-4">
        <button
          type="button"
          onClick={() => setShowScopeIntake(!showScopeIntake)}
          className="w-full py-4 px-5 rounded-2xl border border-[#D4D8D2] bg-white text-[14px] font-semibold text-[#191C1A] hover:bg-[#FAFAF7] transition-all flex items-center justify-between cursor-pointer font-sans shadow-2xs"
        >
          <span className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] text-[oklch(0.48_0.10_160)] bg-[oklch(0.96_0.03_160)] px-2.5 py-0.5 rounded font-bold uppercase">
              Audit Scope &amp; Intake
            </span>
            <span>Required Intake Information &amp; Multi-Location Scope</span>
          </span>
          <span className="text-[oklch(0.48_0.10_160)] font-mono font-bold text-[13px]">
            {showScopeIntake ? "Hide Details ↑" : "View Details ↓"}
          </span>
        </button>

        {showScopeIntake && (
          <div className="mt-4 bg-white border border-[#E3E6E1] rounded-2xl p-6 sm:p-8 animate-in fade-in duration-200 flex flex-col gap-6 text-[14px] leading-relaxed text-[#3D423D]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <h4 className="font-serif text-[18px] font-semibold text-[#191C1A]">
                  Required Intake Information
                </h4>
                <p className="text-[13.5px] text-[#5A6058]">
                  After payment, the buyer provides the practice details needed to verify authoritative facts:
                </p>
                <ul className="space-y-2 text-[13.5px] font-mono">
                  <li className="flex items-start gap-2">
                    <span className="text-[oklch(0.48_0.10_160)] font-bold">1.</span>
                    <span><strong>Canonical website URL:</strong> Official domain for technical inspection.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[oklch(0.48_0.10_160)] font-bold">2.</span>
                    <span><strong>Practice name &amp; city:</strong> Legal/trading name and physical municipality.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[oklch(0.48_0.10_160)] font-bold">3.</span>
                    <span><strong>Location count:</strong> Single clinic location vs. multi-location group.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[oklch(0.48_0.10_160)] font-bold">4.</span>
                    <span><strong>Delivery email:</strong> Working email for report delivery and clarification.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[oklch(0.48_0.10_160)] font-bold">5.</span>
                    <span><strong>Owner confirmation of disputed facts:</strong> Authoritative corrections for address, services, pricing model, licensed providers, and booking URLs.</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="font-serif text-[18px] font-semibold text-[#191C1A]">
                  Single vs. Multi-Location Scope
                </h4>
                <p className="text-[13.5px] text-[#5A6058]">
                  The <strong>$297 Verified Audit</strong> covers exactly one physical clinic location.
                </p>
                <div className="p-4 bg-[#FAFAF7] rounded-xl border border-[#EDEFEA] flex flex-col gap-2">
                  <div className="font-bold text-[#191C1A] text-[13.5px]">
                    $750 Multi-Location Audit
                  </div>
                  <p className="text-[13px] text-[#5A6058] leading-normal">
                    Practices with 2 or more locations require the separate <strong>$750 Multi-Location Audit</strong>. It includes cross-location NAP consistency, directory disambiguation, and separate query tests for each individual location market.
                  </p>
                </div>
                <div className="text-[12px] text-[#8A8F87] font-mono leading-normal mt-1">
                  *No shared passwords or login credentials are required. Real appointments are never booked, and no patient or customer data is transmitted.
                </div>
              </div>
            </div>
          </div>
        )}
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
                  View the live evidence sample →
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
            We do not promise rankings. AI engines are third parties we don&apos;t control. The Verified Audit provides evidence testing, gap analysis, and a prioritized remediation roadmap. Implementation and continuous monitoring belong to the separate Foundation Install and Monitoring services. Every stated fact carries its source, timestamp, and verification status.
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
              View the live evidence sample →
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
              <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">✓ Attempted ChatGPT, Perplexity &amp; Google AI query tests</div>
              <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">✓ Prioritized gap report + 5-step remediation roadmap</div>
              <div className="flex items-center gap-2 text-[oklch(0.48_0.10_160)]">✓ Evidence ZIP bundle with manifest &amp; artifact hashes</div>
            </div>

            <GateForm
              buttonText="Order Verified Audit — $297"
              onSuccess={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
