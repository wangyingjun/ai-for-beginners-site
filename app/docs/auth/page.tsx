import { readFile } from "fs/promises";
import path from "path";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { MarkdownBody } from "@/components/MarkdownBody";
import { resolveLocale } from "@/lib/locale";

export const metadata = {
  title: "登录与班级文档",
};

export default async function AuthDocsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = await resolveLocale(searchParams);
  const md = await readFile(
    path.join(process.cwd(), "docs", "auth.md"),
    "utf8",
  );

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <Link
          href={`/classes?lang=${locale}`}
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← {locale === "en" ? "Back to classes" : "返回班级"}
        </Link>
        <article className="prose prose-zinc mt-6 max-w-none dark:prose-invert">
          <MarkdownBody content={md} />
        </article>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
