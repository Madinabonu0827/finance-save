"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiPage() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: t("ai.greeting") }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const QUICK_QUESTIONS = [t("ai.q1"), t("ai.q2"), t("ai.q3")];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || sending) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);
    try {
      const res = await api.post<{ reply: string }>("/ai/chat", { message: text });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t("ai.error");
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${message}` }]);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-semibold">{t("ai.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("ai.subtitle")}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line",
              m.role === "user"
                ? "self-end bg-primary text-primary-foreground rounded-br-sm"
                : "self-start bg-muted rounded-bl-sm"
            )}
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="self-start bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("ai.typing")}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3 shrink-0">
          {QUICK_QUESTIONS.map((q) => (
            <Button key={q} variant="outline" size="sm" onClick={() => send(q)} disabled={sending}>
              {q}
            </Button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("ai.placeholder")}
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={sending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
