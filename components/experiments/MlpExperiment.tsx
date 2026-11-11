"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COLORS, ExpCanvas, StatusPill, btnPrimary, btnSecondary, chip, isDark } from "@/components/lesson/ui";
import { generateDataset, type Sample2D } from "@/lib/ml/datasets";
import { accuracy, createMlp, decisionGrid, predictProb, trainEpoch, type MlpModel } from "@/lib/ml/mlp";

type Ds = "circle" | "xor";
export type MlpRun = { hidden: number; dataset: Ds; epochs: number; bestAcc: number };
export type MlpExpState = {
  hidden: number;
  dataset: Ds;
  epochs: number;
  acc: number;
  training: boolean;
  runs: MlpRun[];
  traced: number;
};

const LR = 0.1;
const MAX_EPOCHS = 300;
const RES = 36;
const MIN = -1.2;
const MAX = 1.2;

type Snap = { W: number[] }[];
const snapshot = (m: MlpModel): Snap => m.layers.map((l) => ({ W: [...l.W] }));

type Trace = { sample: Sample2D; err: number; blame: number[]; phase: number };

export function MlpExperiment({
  initialHidden = 0,
  neuronChoices,
  datasetSwitch = false,
  trace = false,
  onState,
}: {
  initialHidden?: number;
  /** If set, shows a neuron-count picker; otherwise a simple on/off toggle (0 ↔ 4). */
  neuronChoices?: number[];
  datasetSwitch?: boolean;
  trace?: boolean;
  onState?: (s: MlpExpState) => void;
}) {
  const [hidden, setHidden] = useState(initialHidden);
  const [dataset, setDataset] = useState<Ds>("circle");
  const [epochs, setEpochs] = useState(0);
  const [training, setTraining] = useState(false);
  const [runMap, setRunMap] = useState<Record<number, MlpRun>>({});
  const [traceInfo, setTraceInfo] = useState<Trace | null>(null);
  const [traced, setTraced] = useState(0);
  const data = useMemo(() => generateDataset(dataset, 160, 7), [dataset]);
  const modelRef = useRef<MlpModel | null>(null);
  const [acc, setAcc] = useState(0);
  const [grid, setGrid] = useState<number[] | null>(null);
  const [snap, setSnap] = useState<Snap>([]);

  const metaRef = useRef({ runId: 0, hidden: initialHidden, dataset: "circle" as Ds });
  const rebuild = useCallback((h: number, d: Sample2D[], ds: Ds) => {
    metaRef.current = { runId: metaRef.current.runId + 1, hidden: h, dataset: ds };
    const m = createMlp({ hidden: h > 0 ? [h] : [], activation: "tanh", learningRate: LR, l2: 0 }, 3);
    modelRef.current = m;
    setEpochs(0);
    setAcc(accuracy(m, d));
    setGrid(decisionGrid(m, RES, MIN, MAX));
    setSnap(snapshot(m));
    setTraining(false);
    setTraceInfo(null);
  }, []);

  // Initial model (deferred so no setState runs synchronously in the effect).
  useEffect(() => {
    const t = window.setTimeout(() => rebuild(initialHidden, generateDataset("circle", 160, 7), "circle"), 0);
    return () => window.clearTimeout(t);
  }, [initialHidden, rebuild]);

  const select = (h: number, ds: Ds) => {
    setHidden(h);
    setDataset(ds);
    rebuild(h, generateDataset(ds, 160, 7), ds);
  };

  useEffect(() => {
    if (!training) return;
    const id = window.setInterval(() => {
      const m = modelRef.current;
      if (!m) return;
      for (let k = 0; k < 3; k++) trainEpoch(m, data, LR, 0, 1);
      const a = accuracy(m, data);
      setAcc(a);
      setEpochs(m.epoch);
      setGrid(decisionGrid(m, RES, MIN, MAX));
      setSnap(snapshot(m));
      const meta = metaRef.current;
      const ep = m.epoch;
      setRunMap((rm) => ({
        ...rm,
        [meta.runId]: { hidden: meta.hidden, dataset: meta.dataset, epochs: ep, bestAcc: Math.max(a, rm[meta.runId]?.bestAcc ?? 0) },
      }));
      if (m.epoch >= MAX_EPOCHS) setTraining(false);
    }, 70);
    return () => window.clearInterval(id);
  }, [training, data]);

  const runs = useMemo(() => Object.values(runMap), [runMap]);
  useEffect(() => {
    onState?.({ hidden, dataset, epochs, acc, training, runs, traced });
  }, [hidden, dataset, epochs, acc, training, runs, traced, onState]);

  const startTrace = () => {
    const m = modelRef.current;
    if (!m) return;
    setTraining(false);
    let worst = data[0];
    let worstErr = -1;
    for (const s of data) {
      const e = Math.abs(predictProb(m, s.x, s.y) - s.label);
      if (e > worstErr) {
        worstErr = e;
        worst = s;
      }
    }
    const p = predictProb(m, worst.x, worst.y);
    const err = p - worst.label;
    let blame: number[] = [];
    if (m.layers.length === 2) {
      const L1 = m.layers[0];
      const L2 = m.layers[1];
      blame = Array.from({ length: L1.outSize }, (_, i) => {
        const z = L1.W[i * 2] * worst.x + L1.W[i * 2 + 1] * worst.y + L1.b[i];
        const h = Math.tanh(z);
        return Math.abs(L2.W[i] * err * (1 - h * h));
      });
      const sum = blame.reduce((a, b) => a + b, 0) || 1;
      blame = blame.map((b) => b / sum);
    }
    setTraceInfo({ sample: worst, err, blame, phase: 1 });
  };

  useEffect(() => {
    if (!traceInfo || traceInfo.phase >= 4) return;
    const t = window.setTimeout(() => {
      setTraceInfo((ti) => (ti ? { ...ti, phase: ti.phase + 1 } : ti));
      if (traceInfo.phase === 3) setTraced((n) => n + 1);
    }, 900);
    return () => window.clearTimeout(t);
  }, [traceInfo]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const dark = isDark();
      const sx = (x: number) => ((x - MIN) / (MAX - MIN)) * w;
      const sy = (y: number) => h - ((y - MIN) / (MAX - MIN)) * h;
      if (grid) {
        const cell = w / RES;
        for (let j = 0; j < RES; j++) {
          for (let i = 0; i < RES; i++) {
            const p = grid[j * RES + i];
            const alpha = Math.abs(p - 0.5) * 0.5;
            ctx.fillStyle = p >= 0.5 ? `rgba(220,38,38,${alpha})` : `rgba(37,99,235,${alpha})`;
            ctx.fillRect(i * cell, j * (h / RES), cell + 0.5, h / RES + 0.5);
          }
        }
      }
      const m = modelRef.current;
      for (const s of data) {
        const x = sx(s.x);
        const y = sy(s.y);
        const wrong = m ? (predictProb(m, s.x, s.y) >= 0.5 ? 1 : 0) !== s.label : false;
        ctx.fillStyle = s.label === 1 ? COLORS.red : COLORS.blue;
        ctx.strokeStyle = dark ? "#18181b" : "#fff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (s.label === 1) ctx.arc(x, y, 4, 0, Math.PI * 2);
        else ctx.rect(x - 3.5, y - 3.5, 7, 7);
        ctx.fill();
        ctx.stroke();
        if (wrong) {
          ctx.strokeStyle = COLORS.yellow;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      if (traceInfo) {
        ctx.strokeStyle = COLORS.yellow;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sx(traceInfo.sample.x), sy(traceInfo.sample.y), 13, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    [grid, data, traceInfo],
  );

  const pct = Math.floor(acc * 100 + 1e-9);
  const neuronOptions = neuronChoices ?? null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill ok={acc >= 0.92}>准确率：{pct}%</StatusPill>
        <span className="text-sm text-zinc-500">已训练 {epochs} 轮</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <ExpCanvas
          draw={draw}
          version={`${epochs}|${hidden}|${dataset}|${traceInfo?.phase ?? 0}|${grid ? 1 : 0}`}
          maxWidth={360}
          ariaLabel="红点和蓝点的分类图，背景颜色是网络的判断"
        />
        <NetDiagram layers={snap} trace={traceInfo} />
      </div>
      <div className="flex flex-wrap gap-2">
        {neuronOptions ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium">隐藏层神经元：</span>
            {neuronOptions.map((n) => (
              <button key={n} type="button" className={chip(hidden === n)} onClick={() => select(n, dataset)}>
                {n === 0 ? "不加层" : n}
              </button>
            ))}
          </div>
        ) : (
          <>
            <button type="button" className={chip(hidden === 0)} onClick={() => select(0, dataset)}>
              不加隐藏层
            </button>
            <button type="button" className={chip(hidden > 0)} onClick={() => select(4, dataset)}>
              加一层（4 个神经元）
            </button>
          </>
        )}
      </div>
      {datasetSwitch && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium">数据：</span>
          <button type="button" className={chip(dataset === "circle")} onClick={() => select(hidden, "circle")}>
            红点在中间
          </button>
          <button type="button" className={chip(dataset === "xor")} onClick={() => select(hidden, "xor")}>
            四角棋盘
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={() => setTraining((t) => !t)} disabled={epochs >= MAX_EPOCHS}>
          {training ? "暂停" : epochs > 0 ? "继续训练" : "开始训练"}
        </button>
        <button type="button" className={btnSecondary} onClick={() => rebuild(hidden, data, dataset)}>
          从头再来
        </button>
        {trace && (
          <button type="button" className={btnSecondary} onClick={startTrace} disabled={Boolean(traceInfo && traceInfo.phase < 4)}>
            追查一个错点
          </button>
        )}
      </div>
      {traceInfo && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100" aria-live="polite">
          {traceInfo.phase >= 1 && <>① 这个点答错了 {Math.abs(traceInfo.err).toFixed(2)}（输出 vs 正确答案）。</>}
          {traceInfo.phase >= 2 && <> ② 误差顺着连线往回传，连线越粗、越「有责任」。</>}
          {traceInfo.phase >= 3 && traceInfo.blame.length > 0 && <> ③ 每个隐藏神经元分到自己该背的那份锅（百分比）。</>}
          {traceInfo.phase >= 4 && <> ④ 每根线按分到的锅改一点点——全部点都这样来一遍，就是训练一轮。</>}
        </p>
      )}
    </div>
  );
}

function NetDiagram({ layers, trace }: { layers: Snap; trace: Trace | null }) {
  const hidden = layers.length === 2 ? layers[0].W.length / 2 : 0;
  const W = 220;
  const H = 200;
  const inY = [70, 130];
  const hidY = Array.from({ length: hidden }, (_, i) => (hidden === 1 ? 100 : 25 + (150 * i) / (hidden - 1)));
  const xIn = 25;
  const xHid = 110;
  const xOut = 195;
  const phase = trace?.phase ?? 0;
  const edge = (wt: number) => ({
    stroke: wt >= 0 ? COLORS.red : COLORS.blue,
    strokeWidth: Math.min(6, 0.6 + Math.abs(wt) * 1.5),
    opacity: 0.55,
  });
  const lines: React.ReactNode[] = [];
  if (layers.length) {
    if (layers.length === 1) {
      const L = layers[0];
      inY.forEach((y, i) => {
        const glow = phase >= 2;
        lines.push(
          <line key={`d${i}`} x1={xIn} y1={y} x2={xOut} y2={100} {...edge(L.W[i])} {...(glow ? { stroke: COLORS.yellow, opacity: 0.9 } : {})} />,
        );
      });
    } else {
      const L1 = layers[0];
      const L2 = layers[1];
      hidY.forEach((hy, h) => {
        inY.forEach((iy, i) => {
          const glow = phase >= 4;
          lines.push(
            <line key={`a${h}-${i}`} x1={xIn} y1={iy} x2={xHid} y2={hy} {...edge(L1.W[h * 2 + i])} {...(glow ? { stroke: COLORS.yellow, opacity: 0.35 + (trace?.blame[h] ?? 0) } : {})} />,
          );
        });
        const glow2 = phase >= 2;
        lines.push(
          <line key={`b${h}`} x1={xHid} y1={hy} x2={xOut} y2={100} {...edge(L2.W[h])} {...(glow2 ? { stroke: COLORS.yellow, opacity: 0.35 + (trace?.blame[h] ?? 0), strokeWidth: 1 + 8 * (trace?.blame[h] ?? 0) } : {})} />,
        );
      });
    }
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[260px] shrink-0" role="img" aria-label="网络结构图：输入、隐藏层、输出，线越粗权重越大">
      {lines}
      {inY.map((y, i) => (
        <g key={i}>
          <circle cx={xIn} cy={y} r={11} className="fill-zinc-200 dark:fill-zinc-700" />
          <text x={xIn} y={y + 4} textAnchor="middle" fontSize="10" className="fill-zinc-700 dark:fill-zinc-200">
            {i === 0 ? "横" : "竖"}
          </text>
        </g>
      ))}
      {hidY.map((y, h) => (
        <g key={h}>
          <circle cx={xHid} cy={y} r={9} className="fill-indigo-200 dark:fill-indigo-800" stroke={phase >= 3 ? COLORS.yellow : "none"} strokeWidth={3} />
          {phase >= 3 && trace?.blame[h] !== undefined && (
            <text x={xHid + 13} y={y - 7} fontSize="10" className="fill-amber-700 dark:fill-amber-300">
              {Math.round(trace.blame[h] * 100)}%
            </text>
          )}
        </g>
      ))}
      <circle cx={xOut} cy={100} r={12} className="fill-zinc-300 dark:fill-zinc-600" stroke={phase >= 1 ? COLORS.yellow : "none"} strokeWidth={4} />
      <text x={xOut} y={128} textAnchor="middle" fontSize="10" className="fill-zinc-500">
        输出
      </text>
      {hidden > 0 && (
        <text x={xHid} y={196} textAnchor="middle" fontSize="10" className="fill-zinc-500">
          隐藏层
        </text>
      )}
      <text x={xIn} y={160} textAnchor="middle" fontSize="10" className="fill-zinc-500">
        输入
      </text>
    </svg>
  );
}
