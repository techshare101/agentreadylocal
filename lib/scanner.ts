export const PROBE_USER_AGENT = "AgentReady-Surface-Probe/1.0 (+https://agentready.metalmindtech.com)";

export type CheckId =
  | "service_catalog"
  | "schema_markup"
  | "credentials"
  | "pricing_visibility"
  | "booking_path"
  | "crawl_policy";

export interface FindingDetail {
  code: string;
  category: string;
  defect: string;
  chatGptObservation: string;
  oneLineFix: string;
}

export interface CheckResult {
  id: CheckId;
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  publicSummary: string;
  finding?: FindingDetail;
}

export interface ScanReport {
  domain: string;
  status: "success" | "blocked" | "unreachable";
  statusMessage?: string;
  score: number;
  scoreHeadline: string;
  checks: CheckResult[];
  failedCount: number;
  timestamp: string;
}

// Grouped into distinct clinical treatment families to avoid double-counting synonyms
const CLINICAL_TREATMENT_CATEGORIES = [
  { id: "neurotoxin", name: "Neuromodulators", terms: ["botox", "dysport", "xeomin", "daxxify", "jeuveau"] },
  { id: "fillers", name: "Dermal Fillers", terms: ["juvederm", "restylane", "rha", "revanesse", "lip filler", "dermal filler", "cheek filler"] },
  { id: "biostimulators", name: "Biostimulators", terms: ["sculptra", "radiesse"] },
  { id: "lasers", name: "Laser & Energy Therapies", terms: ["laser hair removal", "ipl", "bbl", "photofacial", "laser resurfacing", "fraxel", "clear and brilliant", "halo laser", "co2 laser"] },
  { id: "rf_tightening", name: "RF & Skin Tightening", terms: ["morpheus8", "rf microneedling", "ultherapy", "thermage", "skin tightening"] },
  { id: "microneedling", name: "Microneedling", terms: ["microneedling", "skinpen", "collagen induction"] },
  { id: "chemical_peels", name: "Chemical Peels", terms: ["chemical peel", "vi peel", "dermaplaning"] },
  { id: "medical_facials", name: "Medical Facials", terms: ["hydrafacial", "diamondglow", "geneo"] },
  { id: "body_contouring", name: "Body Contouring", terms: ["coolsculpting", "emsculpt", "body contouring", "kybella"] },
  { id: "regenerative", name: "Regenerative Aesthetics", terms: ["prp", "prf", "exosomes", "iv hydration", "iv therapy"] },
];

const CREDENTIAL_TERMS = [
  "medical director", "dr.", "m.d.", "md", "d.o.", "do", "n.p.", "np",
  "nurse practitioner", "physician", "r.n.", "rn", "registered nurse",
  "board-certified", "board certified", "plastic surgeon", "dermatologist",
  "master injector", "aesthetic nurse"
];

const VERIFIED_BOOKING_PLATFORMS = [
  "boulevard.io", "joinboulevard", "vagaro.com", "mindbodyonline.com", "jane.app",
  "zenoti.com", "acuityscheduling.com", "calendly.com", "mangomint.com",
  "booker.com", "patientnow.com", "nextech.com", "glossgenius.com"
];

export function cleanDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./i, "");
}

function getScoreHeadline(domain: string, score: number): string {
  if (score <= 39) {
    return `${domain} scored ${score}/100. AI assistants are likely to skip your practice entirely.`;
  }
  if (score <= 59) {
    return `${domain} scored ${score}/100. AI assistants can find you, but can't confidently recommend you.`;
  }
  if (score <= 79) {
    return `${domain} scored ${score}/100. You're readable — but practices with cleaner data get recommended first.`;
  }
  return `${domain} scored ${score}/100. Strong. A few gaps still cost you in head-to-head comparisons.`;
}

export async function probeDomain(rawDomain: string): Promise<ScanReport> {
  const domain = cleanDomain(rawDomain || "lakeshoreskin.com");
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  if (!domain || !domain.includes(".")) {
    return {
      domain: rawDomain,
      status: "unreachable",
      statusMessage: "Invalid or unrecognized domain format.",
      score: 0,
      scoreHeadline: `${rawDomain} is unreachable. Unable to establish connection.`,
      checks: [],
      failedCount: 6,
      timestamp,
    };
  }

  // 12-second total probe budget
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  let homepageHtml = "";
  let homepageStatus = 0;
  let homepageHeaders: Headers | null = null;
  let robotsTxt = "";
  let llmsTxtFound = false;

  try {
    const fetchOptions: RequestInit = {
      headers: {
        "User-Agent": PROBE_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
      redirect: "follow",
    };

    // Parallel fetch: Homepage, robots.txt, and llms.txt
    const [pageRes, robotsRes, llmsRes] = await Promise.allSettled([
      fetch(`https://${domain}`, fetchOptions).catch(async () => {
        // Fallback to http if https rejected
        return fetch(`http://${domain}`, fetchOptions);
      }),
      fetch(`https://${domain}/robots.txt`, fetchOptions).catch(() => null),
      fetch(`https://${domain}/llms.txt`, fetchOptions).catch(() => null),
    ]);

    if (pageRes.status === "fulfilled" && pageRes.value) {
      homepageStatus = pageRes.value.status;
      homepageHeaders = pageRes.value.headers;
      // Read body up to 500KB to inspect without unbounded memory
      const rawText = await pageRes.value.text().catch(() => "");
      homepageHtml = rawText.slice(0, 500000);
    }

    if (robotsRes.status === "fulfilled" && robotsRes.value && robotsRes.value.ok) {
      robotsTxt = (await robotsRes.value.text().catch(() => "")).slice(0, 50000);
    }

    if (llmsRes.status === "fulfilled" && llmsRes.value && llmsRes.value.ok) {
      llmsTxtFound = true;
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      domain,
      status: "unreachable",
      statusMessage: "Couldn't reach domain — connection timed out or host is offline.",
      score: 0,
      scoreHeadline: `Couldn't reach ${domain} — the host is unreachable or offline.`,
      checks: [],
      failedCount: 6,
      timestamp,
    };
  } finally {
    clearTimeout(timeoutId);
  }

  // Check for Blocked / WAF / Cloudflare
  const isCfRay = homepageHeaders?.has("cf-ray");
  const serverHeader = homepageHeaders?.get("server")?.toLowerCase() || "";
  const isCloudflare = isCfRay || serverHeader.includes("cloudflare");

  const blockedSignatures = [
    "attention required! | cloudflare",
    "cf-browser-verification",
    "just a moment...",
    "access denied",
    "wordfence",
    "sucuri webproxy",
    "shield security",
    "security check to continue",
  ];

  const htmlLower = homepageHtml.toLowerCase();
  const hasBlockedHtml = blockedSignatures.some((sig) => htmlLower.includes(sig));

  if (
    homepageStatus === 403 ||
    homepageStatus === 401 ||
    (homepageStatus === 503 && isCloudflare) ||
    hasBlockedHtml
  ) {
    return {
      domain,
      status: "blocked",
      statusMessage: "Site is blocking automated crawler requests (WAF/Cloudflare or Bot Protection)",
      score: 0,
      scoreHeadline: `We couldn't scan ${domain} automatically — your site is blocking automated requests.`,
      checks: [],
      failedCount: 6,
      timestamp,
    };
  }

  if (!homepageHtml || (homepageStatus >= 400 && homepageStatus !== 403)) {
    return {
      domain,
      status: "unreachable",
      statusMessage: `Domain returned HTTP ${homepageStatus || "error"} or empty response.`,
      score: 0,
      scoreHeadline: `Couldn't reach ${domain} — server returned HTTP ${homepageStatus}.`,
      checks: [],
      failedCount: 6,
      timestamp,
    };
  }

  // --- JAVASCRIPT SHELL / CLIENT-SIDE RENDERING (SPA) DETECTION ---
  // Strip script, style, SVG, and tags to calculate visible text content
  const visibleText = homepageHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const hasScriptBundles = /<script[^>]+src=[^>]+(?:bundle|_next|static|webpack|main|app|chunk)/i.test(homepageHtml);
  const isJsShell = (visibleText.length < 500 || visibleText.split(/\s+/).length < 75) && hasScriptBundles;

  // --- REPRODUCIBLE GRANULAR RUBRIC EVALUATION ---

  // 1. Service Catalog (Max 20 pts: 0 / 10 / 20)
  // Deduplicate by clinical treatment categories, not raw keyword substrings
  const matchedCategories = CLINICAL_TREATMENT_CATEGORIES.filter((cat) => {
    return cat.terms.some((term) => {
      const regex = new RegExp(`\\b${term}\\b`, "i");
      return regex.test(homepageHtml);
    });
  });
  const categoryCount = matchedCategories.length;

  let serviceScore = 0;
  let serviceSummary = "Locked";
  let servicePassed = false;
  let serviceFinding: FindingDetail | undefined;

  if (isJsShell) {
    serviceScore = 0;
    servicePassed = false;
    serviceSummary = "Locked";
    serviceFinding = {
      code: "CSR-01",
      category: "Architecture & Machine-Readability",
      defect: "Website relies on client-side JavaScript rendering (SPA shell). The initial HTML contains no crawlable treatment text.",
      chatGptObservation: "AI search engines (GPTBot, ClaudeBot, Perplexity) fetch raw HTML without executing JavaScript. They observe an empty shell and cannot index your services.",
      oneLineFix: "Implement server-side rendering (SSR) or pre-render static HTML snapshots with embedded JSON-LD metadata.",
    };
  } else if (categoryCount >= 5) {
    serviceScore = 20;
    servicePassed = true;
    serviceSummary = `Readable — ${categoryCount} treatment categories detected`;
  } else if (categoryCount >= 2) {
    serviceScore = 10;
    servicePassed = false;
    serviceSummary = "Locked";
    serviceFinding = {
      code: "SVC-02",
      category: "Services & Pricing",
      defect: `Only ${categoryCount} treatment categories detected (${matchedCategories.map((c) => c.name).slice(0, 3).join(", ")}). Core service offerings are buried in unlinked scripts or submenus.`,
      chatGptObservation: `When users query about specialized procedures, AI models only recognize the ${categoryCount} surface categories and cite competitors for unindexed treatments.`,
      oneLineFix: "Publish a structured JSON-LD Service catalog declaring all clinical modalities, indications, and procedures.",
    };
  } else {
    serviceScore = 0;
    servicePassed = false;
    serviceSummary = "Locked";
    serviceFinding = {
      code: "SVC-04",
      category: "Services & Pricing",
      defect: "No structured service catalog detected — treatments cannot be extracted by machine crawlers.",
      chatGptObservation: "AI assistants cannot enumerate what procedures your clinic offers or which modalities you utilize.",
      oneLineFix: "Embed Schema.org/OfferCatalog with machine-readable service names, categories, and target areas.",
    };
  }

  // 2. Schema Markup (Max 20 pts: 0 / 10 / 20)
  const jsonLdBlocks: any[] = [];
  const scriptRegex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(homepageHtml)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      jsonLdBlocks.push(parsed);
    } catch {
      // Ignored malformed script block
    }
  }

  const flatJson = JSON.stringify(jsonLdBlocks).toLowerCase();
  const hasMedicalClinic =
    flatJson.includes("medicalbusiness") ||
    flatJson.includes("medicalclinic") ||
    flatJson.includes("healthandbeautybusiness") ||
    flatJson.includes("physician");
  const hasGenericOrg =
    flatJson.includes("localbusiness") ||
    flatJson.includes("organization") ||
    flatJson.includes("website");

  let schemaScore = 0;
  let schemaPassed = false;
  let schemaSummary = "Locked";
  let schemaFinding: FindingDetail | undefined;

  if (hasMedicalClinic) {
    schemaScore = 20;
    schemaPassed = true;
    schemaSummary = "Found MedicalBusiness schema";
  } else if (hasGenericOrg) {
    schemaScore = 10;
    schemaPassed = false;
    schemaSummary = "Locked";
    schemaFinding = {
      code: "IDN-02",
      category: "Identity & Schema",
      defect: "Generic Organization or LocalBusiness schema present, but lacks MedicalBusiness taxonomy and clinical entity attributes.",
      chatGptObservation: "AI assistants identify your practice as a generic business rather than a specialized medical aesthetic clinic with certified providers.",
      oneLineFix: "Upgrade entity schema to MedicalBusiness with MedicalSpecialty, medicalDirector, and clinical credentials.",
    };
  } else {
    schemaScore = 0;
    schemaPassed = false;
    schemaSummary = "Locked";
    schemaFinding = {
      code: "IDN-01",
      category: "Identity & Schema",
      defect: "Zero machine-readable JSON-LD entity schema found on homepage.",
      chatGptObservation: "AI assistants rely solely on third-party aggregators and directory citations, leading to mismatched entity details and missing location facts.",
      oneLineFix: "Deploy complete verified MedicalBusiness JSON-LD markup with canonical NAP, geocoordinates, and sameAs links.",
    };
  }

  // 3. Practitioner Credentials (Max 15 pts: 0 / 7 / 15)
  const detectedCredentials = CREDENTIAL_TERMS.filter((term) => {
    const reg = new RegExp(`\\b${term}\\b`, "i");
    return reg.test(homepageHtml);
  });
  const hasDirector = /medical\s+director|board[-\s]certified|plastic\s+surgeon|dermatologist/i.test(homepageHtml);

  let credScore = 0;
  let credPassed = false;
  let credSummary = "Locked";
  let credFinding: FindingDetail | undefined;

  if (isJsShell) {
    credScore = 0;
    credPassed = false;
    credSummary = "Locked";
    credFinding = {
      code: "TRS-04",
      category: "Trust & Authority",
      defect: "Practitioner profiles are rendered dynamically via JavaScript; initial HTML serves zero crawlable provider credentials.",
      chatGptObservation: "AI engines querying physician oversight cannot find provider names or medical degrees in the crawlable source code.",
      oneLineFix: "Render medical director and injector credentials in static HTML and Schema.org/Person markup.",
    };
  } else if (hasDirector && detectedCredentials.length >= 2) {
    credScore = 15;
    credPassed = true;
    credSummary = `Readable — verified provider credentials listed`;
  } else if (detectedCredentials.length >= 1) {
    credScore = 7;
    credPassed = false;
    credSummary = "Locked";
    credFinding = {
      code: "TRS-02",
      category: "Trust & Authority",
      defect: "General staff titles mentioned, but explicit medical director oversight or physician licensure credentials are absent in crawlable text.",
      chatGptObservation: "AI assistants state credentials cannot be verified from client-owned sources when prospective patients ask about injector oversight.",
      oneLineFix: "Publish structured Physician and Person markup linking practitioner profiles to medical board state licensure records.",
    };
  } else {
    credScore = 0;
    credPassed = false;
    credSummary = "Locked";
    credFinding = {
      code: "TRS-03",
      category: "Trust & Authority",
      defect: "Practitioner credentials locked in raster images or missing entirely from crawlable text.",
      chatGptObservation: "AI engines treat the practice as uncredentialed or cite generic aggregators rather than your verified staff.",
      oneLineFix: "Expose provider names, clinical degrees (MD, DO, NP, RN), and supervisory structure in crawlable text and Person schema.",
    };
  }

  // 4. Pricing Visibility (Max 15 pts: 0 / 7 / 15)
  // Context-aware: Must be tied to a service, unit rate, or priceSpecification. NOT promo banners ($500 value, financing).
  const cleanHtmlForPricing = homepageHtml
    .replace(/value\s*•\s*\$\s*\d+/gi, " ")
    .replace(/\$\s*\d+\s*value/gi, " ")
    .replace(/orders\s+under\s*\$\s*\d+/gi, " ")
    .replace(/purchases\s+under\s*\$\s*\d+/gi, " ")
    .replace(/gift\s+cards?\s*(?:from)?\s*\$\s*\d+/gi, " ");

  const priceMatches = new Set<string>();
  // Match prices paired with services or unit designations (e.g. $12/unit, Botox $250, starting at $199)
  const servicePriceRegex = /(?:botox|dysport|filler|facial|laser|microneedling|peel|sculptra|treatment|consultation)[^<>\n]{0,80}\$\s*(\d{2,4})/gi;
  const unitPriceRegex = /\$\s*(\d{1,4}(?:\.\d{2})?)\s*(?:\/\s*unit|per\s+unit|\/\s*syringe|per\s+syringe|\/\s*treatment|per\s+treatment|\/\s*session|per\s+session)/gi;
  const startingRateRegex = /(?:starting\s+at|from|starts?\s+at)\s*\$\s*(\d{2,4})/gi;

  let pMatch;
  while ((pMatch = servicePriceRegex.exec(cleanHtmlForPricing)) !== null) {
    priceMatches.add(pMatch[1]);
  }
  while ((pMatch = unitPriceRegex.exec(cleanHtmlForPricing)) !== null) {
    priceMatches.add(pMatch[1]);
  }
  while ((pMatch = startingRateRegex.exec(cleanHtmlForPricing)) !== null) {
    priceMatches.add(pMatch[1]);
  }

  // Also check if JSON-LD has offer priceSpecification
  const hasSchemaPricing = flatJson.includes("pricespecification") || flatJson.includes('"price":');

  let priceScore = 0;
  let pricePassed = false;
  let priceSummary = "Locked";
  let priceFinding: FindingDetail | undefined;

  if (priceMatches.size >= 3 || hasSchemaPricing) {
    priceScore = 15;
    pricePassed = true;
    priceSummary = `Readable — itemized treatment pricing detected`;
  } else if (priceMatches.size >= 1) {
    priceScore = 7;
    pricePassed = false;
    priceSummary = "Locked";
    priceFinding = {
      code: "SVC-05",
      category: "Services & Pricing",
      defect: "Only starting rates or isolated pricing points detected; full treatment catalog is unpriced or unquoted.",
      chatGptObservation: "AI assistants tell users pricing is incomplete and recommend competitor clinics that publish transparent treatment price menus.",
      oneLineFix: "Structure service offerings with Schema.org/Offer priceSpecification containing unit rates or price intervals.",
    };
  } else {
    priceScore = 0;
    pricePassed = false;
    priceSummary = "Locked";
    priceFinding = {
      code: "SVC-04",
      category: "Services & Pricing",
      defect: "Zero crawlable treatment pricing detected — all rates locked behind consultation gates or third-party portals.",
      chatGptObservation: "When prospective patients ask for treatment costs at your clinic, AI models report pricing is unverified and quote competitors instead.",
      oneLineFix: "Publish crawlable price floors or unit ranges in structured Offer schema with freshness timestamps.",
    };
  }

  // 5. Booking Path (Max 15 pts: 0 / 7 / 15)
  const detectedBookingEngines = VERIFIED_BOOKING_PLATFORMS.filter((engine) => {
    const regex = new RegExp(`href=["'][^"']*${engine.replace('.', '\\.')}[^"']*["']`, "gi");
    const matches = homepageHtml.match(regex) || [];
    if (matches.length === 0) return false;
    // Exclude links that are exclusively for giftcards, webstore merchandise, or package sales
    const appointmentMatches = matches.filter(
      (m) => !/giftcard|webstoreNew\/sales|seriespackage|merchandise|shop/i.test(m)
    );
    return appointmentMatches.length > 0;
  });
  const hasGenericFormOrAnchor =
    /<form[^>]*action/i.test(homepageHtml) ||
    /href=["'][^"']*(?:contact|consult|appointment|schedule|book)/i.test(homepageHtml);

  let bookingScore = 0;
  let bookingPassed = false;
  let bookingSummary = "Locked";
  let bookingFinding: FindingDetail | undefined;

  if (detectedBookingEngines.length >= 1) {
    bookingScore = 15;
    bookingPassed = true;
    bookingSummary = "Direct booking path detected (15/15 pts)";
  } else if (hasGenericFormOrAnchor) {
    bookingScore = 7;
    bookingPassed = false;
    bookingSummary = "Locked";
    bookingFinding = {
      code: "ACT-02",
      category: "Actions & Booking",
      defect: "Consultation request form or anchor link found, but no direct machine-readable scheduling engine is integrated.",
      chatGptObservation: "AI assistants tell users to call or submit an inquiry form rather than citing an instant booking link.",
      oneLineFix: "Deploy Schema.org/ReserveAction linked directly to an online scheduling platform.",
    };
  } else {
    bookingScore = 0;
    bookingPassed = false;
    bookingSummary = "Locked";
    bookingFinding = {
      code: "ACT-01",
      category: "Actions & Booking",
      defect: "Booking path is JavaScript-only or telephone-only — no crawlable action an AI agent can complete or cite.",
      chatGptObservation: "AI agents cannot verify how prospective patients initiate an appointment on your site.",
      oneLineFix: "Provide a crawlable, direct booking endpoint with ReserveAction schema.",
    };
  }

  // 6. Crawl Policy (Max 15 pts: 0 / 7 / 15)
  const robotsLower = robotsTxt.toLowerCase();
  const hasUniversalBlock = /user-agent:\s*\*\s*\n(?:[^\n]*\n)*disallow:\s*\/\s*(?:\n|$)/i.test(robotsLower);
  const blocksAiBots = /user-agent:\s*(?:gptbot|claudebot|perplexitybot|ccbot)\s*\n(?:[^\n]*\n)*disallow:\s*\//i.test(robotsLower);

  let crawlScore = 0;
  let crawlPassed = false;
  let crawlSummary = "Locked";
  let crawlFinding: FindingDetail | undefined;

  if (!hasUniversalBlock && !blocksAiBots) {
    if (llmsTxtFound) {
      crawlScore = 15;
      crawlPassed = true;
      crawlSummary = "Allows AI crawlers + llms.txt (15/15 pts)";
    } else {
      crawlScore = 12; // 12 of 15 for allowing crawlers without dedicated llms.txt
      crawlPassed = true;
      crawlSummary = "Allows AI crawlers (missing llms.txt · 12/15 pts)";
    }
  } else if (!hasUniversalBlock && blocksAiBots) {
    crawlScore = 5;
    crawlPassed = false;
    crawlSummary = "Locked";
    crawlFinding = {
      code: "CRL-02",
      category: "Crawl Policy",
      defect: "Robots.txt contains explicit disallow rules targeting major AI search crawlers (GPTBot, ClaudeBot, or PerplexityBot).",
      chatGptObservation: "AI engines respect crawl exclusions and decline to index your primary domain facts.",
      oneLineFix: "Update robots.txt to explicitly allow verified AI search crawlers to read public business facts.",
    };
  } else {
    crawlScore = 0;
    crawlPassed = false;
    crawlSummary = "Locked";
    crawlFinding = {
      code: "CRL-01",
      category: "Crawl Policy",
      defect: "Robots.txt contains universal Disallow rules blocking automated crawlers from the root directory.",
      chatGptObservation: "Search models and AI assistants are entirely prohibited from verifying your website content.",
      oneLineFix: "Remove universal disallow and configure an open llms.txt directory of public practice facts.",
    };
  }

  const checks: CheckResult[] = [
    {
      id: "service_catalog",
      name: "Service catalog",
      passed: servicePassed,
      score: serviceScore,
      maxScore: 20,
      publicSummary: servicePassed ? serviceSummary : "🔒 Locked",
      finding: serviceFinding,
    },
    {
      id: "schema_markup",
      name: "Schema markup",
      passed: schemaPassed,
      score: schemaScore,
      maxScore: 20,
      publicSummary: schemaPassed ? schemaSummary : "🔒 Locked",
      finding: schemaFinding,
    },
    {
      id: "credentials",
      name: "Practitioner credentials",
      passed: credPassed,
      score: credScore,
      maxScore: 15,
      publicSummary: credPassed ? credSummary : "🔒 Locked",
      finding: credFinding,
    },
    {
      id: "pricing_visibility",
      name: "Pricing visibility",
      passed: pricePassed,
      score: priceScore,
      maxScore: 15,
      publicSummary: pricePassed ? priceSummary : "🔒 Locked",
      finding: priceFinding,
    },
    {
      id: "booking_path",
      name: "Booking path",
      passed: bookingPassed,
      score: bookingScore,
      maxScore: 15,
      publicSummary: bookingPassed ? bookingSummary : "🔒 Locked",
      finding: bookingFinding,
    },
    {
      id: "crawl_policy",
      name: "Crawl policy",
      passed: crawlPassed,
      score: crawlScore,
      maxScore: 15,
      publicSummary: crawlPassed ? crawlSummary : "🔒 Locked",
      finding: crawlFinding,
    },
  ];

  const totalScore = Math.min(
    100,
    Math.max(0, serviceScore + schemaScore + credScore + priceScore + bookingScore + crawlScore)
  );
  const failedCount = checks.filter((c) => !c.passed).length;
  const scoreHeadline = getScoreHeadline(domain, totalScore);

  return {
    domain,
    status: "success",
    score: totalScore,
    scoreHeadline,
    checks,
    failedCount,
    timestamp,
  };
}

/**
 * Strips confidential finding details so they are NOT visible in the DOM before email gate submission.
 */
export function sanitizeReportForUngated(report: ScanReport) {
  return {
    domain: report.domain,
    status: report.status,
    statusMessage: report.statusMessage,
    score: report.score,
    scoreHeadline: report.scoreHeadline,
    failedCount: report.failedCount,
    timestamp: report.timestamp,
    checks: report.checks.map((check) => ({
      id: check.id,
      name: check.name,
      passed: check.passed,
      score: check.score,
      maxScore: check.maxScore,
      publicSummary: check.publicSummary,
      // finding is omitted
    })),
  };
}
