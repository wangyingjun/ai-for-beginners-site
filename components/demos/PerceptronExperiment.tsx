"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { predict, trainStep, type Point2D } from "@/lib/ml/perceptron";
import {
  isOutlier,
  perceptronPreset,
  PERCEPTRON_PRESET_LABELS,
  TILTED_START,
  type PerceptronPresetId,
} from "@/lib/ml/perceptron-presets";

/**
 * Guided perceptron experiment (beginner, Chinese UI).
 * Colours follow the upstream notebooks: red = +1, blue = −1.
 * Points on the wrong side pulse with an amber ring; each update animates the
 * line and draws a dashed "pull" from the point that moved it.
 */

export type PerceptronRun = { lr: number; steps: number };

export type PerceptronExperimentState = {
  preset: PerceptronPresetId;
  misclassified: number;
  total: number;
  /** Updates since the last reset of the line / data. */
  steps: number;
  lr: number;
  converged: boolean;
  pointsAdded: number;
  outliersAdded: number;
  /** Updates since the most recent outlier was added. */
  stepsSinceOutlier: number;
  /** Separable runs that reached zero mistakes, with the learning rate used. */
  runs: PerceptronRun[];
};

type Controls = {
  learningRate?: boolean;
  addPoints?: boolean;
  presetSwitch?: boolean;
  reset?: boolean;
};

const MIN = -1.2;
const MAX = 1.2;
const ANIM_MS = 400;
const AUTO_MS = 520;
const AUTO_CAP = 200;

const RED = "#dc2626";
const BLUE = "#2563eb";
const AMBER = "#f59e0b";

type Weights = [number, number, number];

function lerpW(a: Weights, b: Weights, t: number): Weights {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function boundary(w: Weights): [[number, number], [number, number]] | null {
  const [b, wx, wy] = w;
  const pts: [number, number][] = [];
  if (Math.abs(wy) > 1e-9) {
    for (const x of [MIN, MAX]) {
      const y = -(b + wx * x) / wy;
      if (y >= MIN && y <= MAX) pts.push([x, y]);
    }
  }
  if (Math.abs(wx) > 1e-9) {
    for (const y of [MIN, MAX]) {
      const x = -(b + wy * y) / wx;
      if (x >= MIN && x <= MAX) pts.push([x, y]);
    }
  }
  const uniq = pts.filter(
    (p, i) => pts.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-6) === i,
  );
  return uniq.length >= 2 ? [uniq[0], uniq[1]] : null;
}

function footOnLine(w: Weights, x: number, y: number): [number, number] | null {
  const [b, wx, wy] = w;
  const n2 = wx * wx + wy * wy;
  if (n2 < 1e-12) return null;
  const d = (b + wx * x + wy * y) / n2;
  return [x - d * wx, y - d * wy];
}

export function PerceptronExperiment({
  initialPreset = "two-clusters",
  presets = ["two-clusters"],
  initialWeights = TILTED_START,
  initialLr = 0.1,
  controls = {},
  onState,
}: {
  initialPreset?: PerceptronPresetId;
  presets?: PerceptronPresetId[];
  initialWeights?: Weights;
  initialLr?: number;
  controls?: Controls;
  onState?: (s: PerceptronExperimentState) => void;
}) {
  const [preset, setPreset] = useState<PerceptronPresetId>(initialPreset);
  const [points, setPoints] = useState<Point2D[]>(() => perceptronPreset(initialPreset));
  const [weights, setWeights] = useState<Weights>(initialWeights);
  const [lr, setLr] = useState(initialLr);
  const [steps, setSteps] = useState(0);
  const [running, setRunning] = useState(false);
  const [addMode, setAddMode] = useState<0 | 1 | -1>(0);
  const [pointsAdded, setPointsAdded] = useState(0);
  const [outliersAdded, setOutliersAdded] = useState(0);
  const [stepsSinceOutlier, setStepsSinceOutlier] = useState(0);
  const [runs, setRuns] = useState<PerceptronRun[]>([]);
  const [runRecorded, setRunRecorded] = useState(false);
  const [lastPull, setLastPull] = useState<number | null>(null);

  const cursorRef = useRef(0);
  const animRef = useRef<{ from: Weights; to: Weights; start: number; pull: Point2D | null }>({
    from: initialWeights,
    to: initialWeights,
    start: 0,
    pull: null,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef(340);

  const misclassified = useMemo(
    () => points.filter((p) => predict(weights, p.x, p.y) !== p.label).length,
    [points, weights],
  );
  const converged = misclassified === 0;
  const separable = preset === "two-clusters" && outliersAdded === 0;

  // Report state to the experiment shell.
  useEffect(() => {
    onState?.({
      preset,
      misclassified,
      total: points.length,
      steps,
      lr,
      converged,
      pointsAdded,
      outliersAdded,
      stepsSinceOutlier,
      runs,
    });
  }, [onState, preset, misclassified, points.length, steps, lr, converged, pointsAdded, outliersAdded, stepsSinceOutlier, runs]);

  /** One click of 「下一步」: update with the next point that is on the wrong side. */
  const step = useCallback((): boolean => {
    const n = points.length;
    if (!n) return false;
    let idx = -1;
    for (let k = 0; k < n; k++) {
      const i = (cursorRef.current + k) % n;
      const p = points[i];
      if (predict(weights, p.x, p.y) !== p.label) {
        idx = i;
        break;
      }
    }
    if (idx === -1) {
      if (!runRecorded && separable && steps > 0) {
        setRuns((r) => [...r, { lr, steps }]);
        setRunRecorded(true);
      }
      return false;
    }
    cursorRef.current = (idx + 1) % n;
    const p = points[idx];
    const next = trainStep(
      { weights, epoch: 0, step: 0, lastError: null },
      p,
      lr,
    ).state.weights;
    animRef.current = { from: weights, to: next, start: performance.now(), pull: p };
    setWeights(next);
    setSteps((s) => s + 1);
    setStepsSinceOutlier((s) => s + 1);
    setLastPull(idx);
    // Did this update finish a separable run?
    const nowWrong = points.filter((q) => predict(next, q.x, q.y) !== q.label).length;
    if (nowWrong === 0 && separable && !runRecorded) {
      setRuns((r) => [...r, { lr, steps: steps + 1 }]);
      setRunRecorded(true);
    }
    return true;
  }, [points, weights, lr, runRecorded, separable, steps]);

  // Autoplay: one step per tick; stops when everything is on the right side.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const moved = step();
      if (!moved || steps >= AUTO_CAP) setRunning(false);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [running, step, steps]);

  const resetLine = useCallback(() => {
    setRunning(false);
    animRef.current = { from: weights, to: initialWeights, start: performance.now(), pull: null };
    setWeights(initialWeights);
    setSteps(0);
    setRunRecorded(false);
    setLastPull(null);
    cursorRef.current = 0;
  }, [weights, initialWeights]);

  const loadPreset = useCallback(
    (id: PerceptronPresetId) => {
      setRunning(false);
      setPreset(id);
      setPoints(perceptronPreset(id));
      setOutliersAdded(0);
      setPointsAdded(0);
      setStepsSinceOutlier(0);
      animRef.current = { from: weights, to: initialWeights, start: performance.now(), pull: null };
      setWeights(initialWeights);
      setSteps(0);
      setRunRecorded(false);
      setLastPull(null);
      cursorRef.current = 0;
    },
    [weights, initialWeights],
  );

  // Responsive canvas size.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      sizeRef.current = Math.max(240, Math.min(420, Math.floor(el.clientWidth)));
    });
    ro.observe(el);
    sizeRef.current = Math.max(240, Math.min(420, Math.floor(el.clientWidth)));
    return () => ro.disconnect();
  }, []);

  // Render loop (animation + pulsing rings).
  useEffect(() => {
    let raf = 0;
    const draw = (now: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        const size = sizeRef.current;
        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== Math.round(size * dpr)) {
          canvas.width = Math.round(size * dpr);
          canvas.height = Math.round(size * dpr);
          canvas.style.width = `${size}px`;
          canvas.style.height = `${size}px`;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const toC = (x: number, y: number) => [
          ((x - MIN) / (MAX - MIN)) * size,
          ((MAX - y) / (MAX - MIN)) * size,
        ];

        const a = animRef.current;
        const t = Math.min(1, (now - a.start) / ANIM_MS);
        const ease = 1 - Math.pow(1 - t, 3);
        const w = lerpW(a.from, a.to, ease);

        const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = dark ? "#18181b" : "#fafafa";
        ctx.fillRect(0, 0, size, size);

        // Half-plane tint: which side the line calls red / blue.
        const cells = 24;
        const cs = size / cells;
        for (let i = 0; i < cells; i++) {
          for (let j = 0; j < cells; j++) {
            const x = MIN + ((i + 0.5) / cells) * (MAX - MIN);
            const y = MAX - ((j + 0.5) / cells) * (MAX - MIN);
            ctx.fillStyle =
              w[0] + w[1] * x + w[2] * y >= 0 ? "rgba(220,38,38,0.08)" : "rgba(37,99,235,0.08)";
            ctx.fillRect(i * cs, j * cs, cs + 0.5, cs + 0.5);
          }
        }

        // Pull indicator: dashed line from the point to the line, fades out.
        if (a.pull && now - a.start < 1200) {
          const foot = footOnLine(w, a.pull.x, a.pull.y);
          if (foot) {
            const [px, py] = toC(a.pull.x, a.pull.y);
            const [fx, fy] = toC(foot[0], foot[1]);
            ctx.save();
            ctx.globalAlpha = 1 - (now - a.start) / 1200;
            ctx.strokeStyle = AMBER;
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 5]);
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(fx, fy);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.font = "bold 13px system-ui, sans-serif";
            ctx.fillStyle = "#b45309";
            ctx.fillText("拽！", px + 10, py - 10);
            ctx.restore();
          }
        }

        // The line.
        const line = boundary(w);
        if (line) {
          const [x1, y1] = toC(line[0][0], line[0][1]);
          const [x2, y2] = toC(line[1][0], line[1][1]);
          ctx.strokeStyle = dark ? "#f4f4f5" : "#18181b";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        // Points; wrong-side ones pulse with an amber ring.
        const pulse = 0.5 + 0.5 * Math.sin(now / 160);
        const r = size < 300 ? 6 : 7;
        for (const p of points) {
          const [cx, cy] = toC(p.x, p.y);
          const wrong = predict(a.to, p.x, p.y) !== p.label;
          if (wrong) {
            ctx.beginPath();
            ctx.arc(cx, cy, r + 5 + pulse * 3, 0, Math.PI * 2);
            ctx.strokeStyle = AMBER;
            ctx.globalAlpha = 0.45 + 0.55 * pulse;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          ctx.beginPath();
          if (p.label === 1) {
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
          } else {
            ctx.rect(cx - r + 1, cy - r + 1, (r - 1) * 2, (r - 1) * 2);
          }
          ctx.fillStyle = p.label === 1 ? RED : BLUE;
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [points]);

  const onCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!controls.addPoints || addMode === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = MIN + ((e.clientX - rect.left) / rect.width) * (MAX - MIN);
    const y = MAX - ((e.clientY - rect.top) / rect.height) * (MAX - MIN);
    const p: Point2D = { x, y, label: addMode };
    setPoints((pts) => [...pts, p]);
    setPointsAdded((n) => n + 1);
    setRunRecorded(true); // data changed: don't count this as a clean run
    if (preset === "two-clusters" && isOutlier(p)) {
      setOutliersAdded((n) => n + 1);
      setStepsSinceOutlier(0);
    }
  };

  const btn =
    "min-h-10 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-40";
  const primary = `${btn} bg-indigo-600 text-white hover:bg-indigo-500`;
  const secondary = `${btn} border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100`;
  const chip = (active: boolean) =>
    `${btn} border ${active ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200" : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span
          className={`rounded-full px-3 py-1 font-medium ${converged ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"}`}
          aria-live="polite"
        >
          {converged ? "✅ 全部站对了！" : `站错边的点：${misclassified} 个`}
        </span>
        <span className="text-zinc-500">已挪动 {steps} 次</span>
      </div>

      <div ref={wrapRef} className="w-full max-w-[420px]">
        <canvas
          ref={canvasRef}
          onPointerDown={onCanvasPointer}
          role="img"
          aria-label="感知机实验画布：红点和蓝点，以及一条分界线"
          className={`touch-manipulation rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 ${controls.addPoints && addMode !== 0 ? "cursor-crosshair" : ""}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: RED }} /> 红点
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3" style={{ background: BLUE }} /> 蓝点
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full border-2" style={{ borderColor: AMBER }} /> 站错边
        </span>
        <span>浅红 / 浅蓝底色：线认为是红区 / 蓝区</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={primary} onClick={() => step()} disabled={running}>
          下一步
        </button>
        <button
          type="button"
          className={secondary}
          onClick={() => setRunning((r) => !r)}
          disabled={!running && converged}
        >
          {running ? "暂停" : "自动播放"}
        </button>
        {controls.reset && (
          <button type="button" className={secondary} onClick={resetLine}>
            重置直线
          </button>
        )}
      </div>

      {controls.learningRate && (
        <label className="flex max-w-[420px] flex-wrap items-center gap-3 text-sm">
          <span className="font-medium">每次挪多少（学习率）</span>
          <input
            type="range"
            min={0.02}
            max={1}
            step={0.02}
            value={lr}
            onChange={(e) => setLr(Number(e.target.value))}
            className="min-w-[10rem] flex-1"
            aria-label="学习率"
          />
          <span className="w-10 font-mono">{lr.toFixed(2)}</span>
        </label>
      )}

      {controls.presetSwitch && presets.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">换一组数据：</span>
          {presets.map((id) => (
            <button key={id} type="button" className={chip(preset === id)} onClick={() => loadPreset(id)}>
              {PERCEPTRON_PRESET_LABELS[id]}
            </button>
          ))}
        </div>
      )}

      {controls.addPoints && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">点画布放点：</span>
          <button type="button" className={chip(addMode === 1)} onClick={() => setAddMode(addMode === 1 ? 0 : 1)}>
            放红点
          </button>
          <button type="button" className={chip(addMode === -1)} onClick={() => setAddMode(addMode === -1 ? 0 : -1)}>
            放蓝点
          </button>
          {pointsAdded > 0 && (
            <button type="button" className={secondary} onClick={() => loadPreset(preset)}>
              恢复原始数据
            </button>
          )}
        </div>
      )}

      {runs.length > 0 && (
        <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
          {runs.map((r, i) => (
            <li key={i}>
              第 {i + 1} 次分开：学习率 {r.lr.toFixed(2)}，挪了 {r.steps} 次
            </li>
          ))}
        </ul>
      )}
      {lastPull !== null && !converged && (
        <p className="sr-only" aria-live="polite">
          一个站错边的点把线拽了一下
        </p>
      )}
    </div>
  );
}
