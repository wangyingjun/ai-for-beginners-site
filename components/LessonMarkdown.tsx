import { MarkdownBody } from "@/components/MarkdownBody";
import { loadLessonMarkdown } from "@/lib/content";
import type { Locale } from "@/lib/i18n";

export async function LessonMarkdown({
  lessonId,
  locale,
}: {
  lessonId: string;
  locale: Locale;
}) {
  const md = await loadLessonMarkdown(lessonId, locale);
  if (!md) return null;
  return <MarkdownBody content={md} />;
}
