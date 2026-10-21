"use client";

import { loadLocalProgress } from "@/lib/progress";
import type { Locale } from "@/lib/i18n";

export type WrongItem = {
  quizId: number;
  lessonId: string;
  questionOrder: number;
  questionText: string;
  yourAnswer: string;
  correctAnswer: string;
  attemptAt: string;
};

type QuizLike = {
  id: number;
  lessonId: string;
  questions: Array<{
    order: number;
    questionText: string;
    answerOptions: Array<{ answerText: string; isCorrect: boolean }>;
  }>;
};

/**
 * Build wrong-answer list from local quiz attempts.
 * `getQuiz` is passed in so this module stays client-safe without importing JSON banks twice.
 */
export function collectWrongAnswers(
  getQuiz: (id: number, locale: Locale) => QuizLike | null,
  locale: Locale,
): WrongItem[] {
  const store = loadLocalProgress();
  const out: WrongItem[] = [];
  const seen = new Set<string>();

  for (const attempt of store.quizAttempts) {
    const quiz = getQuiz(attempt.quizId, locale);
    if (!quiz) continue;
    quiz.questions.forEach((q, qi) => {
      const chosen = attempt.answers[qi];
      if (chosen == null || chosen < 0) return;
      const opt = q.answerOptions[chosen];
      if (!opt || opt.isCorrect) return;
      const correct =
        q.answerOptions.find((o) => o.isCorrect)?.answerText ?? "";
      const key = `${quiz.id}:${q.order}`;
      // Keep most recent wrong for each question
      if (seen.has(key)) return;
      seen.add(key);
      out.push({
        quizId: quiz.id,
        lessonId: quiz.lessonId,
        questionOrder: q.order,
        questionText: q.questionText,
        yourAnswer: opt.answerText,
        correctAnswer: correct,
        attemptAt: attempt.createdAt,
      });
    });
  }
  return out;
}
