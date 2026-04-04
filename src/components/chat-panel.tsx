"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

interface Citation {
  index: number;
  slug: string;
  title: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  error?: boolean;
}

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  async function sendMessage(retryContent?: string) {
    const question = retryContent || input.trim();
    if (!question || question.length < 3 || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };

    if (!retryContent) {
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
    }

    setLoading(true);
    setRateLimited(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After") || "60";
        setRateLimited(`Please wait ${retryAfter} seconds before asking another question.`);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data = await res.json();

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer || "I wasn't able to generate a response.",
        citations: data.citations || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Failed to get a response. Please try again.",
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function retryLast() {
    // Find the last user message to retry
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      // Remove the last error message
      setMessages((prev) => {
        const idx = prev.length - 1;
        if (prev[idx]?.error) return prev.slice(0, idx);
        return prev;
      });
      sendMessage(lastUserMsg.content);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "var(--space-6)",
          right: "var(--space-6)",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          border: "none",
          background: "var(--accent-primary)",
          color: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          zIndex: 30,
          transition: "transform 0.15s, background 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.background = "var(--accent-primary-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.background = "var(--accent-primary)";
        }}
        aria-label="Open chat"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
        </svg>
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        width: "400px",
        maxWidth: "100vw",
        height: "min(600px, 80vh)",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-primary)",
        borderBottom: "none",
        borderTopLeftRadius: "var(--radius-lg)",
        borderTopRightRadius: "var(--radius-lg)",
        display: "flex",
        flexDirection: "column",
        zIndex: 30,
        boxShadow: "0 -4px 24px rgba(0,0,0,0.3)",
        animation: "chatSlideUp 0.2s ease-out",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-3) var(--space-4)",
        borderBottom: "1px solid var(--border-primary)",
        borderTopLeftRadius: "var(--radius-lg)",
        borderTopRightRadius: "var(--radius-lg)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
          </svg>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
            Ask AI
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            border: "none",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
            borderRadius: "var(--radius-sm)",
          }}
          aria-label="Close chat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
      }}>
        {messages.length === 0 && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            gap: "var(--space-2)",
            color: "var(--text-tertiary)",
            fontSize: "14px",
            textAlign: "center",
            padding: "var(--space-8)",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
            </svg>
            <span>Ask a question about APIANT documentation</span>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            <div style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              color: msg.role === "user" ? "var(--accent-primary)" : "var(--text-tertiary)",
              marginBottom: "var(--space-1)",
            }}>
              {msg.role === "user" ? "You" : "AI"}
            </div>
            <div style={{
              fontSize: "14px",
              lineHeight: 1.6,
              color: msg.error ? "var(--accent-amber)" : "var(--text-primary)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {msg.content}
            </div>
            {msg.citations && msg.citations.length > 0 && (
              <div style={{
                marginTop: "var(--space-2)",
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-1)",
              }}>
                {msg.citations.map((c) => (
                  <Link
                    key={c.index}
                    href={`/docs/${c.slug}`}
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--accent-primary-muted)",
                      color: "var(--accent-primary)",
                      textDecoration: "none",
                      transition: "background 0.1s",
                    }}
                  >
                    [{c.index}] {c.title}
                  </Link>
                ))}
              </div>
            )}
            {msg.error && (
              <button
                onClick={retryLast}
                style={{
                  marginTop: "var(--space-2)",
                  fontSize: "12px",
                  padding: "var(--space-1) var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-secondary)",
                  background: "var(--bg-surface)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            )}
          </div>
        ))}

        {loading && (
          <div>
            <div style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              color: "var(--text-tertiary)",
              marginBottom: "var(--space-1)",
            }}>
              AI
            </div>
            <div style={{
              fontSize: "14px",
              color: "var(--text-tertiary)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}>
              <span style={{ animation: "chatDots 1.5s ease-in-out infinite" }}>
                Searching documentation...
              </span>
            </div>
          </div>
        )}

        {rateLimited && (
          <div style={{
            fontSize: "13px",
            color: "var(--accent-amber)",
            padding: "var(--space-3)",
            borderRadius: "var(--radius-md)",
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
          }}>
            {rateLimited}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "var(--space-3) var(--space-4)",
        borderTop: "1px solid var(--border-primary)",
      }}>
        <div style={{
          display: "flex",
          gap: "var(--space-2)",
          alignItems: "flex-end",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 500))}
            onKeyDown={handleKeyDown}
            placeholder="Ask about APIANT..."
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              padding: "var(--space-2) var(--space-3)",
              fontSize: "14px",
              fontFamily: "inherit",
              outline: "none",
              minHeight: "36px",
              maxHeight: "80px",
            }}
            disabled={loading}
            aria-label="Chat message"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || input.trim().length < 3}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: input.trim().length >= 3 && !loading ? "var(--accent-primary)" : "var(--bg-surface)",
              color: input.trim().length >= 3 && !loading ? "white" : "var(--text-disabled)",
              cursor: input.trim().length >= 3 && !loading ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
        <div style={{
          fontSize: "11px",
          color: "var(--text-disabled)",
          marginTop: "4px",
          textAlign: "right",
        }}>
          {input.length}/500
        </div>
      </div>

      <style>{`
        @keyframes chatSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes chatDots {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
