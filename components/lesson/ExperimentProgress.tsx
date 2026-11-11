"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { experimentDoneKey, PATH_LESSONS, PATH_STAGES } from "@/lib/learning-path";

/** Per-stage experiment completion, read from localStorage. */
export function ExperimentProgress() {
  const [done, setDone] = useState<Record<string, boolean> | null>(null);
  useEffect(() => {
    const t = window.setTimeout(() => {
      const out: Record<string, boolean> = {};
      for (const id of Object.keys(PATH_LESSONS)) {
        try {
          out[id] = window.localStorage.getItem(experimentDoneKey(id)) === "1";
        } catch {
          out[id] = false;
        }
      }
      setDone(out);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);
  if (!done) return null;
  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold">🧪 实验进度（本机）</h2>
      {PATH_STAGES.map((stage) => {
        const n = stage.lessons.filter((id) => done[id]).length;
        return (
          <div key={stage.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{stage.title}</span>
              <span className="text-zinc-500">
                {n} / {stage.lessons.length}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full bg-emerald-500" style={{ width: `${(n / stage.lessons.length) * 100}%` }} />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
              {stage.lessons.map((id) => (
                <Link
                  key={id}
                  href={`/lessons/${id}?lang=zh-CN`}
                  className={`rounded-full px-2 py-0.5 ${done[id] ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}
                >
                  {done[id] ? "✅ " : ""}
                  {PATH_LESSONS[id].title.split("：")[0]}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
