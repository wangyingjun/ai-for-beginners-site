import Link from "next/link";
import { ExperimentLessonById } from "@/components/experiment-lessons/registry";
import { PathNav } from "@/components/lesson/PathNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import type { Locale } from "@/lib/i18n";
import { PATH_LESSONS, stageOf } from "@/lib/learning-path";

/** Site-only micro-lesson (no upstream content, so no 进阶 section). */
export function ExtraLessonPage({ id, locale }: { id: string; locale: Locale }) {
  const meta = PATH_LESSONS[id];
  const stage = stageOf(id);
  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <Link href="/course?lang=zh-CN" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          ← 返回学习路线
        </Link>
        <header className="mt-4 space-y-2">
          {stage && <p className="text-sm text-zinc-500">{stage.title}</p>}
          <h1 className="text-3xl font-bold tracking-tight">{meta.title}</h1>
          <p className="text-xs text-zinc-500">本站补充的小课（上游课程里没有单独这一课）</p>
        </header>
        <div className="mt-8">
          <ExperimentLessonById lessonId={id} />
        </div>
        <PathNav lessonId={id} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
