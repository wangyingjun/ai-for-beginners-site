import Link from "next/link";
import { notFound } from "next/navigation";
import { BrowserRunButtons } from "@/components/BrowserRunButtons";
import { MlpPlayground } from "@/components/demos/MlpPlayground";
import { PerceptronDemo } from "@/components/demos/PerceptronDemo";
import { FrameworkTabs } from "@/components/FrameworkTabs";
import { LessonMarkdown } from "@/components/LessonMarkdown";
import { LessonVisitTracker } from "@/components/LessonVisitTracker";
import { NotebookViewer } from "@/components/NotebookViewer";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { loadLessonMarkdown, loadStaticNotebook } from "@/lib/content";
import { t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import {
  adjacentLessons,
  getLessonById,
  getLessons,
  getModule,
  githubBlobUrl,
  localizedTitle,
} from "@/lib/lessons";

export function generateStaticParams() {
  return getLessons().map((l) => ({ id: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lesson = getLessonById(id);
  if (!lesson) return { title: "Lesson" };
  return { title: lesson.title["zh-CN"] };
}

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const locale = await resolveLocale(searchParams);
  const lesson = getLessonById(id);
  if (!lesson) notFound();

  const mod = getModule(lesson.module);
  const { prev, next } = adjacentLessons(lesson.id);
  const notebooks = lesson.notebooks ?? [];
  const md = await loadLessonMarkdown(lesson.id, locale);
  const hasMd = Boolean(md);

  const staticFiles = lesson.staticNotebooks ?? [];
  const staticRendered = [];
  for (const file of staticFiles) {
    const cells = await loadStaticNotebook(lesson.id, file);
    if (cells) staticRendered.push({ file, cells });
  }

  const tierLabel =
    lesson.tier === "A"
      ? t(locale, "tierA")
      : lesson.tier === "B"
        ? t(locale, "tierB")
        : lesson.tier === "C"
          ? t(locale, "tierC")
          : null;

  const showPerceptron = lesson.id === "03";
  const showMlp = lesson.id === "04" || lesson.id === "05";

  return (
    <>
      <SiteHeader locale={locale} />
      <LessonVisitTracker lessonId={lesson.id} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <Link
          href={`/course?lang=${locale}`}
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← {t(locale, "backToIndex")}
        </Link>

        <header className="mt-4 space-y-2">
          {mod && (
            <p className="text-sm text-zinc-500">
              {localizedTitle(mod, locale)}
            </p>
          )}
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="mr-2 font-mono text-lg text-zinc-400">
              {lesson.id}
            </span>
            {localizedTitle(lesson, locale)}
          </h1>
          <div className="flex flex-wrap gap-2 text-xs">
            {tierLabel && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                {t(locale, "tier")}: {tierLabel}
              </span>
            )}
            {!lesson.hasNotebook && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800">
                {t(locale, "readingOnly")}
              </span>
            )}
            {hasMd && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Markdown
              </span>
            )}
            <a
              href={githubBlobUrl(lesson.path, "README.md")}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600 underline dark:bg-zinc-800"
            >
              GitHub README
            </a>
          </div>
        </header>

        <section className="mt-8 space-y-4">
          {hasMd ? (
            <LessonMarkdown lessonId={lesson.id} locale={locale} />
          ) : (
            <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {t(locale, "placeholderBody")}
            </p>
          )}
        </section>

        {showPerceptron && (
          <section className="mt-10 space-y-3">
            <h2 className="text-xl font-semibold">{t(locale, "demoSection")}</h2>
            <PerceptronDemo locale={locale} />
          </section>
        )}

        {showMlp && (
          <section className="mt-10 space-y-3">
            <h2 className="text-xl font-semibold">{t(locale, "demoSection")}</h2>
            <MlpPlayground locale={locale} />
          </section>
        )}

        {staticRendered.length > 0 && (
          <section className="mt-10 space-y-8">
            <h2 className="text-xl font-semibold">
              {t(locale, "notebookOutput")}
            </h2>
            <p className="text-sm text-zinc-500">
              {t(locale, "notebookOutputHint")}
            </p>
            {staticRendered.map(({ file, cells }) => (
              <NotebookViewer key={file} title={file} cells={cells} />
            ))}
          </section>
        )}

        {(lesson.jupyterlite?.length ?? 0) > 0 && (
          <section className="mt-8">
            <BrowserRunButtons locale={locale} notebooks={lesson.jupyterlite!} />
          </section>
        )}

        {lesson.hasNotebook && notebooks.length > 0 && (
          <section className="mt-10 space-y-4">
            <h2 className="text-xl font-semibold">{t(locale, "notebooks")}</h2>
            <FrameworkTabs
              notebooks={notebooks}
              locale={locale}
              path={lesson.path}
              staticFiles={staticFiles}
            />
          </section>
        )}

        <nav className="mt-12 flex items-center justify-between border-t border-zinc-200 pt-6 text-sm dark:border-zinc-800">
          {prev ? (
            <Link
              href={`/lessons/${prev.id}?lang=${locale}`}
              className="text-indigo-600 hover:underline dark:text-indigo-400"
            >
              ← {t(locale, "prev")}: {localizedTitle(prev, locale)}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/lessons/${next.id}?lang=${locale}`}
              className="text-right text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {t(locale, "next")}: {localizedTitle(next, locale)} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
