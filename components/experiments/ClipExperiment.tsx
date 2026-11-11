"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusPill, chip } from "@/components/lesson/ui";

/** Hand-made shared space. Dims: 动物 会飞 水里 水果 红色 交通工具 长脖子 黄色 猫样 狗样 鸟样 */
type V = number[];
export const IMAGES: { id: string; emoji: string; truth: string; vec: V; isNew?: boolean }[] = [
  { id: "cat", emoji: "🐱", truth: "猫", vec: [1, 0, 0, 0, 0, 0, 0, 0.2, 1, 0.2, 0] },
  { id: "dog", emoji: "🐶", truth: "狗", vec: [1, 0, 0, 0, 0, 0, 0, 0.3, 0.2, 1, 0] },
  { id: "bird", emoji: "🐦", truth: "鸟", vec: [1, 1, 0, 0, 0, 0, 0, 0.2, 0, 0, 1] },
  { id: "fish", emoji: "🐟", truth: "鱼", vec: [1, 0, 1, 0, 0.3, 0, 0, 0.3, 0, 0, 0] },
  { id: "apple", emoji: "🍎", truth: "苹果", vec: [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0] },
  { id: "banana", emoji: "🍌", truth: "香蕉", vec: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] },
  { id: "car", emoji: "🚗", truth: "汽车", vec: [0, 0, 0, 0, 0.6, 1, 0, 0, 0, 0, 0] },
  { id: "plane", emoji: "✈️", truth: "飞机", vec: [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0] },
  { id: "giraffe", emoji: "🦒", truth: "长颈鹿", vec: [1, 0, 0, 0, 0, 0, 1, 0.8, 0, 0.2, 0], isNew: true },
];
const WORDS: Record<string, V> = {
  猫: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
  狗: [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  鸟: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  鱼: [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  苹果: [0, 0, 0, 1, 0.8, 0, 0, 0, 0, 0, 0],
  香蕉: [0, 0, 0, 1, 0, 0, 0, 0.8, 0, 0, 0],
  汽车: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  飞机: [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  长颈鹿: [1, 0, 0, 0, 0, 0, 1, 0.5, 0, 0, 0],
  斑马: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0.4, 0],
};
const BASE_LABELS = ["猫", "狗", "鸟", "鱼", "苹果", "香蕉", "汽车", "飞机"];
const EXTRA_LABELS = ["斑马", "长颈鹿"];
const QUERIES: { id: string; text: string; vec: V }[] = [
  { id: "fly", text: "会飞的东西", vec: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "yellowfruit", text: "黄色的水果", vec: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] },
  { id: "neck", text: "长脖子的动物", vec: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0] },
];
const cos = (a: V, b: V) => {
  let d = 0, na = 0, nb = 0;
  a.forEach((x, i) => { d += x * b[i]; na += x * x; nb += b[i] * b[i]; });
  return na && nb ? d / Math.sqrt(na * nb) : 0;
};

export type ClipState = { correctKnown: number; tapped: string | null; tappedCorrect: boolean; labels: string[]; query: string | null; topIds: string[] };

export function ClipExperiment({ controls = false, onState }: { controls?: boolean; onState?: (s: ClipState) => void }) {
  const [tapped, setTapped] = useState<string | null>(null);
  const [okSet, setOkSet] = useState<string[]>([]);
  const [labels, setLabels] = useState<string[]>(BASE_LABELS);
  const [query, setQuery] = useState<string | null>(null);
  const img = IMAGES.find((x) => x.id === tapped) ?? null;
  const sims = useMemo(() => (img ? labels.map((l) => ({ l, s: cos(img.vec, WORDS[l]) })).sort((a, b) => b.s - a.s) : []), [img, labels]);
  const tappedCorrect = !!img && sims[0]?.l === img.truth;
  const q = QUERIES.find((x) => x.id === query) ?? null;
  const ranked = useMemo(() => (q ? IMAGES.map((im) => ({ im, s: cos(im.vec, q.vec) })).sort((a, b) => b.s - a.s) : []), [q]);
  const topKey = ranked.slice(0, 2).map((r) => r.im.id).join(",");

  useEffect(() => {
    onState?.({ correctKnown: okSet.length, tapped, tappedCorrect, labels, query, topIds: topKey ? topKey.split(",") : [] });
  }, [okSet.length, tapped, tappedCorrect, labels, query, topKey, onState]);

  const tap = (id: string) => {
    setTapped(id);
    setQuery(null);
    const im = IMAGES.find((x) => x.id === id)!;
    const best = labels.map((l) => ({ l, s: cos(im.vec, WORDS[l]) })).sort((a, b) => b.s - a.s)[0];
    if (!im.isNew && best.l === im.truth && !okSet.includes(id)) setOkSet((o) => [...o, id]);
  };

  return (
    <div className="space-y-3">
      <StatusPill ok={tappedCorrect || (!!q && ranked.length > 0)}>
        {q ? `用文字「${q.text}」搜图` : img ? `AI 认为这是：${sims[0].l}（相似度 ${Math.round(sims[0].s * 100)}%）${tappedCorrect ? "✓" : "✗"}` : "点一张图，看 AI 觉得它最像哪个词"}
      </StatusPill>
      <div className="grid max-w-[300px] grid-cols-3 gap-2">
        {IMAGES.filter((im) => controls || !im.isNew).map((im) => {
          const rank = q ? ranked.findIndex((r) => r.im.id === im.id) : -1;
          return (
            <button
              key={im.id}
              type="button"
              aria-label={`图片：${im.truth}`}
              onClick={() => tap(im.id)}
              className={`relative flex aspect-square items-center justify-center rounded-xl border text-4xl ${tapped === im.id && !q ? "border-indigo-500 ring-2 ring-indigo-400" : "border-zinc-200 dark:border-zinc-700"} ${q && rank < 2 ? "bg-indigo-50 ring-2 ring-indigo-400 dark:bg-indigo-950" : "bg-white dark:bg-zinc-900"}`}
            >
              {im.emoji}
              {im.isNew && <span className="absolute right-1 top-1 rounded bg-amber-100 px-1 text-[10px] text-amber-900">新图</span>}
              {okSet.includes(im.id) && <span className="absolute bottom-1 right-1 text-xs">✅</span>}
              {q && <span className="absolute bottom-1 left-1 font-mono text-[10px] text-zinc-500">{Math.round(ranked[rank].s * 100)}%</span>}
            </button>
          );
        })}
      </div>
      {img && !q && (
        <div className="space-y-1">
          <p className="text-xs text-zinc-500">这张图和每个候选词的相似度（同一个空间里离得越近越像）：</p>
          {sims.map(({ l, s }, i) => (
            <div key={l} className="flex items-center gap-2 text-sm">
              <span className="w-14 shrink-0">{l}</span>
              <div className="h-3.5 flex-1 rounded bg-zinc-100 dark:bg-zinc-800">
                <div className={`h-3.5 rounded ${i === 0 ? "bg-indigo-600" : "bg-zinc-400"}`} style={{ width: `${Math.max(0, s) * 100}%` }} />
              </div>
              <span className="w-10 text-right font-mono text-xs">{Math.round(s * 100)}%</span>
            </div>
          ))}
        </div>
      )}
      {controls && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="self-center text-zinc-500">加一个候选词：</span>
            {EXTRA_LABELS.map((l) => (
              <button key={l} type="button" className={chip(labels.includes(l))} disabled={labels.includes(l)} onClick={() => setLabels((ls) => [...ls, l])}>
                {labels.includes(l) ? `已加「${l}」` : `「${l}」`}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="self-center text-zinc-500">用文字搜图：</span>
            {QUERIES.map((x) => (
              <button key={x.id} type="button" className={chip(query === x.id)} onClick={() => setQuery(x.id)}>
                {x.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
