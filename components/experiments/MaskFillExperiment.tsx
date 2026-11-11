"use client";

import { useEffect, useMemo, useState } from "react";
import { Slider, StatusPill, btnSecondary, chip } from "@/components/lesson/ui";
import { BASE_CORPUS, EXTRA_SENTENCES, MASK_QS, contextWords, predict, top } from "@/lib/ml/maskfill";

export type MaskState = { q: string; window: number; both: boolean; guess: string | null; correct: boolean; extras: number };

export function MaskFillExperiment({ controls = false, onState }: { controls?: boolean; onState?: (s: MaskState) => void }) {
  const [qi, setQi] = useState(0);
  const [win, setWin] = useState(1);
  const [both, setBoth] = useState(false);
  const [extras, setExtras] = useState(0);
  const [showCorpus, setShowCorpus] = useState(false);
  const q = MASK_QS[qi];
  const corpus = useMemo(() => [...BASE_CORPUS, ...EXTRA_SENTENCES.slice(0, extras)], [extras]);
  const scores = useMemo(() => predict(corpus, q, win, both), [corpus, q, win, both]);
  const guess = top(scores);
  const correct = guess === q.answer;
  const total = scores.reduce((s, x) => s + x.score, 0);
  const ctx = contextWords(q, win, both);

  useEffect(() => {
    onState?.({ q: q.id, window: win, both, guess, correct, extras });
  }, [q.id, win, both, guess, correct, extras, onState]);

  const word = (w: string, on: boolean, k: string) => (
    <span key={k} className={`rounded px-1.5 py-0.5 ${on ? "bg-indigo-100 font-semibold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200" : "text-zinc-400"}`}>
      {w}
    </span>
  );

  return (
    <div className="space-y-3">
      <StatusPill ok={correct}>{guess ? `AI 猜：${guess}` : "AI 猜不出来（几个词一样可能）"}</StatusPill>
      <div className="flex flex-wrap items-center gap-1 text-lg">
        {q.left.map((w, i) => word(w, ctx.left.has(i), `l${i}`))}
        <span className="rounded border-2 border-dashed border-indigo-500 px-3 py-0.5 font-semibold text-indigo-600">？</span>
        {q.right.map((w, i) => word(w, ctx.right.has(i), `r${i}`))}
      </div>
      <p className="text-xs text-zinc-500">高亮的词 = AI 这次能看到的词。下面是它从语料里统计出的各个候选词的可能性：</p>
      <div className="space-y-1.5">
        {scores.map((s) => {
          const pct = total > 0 ? (s.score / total) * 100 : 0;
          return (
            <div key={s.word} className="flex items-center gap-2 text-sm">
              <span className="w-10 shrink-0">{s.word}</span>
              <div className="h-4 flex-1 rounded bg-zinc-100 dark:bg-zinc-800">
                <div className={`h-4 rounded ${s.word === guess ? "bg-indigo-600" : "bg-zinc-400"}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-10 text-right font-mono text-xs">{Math.round(pct)}%</span>
            </div>
          );
        })}
      </div>
      <Slider label="往前看几个词" value={win} min={1} max={5} step={1} onChange={setWin} format={(v) => String(v)} />
      {controls && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {MASK_QS.map((m, i) => (
              <button key={m.id} type="button" className={chip(qi === i)} onClick={() => setQi(i)}>
                第 {i + 1} 题
              </button>
            ))}
            <button type="button" className={chip(both)} onClick={() => setBoth((b) => !b)}>
              {both ? "只看前面的词" : "也看后面的词"}
            </button>
          </div>
          <button type="button" className={btnSecondary} disabled={extras >= EXTRA_SENTENCES.length} onClick={() => setExtras((n) => n + 1)}>
            {extras < EXTRA_SENTENCES.length ? `给它多读一句：「${EXTRA_SENTENCES[extras].replaceAll(" ", "")}」` : "多读的句子都加上了"}
          </button>
        </div>
      )}
      <button type="button" className="text-sm text-indigo-600 underline" onClick={() => setShowCorpus((x) => !x)}>
        {showCorpus ? "收起" : `看看它读过的全部 ${corpus.length} 句话`}
      </button>
      {showCorpus && (
        <ul className="list-inside list-disc text-sm text-zinc-600 dark:text-zinc-300">
          {corpus.map((s, i) => (
            <li key={i}>{s.replaceAll(" ", "")}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
