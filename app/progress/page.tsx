import { ProgressClient } from "@/components/ProgressClient";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; auth?: string }>;
}) {
  const sp = await searchParams;
  const locale = await resolveLocale(sp);

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">
          {t(locale, "navProgress")}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">{t(locale, "progressHint")}</p>
        {sp.auth === "error" && (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            {t(locale, "authError")}
          </p>
        )}
        <div className="mt-6">
          <ProgressClient locale={locale} />
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
