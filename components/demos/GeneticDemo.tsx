"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_GA,
  bestOf,
  createPopulation,
  evolveGeneration,
  fitnessXY,
  meanFitness,
  type GAConfig,
  type Individual,
} from "@/lib/ml/genetic";
import { t, type Locale } from "@/lib/i18n";

const CANVAS = 320;
const TWO_PI = Math.PI * 2;

export function GeneticDemo({
  locale,
  showFullscreenLink = true,
}: {
  locale: Locale;
  showFullscreenLink?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const curveRef = useRef<HTMLCanvasElement>(null);
  const [cfg, setCfg] = useState<GAConfig>({ ...DEFAULT_GA });
  const [pop, setPop] = useState<Individual[]>(() => createPopulation(DEFAULT_GA));
  const [gen, setGen] = useState(0);
  const [history, setHistory] = useState<number[]>(() => [
    bestOf(createPopulation(DEFAULT_GA)).fitness,
  ]);
  const [running, setRunning] = useState(false);
  const popRef = useRef(pop);
  const cfgRef = useRef(cfg);
  popRef.current = pop;
  cfgRef.current = cfg;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== CANVAS * dpr) {
      canvas.width = CANVAS * dpr;
      canvas.height = CANVAS * dpr;
      canvas.style.width = `${CANVAS}px`;
      canvas.style.height = `${CANVAS}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    ctx.fillStyle = dark ? "#18181b" : "#fafafa";
    ctx.fillRect(0, 0, CANVAS, CANVAS);

    // Fitness heatmap background
    const step = 8;
    for (let py = 0; py < CANVAS; py += step) {
      for (let px = 0; px < CANVAS; px += step) {
        const x = (px / CANVAS) * TWO_PI;
        const y = (1 - py / CANVAS) * TWO_PI;
        const f = fitnessXY(x, y) / 2; // 0..1
        const g = Math.round(40 + f * 180);
        const b = Math.round(80 + (1 - f) * 100);
        ctx.fillStyle = `rgba(79,${g},${b},0.35)`;
        ctx.fillRect(px, py, step, step);
      }
    }

    for (const ind of pop) {
      const cx = (ind.x / TWO_PI) * CANVAS;
      const cy = (1 - ind.y / TWO_PI) * CANVAS;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#4f46e5";
      ctx.fill();
    }

    const best = bestOf(pop);
    const bx = (best.x / TWO_PI) * CANVAS;
    const by = (1 - best.y / TWO_PI) * CANVAS;
    ctx.beginPath();
    ctx.arc(bx, by, 8, 0, Math.PI * 2);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [pop]);

  const drawCurve = useCallback(() => {
    const canvas = curveRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = 280;
    const h = 80;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    ctx.fillStyle = dark ? "#18181b" : "#f4f4f5";
    ctx.fillRect(0, 0, w, h);
    if (history.length < 2) return;
    const max = Math.max(...history, 0.01);
    const min = Math.min(...history, 0);
    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    history.forEach((v, i) => {
      const x = (i / Math.max(1, history.length - 1)) * (w - 8) + 4;
      const y = h - 4 - ((v - min) / (max - min || 1)) * (h - 8);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [history]);

  useEffect(() => {
    draw();
  }, [draw]);
  useEffect(() => {
    drawCurve();
  }, [drawCurve]);

  const stepOnce = useCallback(() => {
    const next = evolveGeneration(popRef.current, cfgRef.current);
    setPop(next);
    setGen((g) => g + 1);
    setHistory((h) => [...h.slice(-199), bestOf(next).fitness]);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(stepOnce, 120);
    return () => window.clearInterval(id);
  }, [running, stepOnce]);

  function reset() {
    setRunning(false);
    const p = createPopulation(cfg);
    setPop(p);
    setGen(0);
    setHistory([bestOf(p).fitness]);
  }

  const best = bestOf(pop);

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{t(locale, "demoGeneticTitle")}</h3>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">
            {t(locale, "demoGeneticHint")}
          </p>
        </div>
        {showFullscreenLink && (
          <a
            href={`/demos/genetic?lang=${locale}`}
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
            width={CANVAS}
            height={CANVAS}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700"
            aria-label={t(locale, "demoGeneticCanvasAria")}
          />
          <canvas
            ref={curveRef}
            width={280}
            height={80}
            className="rounded border border-zinc-200 dark:border-zinc-700"
            aria-label={t(locale, "demoGeneticCurveAria")}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3 text-sm">
          <label className="block space-y-1">
            <span>
              {t(locale, "demoGeneticPop")}: {cfg.popSize}
            </span>
            <input
              type="range"
              min={10}
              max={80}
              value={cfg.popSize}
              onChange={(e) =>
                setCfg((c) => ({ ...c, popSize: Number(e.target.value) }))
              }
              className="w-full"
            />
          </label>
          <label className="block space-y-1">
            <span>
              {t(locale, "demoGeneticMutation")}: {cfg.mutationRate.toFixed(3)}
            </span>
            <input
              type="range"
              min={0.001}
              max={0.2}
              step={0.001}
              value={cfg.mutationRate}
              onChange={(e) =>
                setCfg((c) => ({ ...c, mutationRate: Number(e.target.value) }))
              }
              className="w-full"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={stepOnce}
              className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500"
            >
              {t(locale, "demoGeneticStep")}
            </button>
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              className="rounded-md border border-indigo-600 px-3 py-1.5 font-medium text-indigo-700 dark:text-indigo-300"
            >
              {running ? t(locale, "demoPause") : t(locale, "demoAuto")}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-md bg-zinc-100 px-3 py-1.5 font-medium dark:bg-zinc-800"
            >
              {t(locale, "demoReseed")}
            </button>
          </div>

          <dl className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-50 p-3 font-mono text-xs dark:bg-zinc-900">
            <div>
              <dt className="text-zinc-500">{t(locale, "demoGeneticGen")}</dt>
              <dd>{gen}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t(locale, "demoGeneticBest")}</dt>
              <dd>{best.fitness.toFixed(3)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t(locale, "demoGeneticMean")}</dt>
              <dd>{meanFitness(pop).toFixed(3)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">x, y</dt>
              <dd>
                {best.x.toFixed(2)}, {best.y.toFixed(2)}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-zinc-500">{t(locale, "demoGeneticFormula")}</p>
        </div>
      </div>
    </div>
  );
}
