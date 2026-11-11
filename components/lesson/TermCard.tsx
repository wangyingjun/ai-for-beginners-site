import type { ReactNode } from "react";

export type LessonTerm = { name: string; definition: ReactNode };

/** "Give it a name" card: one new term + one-sentence definition. */
export function TermCard({ term }: { term: LessonTerm }) {
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
      <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{term.name}</p>
      <div className="mt-1 text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200">
        {term.definition}
      </div>
    </div>
  );
}
