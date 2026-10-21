import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";

export const metadata = { title: "互动演示" };

export default async function DemosIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = await resolveLocale(searchParams);

  const cards = [
    {
      href: `/demos/perceptron?lang=${locale}`,
      title: t(locale, "demoPerceptronTitle"),
      body: t(locale, "demoPerceptronHint"),
      lesson: "03",
    },
    {
      href: `/demos/mlp?lang=${locale}`,
      title: t(locale, "demoMlpTitle"),
      body: t(locale, "demoMlpHint"),
      lesson: "04",
    },
  ];

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">
          {t(locale, "demoIndexTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          {t(locale, "demoIndexBody")}
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className="block h-full rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-700"
              >
                <h2 className="text-lg font-semibold">{c.title}</h2>
                <p className="mt-2 text-sm text-zinc-500">{c.body}</p>
                <p className="mt-3 text-xs text-indigo-600 dark:text-indigo-400">
                  {t(locale, "demoRelatedLesson")}: {c.lesson}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
