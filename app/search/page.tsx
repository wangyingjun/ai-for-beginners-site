import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { searchLessons } from "@/lib/search";

export const metadata = { title: "搜索" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const locale = await resolveLocale(sp);
  const q = (sp.q ?? "").trim();
  const hits = q ? searchLessons(q, locale) : [];

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">
          {t(locale, "searchTitle")}
        </h1>
        <div className="mt-6">
          <SearchForm locale={locale} initialQuery={q} />
        </div>

        {!q && (
          <p className="mt-6 text-sm text-zinc-500">{t(locale, "searchEmpty")}</p>
        )}

        {q && (
          <p className="mt-6 text-sm text-zinc-500">
            {hits.length} {t(locale, "searchResults")}
            {q ? ` · “${q}”` : ""}
          </p>
        )}

        {q && hits.length === 0 && (
          <p className="mt-4 text-sm text-zinc-500">{t(locale, "searchNoResults")}</p>
        )}

        <ul className="mt-4 space-y-4">
          {hits.map((h) => (
            <li
              key={h.lessonId}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <Link
                href={`/lessons/${h.lessonId}?lang=${locale}`}
                className="text-lg font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                <span className="mr-2 font-mono text-sm text-zinc-400">
                  {h.lessonId}
                </span>
                {h.title}
              </Link>
              <p className="mt-1 text-xs text-zinc-400">
                {t(locale, "searchLesson")} · {h.module}
              </p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {h.excerpt}
              </p>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
