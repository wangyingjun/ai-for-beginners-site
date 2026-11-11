"use client";

import { useEffect, useMemo, useState } from "react";
import { btnPrimary, btnSecondary, chip } from "@/components/lesson/ui";

const W = 10;
const OUT = W - 2;

/** 10×10 brightness 0–9: a bright "house" on a dark background. */
const START: number[] = [
  "0000000000",
  "0000990000",
  "0009999000",
  "0099999900",
  "0999999990",
  "0099999900",
  "0099009900",
  "0099009900",
  "0099009900",
  "0000000000",
]
  .join("")
  .split("")
  .map(Number);

export type KernelId = "vertical" | "horizontal" | "blur" | "identity";
const KERNELS: Record<KernelId, { name: string; k: number[]; scale: number }> = {
  vertical: { name: "找竖边", k: [-1, 0, 1, -1, 0, 1, -1, 0, 1], scale: 27 },
  horizontal: { name: "找横边", k: [-1, -1, -1, 0, 0, 0, 1, 1, 1], scale: 27 },
  blur: { name: "模糊", k: [1, 1, 1, 1, 1, 1, 1, 1, 1], scale: 81 },
  identity: { name: "原样", k: [0, 0, 0, 0, 1, 0, 0, 0, 0], scale: 9 },
};

export type KernelState = {
  showNumbers: boolean;
  kernel: KernelId;
  /** kernels whose scan reached the end (since last image edit for "afterEdit") */
  completed: KernelId[];
  edited: boolean;
  completedAfterEdit: boolean;
};

function conv(img: number[], k: number[], r: number, c: number) {
  let s = 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += img[(r + i) * W + (c + j)] * k[i * 3 + j];
  return s;
}

export function KernelExperiment({
  kernels = ["vertical"],
  editable = false,
  onState,
}: {
  kernels?: KernelId[];
  editable?: boolean;
  onState?: (s: KernelState) => void;
}) {
  const [img, setImg] = useState(START);
  const [kernel, setKernel] = useState<KernelId>(kernels[0]);
  const [pos, setPos] = useState(-1); // index of last computed output cell
  const [auto, setAuto] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const [completed, setCompleted] = useState<KernelId[]>([]);
  const [edited, setEdited] = useState(false);
  const [completedAfterEdit, setCompletedAfterEdit] = useState(false);
  const K = KERNELS[kernel];
  const out = useMemo(() => Array.from({ length: OUT * OUT }, (_, i) => conv(img, K.k, Math.floor(i / OUT), i % OUT)), [img, K]);

  useEffect(() => {
    onState?.({ showNumbers, kernel, completed, edited, completedAfterEdit });
  }, [showNumbers, kernel, completed, edited, completedAfterEdit, onState]);

  const advance = (n: number) => {
    setPos((p) => {
      const np = Math.min(OUT * OUT - 1, p + n);
      if (np === OUT * OUT - 1 && p !== np) {
        setCompleted((c) => (c.includes(kernel) ? c : [...c, kernel]));
        if (edited) setCompletedAfterEdit(true);
      }
      return np;
    });
  };

  useEffect(() => {
    if (!auto) return;
    if (pos >= OUT * OUT - 1) {
      const t = window.setTimeout(() => setAuto(false), 0);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => advance(1), 90);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, pos]);

  const restart = (k: KernelId = kernel) => {
    setKernel(k);
    setPos(-1);
    setAuto(false);
  };

  const wr = pos >= 0 ? Math.floor(pos / OUT) : -1;
  const wc = pos >= 0 ? pos % OUT : -1;
  const inWindow = (r: number, c: number) => pos >= 0 && r >= wr && r < wr + 3 && c >= wc && c < wc + 3;

  const outColor = (v: number) => {
    const t = Math.max(-1, Math.min(1, v / K.scale));
    if (kernel === "blur" || kernel === "identity") {
      const g = Math.round(255 * Math.max(0, t));
      return { bg: `rgb(${g},${g},${g})`, fg: g > 140 ? "#18181b" : "#f4f4f5" };
    }
    const a = Math.abs(t);
    return { bg: t >= 0 ? `rgba(220,38,38,${a})` : `rgba(37,99,235,${a})`, fg: a > 0.5 ? "#fff" : "#18181b" };
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="mb-1 text-xs font-medium text-zinc-500">原图（{W}×{W} 个格子）{editable && "——点格子可以涂黑 / 涂亮"}</p>
          <div className="grid w-full max-w-[300px] gap-px bg-zinc-300 p-px dark:bg-zinc-700" style={{ gridTemplateColumns: `repeat(${W}, minmax(0, 1fr))` }}>
            {img.map((v, i) => {
              const r = Math.floor(i / W);
              const c = i % W;
              const g = Math.round((v / 9) * 255);
              const hl = inWindow(r, c);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!editable}
                  aria-label={`第 ${r + 1} 行第 ${c + 1} 列，亮度 ${v}`}
                  onClick={() => {
                    setImg((im) => im.map((x, j) => (j === i ? (x > 4 ? 0 : 9) : x)));
                    setEdited(true);
                    setCompletedAfterEdit(false);
                    setPos(-1);
                  }}
                  className={`relative flex aspect-square items-center justify-center text-[11px] font-mono ${hl ? "z-10 outline outline-[3px] outline-amber-500" : ""}`}
                  style={{ background: `rgb(${g},${g},${g})`, color: v > 4 ? "#18181b" : "#e4e4e7" }}
                >
                  {showNumbers ? v : ""}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-zinc-500">小窗口扫出来的结果（{OUT}×{OUT}）</p>
          <div className="grid w-full max-w-[250px] gap-px bg-zinc-300 p-px dark:bg-zinc-700" style={{ gridTemplateColumns: `repeat(${OUT}, minmax(0, 1fr))` }}>
            {out.map((v, i) => {
              const shown = i <= pos;
              const col = outColor(v);
              return (
                <div
                  key={i}
                  className={`flex aspect-square items-center justify-center text-[10px] font-mono ${i === pos ? "outline outline-[3px] outline-amber-500" : ""}`}
                  style={{ background: shown ? col.bg : "transparent", color: col.fg }}
                >
                  {shown && showNumbers ? v : ""}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="font-medium">小窗口（{K.name}）：</span>
            <div className="grid grid-cols-3 gap-px bg-zinc-300 p-px dark:bg-zinc-700">
              {K.k.map((x, i) => (
                <span key={i} className="flex h-6 w-6 items-center justify-center bg-white font-mono dark:bg-zinc-900">
                  {x}
                </span>
              ))}
            </div>
          </div>
          {pos >= 0 && (
            <p className="mt-1 text-xs text-zinc-500" aria-live="polite">
              当前：黄框里 9 个数 × 小窗口里对应的数，加起来 = <b>{out[pos]}</b>
            </p>
          )}
        </div>
      </div>
      {(kernel === "vertical" || kernel === "horizontal") && (
        <p className="text-xs text-zinc-500">
          结果里 <span className="font-semibold text-red-600">红 = 由暗变亮的边</span>，<span className="font-semibold text-blue-600">蓝 = 由亮变暗的边</span>，白 = 没有边。
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={() => advance(1)} disabled={pos >= OUT * OUT - 1 || auto}>
          滑一步
        </button>
        <button type="button" className={btnSecondary} onClick={() => setAuto((a) => !a)} disabled={pos >= OUT * OUT - 1}>
          {auto ? "暂停" : "自动滑"}
        </button>
        <button type="button" className={btnSecondary} onClick={() => restart()}>
          从头扫
        </button>
        <button type="button" className={chip(showNumbers)} onClick={() => setShowNumbers((s) => !s)}>
          {showNumbers ? "隐藏数字" : "显示数字"}
        </button>
      </div>
      {kernels.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium">换小窗口：</span>
          {kernels.map((k) => (
            <button key={k} type="button" className={chip(kernel === k)} onClick={() => restart(k)}>
              {KERNELS[k].name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
