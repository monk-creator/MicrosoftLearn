import { CHUNKS, getChunkById } from "../data/chunks";
import type { LearnChunk } from "../types";

/** Structured match from the local Microsoft Learn catalog slice (for rich UI cards). */
export interface RecommendationPayload {
  primary: LearnChunk;
  next: LearnChunk | null;
  /** Other top-ranked catalog entries (same retrieval pass). */
  alternatives: LearnChunk[];
  whySnippet: string;
}

const STOP = new Set([
  "a",
  "an",
  "the",
  "to",
  "for",
  "of",
  "and",
  "or",
  "in",
  "on",
  "with",
  "i",
  "my",
  "me",
  "is",
  "are",
  "was",
  "what",
  "how",
  "do",
  "does",
  "can",
  "want",
  "need",
  "help",
  "learn",
  "learning",
  "about",
  "some",
  "any",
  "please",
  "thanks",
  "time",
  "have",
  "has",
  "get",
  "start",
  "started",
]);

export interface GuideState {
  consecutiveClarifications: number;
}

const INITIAL_STATE: GuideState = { consecutiveClarifications: 0 };
const SOURCE_HOME = "Microsoft Learn: Build with answers in reach";

function withSource(text: string, source: string = SOURCE_HOME): string {
  return `${text}\n\nSource: ${source}`;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    /* ASCII-friendly (no \\p{}); avoids parse/runtime issues on older engines */
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function scoreChunk(message: string, chunk: LearnChunk): number {
  const toks = new Set(tokenize(message));
  if (toks.size === 0) return 0;
  let score = 0;
  const hay = [
    ...chunk.keywords,
    ...chunk.products.map((p) => p.toLowerCase()),
    ...chunk.roles.map((r) => r.toLowerCase()),
    chunk.title.toLowerCase(),
    chunk.level.toLowerCase(),
  ].join(" ");

  for (const t of toks) {
    if (hay.includes(t)) score += 1;
  }
  for (const kw of chunk.keywords) {
    const kwt = kw.toLowerCase();
    if (kwt.includes(" ") && message.toLowerCase().includes(kwt)) score += 2;
  }
  for (const p of chunk.products) {
    const pl = p.toLowerCase();
    if (message.toLowerCase().includes(pl)) score += 2;
  }
  if (chunk.contentType === "Browse hub") score *= 0.85;
  return score;
}

function detectOutOfScope(message: string): { type: string; resource: string } | null {
  const m = message.toLowerCase();

  if (
    /\bdebug\b|\bstack trace\b|\bexception\b|\bcompile error\b|\bmy code\b|\bfix this bug\b|\bnpm err\b/.test(
      m,
    )
  ) {
    return {
      type: "code or debugging help",
      resource: "https://learn.microsoft.com/en-us/answers/",
    };
  }

  if (
    /\bbi(ll|ling)\b|\binvoice\b|\brefund\b|\bsubscription problem\b|\bcharged twice\b|\bpayment failed\b/.test(
      m,
    ) &&
    !/\bcost management\b|\blearn\b|\bmodule\b|\btraining\b/.test(m)
  ) {
    return {
      type: "Azure billing or account issues",
      resource: "https://learn.microsoft.com/en-us/answers/",
    };
  }

  if (/\bsalary\b|\bjob offer\b|\bshould i quit\b|\bcareer coach\b/.test(m)) {
    return {
      type: "career counselling beyond training recommendations",
      resource: "https://learn.microsoft.com/en-us/credentials/",
    };
  }

  if (/\baws\b|\bgcp\b|\bgoogle cloud\b(?!.*azure)/.test(m) && !/\bazure\b/.test(m)) {
    return {
      type: "non-Microsoft Learn topics",
      resource: "https://learn.microsoft.com/en-us/training/browse/",
    };
  }

  return null;
}

function topChunks(message: string, n: number): { chunk: LearnChunk; score: number }[] {
  const ranked = CHUNKS.map((chunk) => ({ chunk, score: scoreChunk(message, chunk) }))
    .filter((x) => x.score > 0 && x.chunk.contentType !== "Browse hub")
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, n);
}

function formatRecommendation(chunk: LearnChunk, userSnippet: string): string {
  const next = chunk.nextIds.map((id) => getChunkById(id)).find(Boolean) as LearnChunk | undefined;
  const nextLine = next
    ? `4. Suggested next step after this course: ${next.title} — ${next.url}`
    : `4. Suggested next step after this course: Explore related modules on the same topic in https://learn.microsoft.com/en-us/training/browse/.`;

  const why = `2. Why it fits: It matches your interest (${userSnippet}) based on the catalog tags and level for this content.`;

  return [
    `1. Course or learning path: ${chunk.title} — ${chunk.url}`,
    why,
    `3. Estimated completion time: ${chunk.duration}`,
    nextLine,
    "",
    `Source: ${chunk.sourcePage}`,
  ].join("\n");
}

function clarifyPrompt(message: string): string {
  const m = message.toLowerCase();
  if (!/\bazure|power|dynamics|sentinel|fabric|365|bi|security|ai\b/i.test(m)) {
    return "I don't have enough to recommend confidently.\nCould you tell me which Microsoft area you care about most right now (for example Azure fundamentals, Power BI, Dynamics 365, or Microsoft Sentinel)?";
  }
  if (!/\bbeginner|new|start|intermediate|advanced|experience\b/i.test(m)) {
    return "I don't have enough to recommend confidently.\nCould you tell me your rough experience level with that topic (brand new, some hands-on, or advanced)?";
  }
  return "I don't have enough to recommend confidently.\nCould you share how much time you have this week (for example under 1 hour, a half day, or several days)?";
}

function escalationSummary(message: string): string {
  return [
    "Escalation handoff (copy for support)",
    "",
    `- User goal: ${message.slice(0, 200)}${message.length > 200 ? "…" : ""}`,
    "- Background: Not enough structured signals after multiple clarification attempts (prototype guide).",
    "- Courses tried: None confirmed from chat history in this session.",
    "- Blocker: Need product area, experience level, and available time to match catalog entries safely.",
    "",
    "Please continue on [Microsoft Learn](https://learn.microsoft.com/en-us/training/browse/) or ask a more specific training question.",
  ].join("\n");
}

export function processGuideTurn(
  userMessage: string,
  state: GuideState = INITIAL_STATE,
): {
  assistantText: string;
  nextState: GuideState;
  kind: "ok" | "clarify" | "oos" | "escalate";
  recommendation?: RecommendationPayload;
} {
  const trimmed = userMessage.trim();
  if (!trimmed) {
    return {
      assistantText: withSource(
        "I don't have enough to recommend confidently.\nCould you tell me what you want to learn and how much time you have?",
      ),
      nextState: { ...state, consecutiveClarifications: state.consecutiveClarifications + 1 },
      kind: "clarify",
    };
  }

  const oos = detectOutOfScope(trimmed);
  if (oos) {
    return {
      assistantText: withSource(
        `That's outside what I can help with here. For ${oos.type}, please visit ${oos.resource}. Can I help you find a learning path?`,
      ),
      nextState: { consecutiveClarifications: 0 },
      kind: "oos",
    };
  }

  const ranked = topChunks(trimmed, 8);
  const best = ranked[0];
  const strongEnough = best && best.score >= 3;

  if (!strongEnough) {
    if (state.consecutiveClarifications >= 3) {
      return {
        assistantText: withSource(escalationSummary(trimmed)),
        nextState: { consecutiveClarifications: 0 },
        kind: "escalate",
      };
    }
    return {
      assistantText: withSource(clarifyPrompt(trimmed)),
      nextState: { consecutiveClarifications: state.consecutiveClarifications + 1 },
      kind: "clarify",
    };
  }

  const snippet = tokenize(trimmed).slice(0, 6).join(", ") || "your goals";
  // Prefer course/learning path for the response header.
  const primary =
    ranked.find((r) => r.chunk.contentType === "Learning Path")?.chunk ??
    ranked.find((r) => r.chunk.contentType === "Course")?.chunk ??
    best.chunk;

  const nextId = primary.nextIds[0];
  const next = nextId ? getChunkById(nextId) ?? null : null;

  const altIds = new Set([primary.id, ...(next ? [next.id] : [])]);
  const alternatives = ranked
    .map((r) => r.chunk)
    .filter((c) => !altIds.has(c.id))
    .slice(0, 3);

  const textBody = formatRecommendation(primary, snippet);

  return {
    assistantText: textBody,
    recommendation: { primary, next, alternatives, whySnippet: snippet },
    nextState: { consecutiveClarifications: 0 },
    kind: "ok",
  };
}

export function getInitialGuideState(): GuideState {
  return { ...INITIAL_STATE };
}
