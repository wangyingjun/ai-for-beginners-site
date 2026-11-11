"use client";

import { useEffect, useRef, useState } from "react";
import { ExpCanvas, Slider, StatusPill, chip, isDark } from "@/components/lesson/ui";

export type Box = { x0: number; y0: number; x1: number; y1: number };
const ASPECT = 0.75;
/** Ground-truth boxes in [0,1]² canvas units (square in pixels). */
export const TRUTH: Record<"猫" | "狗", Box> = {
  猫: { x0: 0.08, y0: 0.4, x1: 0.4, y1: 0.4 + 0.32 / ASPECT },
  狗: { x0: 0.52, y0: 0.3, x1: 0.92, y1: 0.3 + 0.4 / ASPECT },
};
const CANDS: { label: "猫" | "狗"; score: number; box: Box }[] = [
  { label: "猫", score: 0.92, box: { x0: 0.09, y0: 0.41, x1: 0.41, y1: 0.84 } },
  { label: "猫", score: 0.61, box: { x0: 0.17, y0: 0.5, x1: 0.48, y1: 0.88 } },
  { label: "狗", score: 0.83, box: { x0: 0.51, y0: 0.29, x1: 0.9, y1: 0.85 } },
  { label: "狗", score: 0.34, box: { x0: 0.03, y0: 0.03, x1: 0.22, y1: 0.3 } },
];

const area = (b: Box) => Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0);
export function iou(a: Box, b: Box): number {
  const i = area({ x0: Math.max(a.x0, b.x0), y0: Math.max(a.y0, b.y0), x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1) });
  const u = area(a) + area(b) - i;
  return u > 0 ? i / u : 0;
}
const norm = (b: Box): Box => ({ x0: Math.min(b.x0, b.x1), y0: Math.min(b.y0, b.y1), x1: Math.max(b.x0, b.x1), y1: Math.max(b.y0, b.y1) });

export type DetectState = { iouCat: number; iouDog: number; drawn: boolean; area: number; coversCat: boolean; showModel: boolean; keptOk: boolean; kept: number };

function drawCat(ctx: CanvasRenderingContext2D, b: Box, w: number, h: number) {
  const cx = ((b.x0 + b.x1) / 2) * w, s = (b.x1 - b.x0) * w, top = b.y0 * h;
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath(); ctx.ellipse(cx, top + s * 0.72, s * 0.48, s * 0.27, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, top + s * 0.36, s * 0.22, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.2, top + s * 0.28); ctx.lineTo(cx - s * 0.16, top + s * 0.04); ctx.lineTo(cx - s * 0.04, top + s * 0.18); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + s * 0.2, top + s * 0.28); ctx.lineTo(cx + s * 0.16, top + s * 0.04); ctx.lineTo(cx + s * 0.04, top + s * 0.18); ctx.fill();
  ctx.fillStyle = "#18181b";
  ctx.beginPath(); ctx.arc(cx - s * 0.08, top + s * 0.34, s * 0.03, 0, Math.PI * 2); ctx.arc(cx + s * 0.08, top + s * 0.34, s * 0.03, 0, Math.PI * 2); ctx.fill();
}
function drawDog(ctx: CanvasRenderingContext2D, b: Box, w: number, h: number) {
  const cx = ((b.x0 + b.x1) / 2) * w, s = (b.x1 - b.x0) * w, top = b.y0 * h;
  ctx.fillStyle = "#92400e";
  ctx.beginPath(); ctx.ellipse(cx, top + s * 0.72, s * 0.49, s * 0.27, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#b45309";
  ctx.beginPath(); ctx.arc(cx, top + s * 0.33, s * 0.24, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#78350f";
  ctx.beginPath(); ctx.ellipse(cx - s * 0.24, top + s * 0.34, s * 0.07, s * 0.16, 0.3, 0, Math.PI * 2); ctx.ellipse(cx + s * 0.24, top + s * 0.34, s * 0.07, s * 0.16, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#18181b";
  ctx.beginPath(); ctx.arc(cx - s * 0.08, top + s * 0.3, s * 0.03, 0, Math.PI * 2); ctx.arc(cx + s * 0.08, top + s * 0.3, s * 0.03, 0, Math.PI * 2); ctx.arc(cx, top + s * 0.42, s * 0.04, 0, Math.PI * 2); ctx.fill();
}

export function DetectExperiment({ controls = false, onState }: { controls?: boolean; onState?: (s: DetectState) => void }) {
  const [box, setBox] = useState<Box | null>(null);
  const [dragBox, setDragBox] = useState<Box | null>(null);
  const [showModel, setShowModel] = useState(false);
  const [th, setTh] = useState(0.3);
  const startRef = useRef<{ u: number; v: number } | null>(null);

  const b = box ? norm(box) : null;
  const iouCat = b ? iou(b, TRUTH.猫) : 0;
  const iouDog = b ? iou(b, TRUTH.狗) : 0;
  const a = b ? area(b) : 0;
  const coversCat = !!b && b.x0 <= TRUTH.猫.x0 && b.y0 <= TRUTH.猫.y0 && b.x1 >= TRUTH.猫.x1 && b.y1 >= TRUTH.猫.y1;
  const keptIdx = CANDS.map((c, i) => (c.score >= th ? i : -1)).filter((i) => i >= 0);
  const keptOk = keptIdx.length === 2 && keptIdx[0] === 0 && keptIdx[1] === 2;

  useEffect(() => {
    onState?.({ iouCat, iouDog, drawn: !!box, area: a, coversCat, showModel, keptOk, kept: keptIdx.length });
  }, [iouCat, iouDog, box, a, coversCat, showModel, keptOk, keptIdx.length, onState]);

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const dark = isDark();
    ctx.fillStyle = dark ? "#14532d" : "#dcfce7";
    ctx.fillRect(0, h * 0.82, w, h * 0.18);
    // a little tree
    ctx.fillStyle = "#15803d";
    ctx.beginPath(); ctx.arc(w * 0.12, h * 0.14, w * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#78350f";
    ctx.fillRect(w * 0.11, h * 0.2, w * 0.02, h * 0.1);
    drawCat(ctx, TRUTH.猫, w, h);
    drawDog(ctx, TRUTH.狗, w, h);
    const rect = (bb: Box, color: string, dash: number[], lw = 2) => {
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash);
      ctx.strokeRect(bb.x0 * w, bb.y0 * h, (bb.x1 - bb.x0) * w, (bb.y1 - bb.y0) * h);
      ctx.setLineDash([]);
    };
    ctx.font = "12px system-ui, sans-serif";
    if (showModel)
      for (const i of keptIdx) {
        const c = CANDS[i];
        rect(c.box, "#7c3aed", [], 2);
        const label = `${c.label} ${Math.round(c.score * 100)}%`;
        ctx.fillStyle = "#7c3aed";
        ctx.fillRect(c.box.x0 * w, c.box.y0 * h, ctx.measureText(label).width + 8, 16);
        ctx.fillStyle = "#fff";
        ctx.fillText(label, c.box.x0 * w + 4, c.box.y0 * h + 12);
      }
    if (b) {
      rect(TRUTH.猫, "#059669", [5, 4]);
      rect(TRUTH.狗, "#059669", [5, 4]);
    }
    const cur = dragBox ? norm(dragBox) : b;
    if (cur) rect(cur, "#4f46e5", [], 3);
  };

  return (
    <div className="space-y-3">
      <StatusPill ok={iouCat >= 0.5 || iouDog >= 0.5}>
        {b ? `你的框和标准框的重合度：猫 ${iouCat.toFixed(2)} · 狗 ${iouDog.toFixed(2)}` : "在图上按住拖动，画一个框"}
      </StatusPill>
      <ExpCanvas
        draw={draw}
        version={`${JSON.stringify(dragBox)}-${JSON.stringify(box)}-${showModel}-${th}`}
        aspect={ASPECT}
        ariaLabel="画框的图片：一只猫和一只狗"
        onPointer={(u, v, kind) => {
          if (kind === "down") {
            startRef.current = { u, v };
            setDragBox({ x0: u, y0: v, x1: u, y1: v });
          } else if (kind === "move" && startRef.current) {
            setDragBox({ x0: startRef.current.u, y0: startRef.current.v, x1: u, y1: v });
          } else if (kind === "up" && startRef.current) {
            const nb = { x0: startRef.current.u, y0: startRef.current.v, x1: u, y1: v };
            startRef.current = null;
            setDragBox(null);
            if (Math.abs(nb.x1 - nb.x0) > 0.03 && Math.abs(nb.y1 - nb.y0) > 0.03) setBox(nb);
          }
        }}
      />
      <p className="text-xs text-zinc-500">
        <span className="font-semibold text-indigo-600">实线框 = 你画的</span>；画完后出现 <span className="font-semibold text-emerald-600">绿色虚线 = 标准答案</span>。重合度 = 两个框重叠的面积 ÷ 两个框合起来的面积，1 = 完全一样。
      </p>
      {controls && (
        <div className="space-y-2">
          <button type="button" className={chip(showModel)} onClick={() => setShowModel((x) => !x)}>
            {showModel ? "隐藏模型找到的框" : "显示模型找到的框"}
          </button>
          {showModel && (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                <span className="font-semibold text-violet-600">紫框</span> = 模型找到的框和它的把握。现在显示了 {keptIdx.length} 个框。
              </p>
              <Slider label="只显示把握 ≥" value={th} min={0} max={1} step={0.05} onChange={setTh} format={(v) => `${Math.round(v * 100)}%`} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
