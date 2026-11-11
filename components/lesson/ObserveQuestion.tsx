"use client";

import { useState, type ReactNode } from "react";

/** One "what did you notice?" multiple-choice question with feedback. */
export function ObserveQuestion({
  question,
  options,
  answer,
  explanation,
  hintOnWrong,
}: {
  question: ReactNode;
  options: ReactNode[];
  answer: number;
  explanation: ReactNode;
  hintOnWrong?: ReactNode;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === answer;
  return (
    <div className="space-y-3">
      <p className="font-medium">{question}</p>
      <div className="grid gap-2">
        {options.map((opt, i) => {
          const chosen = picked === i;
          const tone = !chosen
            ? "border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
            : i === answer
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
              : "border-rose-400 bg-rose-50 dark:bg-rose-950/40";
          return (
            <button
              key={i}
              type="button"
              onClick={() => setPicked(i)}
              className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm ${tone}`}
            >
              <span className="mr-2 font-mono text-zinc-500">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div
          className={`rounded-lg p-3 text-sm ${correct ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100" : "bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100"}`}
          aria-live="polite"
        >
          {correct ? <>✅ 对！{explanation}</> : <>再想想。{hintOnWrong ?? explanation}</>}
        </div>
      )}
    </div>
  );
}
