"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  heatColor,
  selfAttentionMatrix,
  tokenizeSentence,
} from "@/lib/ml/attention";
import { t, type Locale } from "@/lib/i18n";

const PRESETS = [
  "the cat sat on the mat",
  "transformers attend to relevant tokens",
  "attention is all you need",
];

export function AttentionDemo({
  locale,
  showFullscreenLink = true,
}: {
  locale: Locale;
  showFullscreenLink?: boolean;
}) {
  const [sentence, setSentence] = useState(PRESETS[0]);
  const [temp, setTemp] = useState(0.35);
  const tokens = useMemo(() => tokenizeSentence(sentence).slice(0, 12), [sentence]);
  const matrix = useMemo(
    () => (tokens.length ? selfAttentionMatrix(tokens, temp) : []),
    [tokens, temp],
  );

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{t(locale, "demoAttnTitle")}</h3>
          <p className="mt-1 text-sm text-zinc-500">{t(locale, "demoAttnHint")}</p>
        </div>
        {showFullscreenLink && (
          <Link
            href={`/demos/attention?lang=${locale}`}
            className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {t(locale, "demoOpenFullscreen")}
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setSentence(p)}
            className="rounded-full bg-zinc-100 px-3 py-1 text-xs hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            {p}
          </button>
        ))}
      </div>

      <label className="block text-sm">
        <span className="font-medium">{t(locale, "demoAttnSentence")}</span>
        <input
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex max-w-sm items-center gap-3 text-sm">
        <span className="whitespace-nowrap">{t(locale, "demoAttnTemp")}</span>
        <input
          type="range"
          min={0.1}
          max={1.2}
          step={0.05}
          value={temp}
          onChange={(e) => setTemp(Number(e.target.value))}
          className="flex-1"
        />
        <span className="font-mono text-xs">{temp.toFixed(2)}</span>
      </label>

      {tokens.length > 0 && (
        <div className="overflow-x-auto" role="img" aria-label={t(locale, "demoAttnCanvasAria")}>
          <table className="border-collapse text-center text-[10px] sm:text-xs">
            <thead>
              <tr>
                <th className="p-1" />
                {tokens.map((tok, j) => (
                  <th key={j} className="max-w-[4.5rem] truncate p-1 font-mono">
                    {tok}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i}>
                  <th className="max-w-[4.5rem] truncate p-1 text-left font-mono">
                    {tokens[i]}
                  </th>
                  {row.map((w, j) => (
                    <td
                      key={j}
                      title={w.toFixed(3)}
                      style={{ backgroundColor: heatColor(w) }}
                      className="h-9 min-w-[2.2rem] border border-white/40 p-1 font-mono text-zinc-800"
                    >
                      {w.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-zinc-500">{t(locale, "demoAttnNote")}</p>
        </div>
      )}
    </div>
  );
}
