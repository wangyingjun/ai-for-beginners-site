"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { COLORS, ExpCanvas, Slider, StatusPill, btnPrimary, btnSecondary, isDark } from "@/components/lesson/ui";

/** Valley: loss(w) = (w − 3)², gradient 2(w − 3). Diverges when lr > 1. */
const TARGET = 3;
const W0 = -0.6;
const lossAt = (w: number) => (w - TARGET) ** 2;
const grad = (w: number) => 2 * (w - TARGET);
const VIEW = { w0: -2, w1: 8, l1: 26 };

export type GdRun = { lr: number; steps: number; result: "bottom" | "flew" | "running" };
export type GdState = {
  w: number;
  loss: number;
  lr: number;
  steps: number;
  atBottom: boolean;
  flew: boolean;
  /** sign changes of (w − 3) in this run = "zig-zag" count */
  zigzags: number;
  runs: GdRun[];
};

export function GdExperiment({
  showLr = false,
  initialLr = 0.1,
  onState,
}: {
  showLr?: boolean;
  initialLr?: number;
  onState?: (s: GdState) => void;
}) {
  const [w, setW] = useState(W0);
  const [lr, setLr] = useState(initialLr);
  const [steps, setSteps] = useState(0);
  const [trail, setTrail] = useState<number[]>([W0]);
  const [zigzags, setZigzags] = useState(0);
  const [auto, setAuto] = useState(false);
  const runIdRef = useRef(0);
  const stepsRef = useRef(0);
  const [runMap, setRunMap] = useState<Record<number, GdRun>>({});
  const runs = Object.keys(runMap)
    .map(Number)
    .sort((x, y) => x - y)
    .slice(-10)
    .map((k) => runMap[k]);
  const loss = lossAt(w);
  const atBottom = loss < 0.01;
  const flew = Math.abs(w - TARGET) > 12;
  const wRef = useRef(w);
  useEffect(() => {
    wRef.current = w;
  }, [w]);

  useEffect(() => {
    onState?.({ w, loss, lr, steps, atBottom, flew, zigzags, runs });
  }, [w, loss, lr, steps, atBottom, flew, zigzags, runs, onState]);

  const step = useCallback(() => {
    const cur = wRef.current;
    if (Math.abs(cur - TARGET) > 12) return;
    const nw = cur - lr * grad(cur);
    wRef.current = nw;
    setW(nw);
    stepsRef.current += 1;
    const n = stepsRef.current;
    setSteps(n);
    const result: GdRun["result"] = lossAt(nw) < 0.01 ? "bottom" : Math.abs(nw - TARGET) > 12 ? "flew" : "running";
    const id = runIdRef.current;
    setRunMap((m) => ({ ...m, [id]: { lr, steps: n, result } }));
    setTrail((t) => [...t.slice(-40), nw]);
    if (Math.sign(nw - TARGET) !== Math.sign(cur - TARGET) && Math.abs(nw - TARGET) > 0.05) setZigzags((z) => z + 1);
  }, [lr]);

  useEffect(() => {
    if (!auto) return;
    if (atBottom || flew || steps >= 150) {
      const t = window.setTimeout(() => setAuto(false), 0);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(step, 260);
    return () => window.clearTimeout(t);
  }, [auto, atBottom, flew, steps, step]);

  const reset = () => {
    setAuto(false);
    wRef.current = W0;
    setW(W0);
    setSteps(0);
    stepsRef.current = 0;
    setTrail([W0]);
    setZigzags(0);
    runIdRef.current += 1;
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, cw: number, ch: number) => {
      const dark = isDark();
      const sx = (v: number) => ((v - VIEW.w0) / (VIEW.w1 - VIEW.w0)) * cw;
      const sy = (l: number) => ch - 18 - (l / VIEW.l1) * (ch - 30);
      // valley
      ctx.fillStyle = dark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)";
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const v = VIEW.w0 + ((VIEW.w1 - VIEW.w0) * i) / 120;
        const y = sy(Math.min(lossAt(v), VIEW.l1 + 4));
        if (i === 0) ctx.moveTo(sx(v), y);
        else ctx.lineTo(sx(v), y);
      }
      ctx.stroke();
      // bottom flag
      ctx.fillStyle = "#10b981";
      ctx.font = "12px system-ui";
      ctx.fillText("谷底", sx(TARGET) - 12, ch - 4);
      // trail
      for (let i = 1; i < trail.length; i++) {
        const p = trail[i - 1];
        const q = trail[i];
        if (Math.abs(q - TARGET) > 6 || Math.abs(p - TARGET) > 6) continue;
        ctx.strokeStyle = "rgba(245,158,11,0.6)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(sx(p), sy(lossAt(p)) - 8);
        ctx.quadraticCurveTo((sx(p) + sx(q)) / 2, Math.min(sy(lossAt(p)), sy(lossAt(q))) - 30, sx(q), sy(lossAt(q)) - 8);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // ball
      const inView = w >= VIEW.w0 && w <= VIEW.w1 && lossAt(w) <= VIEW.l1;
      if (inView) {
        const bx = sx(w);
        const by = sy(lossAt(w)) - 9;
        // tangent (slope) in yellow
        const g = grad(w);
        const dw = 0.9;
        ctx.strokeStyle = COLORS.yellow;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sx(w - dw), sy(lossAt(w) - g * dw));
        ctx.lineTo(sx(w + dw), sy(lossAt(w) + g * dw));
        ctx.stroke();
        ctx.fillStyle = dark ? "#f4f4f5" : "#18181b";
        ctx.beginPath();
        ctx.arc(bx, by, 9, 0, Math.PI * 2);
        ctx.fill();
        // arrow: where the next step goes
        if (!atBottom) {
          const nw = w - lr * g;
          const ax = Math.max(4, Math.min(cw - 4, sx(nw)));
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx, by - 16);
          ctx.lineTo(ax, by - 16);
          ctx.stroke();
          ctx.beginPath();
          const dir = Math.sign(ax - bx) || 1;
          ctx.moveTo(ax, by - 16);
          ctx.lineTo(ax - dir * 7, by - 21);
          ctx.lineTo(ax - dir * 7, by - 11);
          ctx.closePath();
          ctx.fillStyle = "#10b981";
          ctx.fill();
        }
      } else {
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 15px system-ui";
        const msg = "小球飞出山谷了！";
        ctx.fillText(msg, cw / 2 - ctx.measureText(msg).width / 2, 26);
      }
      ctx.fillStyle = dark ? "#a1a1aa" : "#71717a";
      ctx.font = "11px system-ui";
      ctx.fillText("↑ 误差", 4, 12);
      ctx.fillText("斜率 w →", cw - 52, ch - 4);
    },
    [w, trail, lr, atBottom],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill ok={atBottom}>
          {flew ? "飞出去了" : atBottom ? "到谷底了！" : `误差：${loss.toFixed(3)}`}
        </StatusPill>
        <span className="text-sm text-zinc-500">已走 {steps} 步</span>
      </div>
      <ExpCanvas
        draw={draw}
        version={`${w}|${lr}|${trail.length}`}
        aspect={0.7}
        ariaLabel="一条山谷形的误差曲线，小球沿着坡往下走"
      />
      <p className="text-xs text-zinc-500">
        <span className="font-semibold text-amber-600">黄线</span> = 脚下的坡度；
        <span className="font-semibold text-emerald-600">绿箭头</span> = 下一步会落在哪。
      </p>
      {showLr && (
        <Slider label="步子大小（学习率）" value={lr} min={0.01} max={1.1} step={0.01} onChange={(v) => setLr(v)} />
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={step} disabled={atBottom || flew || auto}>
          走一步
        </button>
        <button type="button" className={btnSecondary} onClick={() => setAuto((x) => !x)} disabled={atBottom || flew}>
          {auto ? "暂停" : "自动走"}
        </button>
        <button type="button" className={btnSecondary} onClick={reset}>
          小球放回起点
        </button>
      </div>
      {runs.length > 0 && showLr && (
        <ul className="space-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
          {runs.map((r, i) => (
            <li key={i}>
              第 {i + 1} 次：步子 {r.lr.toFixed(2)} → {r.result === "bottom" ? `${r.steps} 步到谷底` : r.result === "flew" ? `${r.steps} 步后飞出去` : `走了 ${r.steps} 步，还没到`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
