import { t, type Locale } from "@/lib/i18n";
import { UPSTREAM_REPO } from "@/lib/lessons";

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-5xl space-y-2 px-4 py-6 text-sm text-zinc-600 dark:text-zinc-400">
        <p>{t(locale, "attribution")}</p>
        <p>
          <a
            className="underline hover:text-zinc-900 dark:hover:text-zinc-200"
            href={`https://github.com/${UPSTREAM_REPO}`}
            target="_blank"
            rel="noreferrer"
          >
            {t(locale, "upstreamLink")}: {UPSTREAM_REPO}
          </a>
          {" · "}
          <a
            className="underline hover:text-zinc-900 dark:hover:text-zinc-200"
            href="https://opensource.org/licenses/MIT"
            target="_blank"
            rel="noreferrer"
          >
            MIT
          </a>
        </p>
      </div>
    </footer>
  );
}
