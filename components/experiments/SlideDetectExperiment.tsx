"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusPill, btnPrimary, btnSecondary, chip } from "@/components/lesson/ui";

const G = 8;
const PATTERNS = {
  x: { name: "×", cells: [1, 0, 1, 0, 1, 0, 1, 0, 1] },
  o: { name: "○", cells: [0, 1, 0, 1, 0, 1, 0, 1, 0] },
};
type Pat = keyof typeof PATTERNS;
/** The detector looks for "×". Template in ±1 so mismatches are penalised. */
const TEMPLATE = PATTERNS.x.cells.map((v) => (v ? 1 : -1));
const FIXED = { r: 1, c: 1 };
const N = G - 2;

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
  inspectedNeg3: boolean;
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

function windowOf(img: number[], r: number, c: number): number[] {
  return Array.from({ length: 9 }, (_, i) => img[(r + Math.floor(i / 3)) * G + c + (i % 3)]);
}

function scoresOf(img: number[]): number[] {
  return Array.from({ length: N * N }, (_, i) => score(img, Math.floor(i / N), i % N));
}

const INITIAL_RESP = scoresOf(imageFor("x", 1, 1));
const INITIAL_SEL = INITIAL_RESP.indexOf(Math.max(...INITIAL_RESP));

function cellColor(v: number) {
  const t = Math.max(-1, Math.min(1, v / 5));
  return t >= 0 ? `rgba(220,38,38,${t})` : `rgba(37,99,235,${-t * 0.6})`;
}

function term(v: number, k: number) {
  const ks = k < 0 ? `(−${-k})` : String(k);
  return `${v}×${ks}`;
}

function explain(win: number[], products: number[], sum: number, pattern: Pat): string {
  const pos = products.reduce((a, p) => a + (p > 0 ? p : 0), 0);
  const neg = products.reduce((a, p) => a + (p < 0 ? p : 0), 0);
  const lit = win.some((v) => v === 1);
  if (sum === 5) return "窗口正好对准完整的 ×，每个该亮的格都加分。";
  if (!lit) return "窗口里是空白，得 0。";
  if (pattern === "o") {
    if (pos > 0 && neg < 0) return "这是 ○，不是 ×：有的格碰巧加分，有的格在扣分。";
    if (neg < 0) return "这是 ○，和 × 检测器对不上，正在扣分。";
    return "这不是完整的 ×，得分到不了 5。";
  }
  if (pos > 0 && neg < 0) return "只盖住了一部分 ×，有加有减。";
  if (pos === 0 && neg < 0) return "窗口和 × 对不齐：不该亮的格亮了，都在扣分。";
  if (pos > 0 && neg === 0) return "只盖住了 × 的一部分，有加分、没有扣分。";
  if (sum === 0) return "加分和扣分抵消，得 0。";
  return `这一窗的得分是 ${sum}。`;
}

function MiniGrid({
  values,
  kind,
  label,
}: {
  values: number[];
  kind: "img" | "kernel" | "prod";
  label: string;
}) {
  return (
    <div className="w-[5.75rem] shrink-0 space-y-1 sm:w-[6.5rem]">
      <div className="text-center text-[11px] font-medium text-zinc-500">{label}</div>
      <div className="grid grid-cols-3 gap-px bg-zinc-300 p-px dark:bg-zinc-700" role="img" aria-label={label}>
        {values.map((v, i) => {
          let cls = "flex aspect-square items-center justify-center font-mono text-[11px] ";
          if (kind === "img") cls += v ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-white text-zinc-400 dark:bg-zinc-900";
          else if (v > 0) cls += "bg-red-100 font-semibold text-red-700 dark:bg-red-950 dark:text-red-300";
          else if (v < 0) cls += "bg-blue-100 font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300";
          else cls += "bg-white text-zinc-400 dark:bg-zinc-900";
          const text = kind === "kernel" && v > 0 ? `+${v}` : kind === "img" ? String(v) : v > 0 ? `+${v}` : String(v);
          return (
            <div key={i} className={cls}>
              {text}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function poolArgmax(resp: number[], pi: number): number {
  const pr = Math.floor(pi / 3) * 2;
  const pc = (pi % 3) * 2;
  const idxs = [pr * N + pc, pr * N + pc + 1, (pr + 1) * N + pc, (pr + 1) * N + pc + 1];
  return idxs.reduce((b, i) => (resp[i] > resp[b] ? i : b));
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
  const [selected, setSelected] = useState(INITIAL_SEL);
  const [hovered, setHovered] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(N * N);
  const [auto, setAuto] = useState(false);
  const [inspectedNeg3, setInspectedNeg3] = useState(false);

  const img = useMemo(() => imageFor(pattern, pos.r, pos.c), [pattern, pos]);
  const resp = useMemo(() => scoresOf(img), [img]);
  const fixedScore = score(img, FIXED.r, FIXED.c);
  const slideMax = Math.max(...resp);
  const maxIdxs = resp.map((v, i) => (v === slideMax ? i : -1)).filter((i) => i >= 0);
  const fixedFound = fixedScore >= 5;
  const slideFound = slideMax >= 5;
  const pooled = useMemo(() => {
    const out: number[] = [];
    for (let r = 0; r < N; r += 2) for (let c = 0; c < N; c += 2) out.push(Math.max(resp[r * N + c], resp[r * N + c + 1], resp[(r + 1) * N + c], resp[(r + 1) * N + c + 1]));
    return out;
  }, [resp]);

  const view = hovered !== null && hovered < revealed ? hovered : selected;
  const viewRevealed = view < revealed;
  const vr = Math.floor(view / N);
  const vc = view % N;
  const win = windowOf(img, vr, vc);
  const products = win.map((v, i) => v * TEMPLATE[i]);
  const viewScore = resp[view];

  useEffect(() => {
    onState?.({ r: pos.r, c: pos.c, pattern, visited, fixedMissed, slideFound, pooling, pooledSameMoves, inspectedNeg3 });
  }, [pos, pattern, visited, fixedMissed, slideFound, pooling, pooledSameMoves, inspectedNeg3, onState]);

  useEffect(() => {
    if (viewRevealed && viewScore === -3 && !inspectedNeg3) {
      const t = window.setTimeout(() => setInspectedNeg3(true), 0);
      return () => window.clearTimeout(t);
    }
  }, [viewRevealed, viewScore, inspectedNeg3]);

  useEffect(() => {
    if (!auto) return;
    if (selected >= N * N - 1 && revealed >= N * N) {
      const t = window.setTimeout(() => setAuto(false), 0);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      const ns = Math.min(N * N - 1, selected + 1);
      setSelected(ns);
      setRevealed((r) => Math.max(r, ns + 1));
    }, 340);
    return () => window.clearTimeout(t);
  }, [auto, selected, revealed]);

  const revealTo = (i: number) => setRevealed((r) => (r >= N * N ? r : Math.max(r, i + 1)));

  const selectCell = (i: number) => {
    setHovered(null);
    setSelected(i);
    revealTo(i);
  };

  const move = (r: number, c: number) => {
    const nr = Math.max(0, Math.min(G - 3, r));
    const nc = Math.max(0, Math.min(G - 3, c));
    if (nr === pos.r && nc === pos.c) return;
    setAuto(false);
    const nImg = imageFor(pattern, nr, nc);
    const nResp = scoresOf(nImg);
    const nPooled: number[] = [];
    for (let rr = 0; rr < N; rr += 2) for (let cc = 0; cc < N; cc += 2) nPooled.push(Math.max(nResp[rr * N + cc], nResp[rr * N + cc + 1], nResp[(rr + 1) * N + cc], nResp[(rr + 1) * N + cc + 1]));
    const peak = (a: number[]) => `${a.indexOf(Math.max(...a))}:${Math.max(...a)}`;
    if (pooling && peak(nPooled) === peak(pooled)) setPooledSameMoves((n) => n + 1);
    if (pattern === "x" && score(nImg, FIXED.r, FIXED.c) < 5) setFixedMissed(true);
    setPos({ r: nr, c: nc });
    setVisited((v) => (v.includes(`${nr},${nc}`) ? v : [...v, `${nr},${nc}`]));
  };

  const startAuto = () => {
    if (auto) {
      setAuto(false);
      return;
    }
    if (selected >= N * N - 1 && revealed >= N * N) {
      setSelected(0);
      setRevealed(1);
    }
    setAuto(true);
  };

  const step = (d: number) => {
    setAuto(false);
    const ns = Math.max(0, Math.min(N * N - 1, selected + d));
    setSelected(ns);
    setRevealed((r) => (r >= N * N ? r : Math.max(r, ns + 1)));
  };

  const overlayBox = (cls: string, outer = false) => (
    <div
      className={`pointer-events-none absolute z-20 box-border ${cls}`}
      style={
        outer
          ? { left: -3, top: -3, width: "calc(300% + 8px)", height: "calc(300% + 8px)" }
          : { left: 0, top: 0, width: "calc(300% + 2px)", height: "calc(300% + 2px)" }
      }
      aria-hidden
    />
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <StatusPill ok={fixedFound}>只看固定位置：{fixedFound ? "找到 × 了" : "没找到"}</StatusPill>
        <StatusPill ok={slideFound}>滑着找 + 取最大：{slideFound ? "找到 × 了" : "没找到"}</StatusPill>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium text-zinc-500">图片：点任意格子，把图案挪过去</p>
          <div className="grid w-full max-w-[240px] gap-px bg-zinc-300 p-px dark:bg-zinc-700" style={{ gridTemplateColumns: `repeat(${G}, minmax(0, 1fr))` }}>
            {img.map((v, i) => {
              const r = Math.floor(i / G);
              const c = i % G;
              const isFixedOrigin = r === FIXED.r && c === FIXED.c;
              const isViewOrigin = viewRevealed && r === vr && c === vc;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`把图案挪到第 ${r + 1} 行第 ${c + 1} 列`}
                  onClick={() => move(r - 1, c - 1)}
                  className={`relative aspect-square overflow-visible ${v ? "bg-zinc-900 dark:bg-zinc-100" : "bg-white dark:bg-zinc-900"} ${isFixedOrigin || isViewOrigin ? "z-10" : ""}`}
                >
                  {isFixedOrigin && overlayBox("border-2 border-dashed border-amber-400", true)}
                  {isViewOrigin && overlayBox("border-[3px] border-indigo-500")}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            <span className="font-semibold text-amber-600">黄虚线框</span> = 固定位置检测器只看这里；
            <span className="font-semibold text-indigo-600">靛色实线框</span> = 得分图里正在查看的 3×3 窗口。
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
        <div className="min-w-0 space-y-3">
          <div>
            <p className="mb-1 text-xs font-medium text-zinc-500">× 检测器滑过每个位置的得分（越红越像 ×）。点或滑过一个格子，看左边对应的窗口。</p>
            <div className="grid w-full max-w-[240px] gap-px bg-zinc-300 p-px dark:bg-zinc-700" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}>
              {resp.map((v, i) => {
                const shown = i < revealed;
                const isSel = shown && i === view;
                const isMax = shown && v === slideMax;
                const sr = Math.floor(i / N);
                const sc = i % N;
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={shown ? `得分格 第 ${sr + 1} 行第 ${sc + 1} 列，${v}${isMax ? "，最大值" : ""}` : `得分格 第 ${sr + 1} 行第 ${sc + 1} 列，尚未滑到`}
                    aria-pressed={shown && i === selected}
                    onClick={() => selectCell(i)}
                    onMouseEnter={() => setHovered(i < revealed ? i : null)}
                    onMouseLeave={() => setHovered(null)}
                    className={`relative flex aspect-square items-center justify-center font-mono text-[10px] ${isSel ? "z-10 outline outline-[3px] outline-indigo-500" : isMax ? "z-10 outline outline-2 outline-amber-400" : ""}`}
                    style={{ background: shown ? cellColor(v) : undefined }}
                  >
                    {shown ? v : ""}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="mt-1 text-left text-xs text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
              onClick={() => selectCell(maxIdxs[0])}
              aria-label={`取最大值 ${slideMax}，跳到对应窗口`}
            >
              取最大值：<b>{slideMax}</b>（5 = 完全吻合）——点这里跳到最大的格子
            </button>
          </div>
          {pooling && (
            <div>
              <p className="mb-1 text-xs font-medium text-zinc-500">池化：每 2×2 只留最大的 → 3×3。点一个格会跳到它取自的那个最大分。</p>
              <div className="grid w-[132px] grid-cols-3 gap-px bg-zinc-300 p-px dark:bg-zinc-700">
                {pooled.map((v, i) => {
                  const src = poolArgmax(resp, i);
                  const isSel = viewRevealed && src === view;
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={`池化格 第 ${Math.floor(i / 3) + 1} 行第 ${(i % 3) + 1} 列，${v}，来自最大值`}
                      onClick={() => selectCell(src)}
                      className={`flex aspect-square items-center justify-center font-mono text-xs ${isSel ? "z-10 outline outline-[3px] outline-indigo-500" : v === slideMax ? "outline outline-2 outline-amber-400" : ""}`}
                      style={{ background: cellColor(v) }}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {viewRevealed && (
        <div className="space-y-2 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 dark:border-indigo-900 dark:bg-indigo-950/30">
          <p className="text-sm font-medium">
            这一窗的计算（得分图第 {vr + 1} 行第 {vc + 1} 列
            {viewScore === slideMax ? "，最大值" : ""}）
          </p>
          <div className="flex flex-wrap gap-3">
            <MiniGrid values={win} kind="img" label="窗口里的图" />
            <MiniGrid values={TEMPLATE} kind="kernel" label="× 检测器" />
            <MiniGrid values={products} kind="prod" label="对应位置相乘" />
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
            <span className="font-semibold text-red-600">红 = 正分（加分）</span>，
            <span className="font-semibold text-blue-600">蓝 = 负分（扣分）</span>，灰 = 0。
          </p>
          <p className="break-words font-mono text-[11px] leading-relaxed sm:text-xs">
            {products.map((_, i) => term(win[i], TEMPLATE[i])).join(" + ")} = <b>{viewScore}</b>
          </p>
          <p className="text-sm">{explain(win, products, viewScore, pattern)}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={startAuto}>
          {auto ? "暂停" : "自动滑动"}
        </button>
        <button type="button" className={btnSecondary} onClick={() => step(-1)} disabled={auto || selected <= 0} aria-label="上一步">
          上一步
        </button>
        <button type="button" className={btnSecondary} onClick={() => step(1)} disabled={auto || selected >= N * N - 1} aria-label="下一步">
          下一步
        </button>
        <button
          type="button"
          className={btnSecondary}
          onClick={() => {
            setAuto(false);
            setSelected(0);
            setRevealed(1);
          }}
        >
          从头再滑
        </button>
        {revealed < N * N && (
          <button type="button" className={btnSecondary} onClick={() => setRevealed(N * N)}>
            显示全部得分
          </button>
        )}
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
              <button
                key={p}
                type="button"
                className={chip(pattern === p)}
                onClick={() => {
                  setAuto(false);
                  setPattern(p);
                }}
              >
                图案换成 {PATTERNS[p].name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
