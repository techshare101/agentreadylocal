# AgentReady Local — Agent Changelog

## 2026-09-10 — Replace prototype evidence

- Replace the fictional Lakeshore sample with a scoped Gr8Skin MedSpa public evidence sample.
- Add actual Google AI Overview and official contact-page PNG captures, UTC observation times, response text, markup inventory, manifest, and a downloadable ZIP with SHA-256 checksums.
- Record the contact page's visible 2805 address versus its 2855 metadata/map link without claiming which street number is current or what caused Google's response.
- Withdraw the prototype score and projected point recoveries. No score is assigned while the full rubric and engine tests remain incomplete.
- Mark ChatGPT pending sign-in and Perplexity pending browser verification. The Schema.org browser validator was also blocked; the supplied output is a local JSON syntax/markup inventory check only.
- Publish only the response crop and public clinic-page evidence. Exclude private browser-session context and original uncropped account screenshots; document PNG conversion and cropping.
- Verification: `python3 scripts/verify-sample-evidence.py`. Local dependency installation was unavailable; production build verification must use the Vercel preview for this change.

## [1.0.0] - 2026-08-11

### Added
- **Next.js Scaffolding**: Initialized App Router Next.js project with TypeScript, Tailwind CSS, and Google Fonts (`Spectral`, `Public Sans`, `IBM Plex Mono`).
- **Funnel Page (`/`)**: Built lead-generation funnel page matching `AgentReady Funnel.dc.html` with interactive surface scanner, promise band, rubric grid, pricing breakdown, and live demo CTA.
- **Sample Audit Report (`/sample-report`)**: Built paged Verified Audit sample report matching `Verified Audit Report.dc.html` for Lakeshore Skin & Laser (`41/100` score), including category bars, evidence blocks, detailed findings table, remediation plan, and print styles.
- **Scanner API (`/api/scan`)**: Created server-side surface check POST endpoint returning scores and gap breakdowns.
- **Ark Protocol Documentation**: Created `PRD.md`, `SPEC.md`, `TASKS.md`, `AGENTS.md`, `docs/PLAN.md`, and `docs/PREVIEW_REPORT.md`.
