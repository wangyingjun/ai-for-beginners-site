"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExpCanvas, Slider, StatusPill, btnSecondary, isDark } from "@/components/lesson/ui";
import { makeSamples, polyEval, polyFit, polyMse } from "@/lib/ml/polyfit";

export type OverfitState = {
  degree: number;
  trainErr: number;
  valErr: number;
  showVal: boolean;
  moreData: boolean;
  visited: number[];
  /** valErr is within 25% of the best degree's validation error */
  nearBestVal: boolean;
};

const MAXD = 9;
const VAL = makeSamples(12, 29);
const TRAIN_FEW = makeSamples(8, 11);
const TRAIN_MANY = makeSamples(20, 11);
const GREEN = "#059669";

export function OverfitExperiment({
  controls = false,
  onState,
}: {
  /** Show the 考试题 toggle, 更多练习题 button and error chart. */
  controls?: boolean;
  onState?: (s: OverfitState) => void;
}) {
  const [degree, setDegree] = useState(1);
  const [showVal, setShowVal] = useState(false);
  const [moreData, setMoreData] = useState(false);
  const [visited, setVisited] = useState<number[]>([1]);
  const train = moreData ? TRAIN_MANY : TRAIN_FEW;
  const table = useMemo(
    () =>
      Array.from({ length: MAXD }, (_, i) => {
        const c = polyFit(train, i + 1);
        return { c, tr: polyMse(c, train), va: polyMse(c, VAL) };
      }),
    [train],
  );
  const cur = table[degree - 1];
  const minVal = Math.min(...table.map((t) => t.va));
  const nearBestVal = cur.va <= minVal * 1.25;

  useEffect(() => {
    onState?.({ degree, trainErr: cur.tr, valErr: cur.va, showVal, moreData, visited, nearBestVal });
  }, [degree, cur, showVal, moreData, visited, nearBestVal, onState]);

  const changeDegree = (d: number) => {
    setDegree(d);
    setVisited((v) => (v.includes(d) ? v : [...v, d]));
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const dark = isDark();
      const sx = (x: number) => ((x + 1) / 2) * w;
      const sy = (y: number) => h / 2 - (y / 1.7) * (h / 2);
      ctx.strokeStyle = dark ? "#27272a" : "#e4e4e7";
      ctx.beginPath();
      ctx.moveTo(0, sy(0));
      ctx.lineTo(w, sy(0));
      ctx.stroke();
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.clip();
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const x = -1 + (2 * i) / 200;
        const y = Math.max(-5, Math.min(5, polyEval(cur.c, x)));
        if (i === 0) ctx.moveTo(sx(x), sy(y));
        else ctx.lineTo(sx(x), sy(y));
      }
      ctx.stroke();
      ctx.restore();
      for (const p of train) {
        ctx.fillStyle = dark ? "#f4f4f5" : "#18181b";
        ctx.beginPath();
        ctx.arc(sx(p.x), sy(p.y), 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (showVal) {
        for (const p of VAL) {
          ctx.strokeStyle = GREEN;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(sx(p.x), sy(p.y), 5.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    },
    [cur, train, showVal],
  );

  const drawChart = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const dark = isDark();
      const maxE = 0.4;
      const bw = w / MAXD;
      const base = h - 16;
      for (let i = 0; i < MAXD; i++) {
        const d = i + 1;
        const t = table[i];
        const x = i * bw;
        if (visited.includes(d)) {
          const th = (Math.min(t.tr, maxE) / maxE) * (base - 6);
          const vh = (Math.min(t.va, maxE) / maxE) * (base - 6);
          ctx.fillStyle = dark ? "#a1a1aa" : "#52525b";
          ctx.fillRect(x + bw * 0.15, base - th, bw * 0.3, th);
          if (showVal) {
            ctx.fillStyle = GREEN;
            ctx.fillRect(x + bw * 0.5, base - vh, bw * 0.3, vh);
          }
        }
        ctx.fillStyle = d === degree ? "#6366f1" : dark ? "#71717a" : "#a1a1aa";
        ctx.font = d === degree ? "bold 12px system-ui" : "11px system-ui";
        ctx.fillText(String(d), x + bw / 2 - 3, h - 3);
      }
    },
    [table, visited, showVal, degree],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill ok={cur.tr < 0.01}>练习误差：{cur.tr.toFixed(3)}</StatusPill>
        {showVal && (
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
            考试误差：{cur.va.toFixed(3)}
          </span>
        )}
      </div>
      <ExpCanvas draw={draw} version={`${degree}|${showVal}|${moreData}`} aspect={0.7} ariaLabel="散点和一条可以调弯曲程度的曲线" />
      <p className="text-xs text-zinc-500">
        ● 黑点 = 练习题（拿来学的）{showVal && <>；<span className="font-semibold text-emerald-600">○ 绿圈</span> = 考试题（学的时候没见过）</>}
      </p>
      <Slider label="弯曲程度" value={degree} min={1} max={MAXD} step={1} onChange={changeDegree} format={(v) => String(v)} />
      {controls && (
        <>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnSecondary} onClick={() => setShowVal((s) => !s)}>
              {showVal ? "隐藏考试题" : "显示考试题"}
            </button>
            <button type="button" className={btnSecondary} onClick={() => setMoreData((m) => !m)}>
              {moreData ? "练习题减回 8 个" : "多给点练习题（20 个）"}
            </button>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-zinc-500">
              每个弯曲程度的误差（拖到过才显示）：灰柱 = 练习误差{showVal && "，绿柱 = 考试误差"}
            </p>
            <ExpCanvas draw={drawChart} version={`${visited.join(",")}|${showVal}|${moreData}|${degree}`} aspect={0.35} ariaLabel="不同弯曲程度下的练习误差和考试误差柱状图" />
          </div>
        </>
      )}
    </div>
  );
}
