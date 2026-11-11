"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { COLORS, ExpCanvas, Slider, StatusPill, btnSecondary, isDark } from "@/components/lesson/ui";
import { LINE_POINTS, OUTLIER, bestLine, mse, type Pt } from "@/lib/ml/linefit";

export type LossState = {
  a: number;
  b: number;
  loss: number;
  best: number;
  outlier: boolean;
  /** min / max slope tried while intercept unchanged since last reset */
  slopeMin: number;
  slopeMax: number;
  moves: number;
};

const X0 = 0;
const X1 = 10;
const Y0 = -1;
const Y1 = 11;

export function LossExperiment({
  controls = { outlier: false, squares: false, history: false },
  onState,
}: {
  controls?: { outlier?: boolean; squares?: boolean; history?: boolean };
  onState?: (s: LossState) => void;
}) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(5);
  const [outlier, setOutlier] = useState(false);
  const [squares, setSquares] = useState(false);
  const [moves, setMoves] = useState(0);
  const [slopeRange, setSlopeRange] = useState<[number, number]>([0, 0]);
  const [tried, setTried] = useState<{ a: number; loss: number }[]>([]);

  const points: Pt[] = useMemo(() => (outlier ? [...LINE_POINTS, OUTLIER] : LINE_POINTS), [outlier]);
  const loss = mse(points, a, b);
  const best = useMemo(() => bestLine(points).loss, [points]);

  useEffect(() => {
    onState?.({ a, b, loss, best, outlier, slopeMin: slopeRange[0], slopeMax: slopeRange[1], moves });
  }, [a, b, loss, best, outlier, slopeRange, moves, onState]);

  const changeA = (v: number) => {
    setA(v);
    setMoves((m) => m + 1);
    setSlopeRange(([lo, hi]) => [Math.min(lo, v), Math.max(hi, v)]);
    setTried((t) => [...t.slice(-80), { a: v, loss: mse(points, v, b) }]);
  };
  const changeB = (v: number) => {
    setB(v);
    setMoves((m) => m + 1);
    setSlopeRange([a, a]);
    setTried([]);
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const dark = isDark();
      const sx = (x: number) => ((x - X0) / (X1 - X0)) * w;
      const sy = (y: number) => h - ((y - Y0) / (Y1 - Y0)) * h;
      // grid
      ctx.strokeStyle = dark ? "#27272a" : "#e4e4e7";
      ctx.lineWidth = 1;
      for (let g = 0; g <= 10; g += 2) {
        ctx.beginPath();
        ctx.moveTo(sx(g), 0);
        ctx.lineTo(sx(g), h);
        ctx.moveTo(0, sy(g));
        ctx.lineTo(w, sy(g));
        ctx.stroke();
      }
      // error lines / squares
      for (const p of points) {
        const yh = a * p.x + b;
        if (squares) {
          const side = Math.abs(sy(p.y) - sy(yh));
          ctx.fillStyle = "rgba(245,158,11,0.18)";
          ctx.strokeStyle = "rgba(245,158,11,0.7)";
          const top = Math.min(sy(p.y), sy(yh));
          ctx.fillRect(sx(p.x), top, side, side);
          ctx.strokeRect(sx(p.x), top, side, side);
        }
        ctx.strokeStyle = COLORS.yellow;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx(p.x), sy(p.y));
        ctx.lineTo(sx(p.x), sy(yh));
        ctx.stroke();
      }
      // line
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx(X0), sy(a * X0 + b));
      ctx.lineTo(sx(X1), sy(a * X1 + b));
      ctx.stroke();
      // points
      for (const p of points) {
        const isOut = p === OUTLIER;
        ctx.fillStyle = isOut ? "#a855f7" : dark ? COLORS.inkDark : COLORS.ink;
        ctx.beginPath();
        ctx.arc(sx(p.x), sy(p.y), isOut ? 7 : 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = dark ? "#a1a1aa" : "#71717a";
      ctx.font = "12px system-ui";
      ctx.fillText("面积（㎡）→", w - 78, h - 6);
      ctx.fillText("↑ 房租", 4, 14);
    },
    [a, b, points, squares],
  );

  const drawHistory = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const dark = isDark();
      const maxL = 30;
      const sx = (v: number) => ((v + 1) / 3) * w;
      const sy = (l: number) => h - 6 - (Math.min(l, maxL) / maxL) * (h - 16);
      ctx.strokeStyle = dark ? "#3f3f46" : "#d4d4d8";
      ctx.beginPath();
      ctx.moveTo(0, h - 6);
      ctx.lineTo(w, h - 6);
      ctx.stroke();
      for (const t of tried) {
        ctx.fillStyle = COLORS.yellow;
        ctx.beginPath();
        ctx.arc(sx(t.a), sy(t.loss), 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#6366f1";
      ctx.beginPath();
      ctx.arc(sx(a), sy(loss), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = dark ? "#a1a1aa" : "#71717a";
      ctx.font = "11px system-ui";
      ctx.fillText("斜率 →", w - 44, h - 10);
      ctx.fillText("↑ 总误差", 4, 12);
    },
    [tried, a, loss],
  );

  const good = loss <= best * 1.3 + 0.05;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill ok={good}>总误差：{loss.toFixed(2)}</StatusPill>
        <span className="text-xs text-zinc-500">（每根黄线的长度平方后取平均；越小越好）</span>
      </div>
      <ExpCanvas draw={draw} version={`${a}|${b}|${outlier}|${squares}`} aspect={0.8} ariaLabel="房租和面积的散点图，一条可调的直线和黄色误差线" />
      <div className="space-y-2">
        <Slider label="斜率（线有多陡）" value={a} min={-1} max={2} step={0.05} onChange={changeA} />
        <Slider label="截距（线有多高）" value={b} min={-2} max={8} step={0.1} onChange={changeB} format={(v) => v.toFixed(1)} />
      </div>
      {(controls.outlier || controls.squares) && (
        <div className="flex flex-wrap gap-2">
          {controls.squares && (
            <button type="button" className={btnSecondary} onClick={() => setSquares((s) => !s)}>
              {squares ? "隐藏正方形" : "把误差画成正方形"}
            </button>
          )}
          {controls.outlier && (
            <button type="button" className={btnSecondary} onClick={() => { setOutlier((o) => !o); setTried([]); }}>
              {outlier ? "去掉怪点" : "加一个怪点（紫色）"}
            </button>
          )}
        </div>
      )}
      {controls.history && (
        <div className="space-y-1">
          <p className="text-xs text-zinc-500">误差记录：你试过的每个斜率（截距不变时）和它的总误差</p>
          <ExpCanvas draw={drawHistory} version={`${tried.length}|${a}|${b}`} aspect={0.4} ariaLabel="斜率与总误差的记录图" />
        </div>
      )}
    </div>
  );
}
