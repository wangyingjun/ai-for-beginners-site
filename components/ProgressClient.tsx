"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  loadLocalProgress,
  type LocalProgressStore,
} from "@/lib/progress";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { getLessonById, localizedTitle } from "@/lib/lessons";

export function ProgressClient({ locale }: { locale: Locale }) {
  const [store, setStore] = useState<LocalProgressStore | null>(null);
  const [remoteCount, setRemoteCount] = useState<number | null>(null);
  const [userLabel, setUserLabel] = useState<string | null>(null);

  useEffect(() => {
    setStore(loadLocalProgress());
    const supabase = createClient();
    if (!supabase) return;
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserLabel(
        user.user_metadata?.user_name ||
          user.user_metadata?.preferred_username ||
          user.email ||
          user.id.slice(0, 8),
      );
      const { data, error } = await supabase
        .from("progress")
        .select("lesson_id,item_type,item_id,status,updated_at");
      if (!error && data) setRemoteCount(data.length);

      // Merge local → remote (best-effort)
      const local = loadLocalProgress();
      if (local.items.length > 0) {
        const rows = local.items.map((i) => ({
          user_id: user.id,
          lesson_id: i.lessonId,
          item_type: i.itemType,
          item_id: i.itemId,
          status: i.status,
          updated_at: i.updatedAt,
        }));
        await supabase.from("progress").upsert(rows, {
          onConflict: "user_id,lesson_id,item_type,item_id",
        });
      }
      for (const a of local.quizAttempts.slice(0, 20)) {
        await supabase.from("quiz_attempts").insert({
          user_id: user.id,
          quiz_id: a.quizId,
          answers: a.answers,
          score: a.score,
          created_at: a.createdAt,
        });
      }
    })();
  }, []);

  if (!store) {
    return <p className="text-sm text-zinc-500">{t(locale, "authLoading")}</p>;
  }

  const lessons = store.items.filter((i) => i.itemType === "lesson");
  const quizzes = store.items.filter((i) => i.itemType === "quiz");

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
        <p>
          {userLabel
            ? `${t(locale, "authSignedIn")}: ${userLabel}`
            : t(locale, "progressAnonymous")}
        </p>
        {remoteCount != null && (
          <p className="mt-1 text-zinc-500">
            {t(locale, "progressRemoteCount")}: {remoteCount}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">
          {t(locale, "progressLessons")} ({lessons.length})
        </h2>
        {lessons.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">{t(locale, "progressEmpty")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {lessons
              .slice()
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
              .map((item) => {
                const lesson = getLessonById(item.lessonId);
                const title = lesson
                  ? localizedTitle(lesson, locale)
                  : item.lessonId;
                return (
                  <li key={`${item.lessonId}-${item.itemId}`}>
                    <Link
                      href={`/lessons/${item.lessonId}?lang=${locale}`}
                      className="text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {item.lessonId} · {title}
                    </Link>
                    <span className="ml-2 text-xs text-zinc-400">
                      {new Date(item.updatedAt).toLocaleString("zh-CN", {
                        timeZone: "Asia/Shanghai",
                      })}
                    </span>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">
          {t(locale, "progressQuizzes")} ({quizzes.length})
        </h2>
        {quizzes.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">{t(locale, "progressEmpty")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {quizzes
              .slice()
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
              .map((item) => (
                <li key={`${item.lessonId}-quiz-${item.itemId}`}>
                  <Link
                    href={`/quiz/${item.itemId}?lang=${locale}`}
                    className="text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Quiz {item.itemId}
                  </Link>
                  {item.score != null && (
                    <span className="ml-2 text-sm">
                      {Math.round(item.score * 100)}%
                    </span>
                  )}
                </li>
              ))}
          </ul>
        )}
      </section>

      {store.quizAttempts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">
            {t(locale, "progressAttempts")} ({store.quizAttempts.length})
          </h2>
          <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
            {store.quizAttempts.slice(0, 15).map((a, i) => (
              <li key={`${a.quizId}-${a.createdAt}-${i}`}>
                <Link
                  href={`/quiz/${a.quizId}?lang=${locale}`}
                  className="text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  #{a.quizId}
                </Link>
                {" · "}
                {Math.round(a.score * 100)}%
                {" · "}
                {new Date(a.createdAt).toLocaleString("zh-CN", {
                  timeZone: "Asia/Shanghai",
                })}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
