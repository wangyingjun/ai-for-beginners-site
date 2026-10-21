"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { nearestNeighbors, TOY_EMBEDDINGS } from "@/lib/ml/textrep";
import { t, type Locale } from "@/lib/i18n";

const GROUP_COLOR: Record<string, string> = {
  royalty: "#7c3aed",
  people: "#2563eb",
  animals: "#16a34a",
  places: "#ca8a04",
  food: "#ea580c",
  vehicles: "#dc2626",
};

export function EmbeddingsDemo({
  locale,
  showFullscreenLink = true,
}: {
  locale: Locale;
  showFullscreenLink?: boolean;
}) {
  const [selected, setSelected] = useState("king");
  const neighbors = useMemo(() => nearestNeighbors(selected, 5), [selected]);
  const size = 340;
  const pad = 28;

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{t(locale, "demoEmbedTitle")}</h3>
          <p className="mt-1 text-sm text-zinc-500">{t(locale, "demoEmbedHint")}</p>
        </div>
        {showFullscreenLink && (
          <Link
            href={`/demos/embeddings?lang=${locale}`}
            className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {t(locale, "demoOpenFullscreen")}
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-6">
        <svg
          width={size}
          height={size}
          className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
          role="img"
          aria-label={t(locale, "demoEmbedCanvasAria")}
        >
          {TOY_EMBEDDINGS.map((w) => {
            const cx = pad + w.x * (size - 2 * pad);
            const cy = size - pad - w.y * (size - 2 * pad);
            const active = w.word === selected;
            return (
              <g
                key={w.word}
                onClick={() => setSelected(w.word)}
                className="cursor-pointer"
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={active ? 8 : 5}
                  fill={GROUP_COLOR[w.group] || "#71717a"}
                  stroke={active ? "#18181b" : "transparent"}
                  strokeWidth={2}
                />
                <text
                  x={cx + 8}
                  y={cy + 3}
                  className="fill-zinc-700 text-[10px] dark:fill-zinc-300"
                >
                  {w.word}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="min-w-[180px] space-y-2 text-sm">
          <p>
            <span className="text-zinc-500">{t(locale, "demoEmbedSelected")}: </span>
            <strong className="font-mono">{selected}</strong>
          </p>
          <p className="font-medium">{t(locale, "demoEmbedNeighbors")}</p>
          <ul className="space-y-1">
            {neighbors.map((n) => (
              <li key={n.word}>
                <button
                  type="button"
                  className="font-mono text-indigo-600 hover:underline dark:text-indigo-400"
                  onClick={() => setSelected(n.word)}
                >
                  {n.word}
                </button>
                <span className="ml-2 text-zinc-400">{n.score.toFixed(3)}</span>
              </li>
            ))}
          </ul>
          <p className="pt-2 text-xs text-zinc-500">{t(locale, "demoEmbedNote")}</p>
        </div>
      </div>
    </div>
  );
}
