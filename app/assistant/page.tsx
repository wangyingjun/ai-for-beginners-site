import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TutorChat } from "@/components/tutor/TutorChat";
import { t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { getIndexMeta } from "@/lib/rag/retrieve";

export const metadata = {
  title: "AI 助教",
};

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; lesson?: string }>;
}) {
  const sp = await searchParams;
  const locale = await resolveLocale(searchParams);
  const lessonId = sp.lesson?.trim() || null;
  const meta = getIndexMeta();

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t(locale, "tutorTitle")}</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {t(locale, "tutorPageIntro")}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {t(locale, "tutorIndexMeta")}: {meta.chunkCount} chunks · upstream{" "}
            {meta.upstreamSha ?? "—"}
          </p>
          <p className="mt-2 text-xs">
            <Link
              href="/docs/ai-tutor"
              className="text-indigo-600 hover:underline dark:text-indigo-400"
            >
              docs/ai-tutor.md
            </Link>
          </p>
        </div>
        <TutorChat locale={locale} lessonId={lessonId} variant="page" />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
