"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CART,
  act,
  createPolicy,
  heuristicAction,
  reinforceUpdate,
  resetCart,
  runEpisode,
  stepCart,
  type CartAction,
  type CartState,
  type Policy,
} from "@/lib/ml/cartpole";
import { t, type Locale } from "@/lib/i18n";

const W = 360;
const H = 200;

type Mode = "manual" | "heuristic" | "policy";

export function CartPoleDemo({
  locale,
  showFullscreenLink = true,
}: {
  locale: Locale;
  showFullscreenLink?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const curveRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<CartState>(() => resetCart());
  const [mode, setMode] = useState<Mode>("heuristic");
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(0);
  const [policy, setPolicy] = useState<Policy>(() => createPolicy());
  const [curve, setCurve] = useState<number[]>([]);
  const [training, setTraining] = useState(false);
  const stateRef = useRef(state);
  const modeRef = useRef(mode);
  const policyRef = useRef(policy);
  const stepsRef = useRef(0);
  stateRef.current = state;
  modeRef.current = mode;
  policyRef.current = policy;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    ctx.fillStyle = dark ? "#18181b" : "#fafafa";
    ctx.fillRect(0, 0, W, H);

    // Track
    const yTrack = H - 40;
    ctx.strokeStyle = dark ? "#52525b" : "#a1a1aa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, yTrack);
    ctx.lineTo(W - 20, yTrack);
    ctx.stroke();

    const scale = (W - 60) / (2 * CART.xThreshold);
    const cx = W / 2 + state.x * scale;
    const cartW = 50;
    const cartH = 24;

    ctx.fillStyle = "#4f46e5";
    ctx.fillRect(cx - cartW / 2, yTrack - cartH, cartW, cartH);

    // Pole
    const poleLen = 90;
    const px = cx + Math.sin(state.theta) * poleLen;
    const py = yTrack - cartH - Math.cos(state.theta) * poleLen;
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, yTrack - cartH);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
  }, [state]);

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
    if (curve.length < 2) return;
    const max = Math.max(...curve, 1);
    ctx.strokeStyle = "#16a34a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    curve.forEach((v, i) => {
      const x = (i / Math.max(1, curve.length - 1)) * (w - 8) + 4;
      const y = h - 4 - (v / max) * (h - 8);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [curve]);

  useEffect(() => {
    draw();
  }, [draw]);
  useEffect(() => {
    drawCurve();
  }, [drawCurve]);

  const tick = useCallback((action: CartAction) => {
    const { state: next, done } = stepCart(stateRef.current, action);
    stepsRef.current += 1;
    setSteps(stepsRef.current);
    if (done) {
      setRunning(false);
      setState(next);
      return;
    }
    setState(next);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const m = modeRef.current;
      let action: CartAction = 1;
      if (m === "heuristic") action = heuristicAction(stateRef.current);
      else if (m === "policy") action = act(policyRef.current, stateRef.current, false);
      else action = stateRef.current.theta >= 0 ? 1 : -1;
      tick(action);
    }, 30);
    return () => window.clearInterval(id);
  }, [running, tick]);

  function hardReset() {
    setRunning(false);
    stepsRef.current = 0;
    setSteps(0);
    setState(resetCart());
  }

  function trainBatch() {
    setTraining(true);
    let p = policyRef.current;
    const scores: number[] = [];
    for (let i = 0; i < 25; i++) {
      const ep = runEpisode(p, 400, true);
      p = reinforceUpdate(p, ep, 0.008);
      scores.push(ep.steps);
    }
    setPolicy(p);
    policyRef.current = p;
    setCurve((c) => [...c, ...scores].slice(-200));
    setTraining(false);
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{t(locale, "demoCartTitle")}</h3>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">{t(locale, "demoCartHint")}</p>
        </div>
        {showFullscreenLink && (
          <a
            href={`/demos/cartpole?lang=${locale}`}
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
            width={W}
            height={H}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700"
            aria-label={t(locale, "demoCartCanvasAria")}
          />
          <canvas
            ref={curveRef}
            width={280}
            height={80}
            className="rounded border border-zinc-200 dark:border-zinc-700"
            aria-label={t(locale, "demoCartCurveAria")}
          />
          <p className="text-xs text-zinc-500">{t(locale, "demoCartCurveLabel")}</p>
        </div>

        <div className="min-w-0 flex-1 space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["manual", "demoCartManual"],
                ["heuristic", "demoCartHeuristic"],
                ["policy", "demoCartPolicy"],
              ] as const
            ).map(([m, key]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  mode === m
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                }`}
              >
                {t(locale, key)}
              </button>
            ))}
          </div>

          {mode === "manual" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => tick(-1)}
                className="rounded-md bg-zinc-100 px-4 py-2 dark:bg-zinc-800"
              >
                ← {t(locale, "demoCartLeft")}
              </button>
              <button
                type="button"
                onClick={() => tick(1)}
                className="rounded-md bg-zinc-100 px-4 py-2 dark:bg-zinc-800"
              >
                {t(locale, "demoCartRight")} →
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!running) {
                  if (stepsRef.current > 0 && !running) {
                    /* continue */
                  }
                }
                setRunning((r) => !r);
              }}
              className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500"
            >
              {running ? t(locale, "demoPause") : t(locale, "demoAuto")}
            </button>
            <button
              type="button"
              onClick={hardReset}
              className="rounded-md bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800"
            >
              {t(locale, "demoCartReset")}
            </button>
            <button
              type="button"
              disabled={training}
              onClick={trainBatch}
              className="rounded-md border border-emerald-600 px-3 py-1.5 font-medium text-emerald-700 disabled:opacity-50 dark:text-emerald-300"
            >
              {training ? "…" : t(locale, "demoCartTrain")}
            </button>
            <button
              type="button"
              onClick={() => {
                setPolicy(createPolicy());
                setCurve([]);
              }}
              className="rounded-md bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800"
            >
              {t(locale, "demoResetWeights")}
            </button>
          </div>

          <dl className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-50 p-3 font-mono text-xs dark:bg-zinc-900">
            <div>
              <dt className="text-zinc-500">{t(locale, "demoCartSteps")}</dt>
              <dd>{steps}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">θ</dt>
              <dd>{((state.theta * 180) / Math.PI).toFixed(1)}°</dd>
            </div>
            <div>
              <dt className="text-zinc-500">x</dt>
              <dd>{state.x.toFixed(3)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t(locale, "demoCartEpisodes")}</dt>
              <dd>{curve.length}</dd>
            </div>
          </dl>
          <p className="text-xs text-zinc-500">{t(locale, "demoCartNote")}</p>
        </div>
      </div>
    </div>
  );
}
