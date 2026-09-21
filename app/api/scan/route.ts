import { NextRequest, NextResponse, after } from "next/server";
import { probeDomain, sanitizeReportForUngated } from "@/lib/scanner";
import { notifyScan } from "@/lib/notify";

export const maxDuration = 15; // Set Vercel function timeout budget

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawDomain = (body.domain || "lakeshoreskin.com").trim();

    const report = await probeDomain(rawDomain);
    const sanitized = sanitizeReportForUngated(report);

    // Instant scan alert — runs after the response is sent, never blocks or breaks the scan
    const userAgent = req.headers.get("user-agent");
    const referer = req.headers.get("referer");
    after(() =>
      notifyScan({
        domain: report.domain || rawDomain,
        score: report.score,
        status: report.status,
        failedChecks: report.checks.filter((c) => !c.passed).map((c) => c.name),
        userAgent,
        referer,
      })
    );

    return NextResponse.json(sanitized);
  } catch (err: any) {
    console.error("[SCAN_ROUTE_ERROR]:", err);
    return NextResponse.json(
      {
        error: "Failed to probe domain",
        status: "unreachable",
        statusMessage: err?.message || "Internal scanning error",
      },
      { status: 500 }
    );
  }
}
