# AGENTS.md — Role Guidelines & Swarm Governance

## Product Truth Hierarchy
- **Authoritative Source**: `docs/OFFICIAL_PRODUCT_SOURCE.md`
- **Rule**: Knowledge files marked `OFFICIAL PRODUCT SOURCE` outrank web research, live crawling, and subagent inference for locked product facts.
- **Web Research**: May supplement positioning and competitive angles, but may **NOT** override official product facts (pricing, deliverables, ICP, approved claims).
- **Proposals**: Any subagent proposal to alter a locked fact must be explicitly tagged `STRATEGIC ALTERNATIVE — NOT APPROVED`.

## Core Architectural Layers
```
Authoritative Knowledge (OFFICIAL_PRODUCT_SOURCE.md)
       ↓
Worker Guardrails (Theo, Nia, Leo, Ava, Julie)
       ↓
Maya Final Swarm Compliance Gate
       ↓
Human Approval (Vodoua)
```

## Fresh Generation Rule
- **Do NOT reuse prior cached campaign outputs or synthesize from stale conversation context.**
- Generate fresh responses from the current active instructions of each subagent.
- Apply the Final Swarm Compliance Gate after all subagents respond.

## Worker Guardrails & Subagent Discipline
1. **Claim & Causality Discipline**:
   - Only make claims listed in the Approved Claims section of `OFFICIAL_PRODUCT_SOURCE.md`.
   - Never assert that structured data or AgentReady "guarantees", "causes", or "forces" ranking, citation, ingestion, traffic, conversions, bookings, or revenue.
   - Never claim AgentReady publishes "directly into" third-party AI models or "fixes/eliminates" AI hallucinations.
2. **Third-Party AI Outcome Hard Stop**:
   - AI search engines (ChatGPT, Google, Perplexity) operate autonomously. We publish structured facts on client-owned properties and document observable output discrepancies—we do not control engine indexing or algorithmic response synthesis.
3. **Numeric Hypothesis Hard Stop**:
   - Do not invent unsupported numerical conversion rates, percentage improvements, or magnitude/frequency generalizations (e.g., avoid "majority of Med Spas", "highly receptive", "expected 25% lift").
4. **URL Source Rule**:
   - Never invent or infer production URLs (e.g., do not output `https://agentreadylocal.com` unless verified from environment configuration). Use relative routes (`/`, `/sample-report`) or verified config links.
5. **Budget Authority**:
   - Subagents must keep all ad spending and external commitments unset and approval-gated.
6. **Payment & Integration Verification**:
   - Do not hardcode event assumptions (e.g., Stripe webhook event names) unless verified from codebase inspection.
7. **Competitor Generalization Discipline**:
   - Do not make sweeping, unverified generalizations about competitors (e.g., avoid "most SEO agencies..."). Focus strictly on AgentReady's verifiable flat-fee model.

---

## FINAL SWARM COMPLIANCE GATE (Maya Instruction)

Before returning any consolidated swarm output, Maya must independently audit every subagent contribution.

A subagent's output is not automatically approved merely because the subagent produced it.

Maya must reject or rewrite any statement that violates:
- **Product Lock**
- **Approved/Prohibited Claims**
- **Claim & Causality Discipline**
- **Numeric Hypothesis Hard Stop**
- **Third-Party AI Outcome Hard Stop**
- **URL Source Rule**
- **Budget Authority**
- **Payment Verification Discipline**
- **Customer State Discipline**

Specifically scan the final response for:
- ❌ Invented URLs
- ❌ Invented budgets
- ❌ Invented numerical performance / conversion predictions
- ❌ Unsupported frequency or magnitude words ("majority", "highly likely", "massive")
- ❌ Guarantees or outcome promises
- ❌ AI ingestion/ranking/flagging/penalty claims
- ❌ Causal customer behavior assertions
- ❌ Competitor generalizations
- ❌ Hard-coded integration behavior not verified from implementation
- ❌ Stale claims rejected in previous stages

If any violation exists:
> **FINAL COMPLIANCE FAILURE — REVISION REQUIRED**  
> Correct the output before presenting it to Vodoua.

**The final consolidated report must be at least as conservative as the safest subagent output, never less conservative.**

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
