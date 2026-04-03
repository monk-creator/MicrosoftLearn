import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { getInitialGuideState, processGuideTurn, type RecommendationPayload } from "../lib/guideEngine";
import type { GuideState } from "../lib/guideEngine";
import type { LearnChunk } from "../types";
import { LearnUnitCard } from "./LearnUnitCard";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  recommendation?: RecommendationPayload;
}

function renderMarkdownLinks(text: string): ReactNode[] {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  const linkRe = /\[([^\]]+)]\((https?:[^)\s]+)\)/g;

  lines.forEach((line, li) => {
    const parts: ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    linkRe.lastIndex = 0;
    while ((m = linkRe.exec(line)) !== null) {
      if (m.index > last) {
        parts.push(line.slice(last, m.index));
      }
      parts.push(
        <a key={`${li}-${m.index}`} href={m[2]} target="_blank" rel="noreferrer">
          {m[1]}
        </a>,
      );
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    nodes.push(
      <p key={li} className="msg-line">
        {parts}
      </p>,
    );
  });
  return nodes;
}

function whyParagraph(chunk: LearnChunk, snippet: string): string {
  return chunk.contentType === "Browse hub"
    ? "Your question lines up with this product area on Microsoft Learn. This browse view lists official modules and learning paths you can filter further."
    : `This pick lines up with what you said (${snippet}) and the tags, roles, and level shown on the catalog entry.`;
}

const WELCOME = `Hi — I’m your AI Guide for this demo. Describe your goal and how much time you have.

I retrieve matches from a curated slice of the same titles, durations, products, and URLs as Microsoft Learn (you’ll see module-style cards when I recommend something).

What would you like to learn?`;

export function GuideChat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [guideState, setGuideState] = useState<GuideState>(getInitialGuideState);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const { assistantText, nextState, recommendation } = processGuideTurn(text, guideState);
    setGuideState(nextState);
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: assistantText,
      recommendation,
    };
    setMessages((m) => [...m, userMsg, assistantMsg]);
  }, [input, guideState]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  function renderAssistantBody(msg: Message): ReactNode {
    if (msg.recommendation) {
      const r = msg.recommendation;
      const hid = `unit-${msg.id}`;
      return (
        <div className="guide-rich">
          <p className="guide-retrieval-label">
            <span className="guide-retrieval-dot" aria-hidden />
            Retrieved from Microsoft Learn catalog data (local index)
          </p>
          <p className="guide-why">{whyParagraph(r.primary, r.whySnippet)}</p>
          <LearnUnitCard chunk={r.primary} variant="primary" headingId={hid} />
          {r.next ? (
            <section className="guide-next-section" aria-labelledby={`next-${msg.id}`}>
              <h4 className="guide-section-title" id={`next-${msg.id}`}>
                Suggested next step
              </h4>
              <LearnUnitCard
                chunk={r.next}
                variant="compact"
                headingId={`next-unit-${msg.id}`}
              />
            </section>
          ) : null}
          {r.alternatives.length > 0 ? (
            <section className="guide-alt-section" aria-labelledby={`alt-${msg.id}`}>
              <h4 className="guide-section-title" id={`alt-${msg.id}`}>
                Other close matches
              </h4>
              <div className="guide-alt-grid">
                {r.alternatives.map((c) => (
                  <LearnUnitCard
                    key={c.id}
                    chunk={c}
                    variant="alternate"
                    headingId={`alt-${msg.id}-${c.id}`}
                  />
                ))}
              </div>
            </section>
          ) : null}
          <p className="guide-source">
            Source: {r.primary.sourcePage}
          </p>
        </div>
      );
    }
    return <div className="guide-md">{renderMarkdownLinks(msg.content)}</div>;
  }

  return (
    <div className="guide-page">
      <div className="guide-page-header">
        <h1 className="guide-page-title">AI Guide</h1>
        <p className="guide-page-lede">
          Training recommendations styled like Learn. Links open the real{" "}
          <a href="https://learn.microsoft.com/en-us/training/" target="_blank" rel="noreferrer">
            learn.microsoft.com
          </a>{" "}
          pages.
        </p>
      </div>
      <div className="guide-chat">
        <div className="guide-messages" role="log" aria-live="polite">
          {messages.map((msg) => (
            <article
              key={msg.id}
              className={`guide-bubble guide-bubble--${msg.role}`}
            >
              {msg.role === "assistant" ? (
                renderAssistantBody(msg)
              ) : (
                <p className="msg-plain">{msg.content}</p>
              )}
            </article>
          ))}
          <div ref={endRef} />
        </div>
        <div className="guide-composer">
          <label className="sr-only" htmlFor="guide-input">
            Your message
          </label>
          <textarea
            id="guide-input"
            className="guide-input"
            rows={2}
            placeholder="Example: I’m new to Azure and have about 2 hours this week for fundamentals."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button type="button" className="guide-send" onClick={send}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
