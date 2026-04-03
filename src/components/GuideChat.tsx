import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { getInitialGuideState, processGuideTurn } from "../lib/guideEngine";
import type { GuideState } from "../lib/guideEngine";
import { askRemoteGuide } from "../lib/remoteGuide";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
}

const WELCOME =
  "Hi — I’m your Microsoft Learn AI Guide (prototype). Tell me what you want to learn and how much time you have.\n\nFor example: “I’m new to Azure and I have about 2 hours this week.”";

export function GuideChat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [guideState, setGuideState] = useState<GuideState>(getInitialGuideState);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;
    setIsSending(true);
    setInput("");

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((m: Message[]) => [...m, userMsg]);

    try {
      const remote = await askRemoteGuide(text, guideState);
      setGuideState(remote.nextState);
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: remote.assistantText,
      };
      setMessages((m: Message[]) => [...m, assistantMsg]);
    } catch {
      // Fallback to local logic if remote API is unreachable.
      const local = processGuideTurn(text, guideState);
      setGuideState(local.nextState);
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: local.assistantText,
      };
      setMessages((m: Message[]) => [...m, assistantMsg]);
    } finally {
      setIsSending(false);
    }
  }, [guideState, input, isSending]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="guide-page">
      <div className="guide-chat">
        <div className="guide-messages" role="log" aria-live="polite">
          {messages.map((msg) => (
            <article key={msg.id} className={`guide-bubble guide-bubble--${msg.role}`}>
              {msg.role === "assistant" ? (
                <div className="guide-text">{msg.content}</div>
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
            placeholder="Example: I’m new to Azure and I have about 2 hours this week."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={isSending}
          />
          <button
            type="button"
            className="guide-send"
            onClick={() => void send()}
            disabled={isSending}
          >
            {isSending ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
