"use client";

import { useEffect, useState } from "react";
import { StatusPill, btnPrimary, btnSecondary, chip } from "@/components/lesson/ui";

type Move = "C" | "D";
type OppId = "mystery" | "nice" | "copy";
const ROUNDS = 10;
const PAY: Record<string, [number, number]> = { CC: [3, 3], CD: [0, 5], DC: [5, 0], DD: [1, 1] };
const OPP_NAME: Record<OppId, string> = { mystery: "神秘对手", nice: "老好人", copy: "学你的人" };
const oppMove = (id: OppId, myHist: Move[]): Move => (id === "nice" ? "C" : myHist.length ? myHist[myHist.length - 1] : "C");

type Strat = "AC" | "AD" | "TFT";
const STRAT_NAME: Record<Strat, string> = { AC: "总是合作", AD: "总是背叛", TFT: "学对方上一步" };
function match(a: Strat, b: Strat): number {
  let sa = 0, la: Move | null = null, lb: Move | null = null;
  for (let r = 0; r < ROUNDS; r++) {
    const ma: Move = a === "AC" ? "C" : a === "AD" ? "D" : lb ?? "C";
    const mb: Move = b === "AC" ? "C" : b === "AD" ? "D" : la ?? "C";
    sa += PAY[ma + mb][0];
    la = ma; lb = mb;
  }
  return sa;
}
const STRATS: Strat[] = ["AC", "AD", "TFT"];
const START: Record<Strat, number> = { AC: 0.6, AD: 0.2, TFT: 0.2 };
function evolveStep(p: Record<Strat, number>): Record<Strat, number> {
  const fit = Object.fromEntries(STRATS.map((a) => [a, STRATS.reduce((s, b) => s + p[b] * match(a, b), 0)])) as Record<Strat, number>;
  const avg = STRATS.reduce((s, a) => s + p[a] * fit[a], 0);
  return Object.fromEntries(STRATS.map((a) => [a, (p[a] * fit[a]) / avg])) as Record<Strat, number>;
}
const GENS = 30;

export type GameState = { opp: OppId; finished: boolean; myScore: number; evoDone: boolean; winner: Strat | null; peakAD: number };

export function GameExperiment({ controls = false, onState }: { controls?: boolean; onState?: (s: GameState) => void }) {
  const [opp, setOpp] = useState<OppId>(controls ? "nice" : "mystery");
  const [hist, setHist] = useState<{ me: Move; them: Move }[]>([]);
  const [pop, setPop] = useState(START);
  const [gen, setGen] = useState(0);
  const [running, setRunning] = useState(false);
  const [peakAD, setPeakAD] = useState(START.AD);
  const myScore = hist.reduce((s, h) => s + PAY[h.me + h.them][0], 0);
  const theirScore = hist.reduce((s, h) => s + PAY[h.me + h.them][1], 0);
  const finished = hist.length >= ROUNDS;
  const evoDone = gen >= GENS;
  const winner = evoDone ? STRATS.reduce((a, b) => (pop[a] >= pop[b] ? a : b)) : null;

  useEffect(() => {
    onState?.({ opp, finished, myScore, evoDone, winner, peakAD });
  }, [opp, finished, myScore, evoDone, winner, peakAD, onState]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setPop((p) => {
        const n = evolveStep(p);
        setPeakAD((m) => Math.max(m, n.AD));
        return n;
      });
      setGen((g) => g + 1);
    }, 150);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running || !evoDone) return;
    const t = window.setTimeout(() => setRunning(false), 0);
    return () => window.clearTimeout(t);
  }, [running, evoDone]);

  const play = (me: Move) => {
    if (finished) return;
    setHist((h) => [...h, { me, them: oppMove(opp, h.map((x) => x.me)) }]);
  };

  return (
    <div className="space-y-3">
      <StatusPill ok={finished}>
        对手：{OPP_NAME[opp]} · 第 {Math.min(hist.length + 1, ROUNDS)} / {ROUNDS} 轮 · 你 {myScore} 分，对手 {theirScore} 分{finished ? " · 结束" : ""}
      </StatusPill>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        规则：都合作各得 3 分；都背叛各得 1 分；一个背叛一个合作，背叛的得 5 分，合作的得 0 分。
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} disabled={finished} onClick={() => play("C")}>
          合作 🤝
        </button>
        <button type="button" className={btnSecondary} disabled={finished} onClick={() => play("D")}>
          背叛 😈
        </button>
        <button type="button" className={btnSecondary} onClick={() => setHist([])}>
          重新开始
        </button>
      </div>
      {hist.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-zinc-200 text-sm dark:border-zinc-800">
          <div className="grid grid-cols-[3rem_repeat(10,minmax(0,1fr))] bg-zinc-50 dark:bg-zinc-900">
            <span className="px-1 py-1 text-zinc-500">你</span>
            {hist.map((h, i) => (
              <span key={i} className="py-1 text-center">{h.me === "C" ? "🤝" : "😈"}</span>
            ))}
          </div>
          <div className="grid grid-cols-[3rem_repeat(10,minmax(0,1fr))]">
            <span className="px-1 py-1 text-zinc-500">对手</span>
            {hist.map((h, i) => (
              <span key={i} className="py-1 text-center">{h.them === "C" ? "🤝" : "😈"}</span>
            ))}
          </div>
        </div>
      )}
      {controls && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["nice", "copy"] as OppId[]).map((o) => (
              <button key={o} type="button" className={chip(opp === o)} onClick={() => { setOpp(o); setHist([]); }}>
                换对手：{OPP_NAME[o]}
              </button>
            ))}
          </div>
          <div className="space-y-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="text-sm font-semibold">一座小镇的演化（第 {gen} / {GENS} 代）</p>
            <p className="text-xs text-zinc-500">镇上的人两两玩 10 轮，得分高的策略下一代人数变多。</p>
            {STRATS.map((s) => (
              <div key={s} className="flex items-center gap-2 text-sm">
                <span className="w-24 shrink-0">{STRAT_NAME[s]}</span>
                <div className="h-4 flex-1 rounded bg-zinc-100 dark:bg-zinc-800">
                  <div className={`h-4 rounded ${s === "AD" ? "bg-zinc-700 dark:bg-zinc-300" : s === "AC" ? "bg-emerald-500" : "bg-indigo-600"}`} style={{ width: `${pop[s] * 100}%` }} />
                </div>
                <span className="w-10 text-right font-mono text-xs">{Math.round(pop[s] * 100)}%</span>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnPrimary} disabled={running || evoDone} onClick={() => setRunning(true)}>
                {running ? "演化中…" : "开始演化"}
              </button>
              <button type="button" className={btnSecondary} onClick={() => { setRunning(false); setPop(START); setGen(0); setPeakAD(START.AD); }}>
                重置小镇
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
