"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { bagOfWords, tfidf } from "@/lib/ml/textrep";
import { t, type Locale } from "@/lib/i18n";

const DEFAULT_DOCS = [
  "I love machine learning and neural networks",
  "Neural networks power deep learning models",
  "Cats and dogs are popular pets",
];

export function TextRepDemo({
  locale,
  showFullscreenLink = true,
}: {
  locale: Locale;
  showFullscreenLink?: boolean;
}) {
  const [raw, setRaw] = useState(DEFAULT_DOCS.join("\n"));
  const [mode, setMode] = useState<"bow" | "tfidf">("bow");
  const [dropStop, setDropStop] = useState(true);

  const docs = useMemo(
    () =>
      raw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    [raw],
  );

  const result = useMemo(() => {
    if (!docs.length) return null;
    return mode === "bow" ? bagOfWords(docs, dropStop) : tfidf(docs, dropStop);
  }, [docs, mode, dropStop]);

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{t(locale, "demoTextRepTitle")}</h3>
          <p className="mt-1 text-sm text-zinc-500">{t(locale, "demoTextRepHint")}</p>
        </div>
        {showFullscreenLink && (
          <Link
            href={`/demos/text-rep?lang=${locale}`}
            className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {t(locale, "demoOpenFullscreen")}
          </Link>
        )}
      </div>

      <label className="block text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-200">
          {t(locale, "demoTextRepDocs")}
        </span>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 p-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex gap-1 rounded-md bg-zinc-100 p-1 dark:bg-zinc-800">
          {(["bow", "tfidf"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded px-3 py-1 ${
                mode === m
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-700 dark:text-zinc-200"
              }`}
            >
              {m === "bow" ? "BoW" : "TF-IDF"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={dropStop}
            onChange={(e) => setDropStop(e.target.checked)}
          />
          {t(locale, "demoTextRepStop")}
        </label>
      </div>

      {result && result.vocab.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="p-2 font-medium">#</th>
                {result.vocab.map((v) => (
                  <th key={v} className="p-2 font-mono font-medium">
                    {v}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.matrix.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="p-2 text-zinc-500">D{i + 1}</td>
                  {row.map((val, j) => (
                    <td key={j} className="p-2 font-mono">
                      {mode === "bow" ? val : val.toFixed(3)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
