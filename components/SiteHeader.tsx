import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";
import { t, type Locale } from "@/lib/i18n";
import { LanguageToggle } from "./LanguageToggle";

export function SiteHeader({ locale }: { locale: Locale }) {
  return (
    <header className="border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href={`/?lang=${locale}`} className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t(locale, "siteName")}
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300 sm:gap-4">
          <Link href={`/?lang=${locale}`} className="hover:text-zinc-900 dark:hover:text-white">
            {t(locale, "navHome")}
          </Link>
          <Link href={`/course?lang=${locale}`} className="hover:text-zinc-900 dark:hover:text-white">
            {t(locale, "navCourse")}
          </Link>
          <Link href={`/search?lang=${locale}`} className="hover:text-zinc-900 dark:hover:text-white">
            {t(locale, "navSearch")}
          </Link>
          <Link href={`/demos?lang=${locale}`} className="hover:text-zinc-900 dark:hover:text-white">
            {t(locale, "navDemos")}
          </Link>
          <Link href={`/lab?lang=${locale}`} className="hover:text-zinc-900 dark:hover:text-white">
            Lab
          </Link>
          <Link href={`/progress?lang=${locale}`} className="hover:text-zinc-900 dark:hover:text-white">
            {t(locale, "navProgress")}
          </Link>
          <Link href={`/wrongbook?lang=${locale}`} className="hover:text-zinc-900 dark:hover:text-white">
            {t(locale, "navWrongbook")}
          </Link>
          <Link href={`/assistant?lang=${locale}`} className="hover:text-zinc-900 dark:hover:text-white">
            {t(locale, "navTutor")}
          </Link>
          <LanguageToggle locale={locale} />
          <AuthButton locale={locale} />
        </nav>
      </div>
    </header>
  );
}
