import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verified Audit Sample Report — Lakeshore Skin & Laser | MetalMindTech LLC",
  description: "100-point scored AI-readiness sample audit report for Lakeshore Skin & Laser in Edina, MN.",
};

interface EvidenceBlockProps {
  testId: string;
  engine: string;
  timestamp: string;
  confidence: string;
  query: string;
  observed: string;
  verdict: string;
  verdictColor: "fail" | "warn" | "pass";
  placeholderText: string;
}

function EvidenceBlock({
  testId,
  engine,
  timestamp,
  confidence,
  query,
  observed,
  verdict,
  verdictColor,
  placeholderText,
}: EvidenceBlockProps) {
  const textColorClass =
    verdictColor === "fail"
      ? "text-[#B3261E]"
      : verdictColor === "warn"
      ? "text-[#B45309]"
      : "text-[oklch(0.48_0.10_160)]";

  return (
    <div className="evd border border-[#E3E6E1] rounded-[10px] overflow-hidden mb-4 break-inside-avoid shadow-2xs">
      <div className="flex justify-between items-center gap-3 bg-[#F2F4F0] px-4 py-2.5 font-mono text-[9pt] text-[#3D423D] border-b border-[#E3E6E1]">
        <span>
          {testId} · {engine}
        </span>
        <span className="flex items-center gap-2">
          <span>observed_at {timestamp}</span>
          <span className="text-[#8A8F87]">·</span>
          <span>confidence {confidence}</span>
          <span className="text-[#8A8F87]">·</span>
          <span className="text-[oklch(0.48_0.10_160)] font-semibold uppercase">verified</span>
        </span>
      </div>
      <div className="p-[14px_16px] flex flex-col gap-2.5 bg-white">
        <div className="text-[10.5pt]">
          <span className="text-[#5A6058] font-medium">Query:</span>{" "}
          <span className="font-mono text-[10pt] text-[#191C1A]">{query}</span>
        </div>
        <div className="text-[10.5pt] leading-[1.6] text-[#3D423D]">
          <span className="text-[#5A6058] font-medium">Observed:</span> {observed}
        </div>
        <div className="text-[10.5pt]">
          <span className="text-[#5A6058] font-medium">Verdict:</span>{" "}
          <strong className={textColorClass}>{verdict}</strong>
        </div>

        {/* Screenshot Slot Placeholder */}
        <div className="w-full h-[180px] bg-[#FAFAF7] border border-dashed border-[#D4D8D2] rounded-md flex flex-col items-center justify-center p-4 text-center text-[#5A6058] font-mono text-[9pt] mt-1">
          <svg className="w-8 h-8 mb-2 text-[#8A8F87]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-semibold text-[#191C1A]">{placeholderText}</span>
          <span className="text-[8pt] text-[#8A8F87] mt-1">[Verified Screenshot Artifact · Stored per Audit]</span>
        </div>
      </div>
    </div>
  );
}

export default function SampleReportPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#191C1A] font-sans selection:bg-[oklch(0.90_0.05_160)]">
      {/* Backbar */}
      <div id="backbar" className="flex justify-between items-center px-8 py-3.5 text-[13px] border-b border-[#E3E6E1] bg-white font-mono">
        <Link href="/" className="text-[oklch(0.48_0.10_160)] font-medium hover:underline flex items-center gap-1">
          ← Back to AgentReady Local
        </Link>
        <div className="text-[11px] text-[#5A6058] hidden sm:block">
          MetalMindTech LLC · High-Growth Aesthetic Markets
        </div>
      </div>

      {/* Main Printable Document */}
      <main className="max-w-[920px] mx-auto my-8 bg-white p-8 md:p-[0.8in] shadow-sm rounded-lg print:shadow-none print:m-0 print:p-0 print:max-w-none border border-[#E3E6E1] print:border-none">
        {/* Document Header */}
        <div className="flex justify-between items-start gap-6 border-b-2 border-[#191C1A] pb-[18px]">
          <div className="flex flex-col gap-1.5">
            <div className="text-[10.5pt] tracking-[0.12em] uppercase text-[oklch(0.48_0.10_160)] font-bold font-mono">
              Verified Audit — Sample Report
            </div>
            <h1 className="font-serif text-[26pt] font-medium leading-tight tracking-tight text-[#191C1A]">
              Lakeshore Skin &amp; Laser
            </h1>
            <div className="font-mono text-[10pt] text-[#5A6058]">
              lakeshoreskin.com · High-Growth Metro Market · single location
            </div>
          </div>
          <div className="text-right text-[10pt] text-[#5A6058] leading-[1.7] font-mono">
            <div>
              Report <span className="font-bold text-[#191C1A]">ARL-2026-0114</span>
            </div>
            <div>Audited Aug 4, 2026</div>
            <div>AgentReady Local · MetalMindTech</div>
          </div>
        </div>

        {/* Provenance Non-Negotiable Rule Banner */}
        <div className="my-4 bg-[#F2F4F0] border border-[#E3E6E1] rounded-lg p-3 text-[10pt] font-mono text-[#3D423D] flex justify-between items-center flex-wrap gap-2">
          <span><strong>PRODUCT RULE:</strong> No fabricated scores, rankings, or evidence.</span>
          <span className="text-[9pt] text-[#5A6058]">Every stated fact carries source, observed_at, confidence &amp; verification status.</span>
        </div>

        {/* Score Box & Overview */}
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-[36px] items-center mt-[20px] break-inside-avoid">
          <div className="flex flex-col items-center gap-0.5 border-2 border-[#191C1A] rounded-[14px] p-[22px_32px] bg-[#FAFAF7]">
            <div className="font-serif text-[46pt] font-semibold leading-none text-[#B3261E]">41</div>
            <div className="text-[9.5pt] tracking-[0.08em] uppercase text-[#5A6058] font-mono font-medium mt-1">of 100 points</div>
          </div>
          <p className="margin-0 text-[11.5pt] leading-[1.65] text-[#3D423D] text-pretty">
            Lakeshore Skin &amp; Laser is largely invisible to AI assistants. In live tests, ChatGPT could not name the practice for local med spa queries, Perplexity cited a competitor&apos;s pricing when asked about Lakeshore&apos;s, and no engine could describe a booking path. The causes are specific and fixable: no structured service catalog, credentials locked in images, and a JavaScript-only booking flow. Each finding below is a reproducible test with stored evidence.
          </p>
        </div>

        {/* Score by Category */}
        <h2 className="font-serif text-[16pt] font-medium mt-[32px] mb-[12px] text-[#191C1A]">Score by category</h2>
        <table className="w-full border-collapse text-[10.5pt]">
          <thead>
            <tr className="text-left text-[#5A6058] text-[9pt] tracking-[0.06em] uppercase font-mono">
              <th className="py-[6px] border-b border-[#D4D8D2] font-semibold">Category</th>
              <th className="py-[6px] border-b border-[#D4D8D2] font-semibold w-[90px]">Score</th>
              <th className="py-[6px] border-b border-[#D4D8D2] font-semibold w-[220px]"></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-[7px] border-b border-[#EDEFEA] font-medium text-[#191C1A]">Identity</td>
              <td className="font-mono py-[7px] border-b border-[#EDEFEA]">9 / 15</td>
              <td className="py-[7px] border-b border-[#EDEFEA]">
                <div className="bg-[#EDEFEA] rounded-[3px] h-[8px] overflow-hidden">
                  <div className="w-[60%] h-[8px] rounded-[3px] bg-[oklch(0.48_0.10_160)]"></div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="py-[7px] border-b border-[#EDEFEA] font-medium text-[#191C1A]">Services + pricing</td>
              <td className="font-mono py-[7px] border-b border-[#EDEFEA]">3 / 15</td>
              <td className="py-[7px] border-b border-[#EDEFEA]">
                <div className="bg-[#EDEFEA] rounded-[3px] h-[8px] overflow-hidden">
                  <div className="w-[20%] h-[8px] rounded-[3px] bg-[#B3261E]"></div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="py-[7px] border-b border-[#EDEFEA] font-medium text-[#191C1A]">Trust</td>
              <td className="font-mono py-[7px] border-b border-[#EDEFEA]">6 / 15</td>
              <td className="py-[7px] border-b border-[#EDEFEA]">
                <div className="bg-[#EDEFEA] rounded-[3px] h-[8px] overflow-hidden">
                  <div className="w-[40%] h-[8px] rounded-[3px] bg-[#B45309]"></div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="py-[7px] border-b border-[#EDEFEA] font-medium text-[#191C1A]">Machine-readable content</td>
              <td className="font-mono py-[7px] border-b border-[#EDEFEA]">7 / 15</td>
              <td className="py-[7px] border-b border-[#EDEFEA]">
                <div className="bg-[#EDEFEA] rounded-[3px] h-[8px] overflow-hidden">
                  <div className="w-[47%] h-[8px] rounded-[3px] bg-[#B45309]"></div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="py-[7px] border-b border-[#EDEFEA] font-medium text-[#191C1A]">Actions</td>
              <td className="font-mono py-[7px] border-b border-[#EDEFEA]">2 / 15</td>
              <td className="py-[7px] border-b border-[#EDEFEA]">
                <div className="bg-[#EDEFEA] rounded-[3px] h-[8px] overflow-hidden">
                  <div className="w-[13%] h-[8px] rounded-[3px] bg-[#B3261E]"></div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="py-[7px] border-b border-[#EDEFEA] font-medium text-[#191C1A]">Crawl policy</td>
              <td className="font-mono py-[7px] border-b border-[#EDEFEA]">5 / 10</td>
              <td className="py-[7px] border-b border-[#EDEFEA]">
                <div className="bg-[#EDEFEA] rounded-[3px] h-[8px] overflow-hidden">
                  <div className="w-[50%] h-[8px] rounded-[3px] bg-[#B45309]"></div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="py-[7px] border-b border-[#EDEFEA] font-medium text-[#191C1A]">Security</td>
              <td className="font-mono py-[7px] border-b border-[#EDEFEA]">7 / 10</td>
              <td className="py-[7px] border-b border-[#EDEFEA]">
                <div className="bg-[#EDEFEA] rounded-[3px] h-[8px] overflow-hidden">
                  <div className="w-[70%] h-[8px] rounded-[3px] bg-[oklch(0.48_0.10_160)]"></div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="py-[7px] border-b border-[#EDEFEA] font-medium text-[#191C1A]">Freshness</td>
              <td className="font-mono py-[7px] border-b border-[#EDEFEA]">2 / 5</td>
              <td className="py-[7px] border-b border-[#EDEFEA]">
                <div className="bg-[#EDEFEA] rounded-[3px] h-[8px] overflow-hidden">
                  <div className="w-[40%] h-[8px] rounded-[3px] bg-[#B45309]"></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Critical Gaps */}
        <h2 className="font-serif text-[16pt] font-medium mt-[32px] mb-[12px] text-[#191C1A]">Critical gaps</h2>
        <div className="flex flex-col gap-3">
          <div className="border border-[#E3E6E1] rounded-lg p-[14px_16px] break-inside-avoid bg-[#FAFAF7]">
            <div className="flex gap-2.5 items-baseline mb-1">
              <span className="font-mono text-[9pt] text-[#B3261E] bg-[oklch(0.95_0.02_25)] border border-[oklch(0.90_0.04_25)] rounded px-1.5 py-0.5">
                SVC-04
              </span>
              <strong className="text-[11pt] text-[#191C1A]">No structured service catalog</strong>
            </div>
            <div className="text-[10.5pt] leading-[1.6] text-[#3D423D]">
              Services and prices exist only as styled text inside a page builder. No Service or Offer schema anywhere on the site. Agents asked &quot;how much is Botox at Lakeshore&quot; either decline to answer or quote a competitor.
            </div>
          </div>

          <div className="border border-[#E3E6E1] rounded-lg p-[14px_16px] break-inside-avoid bg-[#FAFAF7]">
            <div className="flex gap-2.5 items-baseline mb-1">
              <span className="font-mono text-[9pt] text-[#B3261E] bg-[oklch(0.95_0.02_25)] border border-[oklch(0.90_0.04_25)] rounded px-1.5 py-0.5">
                ACT-01
              </span>
              <strong className="text-[11pt] text-[#191C1A]">Booking path invisible to agents</strong>
            </div>
            <div className="text-[10.5pt] leading-[1.6] text-[#3D423D]">
              Booking runs through a JavaScript widget with no crawlable fallback, no ReserveAction schema, and no booking URL an engine can cite. Every engine tested answered &quot;call the business&quot; or produced no path at all.
            </div>
          </div>

          <div className="border border-[#E3E6E1] rounded-lg p-[14px_16px] break-inside-avoid bg-[#FAFAF7]">
            <div className="flex gap-2.5 items-baseline mb-1">
              <span className="font-mono text-[9pt] text-[#B3261E] bg-[oklch(0.95_0.02_25)] border border-[oklch(0.90_0.04_25)] rounded px-1.5 py-0.5">
                TRS-03
              </span>
              <strong className="text-[11pt] text-[#191C1A]">Credentials locked in images</strong>
            </div>
            <div className="text-[10.5pt] leading-[1.6] text-[#3D423D]">
              Practitioner licensure and certifications appear only as JPEG badges. No Person or MedicalOrganization schema, no text-form credentials. Engines cannot verify who performs treatments — a direct hit to recommendation confidence.
            </div>
          </div>
        </div>

        {/* Live AI-Engine Tests */}
        <h2 className="font-serif text-[16pt] font-medium mt-[32px] mb-1.5 page-break text-[#191C1A]">Live AI-engine tests</h2>
        <p className="mt-0 mb-4 text-[10.5pt] text-[#5A6058] leading-[1.6]">
          Each query was run live and screenshotted. Every result carries source, timestamp, confidence, and verification status. All tests re-run after install for the before/after comparison.
        </p>

        <EvidenceBlock
          testId="TEST L-01"
          engine="ChatGPT (GPT-5)"
          timestamp="2026-08-04T14:12Z"
          confidence="high"
          query='"best med spa in Edina MN"'
          observed="Named four competitors with addresses and specialties. Lakeshore Skin & Laser not mentioned in the response or in cited sources."
          verdict="FAIL — not surfaced"
          verdictColor="fail"
          placeholderText="Drop screenshot: ChatGPT response, 2026-08-04"
        />

        <EvidenceBlock
          testId="TEST L-02"
          engine="Perplexity"
          timestamp="2026-08-04T14:31Z"
          confidence="high"
          query='"Botox pricing at Lakeshore Skin and Laser Edina"'
          observed={`Answered with a competitor's per-unit price attributed to "Edina area med spas," citing an aggregator page. Lakeshore's own pricing page not cited.`}
          verdict="FAIL — wrong facts attributed"
          verdictColor="fail"
          placeholderText="Drop screenshot: Perplexity response, 2026-08-04"
        />

        <EvidenceBlock
          testId="TEST L-03"
          engine="Google AI Overview"
          timestamp="2026-08-04T14:47Z"
          confidence="medium"
          query='"book laser hair removal Edina"'
          observed="Overview listed three bookable competitors with direct scheduling links. Lakeshore appeared in map results only, with no booking path or service detail."
          verdict="PARTIAL — surfaced without actions"
          verdictColor="warn"
          placeholderText="Drop screenshot: Google AI Overview, 2026-08-04"
        />

        {/* Detailed Findings */}
        <h2 className="font-serif text-[16pt] font-medium mt-[32px] mb-3 page-break text-[#191C1A]">Detailed findings</h2>
        <table className="w-full border-collapse text-[10pt]">
          <thead>
            <tr className="text-left text-[#5A6058] text-[9pt] tracking-[0.06em] uppercase font-mono">
              <th className="py-1.5 pr-2 border-b border-[#D4D8D2] font-semibold w-[70px]">Test</th>
              <th className="py-1.5 px-2 border-b border-[#D4D8D2] font-semibold">Check</th>
              <th className="py-1.5 px-2 border-b border-[#D4D8D2] font-semibold w-[80px]">Result</th>
              <th className="py-1.5 pl-2 border-b border-[#D4D8D2] font-semibold w-[55px]">Points</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1.5 pr-2 border-b border-[#EDEFEA] font-mono text-[9pt]">IDN-01</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA]">LocalBusiness schema present with legal name + address</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA] text-[oklch(0.48_0.10_160)] font-semibold font-mono">Pass</td>
              <td className="py-1.5 pl-2 border-b border-[#EDEFEA] font-mono">4 / 4</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-2 border-b border-[#EDEFEA] font-mono text-[9pt]">IDN-02</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA]">NAP consistent across site, GBP, and top directories</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA] text-[#B45309] font-semibold font-mono">Partial</td>
              <td className="py-1.5 pl-2 border-b border-[#EDEFEA] font-mono">3 / 6</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-2 border-b border-[#EDEFEA] font-mono text-[9pt]">IDN-03</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA]">Entity disambiguation (sameAs links, GBP match)</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA] text-[#B45309] font-semibold font-mono">Partial</td>
              <td className="py-1.5 pl-2 border-b border-[#EDEFEA] font-mono">2 / 5</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-2 border-b border-[#EDEFEA] font-mono text-[9pt]">SVC-01</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA]">Service schema for each treatment offered</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA] text-[#B3261E] font-semibold font-mono">Fail</td>
              <td className="py-1.5 pl-2 border-b border-[#EDEFEA] font-mono">0 / 5</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-2 border-b border-[#EDEFEA] font-mono text-[9pt]">SVC-04</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA]">Offer/price markup agents can quote</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA] text-[#B3261E] font-semibold font-mono">Fail</td>
              <td className="py-1.5 pl-2 border-b border-[#EDEFEA] font-mono">0 / 6</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-2 border-b border-[#EDEFEA] font-mono text-[9pt]">SVC-05</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA]">Human-readable pricing page exists and is crawlable</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA] text-[oklch(0.48_0.10_160)] font-semibold font-mono">Pass</td>
              <td className="py-1.5 pl-2 border-b border-[#EDEFEA] font-mono">3 / 4</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-2 border-b border-[#EDEFEA] font-mono text-[9pt]">TRS-01</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA]">Review schema with source attribution</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA] text-[#B45309] font-semibold font-mono">Partial</td>
              <td className="py-1.5 pl-2 border-b border-[#EDEFEA] font-mono">3 / 5</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-2 border-b border-[#EDEFEA] font-mono text-[9pt]">TRS-03</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA]">Practitioner credentials in machine-readable text</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA] text-[#B3261E] font-semibold font-mono">Fail</td>
              <td className="py-1.5 pl-2 border-b border-[#EDEFEA] font-mono">0 / 6</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-2 border-b border-[#EDEFEA] font-mono text-[9pt]">MRC-02</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA]">FAQ / policy pages parseable (FAQPage schema, plain text)</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA] text-[#B45309] font-semibold font-mono">Partial</td>
              <td className="py-1.5 pl-2 border-b border-[#EDEFEA] font-mono">4 / 8</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-2 border-b border-[#EDEFEA] font-mono text-[9pt]">ACT-01</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA]">Crawlable booking path (URL or ReserveAction)</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA] text-[#B3261E] font-semibold font-mono">Fail</td>
              <td className="py-1.5 pl-2 border-b border-[#EDEFEA] font-mono">0 / 8</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-2 border-b border-[#EDEFEA] font-mono text-[9pt]">CRL-01</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA]">llms.txt present; robots.txt permits AI crawlers</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA] text-[#B45309] font-semibold font-mono">Partial</td>
              <td className="py-1.5 pl-2 border-b border-[#EDEFEA] font-mono">5 / 10</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-2 border-b border-[#EDEFEA] font-mono text-[9pt]">SEC-01</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA]">Resource classification: public / controlled / private</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA] text-[oklch(0.48_0.10_160)] font-semibold font-mono">Pass</td>
              <td className="py-1.5 pl-2 border-b border-[#EDEFEA] font-mono">7 / 10</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-2 border-b border-[#EDEFEA] font-mono text-[9pt]">FRS-01</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA]">Freshness signals (lastmod, dateModified) on price/service pages</td>
              <td className="py-1.5 px-2 border-b border-[#EDEFEA] text-[#B45309] font-semibold font-mono">Partial</td>
              <td className="py-1.5 pl-2 border-b border-[#EDEFEA] font-mono">2 / 5</td>
            </tr>
          </tbody>
        </table>
        <p className="text-[9.5pt] text-[#8A8F87] mt-2.5 mb-0 font-mono">
          Representative tests shown. The full audit covers all 100 points; complete evidence bundle (screenshots, raw responses, timestamps) is delivered alongside this report.
        </p>

        {/* Remediation Plan */}
        <h2 className="font-serif text-[16pt] font-medium mt-[32px] mb-[12px] text-[#191C1A]">Remediation plan</h2>
        <table className="w-full border-collapse text-[10.5pt]">
          <thead>
            <tr className="text-left text-[#5A6058] text-[9pt] tracking-[0.06em] uppercase font-mono">
              <th className="py-1.5 pr-2 border-b border-[#D4D8D2] font-semibold w-[30px]">#</th>
              <th className="py-1.5 px-2 border-b border-[#D4D8D2] font-semibold">Fix</th>
              <th className="py-1.5 px-2 border-b border-[#D4D8D2] font-semibold w-[110px]">Recovers</th>
              <th className="py-1.5 pl-2 border-b border-[#D4D8D2] font-semibold w-[120px]">Included in</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py border-b border-[#EDEFEA] py-[7px] pr-2 font-mono">1</td>
              <td className="py border-b border-[#EDEFEA] py-[7px] px-2 text-[#191C1A]">
                Structured service catalog with Offer pricing, generated from verified records
              </td>
              <td className="py border-b border-[#EDEFEA] py-[7px] px-2 font-mono text-[oklch(0.48_0.10_160)] font-semibold">+12 pts</td>
              <td className="py border-b border-[#EDEFEA] py-[7px] pl-2 font-mono">Starter</td>
            </tr>
            <tr>
              <td className="py border-b border-[#EDEFEA] py-[7px] pr-2 font-mono">2</td>
              <td className="py border-b border-[#EDEFEA] py-[7px] px-2 text-[#191C1A]">
                Crawlable booking path + ReserveAction markup
              </td>
              <td className="py border-b border-[#EDEFEA] py-[7px] px-2 font-mono text-[oklch(0.48_0.10_160)] font-semibold">+13 pts</td>
              <td className="py border-b border-[#EDEFEA] py-[7px] pl-2 font-mono">Starter</td>
            </tr>
            <tr>
              <td className="py border-b border-[#EDEFEA] py-[7px] pr-2 font-mono">3</td>
              <td className="py border-b border-[#EDEFEA] py-[7px] px-2 text-[#191C1A]">
                Text-form credentials with Person schema for each practitioner
              </td>
              <td className="py border-b border-[#EDEFEA] py-[7px] px-2 font-mono text-[oklch(0.48_0.10_160)] font-semibold">+9 pts</td>
              <td className="py border-b border-[#EDEFEA] py-[7px] pl-2 font-mono">Starter</td>
            </tr>
            <tr>
              <td className="py border-b border-[#EDEFEA] py-[7px] pr-2 font-mono">4</td>
              <td className="py border-b border-[#EDEFEA] py-[7px] px-2 text-[#191C1A]">
                FAQ/policy normalization + llms.txt + crawl policy tuning
              </td>
              <td className="py border-b border-[#EDEFEA] py-[7px] px-2 font-mono text-[oklch(0.48_0.10_160)] font-semibold">+11 pts</td>
              <td className="py border-b border-[#EDEFEA] py-[7px] pl-2 font-mono">Professional</td>
            </tr>
            <tr>
              <td className="py border-b border-[#EDEFEA] py-[7px] pr-2 font-mono">5</td>
              <td className="py border-b border-[#EDEFEA] py-[7px] px-2 text-[#191C1A]">
                Full before/after test suite re-run with published comparison doc
              </td>
              <td className="py border-b border-[#EDEFEA] py-[7px] px-2 font-mono text-[#5A6058]">verification</td>
              <td className="py border-b border-[#EDEFEA] py-[7px] pl-2 font-mono">All installs</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 bg-[#F2F4F0] rounded-[10px] p-[16px_20px] text-[10.5pt] leading-[1.6] text-[#3D423D] break-inside-avoid border border-[#E3E6E1]">
          Projected post-install score: <strong className="text-[#191C1A]">86 / 100</strong>. Remaining points depend on third-party directory corrections and review volume — outside flat-fee scope and stated as such. We do not promise rankings; we promise these facts become machine-readable and stay that way.
        </div>

        {/* Footer Strip */}
        <div className="mt-[28px] border-t-2 border-[#191C1A] pt-4 flex flex-col md:flex-row justify-between gap-6 items-start md:items-center break-inside-avoid">
          <div className="text-[10.5pt] leading-[1.6] text-[#3D423D] max-w-[56ch]">
            Next step: 20-minute walkthrough of this report, live re-test in front of you, and a fixed quote. Starter Install $1,500 · Professional $3,500 · Monitor from $249/mo.
          </div>
          <div className="text-left md:text-right text-[10pt] leading-[1.7] text-[#5A6058] whitespace-nowrap font-mono">
            <div className="font-bold text-[#191C1A]">AgentReady Local</div>
            <div>MetalMindTech LLC · High-Growth Aesthetic Markets</div>
            <div className="text-[9pt] text-[oklch(0.48_0.10_160)] font-semibold mt-0.5">evidence bundle: ARL-2026-0114.zip</div>
          </div>
        </div>

        {/* Printed Document Footer */}
        <div className="hidden print:flex justify-between text-[9.5pt] text-[#8A8F87] font-mono mt-8 pt-4 border-t border-[#E3E6E1]">
          <span>ARL-2026-0114 · lakeshoreskin.com</span>
          <span>AgentReady Local · MetalMindTech LLC</span>
        </div>
      </main>
    </div>
  );
}
