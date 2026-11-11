"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusPill, btnPrimary, chip } from "@/components/lesson/ui";

const VOCAB = ["好吃", "难吃", "好看", "难看", "喜欢", "讨厌", "便宜", "意思", "电影", "老鼠", "因为", "所以", "非常", "一点", "很", "不", "贵", "我", "你", "他", "狗", "猫", "咬", "人", "追", "没", "有", "也", "都", "了", "的", "太", "是", "这", "家", "店"];
const PRESETS: [string, string][] = [
  ["不好吃，很贵", "很好吃，不贵"],
  ["狗咬人", "人咬狗"],
];

export function segment(s: string): string[] {
  const t = s.replace(/[，。！？、,.!?\s]/g, "");
  const out: string[] = [];
  let i = 0;
  while (i < t.length) {
    let w = t[i];
    for (const len of [3, 2]) {
      const cand = t.slice(i, i + len);
      if (cand.length === len && VOCAB.includes(cand)) {
        w = cand;
        break;
      }
    }
    out.push(w);
    i += w.length;
  }
  return out;
}

function grams(tokens: string[], bigram: boolean): string[] {
  if (!bigram) return tokens;
  const out: string[] = [];
  for (let i = 0; i + 1 < tokens.length; i++) out.push(`${tokens[i]}${tokens[i + 1]}`);
  return out;
}

function bag(items: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const w of items) m.set(w, (m.get(w) ?? 0) + 1);
  return m;
}

export type BowState = {
  converted: boolean;
  a: string;
  b: string;
  same: boolean;
  bigram: boolean;
  presetIndex: number | null;
  customSamePair: boolean;
};

export function BowExperiment({
  editable = false,
  bigramControl = false,
  onState,
}: {
  editable?: boolean;
  bigramControl?: boolean;
  onState?: (s: BowState) => void;
}) {
  const [a, setA] = useState(PRESETS[0][0]);
  const [b, setB] = useState(PRESETS[0][1]);
  const [converted, setConverted] = useState(editable);
  const [bigram, setBigram] = useState(false);
  const ta = useMemo(() => segment(a), [a]);
  const tb = useMemo(() => segment(b), [b]);
  const ga = useMemo(() => bag(grams(ta, bigram)), [ta, bigram]);
  const gb = useMemo(() => bag(grams(tb, bigram)), [tb, bigram]);
  const vocab = useMemo(() => [...new Set([...ga.keys(), ...gb.keys()])], [ga, gb]);
  const same = vocab.length > 0 && vocab.every((w) => (ga.get(w) ?? 0) === (gb.get(w) ?? 0));
  const presetIndex = PRESETS.findIndex(([x, y]) => x === a && y === b);
  const customSamePair =
    !bigram && same && a.trim() !== b.trim() && presetIndex === -1 && ta.length >= 2 && PRESETS.every(([x, y]) => !(x === b && y === a));

  useEffect(() => {
    onState?.({ converted, a, b, same, bigram, presetIndex: presetIndex === -1 ? null : presetIndex, customSamePair });
  }, [converted, a, b, same, bigram, presetIndex, customSamePair, onState]);

  const Row = ({ label, text, setText, tokens, g }: { label: string; text: string; setText: (v: string) => void; tokens: string[]; g: Map<string, number> }) => (
    <div className="space-y-1.5 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{label}</span>
        {editable ? (
          <input
            value={text}
            maxLength={20}
            onChange={(e) => {
              setText(e.target.value);
            }}
            aria-label={`句子 ${label}`}
            className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-base dark:border-zinc-700 dark:bg-zinc-900"
          />
        ) : (
          <span className="text-lg">「{text}」</span>
        )}
      </div>
      {converted && (
        <>
          <div className="flex flex-wrap gap-1 text-sm">
            <span className="text-zinc-500">切成词：</span>
            {tokens.map((t, i) => (
              <span key={i} className="rounded bg-zinc-100 px-1.5 dark:bg-zinc-800">
                {t}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 text-sm">
            <span className="text-zinc-500">{bigram ? "两两一组数：" : "数一数："}</span>
            {vocab.map((w) => (
              <span key={w} className={`rounded px-1.5 font-mono ${(g.get(w) ?? 0) > 0 ? "bg-indigo-100 dark:bg-indigo-900" : "bg-zinc-50 text-zinc-400 dark:bg-zinc-900"}`}>
                {w}:{g.get(w) ?? 0}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {Row({ label: "A", text: a, setText: setA, tokens: ta, g: ga })}
      {Row({ label: "B", text: b, setText: setB, tokens: tb, g: gb })}
      {converted && (
        <StatusPill ok={!same}>{same ? "两句话变成的数字一模一样！电脑分不出来" : "两句话的数字不一样，电脑分得出来"}</StatusPill>
      )}
      <div className="flex flex-wrap gap-2">
        {!converted && (
          <button type="button" className={btnPrimary} onClick={() => setConverted(true)}>
            变成数字（数词）
          </button>
        )}
        {editable &&
          PRESETS.map(([x, y], i) => (
            <button key={i} type="button" className={chip(presetIndex === i)} onClick={() => { setA(x); setB(y); }}>
              例句 {i + 1}
            </button>
          ))}
        {bigramControl && (
          <button type="button" className={chip(bigram)} onClick={() => setBigram((v) => !v)}>
            {bigram ? "改回一个词一个词数" : "改成两个词一组数"}
          </button>
        )}
      </div>
    </div>
  );
}
