import { JoinClassClient } from "@/components/classes/JoinClassClient";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; code?: string }>;
}) {
  const sp = await searchParams;
  const locale = await resolveLocale(sp);

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">
          {t(locale, "classesJoinTitle")}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">{t(locale, "classesJoinIntro")}</p>
        <div className="mt-6">
          <JoinClassClient locale={locale} initialCode={sp.code} />
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
