import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import {
  getLessonsByModule,
  getModules,
  localizedTitle,
} from "@/lib/lessons";

export const metadata = {
  title: "课程目录",
};

export default async function CoursePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = await resolveLocale(searchParams);
  const modules = getModules();

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          {t(locale, "navCourse")}
        </h1>
        <p className="mb-8 text-zinc-600 dark:text-zinc-400">
          {t(locale, "siteTagline")}
        </p>

        <div className="space-y-10">
          {modules.map((mod) => {
            const lessons = getLessonsByModule(mod.id);
            if (!lessons.length) return null;
            return (
              <section key={mod.id}>
                <h2 className="mb-3 text-lg font-semibold text-indigo-700 dark:text-indigo-300">
                  {localizedTitle(mod, locale)}
                </h2>
                <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
                  {lessons.map((lesson) => {
                    const dual =
                      lesson.frameworks.includes("pytorch") &&
                      lesson.frameworks.includes("tensorflow");
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/lessons/${lesson.id}?lang=${locale}`}
                          className="flex flex-col gap-1 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <span className="mr-2 font-mono text-xs text-zinc-400">
                              {lesson.id}
                            </span>
                            <span className="font-medium">
                              {localizedTitle(lesson, locale)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {lesson.hasNotebook ? (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                {t(locale, "hasNotebook")}
                              </span>
                            ) : (
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                {t(locale, "readingOnly")}
                              </span>
                            )}
                            {dual && (
                              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                {t(locale, "dualFramework")}
                              </span>
                            )}
                            {lesson.tier && (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                                Tier {lesson.tier}
                              </span>
                            )}
                            {lesson.hasLab && (
                              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                                {t(locale, "lab")}
                              </span>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
