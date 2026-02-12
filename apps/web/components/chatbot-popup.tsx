"use client";

import { Bot, MessageCircle, SendHorizonal, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiBaseUrl, useApiToken } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type ChatRow = {
  role: "user" | "assistant";
  content: string;
};

const quickPrompts = [
  "چرا سناریوی خشک ریسک بیشتری دارد؟",
  "برای کاهش ریسک سیلاب چه پارامتری را تغییر بدهم؟",
  "خلاصه علمی این سامانه چیست؟",
];

export function ChatbotPopup() {
  const { token } = useApiToken();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState<ChatRow[]>([
    {
      role: "assistant",
      content:
        "سلام. من دستیار پروژه مدیریت رهاسازی آب هستم. درباره داده، پیش‌بینی، بهینه‌سازی، سناریو و بحران سوال بپرسید."
    }
  ]);

  const canSend = useMemo(() => Boolean(token && message.trim() && !loading), [token, message, loading]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!token || !message.trim() || loading) return;

    const userMessage = message.trim();
    const nextRows = [...rows, { role: "user", content: userMessage } as ChatRow];
    setRows(nextRows);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl()}/chatbot/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          history: nextRows.map((row) => ({ role: row.role, content: row.content }))
        })
      });
      if (!response.ok) throw new Error("chat_failed");

      const json = await response.json();
      const answer = json?.data?.answer ?? "پاسخی دریافت نشد.";
      setRows((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch {
      setRows((prev) => [...prev, { role: "assistant", content: "خطا در ارتباط با سرویس چت. دوباره تلاش کنید." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-3 z-50 md:bottom-5 md:right-5">
      {open ? (
        <section className="w-[92vw] max-w-[390px] rounded-2xl border bg-card/95 shadow-glass backdrop-blur">
          <header className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold">دستیار هوشمند پروژه</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </header>

          <div className="max-h-[320px] space-y-2 overflow-y-auto p-3">
            {rows.map((row, index) => (
              <div
                key={`${row.role}-${index}`}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs leading-6",
                  row.role === "assistant"
                    ? "bg-muted text-foreground"
                    : "mr-auto max-w-[90%] bg-primary text-primary-foreground"
                )}
              >
                {row.content}
              </div>
            ))}
            {loading ? (
              <div className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">در حال دریافت پاسخ...</div>
            ) : null}
          </div>

          {!token ? (
            <p className="border-t px-3 py-2 text-xs text-danger">برای استفاده از چت‌بات ابتدا وارد سامانه شوید.</p>
          ) : (
            <form className="border-t p-3" onSubmit={submit}>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setMessage(prompt)}
                    className="rounded-full border px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-muted"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="سوال مرتبط با پروژه را بنویسید..."
                  className="h-9"
                />
                <Button type="submit" size="sm" disabled={!canSend}>
                  <SendHorizonal className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}
        </section>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          className="pulse-border h-12 rounded-full px-4 shadow-soft ring-1 ring-primary/35"
          aria-label="باز کردن چت‌بات"
        >
          <MessageCircle className="ml-2 h-4 w-4" />
          دستیار هوشمند
        </Button>
      )}
    </div>
  );
}
