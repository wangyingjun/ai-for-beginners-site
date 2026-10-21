import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { WrongbookClient } from "@/components/WrongbookClient";
import { t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";

export const metadata = { title: "错题本" };

export default async function WrongbookPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = await resolveLocale(searchParams);

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="mb-2 flex flex-wrap items-center gap-4 text-sm">
          <Link
            href={`/progress?lang=${locale}`}
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← {t(locale, "navProgress")}
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t(locale, "wrongbookTitle")}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">{t(locale, "wrongbookHint")}</p>
        <div className="mt-6">
          <WrongbookClient locale={locale} />
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
