type GuideState = { consecutiveClarifications: number };
type GuideReply = { assistantText: string; nextState: GuideState; kind: "ok" | "clarify" | "oos" | "escalate" };
type SearchHit = { title: string; url: string; description: string; score: number };
type EvidenceChunk = { text: string; score: number };

const SOURCE_HOME = "Microsoft Learn: Build with answers in reach";
const TRAINING_BY_PRODUCT: Record<string, { title: string; url: string; time: string; nextTitle: string; nextUrl: string }> = {
  azure: {
    title: "Introduction to Cloud Infrastructure: Describe cloud concepts",
    url: "https://learn.microsoft.com/en-us/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/",
    time: "56 min",
    nextTitle: "Introduction to Cloud Infrastructure: Describe Azure architecture and services",
    nextUrl: "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals-describe-azure-architecture-services/",
  },
  "dynamics 365": {
    title: "Explore the fundamentals of Microsoft Dynamics 365 Sales",
    url: "https://learn.microsoft.com/en-us/training/paths/learn-fundamentals-of-microsoft-dynamics-365-sales/",
    time: "1 hr 48 min",
    nextTitle: "Explore Dynamics 365 Sales",
    nextUrl: "https://learn.microsoft.com/en-us/training/modules/explore-dynamics-365-sales/",
  },
  "power platform": {
    title: "Get started with Microsoft data analytics",
    url: "https://learn.microsoft.com/en-us/training/paths/data-analytics-microsoft/",
    time: "1 hr 46 min",
    nextTitle: "Get started with Copilot in Power BI",
    nextUrl: "https://learn.microsoft.com/en-us/training/modules/power-bi-copilot/",
  },
  "microsoft 365": {
    title: "Browse all training (Microsoft 365)",
    url: "https://learn.microsoft.com/en-us/training/browse/?products=microsoft-365",
    time: "Varies",
    nextTitle: "Browse all training",
    nextUrl: "https://learn.microsoft.com/en-us/training/browse/",
  },
  fabric: {
    title: "Browse all training (Microsoft Fabric)",
    url: "https://learn.microsoft.com/en-us/training/browse/?products=microsoft-fabric",
    time: "Varies",
    nextTitle: "Get started with Microsoft data analytics",
    nextUrl: "https://learn.microsoft.com/en-us/training/paths/data-analytics-microsoft/",
  },
  sentinel: {
    title: "Configure your Microsoft Sentinel environment",
    url: "https://learn.microsoft.com/en-us/training/paths/sc-200-configure-azure-sentinel-environment/",
    time: "3 hr 35 min",
    nextTitle: "Create queries for Microsoft Sentinel using Kusto Query Language (KQL)",
    nextUrl: "https://learn.microsoft.com/en-us/training/paths/sc-200-utilize-kql-for-azure-sentinel/",
  },
};
const DOCS_BY_PRODUCT: Record<string, string> = {
  azure: "https://learn.microsoft.com/en-us/azure/",
  "dynamics 365": "https://learn.microsoft.com/en-us/dynamics365/",
  "power platform": "https://learn.microsoft.com/en-us/power-platform/",
  "microsoft 365": "https://learn.microsoft.com/en-us/microsoft-365/",
  fabric: "https://learn.microsoft.com/en-us/fabric/",
  sentinel: "https://learn.microsoft.com/en-us/azure/sentinel/",
};

function cors() {
  return { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" };
}
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", ...cors() } });
}
function withSource(text: string, source = SOURCE_HOME) {
  return `${text}\n\nSource: ${source}`;
}
function tokenize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((x) => x.length > 1);
}
function detectOutOfScope(message: string): { type: string; resource: string } | null {
  const m = message.toLowerCase();
  if (/\bdebug\b|\bstack trace\b|\bexception\b|\bcompile error\b|\bmy code\b|\bfix this bug\b|\bnpm err\b/.test(m)) return { type: "code or debugging help", resource: "https://learn.microsoft.com/en-us/answers/" };
  if (/\bbi(ll|ling)\b|\binvoice\b|\brefund\b|\bsubscription\b|\bpayment\b/.test(m)) return { type: "Azure billing or account issues", resource: "https://learn.microsoft.com/en-us/answers/" };
  if (/\bsalary\b|\bjob offer\b|\bcareer coach\b/.test(m)) return { type: "career counselling beyond training recommendations", resource: "https://learn.microsoft.com/en-us/credentials/" };
  return null;
}
function detectProduct(message: string): string | null {
  const m = message.toLowerCase();
  if (m.includes("azure")) return "azure";
  if (m.includes("dynamics")) return "dynamics 365";
  if (m.includes("power platform") || m.includes("power bi")) return "power platform";
  if (m.includes("microsoft 365") || m.includes("m365")) return "microsoft 365";
  if (m.includes("fabric")) return "fabric";
  if (m.includes("sentinel")) return "sentinel";
  return null;
}
function guessUserGoal(message: string): "definition" | "recommendation" {
  return /\bwhat is\b|\bwhat are\b|\bexplain\b|\bdefine\b|\btell me about\b|\boverview\b/i.test(message) ? "definition" : "recommendation";
}
function needsExperience(message: string) {
  return !/\bbeginner\b|\bnew\b|\bintermediate\b|\badvanced\b|\bexperience\b/i.test(message.toLowerCase());
}
function needsTime(message: string) {
  return !/\bmin\b|\bhour\b|\bday\b|\bweek\b|\bmonth\b|\b30\b|\b60\b|\b2h\b|\b3h\b/i.test(message.toLowerCase());
}
function explainProductPlain(product: string) {
  if (product === "azure") return "Azure is Microsoft's cloud platform for building, hosting, and managing applications and services in Microsoft datacenters.";
  if (product === "dynamics 365") return "Dynamics 365 is Microsoft's business applications platform for CRM and ERP scenarios such as sales, service, and operations.";
  if (product === "power platform") return "Power Platform is Microsoft's low-code platform for analytics, app building, automation, and chat experiences.";
  if (product === "microsoft 365") return "Microsoft 365 is Microsoft's productivity cloud that combines apps, collaboration, and enterprise security services.";
  if (product === "fabric") return "Microsoft Fabric is Microsoft's unified analytics platform for data engineering, data science, and business intelligence.";
  return "Microsoft Sentinel is Microsoft's cloud-native security operations platform for threat detection, investigation, and response.";
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function chunkText(text: string, maxWords = 90): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += Math.floor(maxWords * 0.7)) {
    const slice = words.slice(i, i + maxWords).join(" ").trim();
    if (slice.length > 80) chunks.push(slice);
    if (chunks.length >= 60) break;
  }
  return chunks;
}

function rankChunks(chunks: string[], query: string, product: string): EvidenceChunk[] {
  const q = new Set(tokenize(query));
  const p = new Set(tokenize(product));
  const ranked: EvidenceChunk[] = [];
  for (const c of chunks) {
    const lc = c.toLowerCase();
    let score = 0;
    for (const t of q) if (lc.includes(t)) score += 1;
    for (const t of p) if (lc.includes(t)) score += 2;
    if (/\bwhat is\b|\boverview\b|\bintroduction\b/.test(lc)) score += 1;
    if (score > 0) ranked.push({ text: c, score });
  }
  return ranked.sort((a, b) => b.score - a.score);
}

async function fetchEvidenceChunk(url: string, query: string, product: string): Promise<EvidenceChunk | null> {
  const r = await fetch(url);
  if (!r.ok) return null;
  const html = await r.text();
  const cleaned = htmlToText(html);
  const chunks = chunkText(cleaned);
  const ranked = rankChunks(chunks, query, product);
  return ranked[0] ?? null;
}
async function tryLearnSearch(query: string): Promise<SearchHit[]> {
  const u = `https://learn.microsoft.com/api/search?search=${encodeURIComponent(query)}&locale=en-us`;
  const r = await fetch(u, { headers: { accept: "application/json" } });
  if (!r.ok) return [];
  const payload = (await r.json()) as Record<string, unknown>;
  const arr = (payload.results ?? payload.value ?? payload.items) as unknown;
  if (!Array.isArray(arr)) return [];
  const hits: SearchHit[] = [];
  for (const item of arr.slice(0, 12) as Array<Record<string, unknown>>) {
    const url = String(item.url ?? item.href ?? "");
    if (!url.includes("learn.microsoft.com")) continue;
    hits.push({ title: String(item.title ?? item.name ?? "Microsoft Learn result"), url, description: String(item.description ?? item.snippet ?? ""), score: 0 });
  }
  return hits;
}
function scoreSearchHits(hits: SearchHit[], message: string, product: string, intent: "definition" | "recommendation"): SearchHit[] {
  const qTokens = new Set(tokenize(message));
  const pTokens = new Set(tokenize(product));
  for (const hit of hits) {
    const text = `${hit.title} ${hit.description} ${hit.url}`.toLowerCase();
    let score = 0;
    for (const t of qTokens) if (text.includes(t)) score += 1;
    for (const p of pTokens) if (text.includes(p)) score += 2;
    if (intent === "definition") {
      if (/(\/docs\/|\/azure\/|\/dynamics365\/|\/power-platform\/|\/microsoft-365\/|\/fabric\/|\/sentinel\/)/.test(hit.url)) score += 3;
      if (/(what is|overview|introduction)/i.test(hit.title)) score += 2;
    } else {
      if (/\/training\//.test(hit.url)) score += 3;
      if (/(learning path|module|course)/i.test(hit.title)) score += 2;
    }
    if (/learn\.microsoft\.com\/en-us\//.test(hit.url)) score += 1;
    hit.score = score;
  }
  return hits.sort((a, b) => b.score - a.score);
}
function pickBestSource(ranked: SearchHit[], fallbackUrl: string): { sourceName: string; sourceUrl: string; confidence: "high" | "medium" | "low" } {
  const best = ranked[0];
  if (!best) return { sourceName: SOURCE_HOME, sourceUrl: fallbackUrl, confidence: "low" };
  if (best.score >= 9) return { sourceName: best.title, sourceUrl: best.url, confidence: "high" };
  if (best.score >= 5) return { sourceName: best.title, sourceUrl: best.url, confidence: "medium" };
  return { sourceName: SOURCE_HOME, sourceUrl: fallbackUrl, confidence: "low" };
}

async function buildAnswer(message: string, state: GuideState): Promise<GuideReply> {
  const oos = detectOutOfScope(message);
  if (oos) return { kind: "oos", nextState: { consecutiveClarifications: 0 }, assistantText: withSource(`That's outside what I can help with here. For ${oos.type}, please visit ${oos.resource}. Can I help you find a learning path?`) };

  const product = detectProduct(message);
  if (!product) {
    const nextCount = state.consecutiveClarifications + 1;
    if (nextCount > 3) {
      return { kind: "escalate", nextState: { consecutiveClarifications: 0 }, assistantText: withSource(["Escalation handoff (copy for support)", "", `- User goal: ${message.slice(0, 200)}${message.length > 200 ? "…" : ""}`, "- Background: Product area is still unclear.", "- Courses tried: None confirmed in this conversation.", "- Blocker: Need a product area and time budget to recommend safely.", "", "Please continue on https://learn.microsoft.com/en-us/training/browse/ or ask with one product focus."].join("\n")) };
    }
    return { kind: "clarify", nextState: { consecutiveClarifications: nextCount }, assistantText: withSource("I don't have enough to recommend confidently.\nCould you tell me which Microsoft area you want: Azure, Dynamics 365, Power Platform, Microsoft 365, Fabric, or Sentinel?") };
  }

  const train = TRAINING_BY_PRODUCT[product];
  const docsUrl = DOCS_BY_PRODUCT[product];
  const goal = guessUserGoal(message);
  const queryCandidates = goal === "definition" ? [`${product} what is`, `${product} overview`, `${product} documentation`] : [`${product} learning path`, `${product} module`, `${product} training`];
  const allHits: SearchHit[] = [];
  for (const q of queryCandidates) allHits.push(...(await tryLearnSearch(`${q} Microsoft Learn`)));
  const dedup = new Map<string, SearchHit>();
  for (const h of allHits) if (!dedup.has(h.url)) dedup.set(h.url, h);
  const ranked = scoreSearchHits([...dedup.values()], message, product, goal);
  const source = pickBestSource(ranked, docsUrl);

  const needsClarification = goal !== "definition" && (needsExperience(message) || needsTime(message));
  if (needsClarification) {
    const nextCount = state.consecutiveClarifications + 1;
    if (nextCount > 3) {
      return { kind: "escalate", nextState: { consecutiveClarifications: 0 }, assistantText: withSource(["Escalation handoff (copy for support)", "", `- User goal: ${message.slice(0, 200)}${message.length > 200 ? "…" : ""}`, `- Background: Product selected (${product}), but level/time still missing.`, `- Courses tried: ${train.title}.`, "- Blocker: Need experience level and time budget to tailor recommendation."].join("\n"), source.sourceName) };
    }
    if (needsExperience(message)) return { kind: "clarify", nextState: { consecutiveClarifications: nextCount }, assistantText: withSource("I don't have enough to recommend confidently.\nCould you tell me your experience level with this topic (brand new, some hands-on, or advanced)?", source.sourceName) };
    return { kind: "clarify", nextState: { consecutiveClarifications: nextCount }, assistantText: withSource("I don't have enough to recommend confidently.\nCould you tell me how much time you can spend (for example 1 hour, half day, or several days)?", source.sourceName) };
  }

  const fallbackExplanation = explainProductPlain(product);
  let explanation = fallbackExplanation;
  if (goal === "definition") {
    const evidence = await fetchEvidenceChunk(source.sourceUrl, message, product);
    if (evidence?.text) {
      // Use retrieved chunk directly for stronger grounding.
      explanation = evidence.text.slice(0, 420).trim();
      if (!/[.!?]$/.test(explanation)) explanation += ".";
    }
  }
  const confidenceHint = source.confidence === "high" ? "" : source.confidence === "medium" ? " (matched from related Learn content)" : " (fallback source from product landing page)";
  const text = [
    `${product.toUpperCase()}: ${explanation}`,
    "",
    `1. Course or learning path: ${train.title} — ${train.url}`,
    `2. Why it fits this specific user: You asked about ${product}, and this option is a direct Microsoft Learn starting point in that area with a practical progression path.`,
    `3. Estimated completion time: ${train.time}`,
    `4. Suggested next step after this course: ${train.nextTitle} — ${train.nextUrl}`,
    "",
    `Source: ${source.sourceName}${confidenceHint}`,
  ].join("\n");
  return { kind: "ok", nextState: { consecutiveClarifications: 0 }, assistantText: text };
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { headers: cors() });
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/api/health") return json({ ok: true, service: "learn-guide-api" });
    if (request.method === "POST" && url.pathname === "/api/guide/answer") {
      const body = (await request.json()) as { message?: string; state?: GuideState };
      const message = (body.message ?? "").trim();
      const state = body.state ?? { consecutiveClarifications: 0 };
      if (!message) return json({ kind: "clarify", nextState: { consecutiveClarifications: state.consecutiveClarifications + 1 }, assistantText: withSource("I don't have enough to recommend confidently.\nCould you tell me what you want to learn and how much time you have?") });
      try {
        return json(await buildAnswer(message, state));
      } catch (err) {
        return json({ kind: "clarify", nextState: { consecutiveClarifications: state.consecutiveClarifications + 1 }, assistantText: withSource(`I don't have enough to recommend confidently.\nCould you rephrase your goal? (Temporary retrieval issue: ${err instanceof Error ? err.message : "unknown"})`) });
      }
    }
    return json({ error: "Not found" }, 404);
  },
};

