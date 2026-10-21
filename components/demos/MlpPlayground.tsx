"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DATASET_IDS,
  generateDataset,
  type DatasetId,
  type Sample2D,
} from "@/lib/ml/datasets";
import {
  accuracy,
  createMlp,
  decisionGrid,
  trainEpoch,
  type ActivationName,
  type MlpModel,
} from "@/lib/ml/mlp";
import { t, type Locale } from "@/lib/i18n";

const DATA_MIN = -1.2;
const DATA_MAX = 1.2;
const CANVAS_CSS = 360;
const GRID_RES = 48;

const HIDDEN_PRESETS: { id: string; layers: number[] }[] = [
  { id: "0", layers: [] },
  { id: "4", layers: [4] },
  { id: "8", layers: [8] },
  { id: "4-2", layers: [4, 2] },
  { id: "8-4", layers: [8, 4] },
  { id: "6-6-4", layers: [6, 6, 4] },
];

function lerpColor(p: number): string {
  // blue (1) ← white (0.5) → orange/red (0)
  const t = Math.max(0, Math.min(1, p));
  if (t >= 0.5) {
    const u = (t - 0.5) * 2;
    const r = Math.round(255 - u * (255 - 37));
    const g = Math.round(255 - u * (255 - 99));
    const b = Math.round(255 - u * (255 - 235));
    return `rgb(${r},${g},${b})`;
  }
  const u = t * 2;
  const r = Math.round(249 + u * (255 - 249));
  const g = Math.round(115 + u * (255 - 115));
  const b = Math.round(22 + u * (255 - 22));
  return `rgb(${r},${g},${b})`;
}


function datasetLabel(locale: Locale, id: DatasetId): string {
  switch (id) {
    case "circle":
      return t(locale, "demoDataset_circle");
    case "xor":
      return t(locale, "demoDataset_xor");
    case "moons":
      return t(locale, "demoDataset_moons");
    case "gauss":
      return t(locale, "demoDataset_gauss");
  }
}

export function MlpPlayground({ locale, showFullscreenLink = true }: { locale: Locale; showFullscreenLink?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lossCanvasRef = useRef<HTMLCanvasElement>(null);
  const [datasetId, setDatasetId] = useState<DatasetId>("xor");
  const [data, setData] = useState<Sample2D[]>(() => generateDataset("xor", 180, 7));
  const [hiddenId, setHiddenId] = useState("4-2");
  const [activation, setActivation] = useState<ActivationName>("tanh");
  const [lr, setLr] = useState(0.03);
  const [l2, setL2] = useState(0.001);
  const [running, setRunning] = useState(false);
  const [model, setModel] = useState<MlpModel>(() =>
    createMlp({ hidden: [4, 2], activation: "tanh", learningRate: 0.03, l2: 0.001 }, 3),
  );

  const hidden = useMemo(
    () => HIDDEN_PRESETS.find((h) => h.id === hiddenId)?.layers ?? [4, 2],
    [hiddenId],
  );

  const acc = useMemo(() => accuracy(model, data), [model, data]);

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

    const grid = decisionGrid(model, GRID_RES, DATA_MIN, DATA_MAX);
    const cell = w / GRID_RES;
    for (let j = 0; j < GRID_RES; j++) {
      for (let i = 0; i < GRID_RES; i++) {
        ctx.fillStyle = lerpColor(grid[j * GRID_RES + i]);
        ctx.fillRect(i * cell, j * cell, cell + 0.5, cell + 0.5);
      }
    }

    // Decision contour ~0.5
    ctx.strokeStyle = "rgba(24,24,27,0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let j = 0; j < GRID_RES - 1; j++) {
      for (let i = 0; i < GRID_RES - 1; i++) {
        const v00 = grid[j * GRID_RES + i];
        const v10 = grid[j * GRID_RES + i + 1];
        const v01 = grid[(j + 1) * GRID_RES + i];
        if ((v00 - 0.5) * (v10 - 0.5) < 0) {
          const t0 = (0.5 - v00) / (v10 - v00 + 1e-9);
          ctx.moveTo((i + t0) * cell, j * cell);
          ctx.lineTo((i + t0) * cell, (j + 1) * cell);
        }
        if ((v00 - 0.5) * (v01 - 0.5) < 0) {
          const t0 = (0.5 - v00) / (v01 - v00 + 1e-9);
          ctx.moveTo(i * cell, (j + t0) * cell);
          ctx.lineTo((i + 1) * cell, (j + t0) * cell);
        }
      }
    }
    ctx.stroke();

    for (const s of data) {
      const cx = ((s.x - DATA_MIN) / (DATA_MAX - DATA_MIN)) * w;
      const cy = ((DATA_MAX - s.y) / (DATA_MAX - DATA_MIN)) * h;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = s.label === 1 ? "#1d4ed8" : "#c2410c";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [model, data]);

  const drawLoss = useCallback(() => {
    const canvas = lossCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = 280;
    const h = 80;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "#18181b"
      : "#f4f4f5";
    ctx.fillRect(0, 0, w, h);
    const hist = model.lossHistory;
    if (hist.length < 2) return;
    const maxL = Math.max(...hist, 0.1);
    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    hist.forEach((v, i) => {
      const x = (i / (hist.length - 1)) * (w - 8) + 4;
      const y = h - 4 - (v / maxL) * (h - 12);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [model.lossHistory]);

  useEffect(() => {
    draw();
    drawLoss();
  }, [draw, drawLoss]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = 0;
    const tick = (ts: number) => {
      if (ts - last > 40) {
        last = ts;
        setModel((m) => {
          const next: MlpModel = {
            ...m,
            layers: m.layers.map((l) => ({
              ...l,
              W: l.W.slice(),
              b: l.b.slice(),
            })),
            lossHistory: m.lossHistory.slice(),
          };
          trainEpoch(next, data, lr, l2, next.epoch);
          return next;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, data, lr, l2]);

  function onDatasetChange(id: DatasetId) {
    setDatasetId(id);
    setData(generateDataset(id, 180, Date.now() % 10000));
    setRunning(false);
    setModel(
      createMlp(
        { hidden, activation, learningRate: lr, l2 },
        Date.now() % 10000,
      ),
    );
  }

  function onHiddenChange(id: string) {
    setHiddenId(id);
    const layers = HIDDEN_PRESETS.find((h) => h.id === id)?.layers ?? [4];
    setRunning(false);
    setModel(
      createMlp(
        { hidden: layers, activation, learningRate: lr, l2 },
        Date.now() % 10000,
      ),
    );
  }

  function onActivationChange(a: ActivationName) {
    setActivation(a);
    setRunning(false);
    setModel(
      createMlp({ hidden, activation: a, learningRate: lr, l2 }, Date.now() % 10000),
    );
  }

  function handleReset() {
    setRunning(false);
    setModel(
      createMlp({ hidden, activation, learningRate: lr, l2 }, Date.now() % 10000),
    );
  }

  function handleStepEpoch() {
    setModel((m) => {
      const next: MlpModel = {
        ...m,
        layers: m.layers.map((l) => ({
          ...l,
          W: l.W.slice(),
          b: l.b.slice(),
        })),
        lossHistory: m.lossHistory.slice(),
      };
      trainEpoch(next, data, lr, l2, next.epoch);
      return next;
    });
  }

  const lastLoss = model.lossHistory[model.lossHistory.length - 1];

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{t(locale, "demoMlpTitle")}</h3>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">{t(locale, "demoMlpHint")}</p>
        </div>
        {showFullscreenLink && (
          <a
          href={`/demos/mlp?lang=${locale}`}
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          {t(locale, "demoOpenFullscreen")}
        </a>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="mx-auto shrink-0 space-y-2">
          <canvas
            ref={canvasRef}
            width={CANVAS_CSS}
            height={CANVAS_CSS}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700"
            aria-label={t(locale, "demoMlpCanvasAria")}
          />
          <canvas
            ref={lossCanvasRef}
            width={280}
            height={80}
            className="mx-auto block rounded border border-zinc-200 dark:border-zinc-700"
            aria-label={t(locale, "demoLossCurve")}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3 text-sm">
          <label className="block space-y-1">
            <span className="text-zinc-600 dark:text-zinc-400">{t(locale, "demoDataset")}</span>
            <select
              value={datasetId}
              onChange={(e) => onDatasetChange(e.target.value as DatasetId)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-900"
            >
              {DATASET_IDS.map((id) => (
                <option key={id} value={id}>
                  {datasetLabel(locale, id)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-zinc-600 dark:text-zinc-400">{t(locale, "demoHiddenLayers")}</span>
            <select
              value={hiddenId}
              onChange={(e) => onHiddenChange(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-900"
            >
              {HIDDEN_PRESETS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.layers.length === 0
                    ? t(locale, "demoHiddenNone")
                    : `2 → ${h.layers.join(" → ")} → 1`}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-zinc-600 dark:text-zinc-400">{t(locale, "demoActivation")}</span>
            <select
              value={activation}
              onChange={(e) => onActivationChange(e.target.value as ActivationName)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-900"
            >
              <option value="tanh">tanh</option>
              <option value="relu">ReLU</option>
              <option value="sigmoid">sigmoid</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-zinc-600 dark:text-zinc-400">
              {t(locale, "demoLearningRate")}: {lr.toFixed(3)}
            </span>
            <input
              type="range"
              min={0.001}
              max={0.2}
              step={0.001}
              value={lr}
              onChange={(e) => setLr(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-zinc-600 dark:text-zinc-400">
              {t(locale, "demoL2")}: {l2.toFixed(4)}
            </span>
            <input
              type="range"
              min={0}
              max={0.05}
              step={0.0005}
              value={l2}
              onChange={(e) => setL2(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500"
            >
              {running ? t(locale, "demoPause") : t(locale, "demoTrain")}
            </button>
            <button
              type="button"
              onClick={handleStepEpoch}
              className="rounded-md border border-indigo-600 px-3 py-1.5 font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950"
            >
              {t(locale, "demoEpoch")}
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
              onClick={() => onDatasetChange(datasetId)}
              className="rounded-md bg-zinc-100 px-3 py-1.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {t(locale, "demoReseed")}
            </button>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-zinc-50 p-3 font-mono text-xs dark:bg-zinc-900 sm:grid-cols-3">
            <div>
              <dt className="text-zinc-500">{t(locale, "demoEpochCount")}</dt>
              <dd>{model.epoch}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t(locale, "demoLoss")}</dt>
              <dd>{lastLoss != null ? lastLoss.toFixed(4) : "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t(locale, "demoAccuracy")}</dt>
              <dd>{(acc * 100).toFixed(1)}%</dd>
            </div>
          </dl>

          <p className="text-xs text-zinc-500">
            {t(locale, "demoMlpAttribution")}{" "}
            <a
              href="https://github.com/tensorflow/playground"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              TensorFlow Playground
            </a>{" "}
            (Apache-2.0).
          </p>
        </div>
      </div>
    </div>
  );
}
