import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n";

export function resolveLocale(
  searchParams: { lang?: string } | Promise<{ lang?: string }>,
): Locale | Promise<Locale> {
  if (searchParams instanceof Promise) {
    return searchParams.then((sp) =>
      isLocale(sp.lang) ? sp.lang : DEFAULT_LOCALE,
    );
  }
  return isLocale(searchParams.lang) ? searchParams.lang : DEFAULT_LOCALE;
}
