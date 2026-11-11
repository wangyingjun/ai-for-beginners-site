"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExpCanvas, btnPrimary, btnSecondary, chip, isDark } from "@/components/lesson/ui";
import { N, STARTER, emptyGrid, nearest, type Grid } from "@/lib/ml/knn-grid";

export type KnnState = {
  examples: number;
  labels: string[];
  guesses: number;
  noExampleGuess: boolean;
  taught: number;
  correctStreak: number;
  guessedLabels: string[];
  /** count of examples per label */
  perLabel: Record<string, number>;
};

type Ex = { label: string; grid: Grid };

function Thumb({ grid, highlight }: { grid: Grid; highlight?: boolean }) {
  return (
    <div
      className={`grid shrink-0 gap-px rounded p-0.5 ${highlight ? "bg-amber-400" : "bg-zinc-200 dark:bg-zinc-700"}`}
      style={{ gridTemplateColumns: `repeat(${N}, 5px)` }}
      aria-hidden
    >
      {grid.map((v, i) => (
        <div key={i} className={v ? "h-[5px] w-[5px] bg-zinc-900 dark:bg-zinc-100" : "h-[5px] w-[5px] bg-white dark:bg-zinc-900"} />
      ))}
    </div>
  );
}

export function KnnDrawExperiment({
  advanced = false,
  onState,
}: {
  /** Practice mode: clear examples, add a new category. */
  advanced?: boolean;
  onState?: (s: KnnState) => void;
}) {
  const [grid, setGrid] = useState<Grid>(emptyGrid);
  const [examples, setExamples] = useState<Ex[]>(STARTER);
  const [labels, setLabels] = useState<string[]>(["○", "×"]);
  const [guess, setGuess] = useState<{ label: string; index: number } | null | "none">(null);
  const [answered, setAnswered] = useState(false);
  const [guesses, setGuesses] = useState(0);
  const [noExampleGuess, setNoExampleGuess] = useState(false);
  const [taught, setTaught] = useState(0);
  const [streak, setStreak] = useState(0);
  const [guessedLabels, setGuessedLabels] = useState<string[]>([]);
  const paintRef = useRef<0 | 1>(1);

  useEffect(() => {
    const perLabel: Record<string, number> = {};
    for (const e of examples) perLabel[e.label] = (perLabel[e.label] ?? 0) + 1;
    onState?.({ examples: examples.length, labels, guesses, noExampleGuess, taught, correctStreak: streak, guessedLabels, perLabel });
  }, [examples, labels, guesses, noExampleGuess, taught, streak, guessedLabels, onState]);

  const inked = grid.some((v) => v);

  const onPointer = (u: number, v: number, kind: "down" | "move" | "up") => {
    if (kind === "up") return;
    const c = Math.min(N - 1, Math.max(0, Math.floor(u * N)));
    const r = Math.min(N - 1, Math.max(0, Math.floor(v * N)));
    const i = r * N + c;
    setGrid((g) => {
      if (kind === "down") paintRef.current = g[i] ? 0 : 1;
      if (g[i] === paintRef.current) return g;
      const ng = [...g];
      ng[i] = paintRef.current;
      return ng;
    });
    setGuess(null);
    setAnswered(false);
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const dark = isDark();
      const cw = w / N;
      const ch = h / N;
      for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++) {
          ctx.fillStyle = grid[r * N + c] ? (dark ? "#f4f4f5" : "#18181b") : dark ? "#27272a" : "#ffffff";
          ctx.fillRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2);
        }
    },
    [grid],
  );

  const doGuess = () => {
    setGuesses((n) => n + 1);
    setAnswered(false);
    const g = nearest(grid, examples);
    if (!g) {
      setGuess("none");
      setNoExampleGuess(true);
      return;
    }
    setGuess(g);
    setGuessedLabels((l) => (l.includes(g.label) ? l : [...l, g.label]));
  };

  const teach = (label: string) => {
    setExamples((e) => [...e, { label, grid }]);
    setTaught((t) => t + 1);
    setGrid(emptyGrid());
    setGuess(null);
    setAnswered(false);
  };

  const feedback = (correct: boolean, label?: string) => {
    setAnswered(true);
    if (correct) setStreak((s) => s + 1);
    else {
      setStreak(0);
      if (label) teach(label);
    }
  };

  const g = guess && guess !== "none" ? guess : null;
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="w-full max-w-[280px]">
          <ExpCanvas draw={draw} version={grid.join("")} maxWidth={280} onPointer={onPointer} ariaLabel="8×8 画板，用手指或鼠标涂格子" />
          <p className="mt-1 text-xs text-zinc-500">在格子上涂画（再点一下可擦掉）</p>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} disabled={!inked} onClick={doGuess}>
              让电脑猜
            </button>
            <button type="button" className={btnSecondary} onClick={() => { setGrid(emptyGrid()); setGuess(null); }}>
              清空画板
            </button>
          </div>
          {guess === "none" && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100" aria-live="polite">
              电脑：我一个例子都没见过，<b>完全不知道该猜什么</b>。先教我几个吧！
            </p>
          )}
          {g && (
            <div className="space-y-2 rounded-lg bg-indigo-50 p-3 text-sm dark:bg-indigo-950/40" aria-live="polite">
              <div className="flex items-center gap-2">
                <span>
                  电脑猜：<b className="text-lg">{g.label}</b>，因为它最像这个例子 →
                </span>
                <Thumb grid={examples[g.index]?.grid ?? emptyGrid()} highlight />
              </div>
              {!answered && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button type="button" className={chip(false)} onClick={() => feedback(true)}>
                    猜对了 ✓
                  </button>
                  {labels
                    .filter((l) => l !== g.label)
                    .map((l) => (
                      <button key={l} type="button" className={chip(false)} onClick={() => feedback(false, l)}>
                        错了，其实是 {l}
                      </button>
                    ))}
                </div>
              )}
              {answered && <p className="text-zinc-500">收到！（连续猜对：{streak} 次）</p>}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm">直接教它：</span>
            {labels.map((l) => (
              <button key={l} type="button" className={chip(false)} disabled={!inked} onClick={() => teach(l)}>
                这是 {l}
              </button>
            ))}
          </div>
          {advanced && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={btnSecondary}
                onClick={() => {
                  setExamples([]);
                  setGuess(null);
                  setStreak(0);
                }}
              >
                清空所有例子
              </button>
              {!labels.includes("△") && (
                <button type="button" className={btnSecondary} onClick={() => setLabels((l) => [...l, "△"])}>
                  添加新类别：△
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">电脑记住的例子（{examples.length} 个）：</p>
        <div className="flex flex-wrap gap-2">
          {examples.length === 0 && <span className="text-sm text-zinc-500">（空）</span>}
          {examples.map((e, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5 text-xs">
              <Thumb grid={e.grid} highlight={g?.index === i} />
              <span>{e.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
