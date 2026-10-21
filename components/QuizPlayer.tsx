"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { recordQuizAttemptLocal } from "@/lib/progress";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export type QuizPlayerQuestion = {
  order: number;
  questionText: string;
  answerOptions: Array<{ answerText: string; isCorrect: boolean }>;
};

export type QuizPlayerData = {
  id: number;
  lessonId: string;
  kind: "pre" | "post";
  title: string;
  questions: QuizPlayerQuestion[];
};

type Props = {
  quiz: QuizPlayerData;
  locale: Locale;
  siblingQuizId?: number | null;
};

export function QuizPlayer({ quiz, locale, siblingQuizId }: Props) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => quiz.questions.map(() => null),
  );
  const [submitted, setSubmitted] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  const allAnswered = useMemo(
    () => answers.every((a) => a !== null),
    [answers],
  );

  const score = useMemo(() => {
    if (!submitted) return null;
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      const chosen = answers[i];
      if (chosen !== null && q.answerOptions[chosen]?.isCorrect) correct += 1;
    });
    return { correct, total: quiz.questions.length, ratio: correct / quiz.questions.length };
  }, [submitted, answers, quiz.questions]);

  const onSelect = (qi: number, oi: number) => {
    if (submitted) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[qi] = oi;
      return next;
    });
  };

  const onSubmit = useCallback(async () => {
    if (!allAnswered || submitted) return;
    setSubmitted(true);

    const chosen = answers.map((a) => a ?? -1);
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (chosen[i] >= 0 && q.answerOptions[chosen[i]]?.isCorrect) correct += 1;
    });
    const ratio = correct / quiz.questions.length;

    recordQuizAttemptLocal({
      quizId: quiz.id,
      lessonId: quiz.lessonId,
      answers: chosen,
      score: ratio,
    });

    const supabase = createClient();
    if (!supabase) {
      setSyncNote(t(locale, "quizSavedLocal"));
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSyncNote(t(locale, "quizSavedLocal"));
      return;
    }

    const [{ error: attemptErr }, { error: progressErr }] = await Promise.all([
      supabase.from("quiz_attempts").insert({
        user_id: user.id,
        quiz_id: quiz.id,
        answers: chosen,
        score: ratio,
      }),
      supabase.from("progress").upsert(
        {
          user_id: user.id,
          lesson_id: quiz.lessonId,
          item_type: "quiz",
          item_id: String(quiz.id),
          status: "completed",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id,item_type,item_id" },
      ),
    ]);

    if (attemptErr || progressErr) {
      setSyncNote(t(locale, "quizSyncFailed"));
    } else {
      setSyncNote(t(locale, "quizSynced"));
    }
  }, [allAnswered, submitted, answers, quiz, locale]);

  const onRetry = () => {
    setAnswers(quiz.questions.map(() => null));
    setSubmitted(false);
    setSyncNote(null);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm text-zinc-500">
          {quiz.kind === "pre" ? t(locale, "quizPre") : t(locale, "quizPost")}
          {" · "}
          <Link
            href={`/lessons/${quiz.lessonId}?lang=${locale}`}
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {t(locale, "quizBackToLesson")} {quiz.lessonId}
          </Link>
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{quiz.title}</h1>
        <p className="text-sm text-zinc-500">
          {quiz.questions.length} {t(locale, "quizQuestions")}
        </p>
      </header>

      <ol className="space-y-6">
        {quiz.questions.map((q, qi) => {
          const chosen = answers[qi];
          return (
            <li
              key={q.order}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                <span className="mr-2 font-mono text-sm text-zinc-400">
                  {qi + 1}.
                </span>
                {q.questionText}
              </p>
              <ul className="mt-3 space-y-2">
                {q.answerOptions.map((opt, oi) => {
                  const selected = chosen === oi;
                  let cls =
                    "flex w-full cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ";
                  if (!submitted) {
                    cls += selected
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                      : "border-zinc-200 hover:border-indigo-300 dark:border-zinc-700";
                  } else if (opt.isCorrect) {
                    cls += "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40";
                  } else if (selected) {
                    cls += "border-rose-400 bg-rose-50 dark:bg-rose-950/40";
                  } else {
                    cls += "border-zinc-200 opacity-60 dark:border-zinc-700";
                  }
                  return (
                    <li key={oi}>
                      <button
                        type="button"
                        className={cls}
                        onClick={() => onSelect(qi, oi)}
                        disabled={submitted}
                      >
                        <span className="mt-0.5 font-mono text-xs text-zinc-400">
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        <span>{opt.answerText}</span>
                        {submitted && opt.isCorrect && (
                          <span className="ml-auto text-xs text-emerald-700 dark:text-emerald-300">
                            ✓
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        {!submitted ? (
          <button
            type="button"
            disabled={!allAnswered}
            onClick={onSubmit}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t(locale, "quizSubmit")}
          </button>
        ) : (
          <>
            <p className="text-sm font-medium">
              {t(locale, "quizScore")}: {score?.correct}/{score?.total} (
              {Math.round((score?.ratio ?? 0) * 100)}%)
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600"
            >
              {t(locale, "quizRetry")}
            </button>
          </>
        )}
        {siblingQuizId != null && (
          <Link
            href={`/quiz/${siblingQuizId}?lang=${locale}`}
            className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {quiz.kind === "pre"
              ? t(locale, "quizGoPost")
              : t(locale, "quizGoPre")}{" "}
            →
          </Link>
        )}
      </div>
      {syncNote && (
        <p className="text-xs text-zinc-500">{syncNote}</p>
      )}
    </div>
  );
}
