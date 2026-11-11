"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StatusPill, btnSecondary, chip } from "@/components/lesson/ui";

const N = 10;
const M = (rows: string[]) => rows.join("").split("").map((c) => c === "#");
const SHAPES = {
  cat: {
    name: "猫",
    color: "#f59e0b",
    mask: M(["..........", "..#..#....", "..####....", "..####....", "...##.....", "..####...#", "..#####.#.", "..######..", "..........", ".........."]),
  },
  dog: {
    name: "狗",
    color: "#b45309",
    mask: M(["..........", ".##..##...", ".######...", "..####....", "..####....", ".######...", ".######...", ".#....#...", "..........", ".........."]),
  },
};
type ShapeId = keyof typeof SHAPES;
const MODEL_FLIPS = [13, 45, 59, 68, 77];

export type SegState = { shape: ShapeId; boxShown: boolean; boxExtra: number; match: number; model: boolean; found: number; flips: number };

function bbox(mask: boolean[]) {
  let r0 = N, r1 = -1, c0 = N, c1 = -1;
  mask.forEach((m, i) => {
    if (!m) return;
    const r = Math.floor(i / N), c = i % N;
    r0 = Math.min(r0, r); r1 = Math.max(r1, r); c0 = Math.min(c0, c); c1 = Math.max(c1, c);
  });
  return { r0, r1, c0, c1 };
}

export function SegmentExperiment({ controls = false, onState }: { controls?: boolean; onState?: (s: SegState) => void }) {
  const [shape, setShape] = useState<ShapeId>("cat");
  const [paint, setPaint] = useState<boolean[]>(() => new Array(N * N).fill(false));
  const [boxShown, setBoxShown] = useState(false);
  const [model, setModel] = useState(false);
  const [found, setFound] = useState<number[]>([]);
  const dragRef = useRef<{ value: boolean; last: number } | null>(null);
  const truth = SHAPES[shape].mask;
  const bb = useMemo(() => bbox(truth), [truth]);
  const inBox = (i: number) => {
    const r = Math.floor(i / N), c = i % N;
    return r >= bb.r0 && r <= bb.r1 && c >= bb.c0 && c <= bb.c1;
  };
  const boxExtra = truth.reduce((n, m, i) => n + (!m && inBox(i) ? 1 : 0), 0);
  let inter = 0, uni = 0;
  for (let i = 0; i < N * N; i++) {
    if (paint[i] && truth[i]) inter++;
    if (paint[i] || truth[i]) uni++;
  }
  const match = uni ? inter / uni : 0;
  const modelMask = useMemo(() => SHAPES.cat.mask.map((m, i) => (MODEL_FLIPS.includes(i) ? !m : m)), []);

  useEffect(() => {
    onState?.({ shape, boxShown, boxExtra, match, model, found: found.length, flips: MODEL_FLIPS.length });
  }, [shape, boxShown, boxExtra, match, model, found.length, onState]);

  const apply = (i: number, value: boolean) => setPaint((p) => (p[i] === value ? p : p.map((v, j) => (j === i ? value : v))));
  const cellAt = (el: HTMLElement, x: number, y: number) => {
    const r = el.getBoundingClientRect();
    const c = Math.floor(((x - r.left) / r.width) * N), row = Math.floor(((y - r.top) / r.height) * N);
    return c < 0 || c >= N || row < 0 || row >= N ? -1 : row * N + c;
  };
  const tapModel = (i: number) => {
    if (MODEL_FLIPS.includes(i) && !found.includes(i)) setFound((f) => [...f, i]);
  };

  const showMask = model ? modelMask : paint;
  return (
    <div className="space-y-3">
      <StatusPill ok={model ? found.length === MODEL_FLIPS.length : match >= 0.9}>
        {model ? `找到模型的错格：${found.length} / ${MODEL_FLIPS.length}` : `你涂的和「${SHAPES[shape].name}」的真实形状吻合度：${Math.round(match * 100)}%`}
      </StatusPill>
      <div
        role="grid"
        aria-label="涂色画布"
        className="grid w-full max-w-[300px] touch-none select-none gap-px bg-zinc-300 p-px dark:bg-zinc-700"
        style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}
        onPointerDown={(e) => {
          const i = cellAt(e.currentTarget, e.clientX, e.clientY);
          if (i < 0) return;
          if (model) return tapModel(i);
          const value = !paint[i];
          dragRef.current = { value, last: i };
          apply(i, value);
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (!d || model) return;
          const i = cellAt(e.currentTarget, e.clientX, e.clientY);
          if (i < 0 || i === d.last) return;
          d.last = i;
          apply(i, d.value);
        }}
        onPointerUp={() => (dragRef.current = null)}
        onPointerLeave={() => (dragRef.current = null)}
      >
        {truth.map((t, i) => {
          const r = Math.floor(i / N);
          const bg = t ? SHAPES[shape].color : r >= 8 ? "#bbf7d0" : "#f4f4f5";
          const wrongFound = model && found.includes(i);
          const edge = boxShown && !model && inBox(i);
          return (
            <div
              key={i}
              data-cell={i}
              className="relative aspect-square"
              style={{ backgroundColor: bg, boxShadow: wrongFound ? "inset 0 0 0 3px #f59e0b" : edge ? "inset 0 0 0 1px #059669" : undefined }}
            >
              {showMask[i] && <div className={`absolute inset-[18%] rounded-sm ${model ? "bg-violet-600/70" : "bg-indigo-600/75"}`} />}
              {edge && !t && <div className="absolute inset-0 bg-emerald-500/25" />}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-zinc-500">
        {model ? (
          <>
            <span className="font-semibold text-violet-600">紫块 = 模型认为是猫的格子</span>。点一下你觉得它判错的格子（多涂的、漏涂的都算），找到会出现
            <span className="font-semibold text-amber-600">黄框</span>。
          </>
        ) : (
          <>
            点格子或按住拖动，涂上 <span className="font-semibold text-indigo-600">靛蓝方块 = 你说「这格是{SHAPES[shape].name}」</span>；再点一次擦掉。
            {boxShown && <> 绿色区域 = 方框里其实不是{SHAPES[shape].name}的格子：共 {boxExtra} 格。</>}
          </>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {!model && (
          <button type="button" className={chip(boxShown)} onClick={() => setBoxShown((x) => !x)}>
            {boxShown ? "隐藏方框" : "如果只用方框标…"}
          </button>
        )}
        {!model && (
          <button type="button" className={btnSecondary} onClick={() => setPaint(new Array(N * N).fill(false))}>
            全部擦掉
          </button>
        )}
        {controls && (
          <>
            <button type="button" className={chip(shape === "cat" && !model)} onClick={() => { setModel(false); setShape("cat"); setPaint(new Array(N * N).fill(false)); }}>
              涂猫
            </button>
            <button type="button" className={chip(shape === "dog" && !model)} onClick={() => { setModel(false); setShape("dog"); setPaint(new Array(N * N).fill(false)); }}>
              涂狗
            </button>
            <button type="button" className={chip(model)} onClick={() => { setShape("cat"); setModel(true); }}>
              检查模型的答案
            </button>
          </>
        )}
      </div>
    </div>
  );
}
