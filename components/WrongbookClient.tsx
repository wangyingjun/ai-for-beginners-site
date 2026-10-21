"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collectWrongAnswers, type WrongItem } from "@/lib/wrongbook";
import { createClient } from "@/lib/supabase/client";
import { t, type Locale } from "@/lib/i18n";
import { getQuiz } from "@/lib/quizzes";

export function WrongbookClient({ locale }: { locale: Locale }) {
  const [items, setItems] = useState<WrongItem[] | null>(null);
  const [cloudNote, setCloudNote] = useState<string | null>(null);

  useEffect(() => {
    setItems(collectWrongAnswers(getQuiz, locale));

    const supabase = createClient();
    if (!supabase) return;
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("quiz_id,answers,score,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error || !data) {
        setCloudNote(null);
        return;
      }
      setCloudNote(`${data.length}`);
      // Merge cloud attempts into local derivation without mutating storage:
      // re-run collector is local-only; surface cloud count as hint.
    })();
  }, [locale]);

  if (!items) {
    return <p className="text-sm text-zinc-500">{t(locale, "authLoading")}</p>;
  }

  return (
    <div className="space-y-6">
      {cloudNote && (
        <p className="text-sm text-zinc-500">
          {t(locale, "progressRemoteCount")}: {cloudNote} (quiz_attempts)
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">{t(locale, "wrongbookEmpty")}</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={`${item.quizId}-${item.questionOrder}-${item.attemptAt}`}
              className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 dark:border-rose-900 dark:bg-rose-950/20"
            >
              <p className="text-xs text-zinc-500">
                Quiz {item.quizId} · {t(locale, "searchLesson")} {item.lessonId} ·{" "}
                {t(locale, "wrongbookFromAttempt")}{" "}
                {new Date(item.attemptAt).toLocaleString("zh-CN", {
                  timeZone: "Asia/Shanghai",
                })}
              </p>
              <p className="mt-2 font-medium">{item.questionText}</p>
              <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">
                {t(locale, "wrongbookYourAnswer")}: {item.yourAnswer}
              </p>
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                {t(locale, "wrongbookCorrect")}: {item.correctAnswer}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link
                  href={`/quiz/${item.quizId}?lang=${locale}`}
                  className="text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {t(locale, "wrongbookRetry")}
                </Link>
                <Link
                  href={`/lessons/${item.lessonId}?lang=${locale}`}
                  className="text-zinc-500 hover:underline"
                >
                  {t(locale, "quizBackToLesson")} {item.lessonId}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
