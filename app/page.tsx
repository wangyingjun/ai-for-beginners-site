import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { getLessons, getModules } from "@/lib/lessons";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = await resolveLocale(searchParams);
  const lessonCount = getLessons().length;
  const moduleCount = getModules().length;

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <section className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            {t(locale, "siteTagline")}
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            {t(locale, "introTitle")}
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
            {t(locale, "introBody")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/course?lang=${locale}`}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              {t(locale, "viewCourse")}
            </Link>
            <a
              href="https://github.com/microsoft/AI-For-Beginners"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              microsoft/AI-For-Beginners
            </a>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <dt className="text-xs text-zinc-500">{t(locale, "lessons")}</dt>
              <dd className="text-2xl font-semibold">{lessonCount}</dd>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <dt className="text-xs text-zinc-500">{t(locale, "modules")}</dt>
              <dd className="text-2xl font-semibold">{moduleCount}</dd>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <dt className="text-xs text-zinc-500">License</dt>
              <dd className="text-2xl font-semibold">MIT</dd>
            </div>
          </dl>
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            {t(locale, "phaseNote")}
          </p>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
