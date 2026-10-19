"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, Sparkles } from "lucide-react";
import type { MessageTemplate } from "@/lib/messageTemplates";

type Sender = { id: string; name: string | null; email: string; image: string | null };
type Role = "ADMIN" | "INFLUENCER" | "USER";
type Message = {
  id: string;
  body: string;
  senderRole: Role;
  createdAt: string;
  sender: Sender;
};

const fmtTime = (d: string) =>
  new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function MessageThread({
  endpoint,
  role,
  otherPartyLabel,
  templates,
  emptyHint,
}: {
  /** Base API route for this thread's GET (fetch + mark-read) and POST (send). */
  endpoint: string;
  /** Which side of the conversation the current viewer is on. */
  role: Role;
  /** Display name for the other party, e.g. the influencer's name or "the brand". */
  otherPartyLabel?: string;
  /** Optional quick-select canned messages shown to ADMIN viewers. */
  templates?: MessageTemplate[];
  /** Override the "no messages yet" hint text. */
  emptyHint?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      if (res.ok) setMessages(data.messages || []);
    } catch {
      setError("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const send = async (text?: string) => {
    const body = (text ?? draft).trim();
    if (!body) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message.");
      setMessages((prev) => [...prev, data]);
      setDraft("");
      setShowTemplates(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-[1.25rem] border border-[#eadfcb] bg-white">
      <div className="flex items-center gap-2 border-b border-[#eadfcb] px-4 py-3">
        <MessageCircle className="h-4 w-4 text-[#d4a574]" />
        <p className="text-sm font-bold text-[#1a1614]">Messages{otherPartyLabel ? ` with ${otherPartyLabel}` : ""}</p>
      </div>

      {/* Thread */}
      <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-[#6b5d54]">
            <Loader2 className="h-4 w-4 animate-spin" />Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#a89a8e]">
            {emptyHint || (role === "ADMIN" ? "No messages yet. Send a note to get the conversation started." : "No messages yet.")}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderRole === role;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  mine ? "bg-[#1a1614] text-white" : "bg-[#faf6ef] text-[#1a1614] border border-[#eadfcb]"
                }`}>
                  <p className="whitespace-pre-line leading-relaxed">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-white/60" : "text-[#a89a8e]"}`}>
                    {m.senderRole === "ADMIN" ? "Admin" : m.sender.name || m.sender.email} · {fmtTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div>}

      {/* Composer */}
      <div className="border-t border-[#eadfcb] p-3 space-y-2">
        {role === "ADMIN" && templates && templates.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowTemplates((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfcb] bg-[#faf6ef] px-3 py-1.5 text-xs font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"
            >
              <Sparkles className="h-3 w-3 text-[#d4a574]" />Quick messages
            </button>
            {showTemplates && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {templates.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setDraft(t.body)}
                    title={t.body}
                    className="rounded-full border border-[#eadfcb] bg-white px-3 py-1 text-[11px] font-medium text-[#6b5d54] transition hover:border-[#d4a574] hover:text-[#1a1614]"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={otherPartyLabel ? `Message ${otherPartyLabel}… (Enter to send)` : "Type a message… (Enter to send)"}
            className="flex-1 resize-none rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-3 py-2.5 text-sm outline-none focus:border-[#d4a574]"
          />
          <button
            type="button"
            disabled={sending || !draft.trim()}
            onClick={() => void send()}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#1a1614] px-4 text-white transition hover:bg-[#2a2624] disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
