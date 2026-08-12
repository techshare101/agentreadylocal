# Handoff: AgentReady Local — Funnel + Verified Audit Report

## Overview
Phase-1 cash product for MetalMindTech LLC: a lead-gen funnel (free surface scan -> $297 Verified Audit CTA) and the 100-point Verified Audit sample report (the sales asset). Target buyer: single/multi-location med spa owners in the Twin Cities.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, NOT production code to copy directly. Your task is to **recreate these designs in a real codebase**. No environment exists yet; recommended stack (from the PRD): **Next.js (App Router) on Vercel**, Supabase for verified business facts, Stripe Checkout (already live) for the $297 audit purchase.

The .dc.html files depend on a proprietary runtime and will not run standalone — read them as annotated specs (all styling is inline; every value is exact).

## Fidelity
**High-fidelity.** Colors, type, spacing, and copy are final. Recreate pixel-perfectly.

## Scaffold + Deploy (do this first)
In C:\Users\valen\Development\AgentReady:

    npx create-next-app@latest . --ts --app --tailwind --eslint --no-src-dir
    git init && git add -A && git commit -m "scaffold"
    gh repo create agentready-local --private --source=. --push   # or create on github.com and push
    npx vercel --prod                                             # link + deploy

Routes to build:
- `/` — funnel page (see "AgentReady Funnel.dc.html")
- `/sample-report` — the Verified Audit sample (see "Verified Audit Report.dc.html"); also render-to-PDF target
- `/api/scan` — POST { domain } -> { score, gaps[] }. Phase 1: run the 6 surface checks server-side (fetch homepage, parse JSON-LD, robots.txt/llms.txt, detect booking widget, credential text). Until built, keep the deterministic mock from the prototype.
- Stripe Checkout link on every "$297 Verified Audit" CTA.

## Screens

### 1. Funnel page (/)
Max-width 1080px, background #FAFAF7, ink #191C1A, muted #5A6058, border #E3E6E1, accent oklch(0.48 0.10 160) [approx #1D7A56], fail #B3261E, warn #B45309.
Sections top to bottom:
1. Header: brand "AgentReady Local" (Spectral 600 20px) + "BY METALMINDTECH" (11px uppercase); nav links How it works / The 100-point audit / Pricing / Sample report.
2. Hero: 2-col grid 1.15fr/0.85fr, 56px gap. Left: eyebrow (12px uppercase accent), H1 Spectral 500 46px/1.12 "When someone asks ChatGPT for the best med spa in Edina, does it know you exist?", body 17px, three dot-badges (Flat-fee builds / Evidence for every claim / No ranking promises). Right: scan card (white, 1px border, radius 14px, padding 28px, subtle shadow): title "Free surface scan", domain input (IBM Plex Mono 15px) + "Scan free" button (accent bg, radius 8px).
3. Scan flow states: idle (hint text) -> running (check log lines appear every ~550ms, mono 12.5px on #F2F4F0) -> done (score number Spectral 34px in fail red, "N of 100", 3 gap rows: mono code chip red on oklch(0.95 0.02 25) + description, then black CTA button "Get the full 100-point Verified Audit — $297").
4. Promise band: full-bleed #191C1A, quote in Spectral 27px/1.4 (exact PRD promise, verbatim), disclaimer 14px #A9AEA6 (no ranking promises).
5. How it works: 3 white cards (01 AUDIT / 02 INSTALL / 03 MONITOR), mono step labels in accent.
6. Rubric: 4-col grid of 8 cards — Identity 15, Services + pricing 15, Trust 15, Machine-readable content 15, Actions 15, Crawl policy 10, Security 10, Freshness 5. Below: SECURITY RULE strip (public facts free / booking controlled / customer data private).
7. Pricing: 4 cards — Free scan; Verified Audit $297 ($750 multi-location, accent 2px border + "Start here" pill, the featured card); Install $1,500 Starter / $3,500 Professional; Monitor $249–$499/mo.
8. Live-demo band: white card, "Watch it happen live" + black button "Book the live demo".
9. Footer: "(c) 2026 MetalMindTech LLC · Twin Cities, MN" / "Med spa vertical only".

### 2. Verified Audit sample report (/sample-report)
Paged document, 0.8in margins, printable. Fictional clinic: Lakeshore Skin & Laser, lakeshoreskin.com, Edina MN, report ID ARL-2026-0114, audited Aug 4 2026, score 41/100 (projected post-install 86/100).
Sections: header (2px black bottom rule) -> score box + summary paragraph -> category score table with bars (9/15, 3/15, 6/15, 7/15, 2/15, 5/10, 7/10, 2/5; bar color: red <35%, amber <60%, accent otherwise) -> 3 critical gap cards (SVC-04, ACT-01, TRS-03) -> live AI-engine tests (page 2): 3 evidence blocks (ChatGPT L-01 FAIL, Perplexity L-02 FAIL, Google AI Overview L-03 PARTIAL), each with mono metadata bar "observed_at <ISO> · confidence · verified", query, observed result, verdict, and a screenshot slot -> detailed findings table (13 representative tests, Pass/Partial/Fail) -> remediation table (5 fixes with +pts and tier) -> closing CTA strip.
Every stated fact carries source + observed_at + confidence + verification status — this is a hard product rule (no fabricated evidence in production; real screenshots stored per audit).

## Interactions & Behavior
- Scan: Enter key or button triggers; checks stream one per ~550ms; score derived from domain (mock) or real checks (production). Smooth-scroll anchors for nav.
- Buttons hover: accent darkens ~6% lightness; black buttons -> #000.
- Report page: print stylesheet, hide back-bar on print; page break before "Live AI-engine tests" and "Detailed findings".

## State
Funnel: { domain, phase: idle|running|done, checkLog[], score, gaps[] }. No persistence needed Phase 1; log scans to Supabase (domain, score, gaps, timestamp) for lead follow-up.

## Design Tokens
- Fonts (Google): Spectral 400/500/600 (display), Public Sans 400–700 (UI/body), IBM Plex Mono 400/500 (evidence, codes, prices metadata)
- Colors: bg #FAFAF7, surface #FFFFFF, panel #F2F4F0, ink #191C1A, body #3D423D, muted #5A6058, faint #8A8F87, border #E3E6E1 / #EDEFEA, accent oklch(0.48 0.10 160), accent-dark oklch(0.42 0.10 160), fail #B3261E, warn #B45309, fail-bg oklch(0.95 0.02 25)
- Radius: cards 12–14px, inputs/buttons 8px, chips 4px; spacing base 8px grid

## Assets
None. Evidence screenshots are drop-in slots — replaced with real timestamped screenshots per audit.

## Files
- AgentReady Funnel.dc.html — funnel design reference
- Verified Audit Report.dc.html — report design reference
