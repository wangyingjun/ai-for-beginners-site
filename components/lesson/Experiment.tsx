"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Reusable guided-experiment shell.
 *
 * Wrap any demo that can report its state via a callback. The shell shows a
 * one-line instruction, a task checklist that ticks itself when `check(state)`
 * becomes true (sticky; optionally remembered in localStorage), and an "aha"
 * card once every task is done.
 */

export type ExperimentTask<S> = {
  id: string;
  text: ReactNode;
  /** Shown under the task while it is not done yet. */
  hint?: ReactNode;
  /** Shown once the task is done (what the learner should have noticed). */
  doneNote?: ReactNode;
  check: (state: S) => boolean;
};

export function Experiment<S>({
  intro,
  tasks,
  aha,
  storageKey,
  onAllDone,
  render,
}: {
  intro: ReactNode;
  tasks: ExperimentTask<S>[];
  aha?: ReactNode;
  /** e.g. "exp:03:play" — remembers finished tasks across visits. */
  storageKey?: string;
  onAllDone?: () => void;
  /** Render the demo; pass `report` as its state callback. */
  render: (report: (state: S) => void) => ReactNode;
}) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const tasksRef = useRef(tasks);
  const loadedRef = useRef(false);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Restore finished tasks (client only).
  useEffect(() => {
    if (!storageKey || loadedRef.current) return;
    loadedRef.current = true;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, boolean>;
        // Defer to avoid a synchronous setState inside the effect body.
        queueMicrotask(() => setDone((d) => ({ ...saved, ...d })));
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const report = useCallback((state: S) => {
    setDone((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const task of tasksRef.current) {
        if (!next[task.id] && task.check(state)) {
          next[task.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const allDone = tasks.length > 0 && tasks.every((t) => done[t.id]);
  const firedRef = useRef(false);

  useEffect(() => {
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(done));
      } catch {
        /* ignore */
      }
    }
  }, [done, storageKey]);

  useEffect(() => {
    if (allDone && !firedRef.current) {
      firedRef.current = true;
      onAllDone?.();
    }
  }, [allDone, onAllDone]);

  return (
    <div className="space-y-4">
      <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">{intro}</p>
      {render(report)}
      <ol className="space-y-2">
        {tasks.map((task, i) => {
          const ok = Boolean(done[task.id]);
          return (
            <li
              key={task.id}
              className={`rounded-lg border p-3 text-sm ${ok ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"}`}
            >
              <div className="flex gap-2">
                <span aria-hidden className="shrink-0">
                  {ok ? "✅" : `${i + 1}.`}
                </span>
                <div className="space-y-1">
                  <div className={ok ? "text-emerald-900 dark:text-emerald-100" : ""}>{task.text}</div>
                  {!ok && task.hint && <div className="text-zinc-500">{task.hint}</div>}
                  {ok && task.doneNote && (
                    <div className="text-emerald-800 dark:text-emerald-200">{task.doneNote}</div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {allDone && aha && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="text-sm font-semibold">🎯 顿悟时刻</p>
          <div className="mt-1 text-base">{aha}</div>
        </div>
      )}
    </div>
  );
}
