import bankEn from "@/content/quizzes/bank.en.json";
import bankZh from "@/content/quizzes/bank.zh-CN.json";
import legacyMap from "@/content/quizzes/legacy-map.json";
import type { Locale } from "@/lib/i18n";

export type QuizOption = {
  answerText: string;
  isCorrect: boolean;
};

export type QuizQuestion = {
  order: number;
  questionText: string;
  answerOptions: QuizOption[];
};

export type Quiz = {
  id: number;
  lessonId: string;
  lessonNo: number;
  kind: "pre" | "post";
  legacyUrlNo: number;
  title: string;
  questions: QuizQuestion[];
};

type EnBank = {
  quizzes: Array<{
    id: number;
    lessonId: string;
    lessonNo: number;
    kind: "pre" | "post";
    legacyUrlNo: number;
    title: string;
    questions: Array<{
      order: number;
      questionText: string;
      answerOptions: Array<{ answerText: string; isCorrect: boolean }>;
    }>;
  }>;
};

type ZhBank = {
  quizzes: Record<
    string,
    {
      id: number;
      title: string;
      questions: Array<{
        order: number;
        questionText: string;
        answerOptions: Array<{ answerText: string }>;
      }>;
    }
  >;
};

const en = bankEn as EnBank;
const zh = bankZh as ZhBank;
const byLegacy = (legacyMap as { byLegacy: Record<string, number> }).byLegacy;
const lesson24Azure = (legacyMap as { lesson24Azure: Record<string, number> })
  .lesson24Azure;

const byId = new Map<number, (typeof en.quizzes)[number]>();
for (const q of en.quizzes) byId.set(q.id, q);

export function listQuizzes(): Quiz[] {
  return en.quizzes.map((q) => localizeQuiz(q, "en"));
}

export function getQuizIds(): number[] {
  return en.quizzes.map((q) => q.id);
}

/** Resolve route param: mk_id (101…) or legacy URL number (1…46). */
export function resolveQuizId(param: string): number | null {
  const n = Number(param);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (byId.has(n)) return n;
  const mapped = byLegacy[String(n)];
  if (mapped && byId.has(mapped)) return mapped;
  return null;
}

export function getQuiz(id: number, locale: Locale = "zh-CN"): Quiz | null {
  const base = byId.get(id);
  if (!base) return null;
  return localizeQuiz(base, locale);
}

export function getQuizzesForLesson(
  lessonId: string,
  locale: Locale = "zh-CN",
): Quiz[] {
  return en.quizzes
    .filter((q) => q.lessonId === lessonId)
    .map((q) => localizeQuiz(q, locale));
}

function localizeQuiz(
  base: (typeof en.quizzes)[number],
  locale: Locale,
): Quiz {
  const overlay = locale === "zh-CN" ? zh.quizzes[String(base.id)] : undefined;
  const questions: QuizQuestion[] = base.questions.map((qq, i) => {
    const zq = overlay?.questions[i];
    return {
      order: qq.order,
      questionText: zq?.questionText ?? qq.questionText,
      answerOptions: qq.answerOptions.map((opt, j) => ({
        answerText: zq?.answerOptions[j]?.answerText ?? opt.answerText,
        isCorrect: opt.isCorrect,
      })),
    };
  });
  return {
    id: base.id,
    lessonId: base.lessonId,
    lessonNo: base.lessonNo,
    kind: base.kind,
    legacyUrlNo: base.legacyUrlNo,
    title: overlay?.title ?? base.title,
    questions,
  };
}

/** Rewrite upstream quiz URLs to in-site /quiz/{mk_id}. */
export function rewriteQuizHref(
  href: string | undefined,
  lessonId?: string,
): string | undefined {
  if (!href) return href;

  // Lesson 24 uses a different host with colliding quiz numbers — check first.
  const azure = href.match(
    /white-water-09ec41f0f\.azurestaticapps\.net\/quiz\/(\d+)\/?/i,
  );
  if (azure) {
    const n = azure[1];
    if (lessonId === "24" && lesson24Azure[n]) {
      return `/quiz/${lesson24Azure[n]}`;
    }
    // Without lesson context, prefer lesson-24 map for 5/6, else legacy.
    if (lesson24Azure[n]) return `/quiz/${lesson24Azure[n]}`;
    const mk = byLegacy[n];
    if (mk) return `/quiz/${mk}`;
  }

  const ff = href.match(
    /ff-quizzes\.netlify\.app\/(?:en\/)?ai\/quiz\/(\d+)\/?/i,
  );
  if (ff) {
    const legacy = ff[1];
    const mk =
      byLegacy[legacy] ?? (byId.has(Number(legacy)) ? Number(legacy) : null);
    if (mk) return `/quiz/${mk}`;
  }

  return href;
}

export function isExternalQuizUrl(href: string | undefined): boolean {
  if (!href) return false;
  return (
    /ff-quizzes\.netlify\.app/i.test(href) ||
    /azurestaticapps\.net\/quiz\//i.test(href)
  );
}
