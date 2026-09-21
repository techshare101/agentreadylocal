// lib/notify.ts
// Instant email alerts for AgentReady: every scan + every lead.
// Uses the Resend REST API directly (no SDK dependency).
// Never throws: an alert failure must never break the scan or the lead gate.

const RESEND_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 4000;

type ScanAlert = {
  domain: string;
  score: number;
  status?: string;
  band?: string;
  failedChecks?: string[];
  ip?: string | null;
  userAgent?: string | null;
  referer?: string | null;
};

type LeadAlert = ScanAlert & {
  email: string;
  name?: string | null;
  stage?: string;
  utmCampaign?: string | null;
  utmContent?: string | null;
  fbclid?: string | null;
};

function cfg() {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL || "valentin2v2000@gmail.com";
  const from =
    process.env.NOTIFY_FROM || "AgentReady Alerts <audit@metalmindtech.com>";
  return { apiKey, to, from };
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function source(ref?: string | null, ua?: string | null, fbclid?: string | null): string {
  if (fbclid) return "Meta ad (fbclid)";
  const r = (ref || "").toLowerCase();
  const u = (ua || "").toLowerCase();
  if (r.includes("facebook") || r.includes("fb.") || u.includes("fban") || u.includes("fbav")) return "Meta ad (Facebook)";
  if (r.includes("instagram") || u.includes("instagram")) return "Meta ad (Instagram)";
  if (r.includes("linkedin")) return "LinkedIn";
  if (r.includes("google")) return "Google";
  return ref ? ref : "Direct / unknown";
}

function shell(title: string, rows: [string, string][], footer = ""): string {
  const body = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;color:#8b8fa3;font-size:13px;white-space:nowrap;vertical-align:top">${esc(k)}</td>` +
        `<td style="padding:8px 12px;color:#e8e8f0;font-size:14px">${v}</td></tr>`
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#0a0a0f;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
  <div style="height:3px;background:linear-gradient(90deg,#22d3ee,#a855f7,#ec4899);border-radius:3px"></div>
  <h1 style="color:#fff;font-size:20px;margin:20px 0 16px">${esc(title)}</h1>
  <table style="width:100%;border-collapse:collapse;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px">${body}</table>
  ${footer}
  <p style="color:#5b5f73;font-size:11px;margin-top:24px">AgentReady · MetalMindTech Labs · ${new Date().toUTCString()}</p>
</div></body></html>`;
}

async function send(subject: string, html: string): Promise<void> {
  const { apiKey, to, from } = cfg();
  if (!apiKey) {
    console.warn("[notify] RESEND_API_KEY missing — alert skipped:", subject);
    return;
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      console.error("[notify] Resend error", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("[notify] send failed:", err);
  } finally {
    clearTimeout(t);
  }
}

function failedList(checks?: string[]): string {
  if (!checks || checks.length === 0) return "—";
  return checks.map((c) => `✗ ${esc(c)}`).join("<br>");
}

/** Fires on every completed scan (top of funnel — shows gate drop-off). */
export async function notifyScan(a: ScanAlert): Promise<void> {
  if (process.env.NOTIFY_SCANS === "off") return;
  const ok = !a.status || a.status === "success";
  const subject = ok
    ? `👀 Scan: ${a.domain} scored ${a.score}/100`
    : `⚠️ Scan ${a.status}: ${a.domain}`;
  const html = shell(`New scan — ${a.domain}`, [
    ["Status", esc(a.status || "success")],
    ["Domain", `<a style="color:#22d3ee" href="https://${esc(a.domain)}">${esc(a.domain)}</a>`],
    ["Score", `<b>${esc(a.score)}/100</b>${a.band ? ` · ${esc(a.band)}` : ""}`],
    ["Failed checks", failedList(a.failedChecks)],
    ["Source", esc(source(a.referer, a.userAgent))],
  ], `<p style="color:#8b8fa3;font-size:13px;margin-top:16px">No email yet. If a 🔥 Lead alert for this domain doesn't follow, they dropped at the gate.</p>`);
  await send(subject, html);
}

/** Fires when someone unlocks the fixes (the money event). */
export async function notifyLead(a: LeadAlert): Promise<void> {
  const checkout = a.stage === "checkout_started";
  const subject = checkout
    ? `💰 Checkout started ($297) — ${a.email}${a.domain ? ` · ${a.domain}` : ""}`
    : `🔥 New AgentReady lead — ${a.domain} scored ${a.score}/100`;
  const html = shell(checkout ? `Checkout started — ${a.email}` : `New lead — ${a.domain}`, [
    ["Email", `<a style="color:#22d3ee" href="mailto:${esc(a.email)}">${esc(a.email)}</a>`],
    ...(a.name ? ([["Name", esc(a.name)]] as [string, string][]) : []),
    ["Domain", a.domain ? `<a style="color:#22d3ee" href="https://${esc(a.domain)}">${esc(a.domain)}</a>` : "—"],
    ["Score", a.domain ? `<b>${esc(a.score)}/100</b>${a.band ? ` · ${esc(a.band)}` : ""}` : "—"],
    ["Failed checks", failedList(a.failedChecks)],
    ["Stage", esc(checkout ? "Checkout started — $297 audit" : "Unlocked fixes (scan gate)")],
    ["Source", esc(source(a.referer, a.userAgent, a.fbclid))],
    ["UTM", esc([a.utmCampaign, a.utmContent].filter(Boolean).join(" / ") || "—")],
  ], `<p style="margin-top:20px"><a href="mailto:${esc(a.email)}?subject=${encodeURIComponent(a.domain ? `Your ${a.domain} AI visibility fixes` : "Your AgentReady audit")}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:linear-gradient(90deg,#22d3ee,#a855f7,#ec4899);color:#fff;text-decoration:none;font-weight:600">Reply to lead →</a></p>`);
  await send(subject, html);
}
