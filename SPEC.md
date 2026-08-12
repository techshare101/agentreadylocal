# SPEC: AgentReady Local Architecture & Evidence System

## Entity Attribution
- **Company**: MetalMindTech LLC
- **Scope**: High-Growth Aesthetic Markets & Med Spas (Universal / Nationwide)
- **Operating Principle**: *"Humans buy verified outcomes today; agents buy trusted resources tomorrow."*

## Environment Variables & Deployment Setup
Secrets and API keys are stored in `.env.local` for local development and in **Vercel Project Settings** for production deployment:

| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_STRIPE_CHECKOUT_URL` | Public / Frontend | Live Stripe Checkout link (`https://buy.stripe.com/7sY7sL9gL6gQ3Ft6qt3840n`) |
| `STRIPE_WEBHOOK_SECRET` | Server Only | Verifies Stripe webhooks when a $297 audit is purchased |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client | Supabase Project URL for storing scan leads & business facts |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | Backend database access for storing lead telemetry |
| `OPENAI_API_KEY` | Server Only | Query test harness for ChatGPT (GPT-5) live audit evidence |
| `PERPLEXITY_API_KEY` | Server Only | Query test harness for Perplexity live audit evidence |
| `SERPAPI_KEY` | Server Only | Query test harness for Google AI Overview live audit evidence |

## Core Technical Stack
- **Framework**: Next.js App Router (TypeScript)
- **Styling**: Tailwind CSS + Custom Design System Tokens (OKLCH, Spectral, Public Sans, IBM Plex Mono)
- **Database / Fact Storage**: Supabase (for verified business facts and lead telemetry)
- **Deployment**: Vercel ready

## Evidence & Provenance Data Schema
Every test result, gap finding, and observation record adheres to the evidence model:
```ts
interface EvidenceRecord {
  id: string;
  source: "ChatGPT (GPT-5)" | "Perplexity" | "Google AI Overview" | "Surface Crawler";
  observed_at: string; // ISO 8601 UTC
  confidence: "high" | "medium" | "low";
  verification_status: "verified" | "pending" | "unverified";
  query?: string;
  observed?: string;
  verdict?: string;
  screenshot_url?: string;
}
```

## Security Classification Rules
All resources exposed or inspected by AgentReady Local are strictly classified:
1. `public_facts`: Free to crawl and read (`llms.txt`, JSON-LD schema, service catalog, pricing, credentials).
2. `booking`: Controlled access (`ReserveAction`, rate-limited API, agent-friendly handoff).
3. `customer_data`: Strictly private (encrypted, non-exposed).

## Routes
- `/`: Funnel Page with interactive 6-point scan & product ladder (universal positioning)
- `/sample-report`: 100-point Verified Audit Report (Lakeshore Skin & Laser sample asset)
- `/api/scan`: POST surface check scanner API
