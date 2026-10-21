import Link from "next/link";
import { BrowserRunButtons } from "@/components/BrowserRunButtons";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { resolveLocale } from "@/lib/locale";
import { getLessons, localizedTitle } from "@/lib/lessons";
import { jupyterliteLabUrl } from "@/lib/jupyterlite";

export const metadata = { title: "浏览器实验室 · JupyterLite" };

export default async function LabPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = await resolveLocale(searchParams);
  const labs = getLessons().filter((l) => (l.jupyterlite?.length ?? 0) > 0);

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">
          {locale === "zh-CN" ? "浏览器实验室" : "Browser Lab"}
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          {locale === "zh-CN"
            ? "Tier A notebook 已打好 Pyodide 补丁，可在 JupyterLite 中运行（无需安装）。首次加载较慢。"
            : "Tier A notebooks are patched for Pyodide and run in JupyterLite (no install). First load is slow."}
        </p>
        <p className="mt-4">
          <a
            href={jupyterliteLabUrl()}
            className="text-indigo-600 underline dark:text-indigo-400"
            target="_blank"
            rel="noreferrer"
          >
            /jupyterlite/lab
          </a>
        </p>

        <ul className="mt-8 space-y-6">
          {labs.map((lesson) => (
            <li
              key={lesson.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold">
                  <span className="mr-2 font-mono text-sm text-zinc-400">
                    {lesson.id}
                  </span>
                  {localizedTitle(lesson, locale)}
                </h2>
                <Link
                  href={`/lessons/${lesson.id}?lang=${locale}`}
                  className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {locale === "zh-CN" ? "课程页" : "Lesson page"}
                </Link>
              </div>
              <BrowserRunButtons
                locale={locale}
                notebooks={lesson.jupyterlite || []}
              />
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
