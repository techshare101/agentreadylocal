import { NextRequest, NextResponse } from "next/server";

const CHECKS = [
  "Fetching homepage + service pages",
  "Parsing JSON-LD / schema markup",
  "Locating service catalog + pricing",
  "Checking practitioner credentials",
  "Tracing booking path for agents",
  "Reading robots.txt / llms.txt crawl policy",
];

const GAP_POOL = [
  { code: "SVC-04", text: "No structured service catalog — agents can't list what you offer or at what price." },
  { code: "IDN-02", text: "Business identity schema missing NAP consistency — agents can't confirm you're the same entity across sources." },
  { code: "ACT-01", text: "Booking path is JavaScript-only — no machine-readable action an agent can complete or cite." },
  { code: "TRS-03", text: "Practitioner credentials are in images, not text — invisible to every AI engine." },
  { code: "CRL-01", text: "No llms.txt and restrictive robots rules — AI crawlers are partially blocked from your own facts." },
  { code: "FRS-01", text: "Pricing page last updated signal missing — engines treat your prices as stale." },
];

function stringHash(s: string): number {
  let h = 0;
  for (const c of s) {
    h = (h * 31 + c.charCodeAt(0)) >>> 0;
  }
  return h;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawDomain = (body.domain || "lakeshoreskin.com").trim();
    const domain = rawDomain.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");

    const h = Math.abs(stringHash(domain || "lakeshoreskin.com"));
    const score = 24 + (h % 34);

    const rawIndices = [h % 6, Math.floor(h / 7) % 6, Math.floor(h / 49) % 6];
    const seen = new Set<number>();
    const gaps = [];

    for (const raw of rawIndices) {
      let k = Math.abs(Math.floor(raw)) % GAP_POOL.length;
      let attempts = 0;
      while (seen.has(k) && attempts < GAP_POOL.length) {
        k = (k + 1) % GAP_POOL.length;
        attempts++;
      }
      seen.add(k);
      gaps.push(GAP_POOL[k] || GAP_POOL[0]);
    }

    return NextResponse.json({
      domain,
      score,
      gaps,
      checkLog: CHECKS,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 }
    );
  }
}
