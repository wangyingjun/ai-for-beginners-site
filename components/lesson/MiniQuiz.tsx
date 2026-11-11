"use client";

import { useState, type ReactNode } from "react";

export type MiniQuizItem = {
  question: ReactNode;
  options: ReactNode[];
  answer: number;
  explanation: ReactNode;
};

/** Short in-page quiz: instant per-question feedback with an explanation. */
export function MiniQuiz({ items }: { items: MiniQuizItem[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => items.map(() => null));
  const answered = picked.filter((p) => p !== null).length;
  const score = picked.filter((p, i) => p === items[i].answer).length;

  return (
    <div className="space-y-5">
      {items.map((item, qi) => {
        const p = picked[qi];
        return (
          <div key={qi} className="space-y-2">
            <p className="font-medium">
              {qi + 1}. {item.question}
            </p>
            <div className="grid gap-2">
              {item.options.map((opt, oi) => {
                const chosen = p === oi;
                const reveal = p !== null && oi === item.answer;
                const tone = reveal
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                  : chosen
                    ? "border-rose-400 bg-rose-50 dark:bg-rose-950/40"
                    : "border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900";
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={p !== null}
                    onClick={() =>
                      setPicked((arr) => arr.map((v, i) => (i === qi ? oi : v)))
                    }
                    className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm disabled:cursor-default ${tone}`}
                  >
                    <span className="mr-2 font-mono text-zinc-500">{String.fromCharCode(65 + oi)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {p !== null && (
              <p className="rounded-lg bg-zinc-100 p-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                {p === item.answer ? "✅ 答对了。" : "❌ 正确答案已标绿。"}解析：{item.explanation}
              </p>
            )}
          </div>
        );
      })}
      {answered === items.length && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm dark:border-indigo-900 dark:bg-indigo-950/40">
          <span className="font-semibold">
            得分 {score} / {items.length}
          </span>
          <button
            type="button"
            onClick={() => setPicked(items.map(() => null))}
            className="min-h-10 rounded-lg border border-indigo-300 bg-white px-3 py-1 dark:border-indigo-800 dark:bg-zinc-900"
          >
            再做一次
          </button>
        </div>
      )}
    </div>
  );
}
