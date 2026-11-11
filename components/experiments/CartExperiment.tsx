"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExpCanvas, StatusPill, btnPrimary, btnSecondary, chip, isDark } from "@/components/lesson/ui";
import { CART, act, resetCart, runEpisode, stepCart, type CartAction, type CartState, type Policy } from "@/lib/ml/cartpole";

export type CartExpState = {
  manualEpisodes: number;
  manualBest: number;
  trials: number;
  best: number;
  zeroRewardTrials: number;
  watched: number;
};

const MAX = 500;
const scorePolicy = (p: Policy) => Math.min(runEpisode(p, MAX, false).steps, runEpisode(p, MAX, false).steps);

export function CartExperiment({
  agent = false,
  onState,
}: {
  agent?: boolean;
  onState?: (s: CartExpState) => void;
}) {
  const [cart, setCart] = useState<CartState>({ x: 0, xDot: 0, theta: 0.02, thetaDot: 0 });
  const [steps, setSteps] = useState(0);
  const [mode, setMode] = useState<"idle" | "manual" | "watch">("idle");
  const [manualEpisodes, setManualEpisodes] = useState(0);
  const [manualBest, setManualBest] = useState(0);
  const [zeroReward, setZeroReward] = useState(false);
  const [trials, setTrials] = useState<number[]>([]);
  const [best, setBest] = useState<{ p: Policy; s: number } | null>(null);
  const [zeroRewardTrials, setZeroRewardTrials] = useState(0);
  const [watched, setWatched] = useState(0);
  const dirRef = useRef<0 | -1 | 1>(0);
  const cartRef = useRef(cart);
  const stepsRef = useRef(0);
  const bestRef = useRef(best);
  useEffect(() => {
    bestRef.current = best;
  }, [best]);

  useEffect(() => {
    onState?.({ manualEpisodes, manualBest, trials: trials.length, best: best?.s ?? 0, zeroRewardTrials, watched });
  }, [manualEpisodes, manualBest, trials, best, zeroRewardTrials, watched, onState]);

  const startEpisode = (m: "manual" | "watch") => {
    const s = resetCart();
    cartRef.current = s;
    stepsRef.current = 0;
    setCart(s);
    setSteps(0);
    setMode(m);
  };

  useEffect(() => {
    if (mode === "idle") return;
    const id = window.setInterval(() => {
      const a: CartAction =
        mode === "watch" && bestRef.current ? act(bestRef.current.p, cartRef.current) : (dirRef.current as CartAction);
      const r = stepCart(cartRef.current, a);
      cartRef.current = r.state;
      stepsRef.current += 1;
      setCart(r.state);
      setSteps(stepsRef.current);
      if (r.done || stepsRef.current >= MAX) {
        const n = stepsRef.current;
        if (mode === "manual") {
          setManualEpisodes((e) => e + 1);
          setManualBest((b) => Math.max(b, n));
        } else setWatched((w) => w + 1);
        setMode("idle");
      }
    }, mode === "manual" ? 45 : 20);
    return () => window.clearInterval(id);
  }, [mode]);

  const tryTen = () => {
    const out: number[] = [];
    let cur = best;
    for (let i = 0; i < 10; i++) {
      const cand: Policy =
        cur && Math.random() < 0.6
          ? { weights: cur.p.weights.map((w) => w + (Math.random() - 0.5) * 0.6) }
          : { weights: Array.from({ length: 5 }, (_, k) => (k === 4 ? 0 : Math.random() * 2 - 1)) };
      const s = scorePolicy(cand);
      const reward = zeroReward ? 0 : s;
      out.push(s);
      if (!zeroReward && (!cur || reward > cur.s)) cur = { p: cand, s };
      if (zeroReward && !cur) cur = null;
    }
    setTrials((t) => [...t, ...out].slice(-60));
    if (zeroReward) setZeroRewardTrials((n) => n + 10);
    else setBest(cur);
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const dark = isDark();
      const ground = h - 30;
      const scale = w / (CART.xThreshold * 2 + 0.6);
      const cx = w / 2 + cart.x * scale;
      ctx.strokeStyle = dark ? "#52525b" : "#a1a1aa";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, ground);
      ctx.lineTo(w, ground);
      ctx.stroke();
      ctx.fillStyle = "#6366f1";
      ctx.fillRect(cx - 28, ground - 22, 56, 22);
      const len = h * 0.55;
      const tilt = Math.abs(cart.theta) / CART.thetaThreshold;
      ctx.strokeStyle = tilt > 0.7 ? "#f59e0b" : dark ? "#f4f4f5" : "#18181b";
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, ground - 22);
      ctx.lineTo(cx + Math.sin(cart.theta) * len, ground - 22 - Math.cos(cart.theta) * len);
      ctx.stroke();
      ctx.fillStyle = dark ? "#a1a1aa" : "#71717a";
      ctx.font = "12px system-ui";
      ctx.fillText(`奖励：${steps}`, 8, 18);
    },
    [cart, steps],
  );

  const setDir = useCallback((d: 0 | -1 | 1) => {
    dirRef.current = d;
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <StatusPill ok={steps >= 200}>{mode === "idle" ? (steps ? `这一局坚持了 ${steps} 步` : "准备好了") : `坚持中：${steps} 步`}</StatusPill>
      </div>
      <ExpCanvas draw={draw} version={`${steps}|${cart.x}`} aspect={0.55} ariaLabel="平衡小车：推小车让杆子不倒" />
      <p className="text-xs text-zinc-500">杆子每多立住一步，奖励 +1；杆子倒了（超过 12°）或车出界，这一局结束。</p>
      {!agent && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btnPrimary} onClick={() => startEpisode("manual")} disabled={mode !== "idle"}>
            {manualEpisodes ? "再来一局" : "开始（慢动作）"}
          </button>
          <button type="button" className={`${btnSecondary} min-w-20 touch-none select-none text-lg`} onPointerDown={(e) => { e.preventDefault(); setDir(-1); }} onPointerUp={() => setDir(0)} onPointerLeave={() => setDir(0)} onPointerCancel={() => setDir(0)} aria-label="按住向左推">
            ← 推
          </button>
          <button type="button" className={`${btnSecondary} min-w-20 touch-none select-none text-lg`} onPointerDown={(e) => { e.preventDefault(); setDir(1); }} onPointerUp={() => setDir(0)} onPointerLeave={() => setDir(0)} onPointerCancel={() => setDir(0)} aria-label="按住向右推">
            推 →
          </button>
        </div>
      )}
      {agent && (
        <>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={tryTen} disabled={mode !== "idle"}>
              让 AI 自己试 10 局
            </button>
            <button type="button" className={btnSecondary} onClick={() => startEpisode("watch")} disabled={!best || mode !== "idle"}>
              看最好的策略玩一局
            </button>
            <button type="button" className={chip(zeroReward)} onClick={() => setZeroReward((z) => !z)}>
              {zeroReward ? "恢复奖励" : "关掉奖励（每步 0 分）"}
            </button>
          </div>
          <div>
            <p className="mb-1 text-xs text-zinc-500">
              每一局的成绩（共 {trials.length} 局{best ? `，目前最好的策略：${best.s} 步` : ""}）
            </p>
            <div className="flex h-16 items-end gap-px">
              {trials.map((t, i) => (
                <div key={i} className="w-1.5 bg-indigo-500" style={{ height: `${Math.max(2, (t / MAX) * 100)}%` }} />
              ))}
            </div>
            {zeroReward && zeroRewardTrials > 0 && (
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">没有奖励，AI 分不出哪局好哪局坏，所以什么也学不到，「最好的策略」也不会更新。</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
