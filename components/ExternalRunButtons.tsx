import { t, type Locale } from "@/lib/i18n";
import { binderUrl, colabUrl, codespacesUrl } from "@/lib/lessons";

export function ExternalRunButtons({
  locale,
  path,
  file,
}: {
  locale: Locale;
  path: string;
  file: string;
}) {
  const links = [
    { href: colabUrl(path, file), label: t(locale, "openColab") },
    { href: codespacesUrl(path, file), label: t(locale, "openCodespaces") },
    { href: binderUrl(path, file), label: t(locale, "openBinder") },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
