# OFFICIAL PRODUCT SOURCE: AgentReady Local
> **CLASSIFICATION: OFFICIAL PRODUCT SOURCE (LOCKED)**  
> **RULE FOR ALL AGENTS (Maya, Theo, Nia, Leo, Ava, Julie, etc.):**  
> Knowledge files marked **OFFICIAL PRODUCT SOURCE** outrank web research, live crawling, and subagent inference for locked product facts. Web research may supplement campaign angles and competitor intelligence, but it **may not override** this document. Any proposed modification must be labeled `STRATEGIC ALTERNATIVE — NOT APPROVED`.

---

## 1. Official Product Name & Organization
- **Product Name**: AgentReady Local
- **Parent Company**: MetalMindTech LLC
- **Operating Principle**: *"Humans buy verified outcomes today; agents buy trusted resources tomorrow."*

## 2. Ideal Customer Profile (ICP)
- **Target Audience**: Single and multi-location Med Spa owners, aesthetic medical practices, and high-growth aesthetic clinic managers.
- **Geographic Scope**: Nationwide / Universal (Major metro markets e.g., Miami, Dallas, Scottsdale, Los Angeles, Twin Cities, New York, Austin, etc.).
- **Buyer Characteristics**: Practices already investing in paid search, social ads, or local SEO whose business facts (services, pricing, providers, policies) are unverified, inconsistent, or omitted in public AI answer-engine responses.

## 3. Exact Pricing Structure (Product Ladder)
- **Free Surface Scan**: **$0** (Instant lead-generation scanner)
- **Verified Audit Report**: **$297** flat fee (*$750 for multi-location*)
- **Starter Schema & LLM Install**: **$1,500** one-time (*$3,500 for Professional Multi-Location Install*)
- **Continuous Monitoring & Retesting**: **$249/month** (*$499/month for multi-location / enterprise*)

---

## 4. Deliverables by Tier

### Tier 1: Free Surface Scan ($0)
- Instant automated 6-point check on the practice's domain.
- Generates a surface readiness score and highlights top 3 observable data gaps.
- Primary conversion trigger for the $297 Verified Audit.

### Tier 2: Verified Audit Report ($297 / $750)
- Comprehensive **100-Point Scored Audit** evaluating structured data, entity authority, and machine-readability.
- **Live AI-Engine Query Tests & Screenshots** across ChatGPT (GPT-5), Perplexity, and Google AI Overviews.
- **Timestamped Evidence Bundle** detailing verified, conflicting, or omitted business facts observed across engines.
- Actionable technical remediation roadmap.

### Tier 3: Foundation Install ($1,500 / $3,500)
- Complete **JSON-LD Schema Graph** implementation on client-owned web properties (MedicalBusiness, Physician, Service, PriceSpecification, ReserveAction).
- Normalized **Service Catalog & Pricing Model** formatted for machine readability.
- Standardized **FAQ & Clinical Policy Data Assets**.
- Implementation of **`llms.txt`** and machine-readable crawl directives.
- Before-and-after verification test suite evaluating observable AI engine responses.

### Tier 4: Monthly Monitoring ($249/mo / $499/mo)
- Monthly multi-engine citation and query re-testing across supported AI engines.
- Real-time alerts for broken schema, data drift, or unauthorized overrides on client properties.
- Freshness updates for seasonal specials, new providers, and service modifications.
- Ongoing citation consistency documentation across third-party directories and knowledge graphs.

---

## 5. Approved vs. Prohibited Claims

### APPROVED CLAIMS
1. **AgentReady Local verifies and publishes owner-approved, machine-readable business facts on the clinic’s owned web properties.**
2. **AgentReady Local implements structured data including approved JSON-LD schema, service catalogs, and machine-readable resources.**
3. **AgentReady Local compares authoritative clinic information against observable responses from supported AI answer engines and records discrepancies with timestamped evidence.**
4. **The Verified Audit provides evidence records containing source, observed timestamp, confidence, and verification status.**
5. **AgentReady Local can identify and document inaccurate, outdated, inconsistent, or omitted information appearing in AI answer-engine responses.**
6. **AgentReady Local provides flat-fee technical audit and implementation options without requiring an ongoing marketing retainer.**
7. **Installation can use limited collaborator/manager permissions rather than shared passwords where the client platform supports appropriate access controls.**

### DO NOT CLAIM (STRICTLY PROHIBITED)
- ❌ **Do NOT claim AgentReady directly publishes facts into ChatGPT, Google, Perplexity, or other third-party AI systems.**
- ❌ **Do NOT claim schema guarantees ingestion, ranking, citation, recommendation, or correction by an AI system.**
- ❌ **Do NOT claim AgentReady eliminates or fixes third-party hallucinations.**
- ❌ **Do NOT claim missing schema causes hallucinations.**
- ❌ **Do NOT claim structured data causes improved rankings, traffic, conversion, bookings, or revenue.**
- ❌ **Do NOT claim any AI platform prefers, trusts, flags, penalizes, or prioritizes a business because of AgentReady.**
- ❌ **Do NOT claim guaranteed security, confidentiality, or zero risk.**
- ❌ **Do NOT make unverified claims about competitor practices (e.g., generalizing "most SEO agencies").**
- ❌ **Do NOT assert unsupported numerical hypotheses, conversion predictions, or magnitude assumptions (e.g., "majority of clinics", "highly receptive").**

---

## 6. Call to Action (CTA) & Conversion Path
- **Primary Funnel CTA**: *"Run Your Free 6-Point Surface Scan"*
- **Audit CTA**: *"Get the 100-Point Verified Audit ($297)"*
- **Install CTA**: *"Book Foundation Install ($1,500)"*

---

## 7. Proof & Evidence Language
- Every finding must be structured as an evidence record:
  - `source`: Engine queried (`ChatGPT (GPT-5)`, `Perplexity`, `Google AI Overview`, `Surface Crawler`)
  - `observed_at`: Exact UTC ISO 8601 timestamp
  - `confidence`: `high` | `medium` | `low`
  - `verification_status`: `verified` | `pending` | `unverified`
- **Sales Demo Anchor**: The demo is the close — run a live query for *"best med spa in [City]"* or *"[Practice Name] pricing"* live in front of the owner to document observable discrepancies and omissions in real-time.

---

## 8. URLs, Routing & Integration Discipline
- **Funnel Route**: `/` (Relative route)
- **Sample Audit Report Route**: `/sample-report`
- **Stripe Checkout ($297 Audit)**: `https://buy.stripe.com/7sY7sL9gL6gQ3Ft6qt3840n` (Configured checkout URL)
- **URL Source Rule**: Do NOT invent or infer unverified production domain URLs (e.g., do not hardcode `https://agentreadylocal.com` unless verified from environment configuration).
- **Payment Webhook Verification**: Do NOT hardcode assumptions about Stripe event types (e.g., `payment_intent.succeeded` vs `checkout.session.completed`) unless verified directly against the active webhook implementation code.
