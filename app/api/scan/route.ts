import { NextRequest, NextResponse } from "next/server";
import { probeDomain, sanitizeReportForUngated } from "@/lib/scanner";

export const maxDuration = 15; // Set Vercel function timeout budget

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawDomain = (body.domain || "lakeshoreskin.com").trim();

    const report = await probeDomain(rawDomain);
    const sanitized = sanitizeReportForUngated(report);

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
