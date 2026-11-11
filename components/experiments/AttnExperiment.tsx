"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusPill, chip } from "@/components/lesson/ui";

type SentId = "full" | "fresh";
const SENTS: Record<SentId, { tokens: string[]; boost: Record<string, Record<string, number>>; label: string }> = {
  full: {
    label: "……因为它太饱了",
    tokens: ["小猫", "没", "吃", "鱼", "，", "因为", "它", "太", "饱", "了"],
    boost: {
      它: { 小猫: 3.2, 饱: 1.2, 鱼: 0.4 },
      饱: { 它: 2.2, 小猫: 1.8, 太: 1.0 },
      吃: { 小猫: 1.6, 鱼: 1.9, 没: 1.0 },
      小猫: { 吃: 1.0, 它: 1.2 },
      鱼: { 吃: 1.6 },
    },
  },
  fresh: {
    label: "……因为它不新鲜",
    tokens: ["小猫", "没", "吃", "鱼", "，", "因为", "它", "不", "新鲜"],
    boost: {
      它: { 鱼: 3.2, 新鲜: 1.2, 小猫: 0.4 },
      新鲜: { 它: 2.2, 鱼: 1.8, 不: 1.0 },
      吃: { 小猫: 1.6, 鱼: 1.9, 没: 1.0 },
      小猫: { 吃: 1.0 },
      鱼: { 吃: 1.6, 它: 1.2 },
    },
  },
};

function weights(id: SentId, q: number, baseline: boolean): number[] {
  const { tokens, boost } = SENTS[id];
  if (baseline) return tokens.map((_, j) => (j === q - 1 ? 1 : 0));
  const b = boost[tokens[q]] ?? {};
  const raw = tokens.map((t, j) => {
    let s = j === q ? 1.0 : Math.abs(j - q) === 1 ? 0.6 : 0;
    if (t === "，") s -= 1;
    s += b[t] ?? 0;
    return Math.exp(s);
  });
  const sum = raw.reduce((a, c) => a + c, 0);
  return raw.map((r) => r / sum);
}

export type AttnState = { sent: SentId; selected: string | null; itSeen: SentId[]; others: string[]; baselineSeen: boolean };

export function AttnExperiment({
  controls = false,
  onState,
}: {
  controls?: boolean;
  onState?: (s: AttnState) => void;
}) {
  const [sent, setSent] = useState<SentId>("full");
  const [q, setQ] = useState<number | null>(null);
  const [baseline, setBaseline] = useState(false);
  const [itSeen, setItSeen] = useState<SentId[]>([]);
  const [others, setOthers] = useState<string[]>([]);
  const [baselineSeen, setBaselineSeen] = useState(false);
  const tokens = SENTS[sent].tokens;
  const w = useMemo(() => (q === null ? null : weights(sent, q, baseline)), [sent, q, baseline]);
  const selected = q === null ? null : tokens[q];

  useEffect(() => {
    onState?.({ sent, selected, itSeen, others, baselineSeen });
  }, [sent, selected, itSeen, others, baselineSeen, onState]);

  const pick = (i: number) => {
    setQ(i);
    const t = tokens[i];
    if (t === "它") {
      if (!baseline) setItSeen((s) => (s.includes(sent) ? s : [...s, sent]));
      else setBaselineSeen(true);
    } else if (t !== "，") setOthers((o) => (o.includes(t) ? o : [...o, t]));
  };

  let top: string | null = null;
  if (w && q !== null) {
    let bi = -1;
    w.forEach((x, j) => {
      if (j !== q && (bi === -1 || x > w[bi])) bi = j;
    });
    top = tokens[bi];
  }

  return (
    <div className="space-y-3">
      {controls && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SENTS) as SentId[]).map((id) => (
            <button key={id} type="button" className={chip(sent === id)} onClick={() => { setSent(id); setQ(null); }}>
              {SENTS[id].label}
            </button>
          ))}
        </div>
      )}
      <p className="text-sm text-zinc-500">点句子里的任意一个词，看它在「看」谁（颜色越深 = 看得越多）：</p>
      <div className="flex flex-wrap gap-1.5">
        {tokens.map((t, j) => {
          const a = w ? w[j] : 0;
          const isQ = j === q;
          return (
            <button
              key={j}
              type="button"
              onClick={() => pick(j)}
              className={`relative min-h-12 min-w-10 rounded-lg border px-2 pt-1 pb-4 text-lg ${isQ ? "border-indigo-500 ring-2 ring-indigo-400" : "border-zinc-300 dark:border-zinc-700"}`}
              style={{ background: w && !isQ ? `rgba(245,158,11,${Math.min(0.9, a * 1.6)})` : undefined }}
            >
              {t}
              {w && !isQ && <span className="absolute inset-x-0 bottom-0.5 text-center font-mono text-[10px] text-zinc-600 dark:text-zinc-300">{Math.round(a * 100)}%</span>}
            </button>
          );
        })}
      </div>
      {selected && top && (
        <StatusPill ok={!baseline}>
          「{selected}」看得最多的是「{top}」
          {selected === "它" && !baseline && `→ 所以「它」指的是${top}`}
          {selected === "它" && baseline && "——只看前一个词，根本不知道「它」是谁"}
        </StatusPill>
      )}
      {controls && (
        <button type="button" className={chip(baseline)} onClick={() => { setBaseline((b) => !b); if (q !== null && tokens[q] === "它" && !baseline) setBaselineSeen(true); }}>
          {baseline ? "打开注意力" : "关掉注意力（只看前一个词）"}
        </button>
      )}
    </div>
  );
}
