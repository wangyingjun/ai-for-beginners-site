import Link from "next/link";
import { CartPoleDemo } from "@/components/demos/CartPoleDemo";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";

export const metadata = { title: "CartPole 强化学习" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = await resolveLocale(searchParams);

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
          <Link
            href={`/demos?lang=${locale}`}
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← {t(locale, "navDemos")}
          </Link>
          <Link
            href={`/lessons/22?lang=${locale}`}
            className="text-zinc-500 hover:underline"
          >
            {t(locale, "demoBackToLesson")} 22
          </Link>
        </div>
        <CartPoleDemo locale={locale} showFullscreenLink={false} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
