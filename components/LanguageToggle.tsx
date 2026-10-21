"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n";

export function LanguageToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setLocale(next: Locale) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex overflow-hidden rounded-md border border-zinc-300 text-xs dark:border-zinc-600">
      <button
        type="button"
        onClick={() => setLocale("zh-CN")}
        className={`px-2 py-1 ${locale === "zh-CN" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-white dark:bg-zinc-950"}`}
        aria-pressed={locale === "zh-CN"}
      >
        中文
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`px-2 py-1 ${locale === "en" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-white dark:bg-zinc-950"}`}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
