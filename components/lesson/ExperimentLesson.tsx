import type { ReactNode } from "react";
import { MiniQuiz, type MiniQuizItem } from "@/components/lesson/MiniQuiz";
import { ObserveQuestion } from "@/components/lesson/ObserveQuestion";
import { TermCard, type LessonTerm } from "@/components/lesson/TermCard";

/**
 * Experiment-first lesson template (see docs/课程优化方案.md §4).
 *
 *   ① 先玩一下 → ② 你看到了什么 → ③ 发生了什么（大白话）→ ④ 给它起个名字（≤2 个术语）
 *   → ⑤ 再玩一次（带任务）→ ⑥ 小测 + 一句话小结 → ⑦ 进阶（默认折叠）
 *
 * A lesson supplies an `ExperimentLessonDef`; `advanced` carries the original
 * upstream content (README, notebooks, lab) rendered by the server page.
 */

export type ExperimentLessonDef = {
  minutes: number;
  /** One sentence: what the learner can do after this lesson. */
  goal: ReactNode;
  /** ① First screen: usually an <Experiment> wrapping a demo. No jargon. */
  play: ReactNode;
  /** ② One observation question. */
  observe: {
    question: ReactNode;
    options: ReactNode[];
    answer: number;
    explanation: ReactNode;
    hintOnWrong?: ReactNode;
  };
  /** ③ Plain-language explanation with an everyday analogy (≤ ~300 字). */
  explain: ReactNode;
  /** ④ At most two new terms — enforced by the type. */
  terms: [LessonTerm] | [LessonTerm, LessonTerm];
  /** ⑤ Second round with tasks; the last one should set up the next lesson. */
  practice: ReactNode;
  /** ⑥ Three understanding questions with explanations. */
  quiz: MiniQuizItem[];
  /** ⑥ One-sentence summary. */
  summary: ReactNode;
  next?: { question: ReactNode; href?: string; label?: string };
  /** ⑦ Optional formulas etc. shown at the top of the collapsed section. */
  advancedIntro?: ReactNode;
};

function Section({
  n,
  icon,
  title,
  id,
  children,
}: {
  n: number;
  icon: string;
  title: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
        <span aria-hidden className="text-2xl">
          {icon}
        </span>
        <span className="text-sm font-mono text-zinc-400">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

const card =
  "rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950";

export function ExperimentLesson({
  def,
  advanced,
}: {
  def: ExperimentLessonDef;
  advanced?: ReactNode;
}) {
  const termNames = def.terms.map((t) => t.name).join("、");
  return (
    <div className="space-y-10">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
          ⏱ 约 {def.minutes} 分钟
        </span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          🆕 新词只有 {def.terms.length} 个：{termNames}
        </span>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          🧪 先动手，再讲道理
        </span>
        {advanced && (
          <a
            href="#advanced"
            className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 underline dark:bg-zinc-800 dark:text-zinc-200"
          >
            原课程内容（进阶）↓
          </a>
        )}
      </div>
      <p className="text-[15px] text-zinc-600 dark:text-zinc-300">🎯 学完这节：{def.goal}</p>

      <Section n={1} icon="🧪" title="先玩一下" id="play">
        <div className={card}>{def.play}</div>
      </Section>

      <Section n={2} icon="🤔" title="你看到了什么？" id="observe">
        <div className={card}>
          <ObserveQuestion {...def.observe} />
        </div>
      </Section>

      <Section n={3} icon="💡" title="发生了什么（大白话）" id="explain">
        <div className="space-y-3 text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200">
          {def.explain}
        </div>
      </Section>

      <Section n={4} icon="🏷️" title="给它起个名字" id="terms">
        <div className="grid gap-3 sm:grid-cols-2">
          {def.terms.map((t) => (
            <TermCard key={t.name} term={t} />
          ))}
        </div>
      </Section>

      <Section n={5} icon="🎮" title="再玩一次（带任务）" id="practice">
        <div className={card}>{def.practice}</div>
      </Section>

      <Section n={6} icon="✅" title="小测（每题都有解析）" id="quiz">
        <div className={card}>
          <MiniQuiz items={def.quiz} />
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
          <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">📌 一句话小结</p>
          <div className="mt-1 text-base text-zinc-900 dark:text-zinc-50">{def.summary}</div>
          {def.next && (
            <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
              下节课要解决的问题：{def.next.question}
              {def.next.href && (
                <>
                  {" "}
                  <a href={def.next.href} className="text-indigo-600 underline dark:text-indigo-400">
                    {def.next.label ?? "去下一课 →"}
                  </a>
                </>
              )}
            </p>
          )}
        </div>
      </Section>

      {advanced && (
        <section id="advanced-section" className="scroll-mt-20">
          <details
            id="advanced"
            className="group rounded-2xl border border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <summary className="cursor-pointer list-none px-4 py-4 sm:px-6">
              <span className="text-xl font-semibold">📚 7 进阶：公式、原课程内容与 Notebook</span>
              <span className="mt-1 block text-sm text-zinc-500">
                默认折叠。这里保留了上游原文、互动演示自由版、Notebook 与实验作业，适合想深入的同学。
                <span className="ml-1 text-indigo-600 group-open:hidden dark:text-indigo-400">点击展开 ↓</span>
              </span>
            </summary>
            <div className="min-w-0 space-y-8 overflow-x-auto border-t border-zinc-200 px-3 py-6 sm:px-6 dark:border-zinc-800">
              {def.advancedIntro}
              {advanced}
            </div>
          </details>
        </section>
      )}
    </div>
  );
}
