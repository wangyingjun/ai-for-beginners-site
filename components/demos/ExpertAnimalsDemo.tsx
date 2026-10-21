"use client";

import { useMemo, useState } from "react";
import {
  PRESETS,
  RULES,
  answerQuestion,
  applyPreset,
  createSession,
  pendingQuestion,
  type SessionState,
} from "@/lib/ml/expert-animals";
import { t, type Locale } from "@/lib/i18n";

export function ExpertAnimalsDemo({
  locale,
  showFullscreenLink = true,
}: {
  locale: Locale;
  showFullscreenLink?: boolean;
}) {
  const [session, setSession] = useState<SessionState>(() => createSession());
  const q = pendingQuestion(session);
  const derived = useMemo(() => {
    const keys = ["mammal", "bird", "carnivore", "ungulate"] as const;
    return keys.filter((k) => session.kb[k] === true);
  }, [session.kb]);

  function yes() {
    setSession((s) => answerQuestion(s, "yes"));
  }
  function no() {
    setSession((s) => answerQuestion(s, "no"));
  }
  function reset() {
    setSession(createSession());
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{t(locale, "demoExpertTitle")}</h3>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">
            {t(locale, "demoExpertHint")}
          </p>
        </div>
        {showFullscreenLink && (
          <a
            href={`/demos/expert-animals?lang=${locale}`}
            className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {t(locale, "demoOpenFullscreen")}
          </a>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          {!session.done && q && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                {t(locale, "demoExpertAsk")}
              </p>
              <p className="mt-2 text-xl font-semibold">{q.label[locale]}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={yes}
                  className="rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
                >
                  {t(locale, "demoExpertYes")}
                </button>
                <button
                  type="button"
                  onClick={no}
                  className="rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-500"
                >
                  {t(locale, "demoExpertNo")}
                </button>
              </div>
            </div>
          )}

          {session.done && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-lg font-semibold">
                {session.conclusionId
                  ? session.trace[session.trace.length - 1]?.message[locale]
                  : t(locale, "demoExpertStuck")}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {t(locale, "demoExpertReset")}
            </button>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSession(applyPreset(p.id))}
                className="rounded-md border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950"
              >
                {p.label[locale]}
              </button>
            ))}
          </div>

          {derived.length > 0 && (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {t(locale, "demoExpertDerived")}:{" "}
              <span className="font-mono">{derived.join(", ")}</span>
            </p>
          )}
        </div>

        <div className="w-full shrink-0 space-y-3 lg:w-80">
          <h4 className="text-sm font-semibold">{t(locale, "demoExpertTrace")}</h4>
          <ol className="max-h-72 space-y-1 overflow-y-auto rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-900">
            {session.trace.map((step, i) => (
              <li
                key={i}
                className={
                  step.kind === "fire"
                    ? "text-amber-700 dark:text-amber-300"
                    : step.kind === "conclude"
                      ? "font-semibold text-emerald-700 dark:text-emerald-300"
                      : "text-zinc-600 dark:text-zinc-400"
                }
              >
                {step.message[locale]}
              </li>
            ))}
          </ol>
          <details className="text-xs text-zinc-500">
            <summary className="cursor-pointer">{t(locale, "demoExpertRules")}</summary>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto font-mono">
              {RULES.map((r) => (
                <li key={r.id}>
                  {r.id}: {r.label[locale]}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
