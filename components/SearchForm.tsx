"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";

export function SearchForm({
  locale,
  initialQuery = "",
}: {
  locale: Locale;
  initialQuery?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        params.set("lang", locale);
        router.push(`/search?${params.toString()}`);
      }}
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t(locale, "searchPlaceholder")}
        className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        aria-label={t(locale, "searchTitle")}
      />
      <button
        type="submit"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
      >
        {t(locale, "searchButton")}
      </button>
    </form>
  );
}
