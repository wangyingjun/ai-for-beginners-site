import { ClassDetailClient } from "@/components/classes/ClassDetailClient";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";

export default async function ClassDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const locale = await resolveLocale(sp);

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <p className="mb-2 text-sm text-zinc-500">{t(locale, "classesDashboard")}</p>
        <ClassDetailClient locale={locale} classId={id} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
