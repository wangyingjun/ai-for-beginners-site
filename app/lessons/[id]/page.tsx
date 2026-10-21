import Link from "next/link";
import { notFound } from "next/navigation";
import { AttentionDemo } from "@/components/demos/AttentionDemo";
import { BrowserRunButtons } from "@/components/BrowserRunButtons";
import { CartPoleDemo } from "@/components/demos/CartPoleDemo";
import { ConvKernelDemo } from "@/components/demos/ConvKernelDemo";
import { EmbeddingsDemo } from "@/components/demos/EmbeddingsDemo";
import { ExpertAnimalsDemo } from "@/components/demos/ExpertAnimalsDemo";
import { GeneticDemo } from "@/components/demos/GeneticDemo";
import { MlpPlayground } from "@/components/demos/MlpPlayground";
import { PerceptronDemo } from "@/components/demos/PerceptronDemo";
import { TextRepDemo } from "@/components/demos/TextRepDemo";
import { ExternalRunButtons } from "@/components/ExternalRunButtons";
import { FrameworkTabs } from "@/components/FrameworkTabs";
import { LessonMarkdown } from "@/components/LessonMarkdown";
import { LessonVisitTracker } from "@/components/LessonVisitTracker";
import { MarkdownBody } from "@/components/MarkdownBody";
import { SiteFooter } from "@/components/SiteFooter";
import { TutorChat } from "@/components/tutor/TutorChat";
import { SiteHeader } from "@/components/SiteHeader";
import {
  loadLabMarkdown,
  loadLessonMarkdown,
  loadStaticNotebook,
} from "@/lib/content";
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
  const labMd = lesson.hasLab
    ? await loadLabMarkdown(lesson.id, locale)
    : null;

  const staticFiles = lesson.staticNotebooks ?? [];
  const staticByFile: Record<string, Awaited<ReturnType<typeof loadStaticNotebook>> extends infer R ? NonNullable<R> : never> = {};
  for (const file of staticFiles) {
    const cells = await loadStaticNotebook(lesson.id, file, locale);
    if (cells) staticByFile[file] = cells;
  }

  const tierLabel =
    lesson.tier === "A"
      ? t(locale, "tierA")
      : lesson.tier === "B"
        ? t(locale, "tierB")
        : lesson.tier === "C"
          ? t(locale, "tierC")
          : null;

  const showExpert = lesson.id === "02";
  const showPerceptron = lesson.id === "03";
  const showMlp = lesson.id === "04" || lesson.id === "05";
  const showConv = lesson.id === "06" || lesson.id === "07";
  const showTextRep = lesson.id === "13";
  const showEmbed = lesson.id === "14" || lesson.id === "15";
  const showAttn = lesson.id === "18";
  const showGenetic = lesson.id === "21";
  const showCart = lesson.id === "22";

  const labNotebooks = lesson.labNotebooks ?? [];

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
            {lesson.hasLab && (
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                {t(locale, "lab")}
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

        {showExpert && (
          <section className="mt-10 space-y-3">
            <h2 className="text-xl font-semibold">{t(locale, "demoSection")}</h2>
            <ExpertAnimalsDemo locale={locale} />
          </section>
        )}

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

        {showConv && (
          <section className="mt-10 space-y-3">
            <h2 className="text-xl font-semibold">{t(locale, "demoSection")}</h2>
            <ConvKernelDemo locale={locale} />
          </section>
        )}

        {showTextRep && (
          <section className="mt-10 space-y-3">
            <h2 className="text-xl font-semibold">{t(locale, "demoSection")}</h2>
            <TextRepDemo locale={locale} />
          </section>
        )}

        {showEmbed && (
          <section className="mt-10 space-y-3">
            <h2 className="text-xl font-semibold">{t(locale, "demoSection")}</h2>
            <EmbeddingsDemo locale={locale} />
          </section>
        )}

        {showAttn && (
          <section className="mt-10 space-y-3">
            <h2 className="text-xl font-semibold">{t(locale, "demoSection")}</h2>
            <AttentionDemo locale={locale} />
          </section>
        )}

        {showGenetic && (
          <section className="mt-10 space-y-3">
            <h2 className="text-xl font-semibold">{t(locale, "demoSection")}</h2>
            <GeneticDemo locale={locale} />
          </section>
        )}

        {showCart && (
          <section className="mt-10 space-y-3">
            <h2 className="text-xl font-semibold">{t(locale, "demoSection")}</h2>
            <CartPoleDemo locale={locale} />
          </section>
        )}

        {lesson.hasNotebook && notebooks.length > 0 && (
          <section className="mt-10 space-y-4">
            <h2 className="text-xl font-semibold">{t(locale, "notebooks")}</h2>
            <p className="text-sm text-zinc-500">{t(locale, "notebookOutputHint")}</p>
            <FrameworkTabs
              notebooks={notebooks}
              locale={locale}
              path={lesson.path}
              staticByFile={staticByFile}
            />
          </section>
        )}

        {(lesson.jupyterlite?.length ?? 0) > 0 && (
          <section className="mt-8">
            <BrowserRunButtons locale={locale} notebooks={lesson.jupyterlite!} />
          </section>
        )}

        {lesson.hasLab && (
          <section className="mt-10 space-y-4 rounded-xl border border-violet-200 bg-violet-50/50 p-5 dark:border-violet-900 dark:bg-violet-950/30">
            <h2 className="text-xl font-semibold text-violet-900 dark:text-violet-100">
              {t(locale, "labSection")}
            </h2>
            <p className="text-sm text-violet-800/80 dark:text-violet-200/80">
              {t(locale, "labSectionHint")}
            </p>
            {labNotebooks.length > 0 && (
              <ul className="space-y-3">
                {labNotebooks.map((file) => (
                  <li
                    key={file}
                    className="rounded-lg border border-violet-200 bg-white p-3 dark:border-violet-800 dark:bg-zinc-950"
                  >
                    <p className="font-mono text-sm text-zinc-600 dark:text-zinc-300">
                      {file}
                    </p>
                    <div className="mt-2">
                      <ExternalRunButtons
                        locale={locale}
                        path={lesson.path}
                        file={file}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {labMd && (
              <details className="rounded-lg border border-violet-200 bg-white dark:border-violet-800 dark:bg-zinc-950">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
                  {t(locale, "labReadme")}
                </summary>
                <div className="border-t border-violet-100 px-4 py-3 dark:border-violet-900">
                  <MarkdownBody content={labMd} />
                </div>
              </details>
            )}
            {!labMd && labNotebooks.length === 0 && (
              <a
                href={githubBlobUrl(lesson.path, "lab/README.md")}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-indigo-600 underline dark:text-indigo-400"
              >
                {t(locale, "labReadme")} (GitHub)
              </a>
            )}
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
      <TutorChat locale={locale} lessonId={lesson.id} variant="panel" />
      <SiteFooter locale={locale} />
    </>
  );
}
