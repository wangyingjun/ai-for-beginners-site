"use client";

import { useEffect, useRef, useState } from "react";
import { Slider, StatusPill, btnPrimary, btnSecondary } from "@/components/lesson/ui";
import { mulberry32 } from "@/lib/ml/perceptron";

const COLS = 6;
const TARGET = [
  "011110",
  "100001",
  "101101",
  "100001",
  "110011",
  "011110",
]
  .join("")
  .split("")
  .map(Number);
const L = TARGET.length;
const POP = 16;

type Ind = { genes: number[]; fit: number };
const fitness = (g: number[]) => g.reduce((s, v, i) => s + (v === TARGET[i] ? 1 : 0), 0);
export const randInd = (rnd: () => number = Math.random): Ind => {
  const genes = Array.from({ length: L }, () => (rnd() < 0.5 ? 1 : 0));
  return { genes, fit: fitness(genes) };
};

export function evolve(pop: Ind[], mut: number): Ind[] {
  const sorted = [...pop].sort((a, b) => b.fit - a.fit);
  const pick = () => {
    const a = pop[Math.floor(Math.random() * pop.length)];
    const b = pop[Math.floor(Math.random() * pop.length)];
    return a.fit >= b.fit ? a : b;
  };
  const next: Ind[] = [sorted[0]];
  while (next.length < pop.length) {
    const p1 = pick();
    const p2 = pick();
    const cut = 1 + Math.floor(Math.random() * (L - 1));
    const genes = [...p1.genes.slice(0, cut), ...p2.genes.slice(cut)].map((g) => (Math.random() < mut ? 1 - g : g));
    next.push({ genes, fit: fitness(genes) });
  }
  return next;
}

export type GaRun = { mut: number; gens: number; best: number; solved: boolean };
export type GaState = { runs: GaRun[]; mut: number };

function Grid({ genes, size = 14, compare = false }: { genes: number[]; size?: number; compare?: boolean }) {
  return (
    <div className="grid gap-px bg-zinc-300 p-px dark:bg-zinc-700" style={{ gridTemplateColumns: `repeat(${COLS}, ${size}px)` }}>
      {genes.map((g, i) => (
        <div
          key={i}
          style={{ width: size, height: size }}
          className={`${g ? "bg-zinc-900 dark:bg-zinc-100" : "bg-white dark:bg-zinc-900"} ${compare && g !== TARGET[i] ? "outline outline-2 -outline-offset-2 outline-amber-500" : ""}`}
        />
      ))}
    </div>
  );
}

export function GaExperiment({
  showMutation = false,
  onState,
}: {
  showMutation?: boolean;
  onState?: (s: GaState) => void;
}) {
  const [mut, setMut] = useState(0.03);
  const [pop, setPop] = useState<Ind[]>(() => {
    // Seeded so server and client render the same first population.
    const rnd = mulberry32(42);
    return Array.from({ length: POP }, () => randInd(rnd));
  });
  const [gens, setGens] = useState(0);
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState(0);
  const [runMap, setRunMap] = useState<Record<number, GaRun>>({});
  const [history, setHistory] = useState<number[]>([]);
  const popRef = useRef(pop);
  useEffect(() => {
    popRef.current = pop;
  }, [pop]);

  const best = pop.reduce((a, b) => (b.fit > a.fit ? b : a), pop[0]);
  const solved = best.fit === L;

  useEffect(() => {
    onState?.({ runs: Object.values(runMap), mut });
  }, [runMap, mut, onState]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const np = evolve(popRef.current, mut);
      popRef.current = np;
      const b = Math.max(...np.map((i) => i.fit));
      setPop(np);
      setHistory((h) => [...h.slice(-79), b]);
      setGens((g) => {
        const ng = g + 1;
        setRunMap((m) => ({ ...m, [runId]: { mut, gens: ng, best: b, solved: b === L } }));
        if (b === L || ng >= 200) setRunning(false);
        return ng;
      });
    }, 110);
    return () => window.clearInterval(id);
  }, [running, mut, runId]);

  const reset = () => {
    const p = Array.from({ length: POP }, () => randInd());
    popRef.current = p;
    setPop(p);
    setGens(0);
    setHistory([]);
    setRunning(false);
    setRunId((r) => r + 1);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill ok={solved}>{solved ? `第 ${gens} 代找到了！` : `第 ${gens} 代：最好的对了 ${best.fit} / ${L} 格`}</StatusPill>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="mb-1 text-xs text-zinc-500">目标图案</p>
          <Grid genes={TARGET} />
        </div>
        <div>
          <p className="mb-1 text-xs text-zinc-500">这一代最好的（黄框 = 不对的格）</p>
          <Grid genes={best.genes} compare />
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs text-zinc-500">整个种群（{POP} 个随机图案，一代代进化）</p>
        <div className="flex flex-wrap gap-1.5">
          {pop.map((ind, i) => (
            <Grid key={i} genes={ind.genes} size={6} />
          ))}
        </div>
      </div>
      <div className="flex h-12 items-end gap-px" aria-label="每代最好成绩">
        {history.map((h, i) => (
          <div key={i} className="w-1 bg-indigo-500" style={{ height: `${(h / L) * 100}%` }} />
        ))}
      </div>
      {showMutation && (
        <Slider label="变异率（每格随机翻转的概率）" value={mut} min={0} max={0.4} step={0.01} onChange={(v) => { setMut(v); reset(); }} />
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={() => setRunning((r) => !r)} disabled={solved || gens >= 200}>
          {running ? "暂停" : gens > 0 ? "继续进化" : "开始进化"}
        </button>
        <button type="button" className={btnSecondary} onClick={reset}>
          重新随机
        </button>
      </div>
    </div>
  );
}
