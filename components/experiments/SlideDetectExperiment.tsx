"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusPill, btnSecondary, chip } from "@/components/lesson/ui";

const G = 8;
const PATTERNS = {
  x: { name: "×", cells: [1, 0, 1, 0, 1, 0, 1, 0, 1] },
  o: { name: "○", cells: [0, 1, 0, 1, 0, 1, 0, 1, 0] },
};
type Pat = keyof typeof PATTERNS;
/** The detector looks for "×". Template in ±1 so mismatches are penalised. */
const TEMPLATE = PATTERNS.x.cells.map((v) => (v ? 1 : -1));
const FIXED = { r: 1, c: 1 }; // the fixed detector only checks this window

export type SlideState = {
  r: number;
  c: number;
  pattern: Pat;
  visited: string[];
  fixedMissed: boolean;
  slideFound: boolean;
  pooling: boolean;
  /** moves made while pooling was visible and pooled output stayed the same */
  pooledSameMoves: number;
};

function imageFor(p: Pat, r: number, c: number): number[] {
  const img = new Array<number>(G * G).fill(0);
  PATTERNS[p].cells.forEach((v, i) => {
    if (v) img[(r + Math.floor(i / 3)) * G + c + (i % 3)] = 1;
  });
  return img;
}

function score(img: number[], r: number, c: number) {
  let s = 0;
  for (let i = 0; i < 9; i++) s += img[(r + Math.floor(i / 3)) * G + c + (i % 3)] * TEMPLATE[i];
  return s; // max 5 for a perfect ×
}

export function SlideDetectExperiment({
  poolingControl = false,
  patternSwitch = false,
  onState,
}: {
  poolingControl?: boolean;
  patternSwitch?: boolean;
  onState?: (s: SlideState) => void;
}) {
  const [pos, setPos] = useState({ r: 1, c: 1 });
  const [pattern, setPattern] = useState<Pat>("x");
  const [visited, setVisited] = useState<string[]>(["1,1"]);
  const [fixedMissed, setFixedMissed] = useState(false);
  const [pooling, setPooling] = useState(false);
  const [pooledSameMoves, setPooledSameMoves] = useState(0);
  const img = useMemo(() => imageFor(pattern, pos.r, pos.c), [pattern, pos]);
  const N = G - 2;
  const resp = useMemo(() => Array.from({ length: N * N }, (_, i) => score(img, Math.floor(i / N), i % N)), [img, N]);
  const fixedScore = score(img, FIXED.r, FIXED.c);
  const slideMax = Math.max(...resp);
  const fixedFound = fixedScore >= 5;
  const slideFound = slideMax >= 5;
  const pooled = useMemo(() => {
    const out: number[] = [];
    for (let r = 0; r < N; r += 2) for (let c = 0; c < N; c += 2) out.push(Math.max(resp[r * N + c], resp[r * N + c + 1], resp[(r + 1) * N + c], resp[(r + 1) * N + c + 1]));
    return out;
  }, [resp, N]);

  useEffect(() => {
    onState?.({ r: pos.r, c: pos.c, pattern, visited, fixedMissed, slideFound, pooling, pooledSameMoves });
  }, [pos, pattern, visited, fixedMissed, slideFound, pooling, pooledSameMoves, onState]);

  const move = (r: number, c: number) => {
    const nr = Math.max(0, Math.min(G - 3, r));
    const nc = Math.max(0, Math.min(G - 3, c));
    if (nr === pos.r && nc === pos.c) return;
    const nImg = imageFor(pattern, nr, nc);
    const nResp = Array.from({ length: N * N }, (_, i) => score(nImg, Math.floor(i / N), i % N));
    const nPooled: number[] = [];
    for (let rr = 0; rr < N; rr += 2) for (let cc = 0; cc < N; cc += 2) nPooled.push(Math.max(nResp[rr * N + cc], nResp[rr * N + cc + 1], nResp[(rr + 1) * N + cc], nResp[(rr + 1) * N + cc + 1]));
    const peak = (a: number[]) => `${a.indexOf(Math.max(...a))}:${Math.max(...a)}`;
    if (pooling && peak(nPooled) === peak(pooled)) setPooledSameMoves((n) => n + 1);
    if (pattern === "x" && score(nImg, FIXED.r, FIXED.c) < 5) setFixedMissed(true);
    setPos({ r: nr, c: nc });
    setVisited((v) => (v.includes(`${nr},${nc}`) ? v : [...v, `${nr},${nc}`]));
  };

  const cellColor = (v: number) => {
    const t = Math.max(-1, Math.min(1, v / 5));
    return t >= 0 ? `rgba(220,38,38,${t})` : `rgba(37,99,235,${-t * 0.6})`;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <StatusPill ok={fixedFound}>只看固定位置：{fixedFound ? "找到 × 了" : "没找到"}</StatusPill>
        <StatusPill ok={slideFound}>滑着找 + 取最大：{slideFound ? "找到 × 了" : "没找到"}</StatusPill>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="mb-1 text-xs font-medium text-zinc-500">图片：点任意格子，把图案挪过去</p>
          <div className="grid w-full max-w-[240px] gap-px bg-zinc-300 p-px dark:bg-zinc-700" style={{ gridTemplateColumns: `repeat(${G}, minmax(0, 1fr))` }}>
            {img.map((v, i) => {
              const r = Math.floor(i / G);
              const c = i % G;
              const inFixed = r >= FIXED.r && r < FIXED.r + 3 && c >= FIXED.c && c < FIXED.c + 3;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`把图案挪到第 ${r + 1} 行第 ${c + 1} 列`}
                  onClick={() => move(r - 1, c - 1)}
                  className={`aspect-square ${v ? "bg-zinc-900 dark:bg-zinc-100" : "bg-white dark:bg-zinc-900"} ${inFixed ? "ring-2 ring-inset ring-amber-400" : ""}`}
                />
              );
            })}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            <span className="font-semibold text-amber-600">黄框</span> = 「固定位置检测器」唯一会看的地方
          </p>
          <div className="mt-2 grid w-[132px] grid-cols-3 gap-1">
            <span />
            <button type="button" className={btnSecondary} aria-label="上移" onClick={() => move(pos.r - 1, pos.c)}>↑</button>
            <span />
            <button type="button" className={btnSecondary} aria-label="左移" onClick={() => move(pos.r, pos.c - 1)}>←</button>
            <span />
            <button type="button" className={btnSecondary} aria-label="右移" onClick={() => move(pos.r, pos.c + 1)}>→</button>
            <span />
            <button type="button" className={btnSecondary} aria-label="下移" onClick={() => move(pos.r + 1, pos.c)}>↓</button>
            <span />
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs font-medium text-zinc-500">× 检测器滑过每个位置的得分（越红越像 ×）</p>
            <div className="grid w-full max-w-[200px] gap-px bg-zinc-300 p-px dark:bg-zinc-700" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}>
              {resp.map((v, i) => (
                <div key={i} className="flex aspect-square items-center justify-center bg-white font-mono text-[10px] dark:bg-zinc-900" style={{ background: cellColor(v) }}>
                  {v}
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-zinc-500">取最大值：<b>{slideMax}</b>（5 = 完全吻合）</p>
          </div>
          {pooling && (
            <div>
              <p className="mb-1 text-xs font-medium text-zinc-500">池化：每 2×2 只留最大的 → 3×3</p>
              <div className="grid w-[120px] grid-cols-3 gap-px bg-zinc-300 p-px dark:bg-zinc-700">
                {pooled.map((v, i) => (
                  <div key={i} className="flex aspect-square items-center justify-center font-mono text-xs" style={{ background: cellColor(v) }}>
                    {v}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {(poolingControl || patternSwitch) && (
        <div className="flex flex-wrap gap-2">
          {poolingControl && (
            <button type="button" className={chip(pooling)} onClick={() => setPooling((p) => !p)}>
              {pooling ? "隐藏池化" : "显示池化"}
            </button>
          )}
          {patternSwitch &&
            (Object.keys(PATTERNS) as Pat[]).map((p) => (
              <button key={p} type="button" className={chip(pattern === p)} onClick={() => setPattern(p)}>
                图案换成 {PATTERNS[p].name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
