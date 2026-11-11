"use client";

import { useEffect, useMemo, useState } from "react";
import { Slider, btnPrimary, btnSecondary, chip } from "@/components/lesson/ui";
import { STARTERS, nextDist, sample } from "@/lib/ml/charlm";

export type CharRun = { temperature: number; order: 1 | 2; generated: number };
export type CharLmState = { generated: number; runs: CharRun[]; temperature: number; order: 1 | 2 };

export function CharLmExperiment({
  controls = false,
  onState,
}: {
  controls?: boolean;
  onState?: (s: CharLmState) => void;
}) {
  const [start, setStart] = useState("春");
  const [text, setText] = useState("春");
  const [temperature, setTemperature] = useState(1);
  const [order, setOrder] = useState<1 | 2>(1);
  const [runId, setRunId] = useState(0);
  const [runMap, setRunMap] = useState<Record<number, CharRun>>({});
  const [last, setLast] = useState<string | null>(null);
  const dist = useMemo(() => nextDist(text, order, temperature), [text, order, temperature]);
  const generated = text.length - start.length;
  const runs = useMemo(() => Object.values(runMap), [runMap]);

  useEffect(() => {
    onState?.({ generated, runs, temperature, order });
  }, [generated, runs, temperature, order, onState]);

  const add = (n: number) => {
    let t = text;
    let ch = "";
    for (let i = 0; i < n; i++) {
      ch = sample(nextDist(t, order, temperature));
      t += ch;
    }
    setText(t);
    setLast(ch);
    const g = t.length - start.length;
    setRunMap((m) => ({ ...m, [runId]: { temperature, order, generated: g } }));
  };

  const restart = (s = start) => {
    setStart(s);
    setText(s);
    setLast(null);
    setRunId((r) => r + 1);
  };

  return (
    <div className="space-y-3">
      <div className="min-h-[4.5rem] rounded-xl border border-zinc-200 bg-white p-3 text-xl leading-relaxed tracking-wide dark:border-zinc-800 dark:bg-zinc-950" aria-live="polite">
        {text.slice(0, -1)}
        <span className={last ? "rounded bg-amber-200 px-0.5 dark:bg-amber-700" : ""}>{text.slice(-1)}</span>
        <span className="animate-pulse text-zinc-400">▍</span>
      </div>
      <div>
        <p className="mb-1 text-xs text-zinc-500">
          {order === 2 ? `看了最后两个字「${text.slice(-2)}」` : `只看最后一个字「${text.slice(-1)}」`}，下一个字的候选（条越长越可能被选中）：
        </p>
        <ul className="space-y-1">
          {dist.slice(0, 5).map((d) => (
            <li key={d.ch} className="flex items-center gap-2 text-sm">
              <span className="w-6 text-center text-base">{d.ch}</span>
              <span className="h-3 rounded bg-indigo-500" style={{ width: `${Math.max(2, d.p * 220)}px` }} />
              <span className="font-mono text-xs text-zinc-500">{Math.round(d.p * 100)}%</span>
            </li>
          ))}
          {dist.length > 5 && <li className="text-xs text-zinc-400">……还有 {dist.length - 5} 个候选</li>}
        </ul>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={() => add(1)}>
          下一个字
        </button>
        <button type="button" className={btnSecondary} onClick={() => add(15)}>
          连写 15 个字
        </button>
        <button type="button" className={btnSecondary} onClick={() => restart()}>
          清空重写
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-medium">开头字：</span>
        {STARTERS.map((s) => (
          <button key={s} type="button" className={chip(start === s)} onClick={() => restart(s)}>
            {s}
          </button>
        ))}
      </div>
      {controls && (
        <div className="space-y-2">
          <Slider label="温度（放飞程度）" value={temperature} min={0.1} max={2} step={0.1} onChange={(v) => { setTemperature(v); restart(); }} format={(v) => v.toFixed(1)} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(order === 1)} onClick={() => { setOrder(1); restart(); }}>
              只看前 1 个字
            </button>
            <button type="button" className={chip(order === 2)} onClick={() => { setOrder(2); restart(); }}>
              看前 2 个字
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
