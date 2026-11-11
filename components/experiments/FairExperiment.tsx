"use client";

import { useEffect, useMemo, useState } from "react";
import { Slider, StatusPill, chip } from "@/components/lesson/ui";
import { mulberry32 } from "@/lib/ml/perceptron";

type P = { score: number; repay: boolean };
type G = "甲" | "乙";

/** Same true behaviour in both groups; group 乙's scores are shifted down (biased training data). */
function makeGroup(seed: number, shift: number): P[] {
  const rnd = mulberry32(seed);
  const out: P[] = [];
  for (let i = 0; i < 16; i++) {
    const repay = i % 3 !== 0;
    const base = repay ? 65 + rnd() * 25 : 35 + rnd() * 27;
    out.push({ score: Math.round(Math.min(98, Math.max(2, base - shift))), repay });
  }
  return out;
}
const DATA: Record<G, P[]> = { 甲: makeGroup(3, 0), 乙: makeGroup(9, 25) };

function stats(ps: P[], t: number) {
  let ok = 0;
  let missed = 0;
  let approved = 0;
  for (const p of ps) {
    const yes = p.score >= t;
    if (yes) approved++;
    if (yes === p.repay) ok++;
    if (!yes && p.repay) missed++;
  }
  return { ok, missed, approved, n: ps.length };
}

export type FairState = { split: boolean; tA: number; tB: number; acc: number; missedA: number; missedB: number; revealed: boolean };

export function FairExperiment({
  controls = false,
  onState,
}: {
  controls?: boolean;
  onState?: (s: FairState) => void;
}) {
  const [tA, setTA] = useState(80);
  const [tB, setTB] = useState(80);
  const [split, setSplit] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const thB = split ? tB : tA;
  const sA = useMemo(() => stats(DATA.甲, tA), [tA]);
  const sB = useMemo(() => stats(DATA.乙, thB), [thB]);
  const acc = (sA.ok + sB.ok) / (sA.n + sB.n);

  useEffect(() => {
    onState?.({ split, tA, tB: thB, acc, missedA: sA.missed, missedB: sB.missed, revealed });
  }, [split, tA, thB, acc, sA.missed, sB.missed, revealed, onState]);

  const Row = ({ g, t }: { g: G; t: number }) => {
    const s = g === "甲" ? sA : sB;
    return (
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">{g}组</span>
          <span className="text-zinc-500">批准 {s.approved}/{s.n}</span>
          <span className={s.missed > 1 ? "font-semibold text-amber-700 dark:text-amber-300" : "text-zinc-500"}>会还却被拒：{s.missed} 人</span>
        </div>
        <div className="relative h-10 rounded bg-zinc-100 dark:bg-zinc-800">
          <div className="absolute inset-y-0 right-0 rounded-r bg-emerald-100 dark:bg-emerald-950" style={{ left: `${t}%` }} />
          <div className="absolute inset-y-0 w-0.5 bg-emerald-600" style={{ left: `${t}%` }} />
          {DATA[g].map((p, i) => {
            const wrong = p.repay && p.score < t;
            return (
              <span
                key={i}
                className={`absolute -translate-x-1/2 ${p.repay ? "h-3 w-3 rounded-full bg-red-600" : "h-3 w-3 bg-blue-600"} ${wrong ? "ring-2 ring-amber-400 ring-offset-1" : ""}`}
                style={{ left: `${p.score}%`, top: i % 2 ? 6 : 22 }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <StatusPill ok={acc >= 0.85}>总体判对率：{Math.round(acc * 100)}%</StatusPill>
      <p className="text-xs text-zinc-500">
        横轴 = 模型给的信用分（0～100），绿色区域 = 批准贷款。<span className="font-semibold text-red-600">● 红 = 实际会还钱</span>，
        <span className="font-semibold text-blue-600">■ 蓝 = 实际不会还</span>，<span className="font-semibold text-amber-600">黄圈 = 会还钱却被拒</span>。
      </p>
      {Row({ g: "甲", t: tA })}
      {Row({ g: "乙", t: thB })}
      <Slider label={split ? "甲组门槛" : "批准门槛（两组一样）"} value={tA} min={10} max={95} step={1} onChange={setTA} format={(v) => String(v)} />
      {split && <Slider label="乙组门槛" value={tB} min={10} max={95} step={1} onChange={setTB} format={(v) => String(v)} />}
      {controls && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(split)} onClick={() => { setSplit((s) => !s); setTB(tA); }}>
            {split ? "改回统一门槛" : "两组分开设门槛"}
          </button>
          <button type="button" className={chip(revealed)} onClick={() => setRevealed(true)}>
            查原因：模型看了哪些信息？
          </button>
        </div>
      )}
      {revealed && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          这个模型用过去的贷款记录训练，其中「住在哪个片区」这一项分量很大。乙组的人大多住在过去很少有人能贷到款的片区，记录少、分数被系统性压低了约 25 分——<b>两组人实际还钱的比例完全一样</b>，偏差来自数据。
        </p>
      )}
    </div>
  );
}
