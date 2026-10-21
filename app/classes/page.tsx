import Link from "next/link";
import { ClassesClient } from "@/components/classes/ClassesClient";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const locale = await resolveLocale(sp);

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">
          {t(locale, "classesTitle")}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">{t(locale, "classesIntro")}</p>
        <p className="mt-2 text-sm">
          <Link
            href={`/join?lang=${locale}`}
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {t(locale, "classesJoinLink")} →
          </Link>
        </p>
        <div className="mt-6">
          <ClassesClient locale={locale} />
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
