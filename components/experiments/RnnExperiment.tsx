"use client";

import { useEffect, useState } from "react";
import { Slider, StatusPill, btnPrimary, btnSecondary, chip } from "@/components/lesson/ui";

type Tok = [string, number];
export const RNN_SENTENCES: { id: string; name: string; truth: 1 | -1; toks: Tok[] }[] = [
  {
    id: "s1",
    name: "第 1 条评论",
    truth: 1,
    toks: [["菜", 0], ["好吃", 2], ["，", 0], ["服务", 0], ["好", 1.5], ["，", 0], ["环境", 0], ["也", 0], ["好", 1.5], ["，", 0], ["就是", 0], ["有点", 0], ["贵", -1.5]],
  },
  {
    id: "s2",
    name: "第 2 条评论",
    truth: -1,
    toks: [["以前", 0], ["很", 0], ["好吃", 2], ["，", 0], ["服务", 0], ["也", 0], ["好", 1.5], ["，", 0], ["很", 0], ["热闹", 1], ["，", 0], ["后来", 0], ["换了", 0], ["厨师", 0], ["，", 0], ["现在", 0], ["难吃", -2], ["还", 0], ["贵", -1.5]],
  },
];

/** Memory after each token: h ← keep·h + x. */
export function memTrace(toks: Tok[], keep: number): number[] {
  const out: number[] = [];
  let h = 0;
  for (const [, x] of toks) {
    h = keep * h + x;
    out.push(h);
  }
  return out;
}
const finalOk = (si: number, keep: number) => {
  const tr = memTrace(RNN_SENTENCES[si].toks, keep);
  return Math.sign(tr[tr.length - 1]) === RNN_SENTENCES[si].truth;
};

export type RnnState = { sentence: string; keep: number; finished: boolean; correct: boolean; bothRight: boolean };

export function RnnExperiment({ controls = false, onState }: { controls?: boolean; onState?: (s: RnnState) => void }) {
  const [si, setSi] = useState(0);
  const [keep, setKeep] = useState(0.9);
  const [pos, setPos] = useState(-1);
  const [auto, setAuto] = useState(false);
  const s = RNN_SENTENCES[si];
  const trace = memTrace(s.toks, keep);
  const finished = pos === s.toks.length - 1;
  const h = pos >= 0 ? trace[pos] : 0;
  const verdict = h > 0 ? 1 : h < 0 ? -1 : 0;
  const correct = finished && verdict === s.truth;
  const bothRight = finalOk(0, keep) && finalOk(1, keep);

  useEffect(() => {
    onState?.({ sentence: s.id, keep, finished, correct, bothRight });
  }, [s.id, keep, finished, correct, bothRight, onState]);

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => setPos((p) => Math.min(s.toks.length - 1, p + 1)), 220);
    return () => window.clearInterval(id);
  }, [auto, s.toks.length]);

  useEffect(() => {
    if (!auto || !finished) return;
    const t = window.setTimeout(() => setAuto(false), 0);
    return () => window.clearTimeout(t);
  }, [auto, finished]);

  const MAX = 5;
  const pct = Math.min(1, Math.abs(h) / MAX) * 50;
  return (
    <div className="space-y-3">
      <StatusPill ok={!finished || correct}>
        {finished ? `读完了：AI 判断「${verdict > 0 ? "好评" : verdict < 0 ? "差评" : "说不清"}」，${correct ? "判对了" : `判错了（其实是${s.truth > 0 ? "好评" : "差评"}）`}` : pos < 0 ? "还没开始读" : `读到第 ${pos + 1} / ${s.toks.length} 个词`}
      </StatusPill>
      <div className="flex flex-wrap gap-1 text-base">
        {s.toks.map(([w, x], i) => (
          <span
            key={i}
            className={`rounded px-1 ${i === pos ? "bg-indigo-600 text-white" : i < pos ? (x > 0 ? "text-red-600" : x < 0 ? "text-blue-600" : "text-zinc-700 dark:text-zinc-300") : "text-zinc-400"}`}
          >
            {w}
          </span>
        ))}
      </div>
      <div className="space-y-1">
        <div className="text-xs text-zinc-500">AI 的「记忆」（往右 = 偏好评，往左 = 偏差评）：{h.toFixed(2)}</div>
        <div className="relative h-6 rounded bg-zinc-100 dark:bg-zinc-800">
          <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-400" />
          <div className={`absolute inset-y-1 rounded ${h >= 0 ? "bg-red-500" : "bg-blue-500"}`} style={h >= 0 ? { left: "50%", width: `${pct}%` } : { right: "50%", width: `${pct}%` }} />
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        每读一个词：新记忆 = 旧记忆 × 保留比例 + 这个词的分（<span className="font-semibold text-red-600">红字 = 夸</span>，<span className="font-semibold text-blue-600">蓝字 = 骂</span>）。读完看记忆偏哪边。
      </p>
      <Slider label="保留多少旧记忆" value={keep} min={0} max={1} step={0.05} onChange={setKeep} format={(v) => v.toFixed(2)} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} disabled={finished || auto} onClick={() => setPos((p) => Math.min(s.toks.length - 1, p + 1))}>
          读下一个词
        </button>
        <button type="button" className={btnSecondary} disabled={finished || auto} onClick={() => setAuto(true)}>
          一口气读完
        </button>
        <button type="button" className={btnSecondary} onClick={() => { setAuto(false); setPos(-1); }}>
          从头再读
        </button>
      </div>
      {controls && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {RNN_SENTENCES.map((x, i) => (
              <button key={x.id} type="button" className={chip(si === i)} onClick={() => { setAuto(false); setSi(i); setPos(-1); }}>
                {x.name}
              </button>
            ))}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            用现在的保留比例，两条评论各判：第 1 条 {finalOk(0, keep) ? "✅" : "❌"}　第 2 条 {finalOk(1, keep) ? "✅" : "❌"}
          </p>
        </div>
      )}
    </div>
  );
}
