"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import {
  settingsComplete,
  type UserLlmSettings,
} from "@/lib/rag/llm-settings";
import type { ChatCitation } from "@/lib/rag/types";
import { loadUserLlmSettings } from "@/lib/rag/user-settings-client";
import { TutorSettingsForm } from "./TutorSettingsForm";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
  feedback?: 1 | -1 | null;
};

type Props = {
  locale: Locale;
  lessonId?: string | null;
  /** compact = floating panel on lesson pages */
  variant?: "page" | "panel";
};

function decodeCitations(header: string | null): ChatCitation[] {
  if (!header) return [];
  try {
    const json = atob(header.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as ChatCitation[];
  } catch {
    try {
      const pad =
        header.length % 4 === 0 ? "" : "=".repeat(4 - (header.length % 4));
      const b64 = header.replace(/-/g, "+").replace(/_/g, "/") + pad;
      return JSON.parse(atob(b64)) as ChatCitation[];
    } catch {
      return [];
    }
  }
}

export function TutorChat({ locale, lessonId = null, variant = "page" }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [serverConfigured, setServerConfigured] = useState<boolean | null>(
    null,
  );
  const [userSettings, setUserSettings] = useState<UserLlmSettings | null>(
    null,
  );
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(variant === "page");
  const bottomRef = useRef<HTMLDivElement>(null);
  const settingsHydrated = useRef(false);

  useEffect(() => {
    const local = loadUserLlmSettings();
    setUserSettings(local);
    settingsHydrated.current = true;
    if (!settingsComplete(local)) {
      setShowSettings(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d: { serverConfigured?: boolean; configured?: boolean }) => {
        if (!cancelled) {
          setServerConfigured(
            Boolean(d.serverConfigured ?? d.configured),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setServerConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!settingsHydrated.current) return;
    if (
      serverConfigured === false &&
      !settingsComplete(userSettings)
    ) {
      setShowSettings(true);
    }
  }, [serverConfigured, userSettings]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const generationReady =
    settingsComplete(userSettings) || serverConfigured === true;

  const statusLabel = (() => {
    if (settingsComplete(userSettings)) return t(locale, "tutorReadyUser");
    if (serverConfigured === true) return t(locale, "tutorReadyServer");
    if (serverConfigured === null && !settingsHydrated.current) {
      return t(locale, "tutorChecking");
    }
    return t(locale, "tutorNotConfigured");
  })();

  const sendFeedback = useCallback(
    async (msgId: string, vote: 1 | -1) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, feedback: vote } : m)),
      );
      try {
        await fetch("/api/chat/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote, localOnly: true }),
        });
      } catch {
        /* stub */
      }
    },
    [],
  );

  const onSettingsChange = useCallback((s: UserLlmSettings | null) => {
    setUserSettings(s);
    if (settingsComplete(s)) {
      setShowSettings(false);
      setError(null);
    }
  }, []);

  const onSend = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;

    if (!generationReady) {
      setShowSettings(true);
      setError(t(locale, "tutorNeedSettings"));
      return;
    }

    setError(null);
    setInput("");
    const userMsg: Msg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const history = [...messages, userMsg];
    setMessages(history);
    setBusy(true);

    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const creds = loadUserLlmSettings();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          messages: history.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          lessonId,
          locale,
          // Prefer browser settings when present; server falls back to env.
          ...(creds ? { credentials: creds } : {}),
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
        };
        const errText =
          data.error ||
          (locale === "en"
            ? `Request failed (${res.status})`
            : `请求失败（${res.status}）`);
        setError(errText);
        if (res.status === 503 || data.code === "AI_NOT_CONFIGURED") {
          setShowSettings(true);
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    res.status === 503
                      ? `${errText}\n\n→ ${t(locale, "tutorOpenSettings")}`
                      : errText,
                }
              : m,
          ),
        );
        return;
      }

      const citations = decodeCitations(res.headers.get("X-Citations"));
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snapshot = acc;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: snapshot, citations }
              : m,
          ),
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setError(msg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: msg } : m,
        ),
      );
    } finally {
      setBusy(false);
    }
  }, [
    input,
    busy,
    messages,
    lessonId,
    locale,
    generationReady,
  ]);

  const panelShell =
    variant === "panel"
      ? "fixed bottom-4 right-4 z-40 flex w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-950"
      : "flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950";

  if (variant === "panel" && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-indigo-500"
      >
        {t(locale, "tutorOpen")}
      </button>
    );
  }

  return (
    <div
      className={panelShell}
      style={{ maxHeight: variant === "panel" ? "70vh" : undefined }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t(locale, "tutorTitle")}
          </h2>
          <p className="text-xs text-zinc-500">
            {statusLabel}
            {lessonId
              ? ` · ${t(locale, "tutorLessonContext")} ${lessonId}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className="rounded px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
          >
            {showSettings
              ? t(locale, "tutorHideSettings")
              : t(locale, "tutorOpenSettings")}
          </button>
          <Link
            href={`/assistant?lang=${locale}${lessonId ? `&lesson=${lessonId}` : ""}`}
            className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {t(locale, "tutorFullscreen")}
          </Link>
          {variant === "panel" && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="max-h-[40vh] overflow-y-auto">
          <TutorSettingsForm
            locale={locale}
            compact={variant === "panel"}
            onChange={onSettingsChange}
          />
        </div>
      )}

      <div
        className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
        style={{ minHeight: "12rem" }}
      >
        {messages.length === 0 && (
          <p className="text-sm text-zinc-500">
            {generationReady
              ? t(locale, "tutorEmpty")
              : t(locale, "tutorEmptyNeedSettings")}
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-6 rounded-lg bg-indigo-50 px-3 py-2 text-sm dark:bg-indigo-950/40"
                : "mr-6 rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900"
            }
          >
            <div className="whitespace-pre-wrap break-words">
              {m.content || (busy ? "…" : "")}
            </div>
            {m.role === "assistant" &&
              m.citations &&
              m.citations.length > 0 && (
                <ul className="mt-2 space-y-1 border-t border-zinc-200 pt-2 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                  {m.citations.map((c, i) => (
                    <li key={`${c.path}-${i}`}>
                      <Link
                        href={c.lessonHref}
                        className="text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        {c.lesson_id}
                        {c.heading ? ` · ${c.heading}` : ""}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            {m.role === "assistant" && m.content && !busy && (
              <div className="mt-2 flex gap-2 text-xs">
                <button
                  type="button"
                  className={`rounded px-2 py-0.5 ${m.feedback === 1 ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800"}`}
                  onClick={() => sendFeedback(m.id, 1)}
                  aria-label="thumbs up"
                >
                  👍
                </button>
                <button
                  type="button"
                  className={`rounded px-2 py-0.5 ${m.feedback === -1 ? "bg-rose-100 text-rose-800" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800"}`}
                  onClick={() => sendFeedback(m.id, -1)}
                  aria-label="thumbs down"
                >
                  👎
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && !showSettings && (
        <p className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {error}{" "}
          <Link href="/docs/ai-tutor" className="underline">
            docs/ai-tutor.md
          </Link>
        </p>
      )}

      <form
        className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
        onSubmit={(e) => {
          e.preventDefault();
          void onSend();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t(locale, "tutorPlaceholder")}
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-indigo-500"
        >
          {t(locale, "tutorSend")}
        </button>
      </form>
    </div>
  );
}
