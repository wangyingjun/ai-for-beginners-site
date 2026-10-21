"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  accuracy,
  createPerceptron,
  decisionBoundaryLine,
  predict,
  seedLinearlySeparable,
  trainEpoch,
  trainStep,
  type Point2D,
  type PerceptronState,
} from "@/lib/ml/perceptron";
import { t, type Locale } from "@/lib/i18n";

const DATA_MIN = -1.2;
const DATA_MAX = 1.2;
const CANVAS_CSS = 360;

type LabelMode = 1 | -1;

export function PerceptronDemo({ locale, showFullscreenLink = true }: { locale: Locale; showFullscreenLink?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point2D[]>(() => seedLinearlySeparable(24, 42));
  const [model, setModel] = useState<PerceptronState>(() => createPerceptron(1));
  const [lr, setLr] = useState(0.1);
  const [labelMode, setLabelMode] = useState<LabelMode>(1);
  const [running, setRunning] = useState(false);
  const [cursorIdx, setCursorIdx] = useState(0);
  const pointIdxRef = useRef(0);

  const acc = useMemo(() => accuracy(model.weights, points), [model.weights, points]);

  const toData = useCallback((cx: number, cy: number, w: number, h: number) => {
    const x = DATA_MIN + (cx / w) * (DATA_MAX - DATA_MIN);
    const y = DATA_MAX - (cy / h) * (DATA_MAX - DATA_MIN);
    return { x, y };
  }, []);

  const toCanvas = useCallback((x: number, y: number, w: number, h: number) => {
    const cx = ((x - DATA_MIN) / (DATA_MAX - DATA_MIN)) * w;
    const cy = ((DATA_MAX - y) / (DATA_MAX - DATA_MIN)) * h;
    return { cx, cy };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = CANVAS_CSS;
    const h = CANVAS_CSS;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#fafafa";
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      ctx.fillStyle = "#18181b";
    }
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(113,113,122,0.25)";
    ctx.lineWidth = 1;
    for (let g = -1; g <= 1; g += 0.5) {
      const { cx } = toCanvas(g, 0, w, h);
      const { cy } = toCanvas(0, g, w, h);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();
    }

    // Axes
    const o = toCanvas(0, 0, w, h);
    ctx.strokeStyle = "rgba(113,113,122,0.6)";
    ctx.beginPath();
    ctx.moveTo(0, o.cy);
    ctx.lineTo(w, o.cy);
    ctx.moveTo(o.cx, 0);
    ctx.lineTo(o.cx, h);
    ctx.stroke();

    // Soft regions (optional tint)
    const line = decisionBoundaryLine(model.weights, DATA_MIN, DATA_MAX);
    if (line) {
      const a = toCanvas(line[0][0], line[0][1], w, h);
      const b = toCanvas(line[1][0], line[1][1], w, h);
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(a.cx, a.cy);
      ctx.lineTo(b.cx, b.cy);
      ctx.stroke();
    }

    // Points
    for (const p of points) {
      const { cx, cy } = toCanvas(p.x, p.y, w, h);
      const correct = predict(model.weights, p.x, p.y) === p.label;
      ctx.beginPath();
      if (p.label === 1) {
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fillStyle = correct ? "#2563eb" : "#93c5fd";
        ctx.fill();
        ctx.strokeStyle = "#1e3a8a";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = correct ? "#dc2626" : "#fca5a5";
        ctx.fillRect(-6, -6, 12, 12);
        ctx.strokeStyle = "#7f1d1d";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-6, -6, 12, 12);
        ctx.restore();
      }
    }
  }, [model.weights, points, toCanvas]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setPoints((pts) => {
        if (!pts.length) return pts;
        setModel((m) => {
          const i = pointIdxRef.current % pts.length;
          const r = trainStep(m, pts[i], lr);
          pointIdxRef.current = i + 1;
          setCursorIdx(pointIdxRef.current % pts.length);
          if (pointIdxRef.current % pts.length === 0) {
            return { ...r.state, epoch: r.state.epoch + 1 };
          }
          return r.state;
        });
        return pts;
      });
    }, 80);
    return () => window.clearInterval(id);
  }, [running, lr]);

  function onCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = toData(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
    setPoints((pts) => [...pts, { x, y, label: labelMode }]);
  }

  function handleStep() {
    if (!points.length) return;
    const i = cursorIdx % points.length;
    setModel((m) => {
      const r = trainStep(m, points[i], lr);
      return r.state;
    });
    setCursorIdx((i + 1) % points.length);
  }

  function handleEpoch() {
    setModel((m) => trainEpoch(m, points, lr).state);
    setCursorIdx(0);
    pointIdxRef.current = 0;
  }

  function handleReset() {
    setRunning(false);
    setModel(createPerceptron(Date.now() % 10000));
    setCursorIdx(0);
    pointIdxRef.current = 0;
  }

  function handleReseed() {
    setRunning(false);
    setPoints(seedLinearlySeparable(24, Date.now() % 10000));
    setModel(createPerceptron(Date.now() % 10000));
    setCursorIdx(0);
    pointIdxRef.current = 0;
  }

  function handleClear() {
    setRunning(false);
    setPoints([]);
    setModel(createPerceptron(1));
    setCursorIdx(0);
  }

  const [w0, w1, w2] = model.weights;

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{t(locale, "demoPerceptronTitle")}</h3>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">{t(locale, "demoPerceptronHint")}</p>
        </div>
        {showFullscreenLink && (
          <a
          href={`/demos/perceptron?lang=${locale}`}
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          {t(locale, "demoOpenFullscreen")}
        </a>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="mx-auto shrink-0">
          <canvas
            ref={canvasRef}
            width={CANVAS_CSS}
            height={CANVAS_CSS}
            onClick={onCanvasClick}
            className="cursor-crosshair rounded-lg border border-zinc-200 touch-none dark:border-zinc-700"
            aria-label={t(locale, "demoPerceptronCanvasAria")}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLabelMode(1)}
              className={`rounded-md px-3 py-1.5 font-medium ${
                labelMode === 1
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {t(locale, "demoLabelPos")}
            </button>
            <button
              type="button"
              onClick={() => setLabelMode(-1)}
              className={`rounded-md px-3 py-1.5 font-medium ${
                labelMode === -1
                  ? "bg-red-600 text-white"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {t(locale, "demoLabelNeg")}
            </button>
          </div>

          <label className="block space-y-1">
            <span className="text-zinc-600 dark:text-zinc-400">
              {t(locale, "demoLearningRate")}: {lr.toFixed(2)}
            </span>
            <input
              type="range"
              min={0.01}
              max={1}
              step={0.01}
              value={lr}
              onChange={(e) => setLr(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleStep}
              className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500"
            >
              {t(locale, "demoStep")}
            </button>
            <button
              type="button"
              onClick={handleEpoch}
              className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500"
            >
              {t(locale, "demoEpoch")}
            </button>
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              className="rounded-md border border-indigo-600 px-3 py-1.5 font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950"
            >
              {running ? t(locale, "demoPause") : t(locale, "demoAuto")}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md bg-zinc-100 px-3 py-1.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {t(locale, "demoResetWeights")}
            </button>
            <button
              type="button"
              onClick={handleReseed}
              className="rounded-md bg-zinc-100 px-3 py-1.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {t(locale, "demoReseed")}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md bg-zinc-100 px-3 py-1.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {t(locale, "demoClear")}
            </button>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-zinc-50 p-3 font-mono text-xs dark:bg-zinc-900 sm:grid-cols-3">
            <div>
              <dt className="text-zinc-500">w₀ (bias)</dt>
              <dd>{w0.toFixed(3)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">w₁ (x)</dt>
              <dd>{w1.toFixed(3)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">w₂ (y)</dt>
              <dd>{w2.toFixed(3)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t(locale, "demoEpochCount")}</dt>
              <dd>{model.epoch}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t(locale, "demoStepCount")}</dt>
              <dd>{model.step}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t(locale, "demoAccuracy")}</dt>
              <dd>{(acc * 100).toFixed(1)}%</dd>
            </div>
          </dl>

          <p className="text-xs text-zinc-500">{t(locale, "demoPerceptronFormula")}</p>
        </div>
      </div>
    </div>
  );
}
