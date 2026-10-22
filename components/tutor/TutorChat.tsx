"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AssistantRuntimeProvider,
  generateId,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { TutorThread } from "@/components/assistant-ui/thread";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { decodeCitationsHeader } from "@/lib/rag/citations-header";
import {
  isLocalOpenAIEndpoint,
  settingsComplete,
  type UserLlmSettings,
} from "@/lib/rag/llm-settings";
import { streamOpenAICompatibleChat } from "@/lib/rag/openai-compatible-stream";
import type { ChatCitation } from "@/lib/rag/types";
import { loadUserLlmSettings } from "@/lib/rag/user-settings-client";
import { TutorSettingsForm } from "./TutorSettingsForm";

type TutorMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
  ragEmpty?: boolean;
  running?: boolean;
};

type Props = {
  locale: Locale;
  lessonId?: string | null;
  /** compact = floating panel on lesson pages */
  variant?: "page" | "panel";
};

type RagPrepare = {
  system: string;
  citations: ChatCitation[];
  empty: boolean;
};

async function prepareRag(opts: {
  query: string;
  lessonId: string | null;
  locale: Locale;
}): Promise<RagPrepare> {
  const res = await fetch("/api/rag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      query: opts.query,
      lessonId: opts.lessonId,
      locale: opts.locale,
      topK: 6,
    }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `RAG HTTP ${res.status}`);
  }
  const data = (await res.json()) as RagPrepare;
  return {
    system: data.system,
    citations: data.citations ?? [],
    empty: Boolean(data.empty),
  };
}

function convertMessage(message: TutorMsg): ThreadMessageLike {
  return {
    role: message.role,
    id: message.id,
    content: [{ type: "text", text: message.content }],
    status:
      message.role === "assistant"
        ? message.running
          ? { type: "running" }
          : { type: "complete", reason: "stop" }
        : undefined,
    metadata: {
      custom: {
        citations: message.citations,
        ragEmpty: message.ragEmpty,
      },
    },
  };
}

export function TutorChat({ locale, lessonId = null, variant = "page" }: Props) {
  const [messages, setMessages] = useState<TutorMsg[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [serverConfigured, setServerConfigured] = useState<boolean | null>(
    null,
  );
  const [userSettings, setUserSettings] = useState<UserLlmSettings | null>(
    null,
  );
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(variant === "page");
  const settingsHydrated = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

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
    if (serverConfigured === false && !settingsComplete(userSettings)) {
      setShowSettings(true);
    }
  }, [serverConfigured, userSettings]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const generationReady =
    settingsComplete(userSettings) || serverConfigured === true;

  const statusLabel = (() => {
    if (settingsComplete(userSettings)) {
      const local =
        userSettings &&
        userSettings.apiType === "openai-compatible" &&
        isLocalOpenAIEndpoint(userSettings.apiUrl);
      return local
        ? t(locale, "tutorReadyLocal")
        : t(locale, "tutorReadyUser");
    }
    if (serverConfigured === true) return t(locale, "tutorReadyServer");
    if (serverConfigured === null && !settingsHydrated.current) {
      return t(locale, "tutorChecking");
    }
    return t(locale, "tutorNotConfigured");
  })();

  const onSettingsChange = useCallback((s: UserLlmSettings | null) => {
    setUserSettings(s);
    if (settingsComplete(s)) {
      setShowSettings(false);
      setError(null);
    }
  }, []);

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const part = message.content.find((p) => p.type === "text");
      const text = part && part.type === "text" ? part.text.trim() : "";
      if (!text) return;

      if (!generationReady) {
        setShowSettings(true);
        setError(t(locale, "tutorNeedSettings"));
        return;
      }

      setError(null);
      const userMsg: TutorMsg = {
        id: generateId(),
        role: "user",
        content: text,
      };
      const history = [...messagesRef.current, userMsg];
      setMessages(history);

      const assistantId = generateId();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", running: true },
      ]);
      setIsRunning(true);

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const creds = loadUserLlmSettings();
        const useClientStream =
          creds &&
          creds.apiType === "openai-compatible" &&
          isLocalOpenAIEndpoint(creds.apiUrl);

        if (useClientStream && creds) {
          const rag = await prepareRag({
            query: text,
            lessonId,
            locale,
          });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    citations: rag.citations,
                    ragEmpty: rag.empty,
                  }
                : m,
            ),
          );

          const prior = history
            .filter((m) => m.role === "user" || m.role === "assistant")
            .slice(-12)
            .map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            }));

          await streamOpenAICompatibleChat({
            settings: creds,
            messages: prior,
            system: rag.system,
            signal: ac.signal,
            onDelta: (acc) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: acc,
                        citations: rag.citations,
                        ragEmpty: rag.empty,
                        running: true,
                      }
                    : m,
                ),
              );
            },
          });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, running: false } : m,
            ),
          );
          return;
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          signal: ac.signal,
          body: JSON.stringify({
            messages: history.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            lessonId,
            locale,
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
                    running: false,
                  }
                : m,
            ),
          );
          return;
        }

        const citations = decodeCitationsHeader(res.headers.get("X-Citations"));
        const ragEmpty = res.headers.get("X-Citations-Empty") === "1";
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
                ? {
                    ...m,
                    content: snapshot,
                    citations,
                    ragEmpty,
                    running: true,
                  }
                : m,
            ),
          );
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, running: false } : m,
          ),
        );
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, running: false } : m,
            ),
          );
          return;
        }
        const msg = e instanceof Error ? e.message : "Network error";
        setError(msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: msg, running: false }
              : m,
          ),
        );
      } finally {
        setIsRunning(false);
      }
    },
    [lessonId, locale, generationReady],
  );

  const onCancel = useCallback(async () => {
    abortRef.current?.abort();
    setIsRunning(false);
    setMessages((prev) =>
      prev.map((m) => (m.running ? { ...m, running: false } : m)),
    );
  }, []);

  const feedbackAdapter = useMemo(
    () => ({
      submit: (feedback: {
        message: { id: string };
        type: "positive" | "negative";
      }) => {
        void fetch("/api/chat/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vote: feedback.type === "positive" ? 1 : -1,
            localOnly: true,
            messageId: feedback.message.id,
          }),
        }).catch(() => {
          /* stub */
        });
      },
    }),
    [],
  );

  const runtime = useExternalStoreRuntime({
    isRunning,
    messages,
    convertMessage,
    onNew,
    onCancel,
    isSendDisabled: !generationReady,
    adapters: { feedback: feedbackAdapter },
  });

  const threadLabels = useMemo(
    () => ({
      empty: generationReady
        ? t(locale, "tutorEmpty")
        : t(locale, "tutorEmptyNeedSettings"),
      placeholder: t(locale, "tutorPlaceholder"),
      send: t(locale, "tutorSend"),
      citations: t(locale, "tutorCitations"),
      ragEmpty: t(locale, "tutorRagEmpty"),
    }),
    [locale, generationReady],
  );

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
      style={{
        maxHeight: variant === "panel" ? "70vh" : undefined,
        height: variant === "page" ? "min(70vh, 36rem)" : undefined,
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
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
        <div className="max-h-[40vh] shrink-0 overflow-y-auto">
          <TutorSettingsForm
            locale={locale}
            compact={variant === "panel"}
            onChange={onSettingsChange}
          />
        </div>
      )}

      {error && !showSettings && (
        <p className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {error}{" "}
          <Link href="/docs/ai-tutor" className="underline">
            docs/ai-tutor.md
          </Link>
        </p>
      )}

      <div className="min-h-0 flex-1">
        <AssistantRuntimeProvider runtime={runtime}>
          <TutorThread labels={threadLabels} className="flex h-full flex-col" />
        </AssistantRuntimeProvider>
      </div>
    </div>
  );
}
