import Link from "next/link";
import { notFound } from "next/navigation";
import { QuizPlayer } from "@/components/QuizPlayer";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { getQuiz, getQuizIds, resolveQuizId } from "@/lib/quizzes";

export function generateStaticParams() {
  const ids = new Set<string>();
  for (const id of getQuizIds()) {
    ids.add(String(id));
  }
  // Also prebuild legacy URL numbers 1..46 (+47/48 for lesson 24 synthetic)
  for (let n = 1; n <= 48; n++) ids.add(String(n));
  return Array.from(ids).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mk = resolveQuizId(id);
  if (!mk) return { title: "Quiz" };
  const quiz = getQuiz(mk, "zh-CN");
  return { title: quiz?.title ?? `Quiz ${mk}` };
}

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const locale = await resolveLocale(searchParams);
  const mk = resolveQuizId(id);
  if (!mk) notFound();
  const quiz = getQuiz(mk, locale);
  if (!quiz) notFound();

  const siblingId =
    quiz.kind === "pre" ? quiz.id + 100 : quiz.id - 100;
  const sibling = getQuiz(siblingId, locale);

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <Link
          href={`/lessons/${quiz.lessonId}?lang=${locale}`}
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← {t(locale, "quizBackToLesson")}
        </Link>
        <div className="mt-4">
          <QuizPlayer
            quiz={{
              id: quiz.id,
              lessonId: quiz.lessonId,
              kind: quiz.kind,
              title: quiz.title,
              questions: quiz.questions,
            }}
            locale={locale}
            siblingQuizId={sibling ? sibling.id : null}
          />
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
