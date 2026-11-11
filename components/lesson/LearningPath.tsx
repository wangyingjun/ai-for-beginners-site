"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { experimentDoneKey, PATH_LESSONS, PATH_STAGES } from "@/lib/learning-path";

/** zh-CN learning-path catalog with local experiment progress. */
export function LearningPath({ ready }: { ready: readonly string[] }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const read = () => {
      const out: Record<string, boolean> = {};
      for (const id of Object.keys(PATH_LESSONS)) {
        try {
          out[id] = window.localStorage.getItem(experimentDoneKey(id)) === "1";
        } catch {
          out[id] = false;
        }
      }
      setDone(out);
    };
    const id = window.setTimeout(read, 0);
    return () => window.clearTimeout(id);
  }, []);

  const core = PATH_STAGES.filter((s) => !s.optional).flatMap((s) => s.lessons);
  const coreMinutes = core.reduce((a, id) => a + PATH_LESSONS[id].minutes, 0);
  const coreDone = core.filter((id) => done[id]).length;

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm leading-relaxed dark:border-indigo-900 dark:bg-indigo-950/40">
        <p className="text-base font-semibold text-indigo-950 dark:text-indigo-100">零基础从这里开始 👇</p>
        <p className="mt-1 text-zinc-700 dark:text-zinc-300">
          核心路线 {core.length} 节小课，约 {Math.round(coreMinutes / 6) / 10} 小时，<b>不用安装、不用写代码</b>
          。每节课都是先玩一个小实验，再讲道理，新词最多 2 个。已完成 {coreDone} / {core.length}。
        </p>
        <Link
          href={`/lessons/${core.find((id) => !done[id]) ?? core[0]}?lang=zh-CN`}
          className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500"
        >
          {coreDone > 0 ? "继续学习 →" : "从第一课开始 →"}
        </Link>
      </div>

      {PATH_STAGES.map((stage) => (
        <section key={stage.id} className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{stage.title}</h2>
            <p className="text-sm text-zinc-500">{stage.blurb}</p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {stage.lessons.map((id) => {
              const l = PATH_LESSONS[id];
              const isReady = ready.includes(id);
              return (
                <li key={id}>
                  <Link
                    href={`/lessons/${id}?lang=zh-CN`}
                    className="block h-full rounded-xl border border-zinc-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold">{l.title}</span>
                      {done[id] && <span aria-label="已完成">✅</span>}
                    </div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">学完能：{l.canDo}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">⏱ {l.minutes} 分钟</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                        新词：{l.terms.join("、")}
                      </span>
                      {l.prereq.length > 0 && (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          先学：{l.prereq.map((p) => PATH_LESSONS[p]?.title.split("：")[0] ?? p).join("、")}
                        </span>
                      )}
                      {!isReady && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                          实验版制作中
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
