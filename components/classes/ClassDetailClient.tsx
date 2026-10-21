"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  formatScorePct,
  scoreToHeatColor,
  type ClassRow,
} from "@/lib/classes";
import { getLessons, localizedTitle } from "@/lib/lessons";
import { listQuizzes } from "@/lib/quizzes";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type MemberInfo = {
  userId: string;
  displayName: string;
  joinedAt: string;
  lessonsVisited: number;
  quizzesDone: number;
  avgScore: number | null;
  /** lessonId → best quiz score (0–1) or null */
  lessonScores: Record<string, number | null>;
  /** quizId → best score */
  quizScores: Record<number, number>;
};

export function ClassDetailClient({
  locale,
  classId,
}: {
  locale: Locale;
  classId: string;
}) {
  const configured = isSupabaseConfigured();
  const lessons = useMemo(() => getLessons(), []);
  const quizzes = useMemo(() => listQuizzes(), []);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [klass, setKlass] = useState<ClassRow | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(
    async (u: User) => {
      const supabase = createClient();
      if (!supabase) return;
      setError(null);
      const { data: c, error: e1 } = await supabase
        .from("classes")
        .select("id,teacher_id,name,invite_code,created_at")
        .eq("id", classId)
        .maybeSingle();
      if (e1) {
        setError(e1.message);
        return;
      }
      if (!c) {
        setError(t(locale, "classesNotFound"));
        setKlass(null);
        return;
      }
      setKlass(c as ClassRow);
      if (c.teacher_id !== u.id) {
        // Members can see the class exists but not the teacher dashboard.
        setMembers([]);
        return;
      }

      const { data: rows, error: e2 } = await supabase
        .from("class_members")
        .select("user_id,joined_at")
        .eq("class_id", classId);
      if (e2) {
        setError(e2.message);
        return;
      }
      const memberIds = (rows ?? []).map((r) => r.user_id as string);
      if (memberIds.length === 0) {
        setMembers([]);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,display_name")
        .in("id", memberIds);
      const nameById = new Map<string, string>();
      for (const p of profiles ?? []) {
        nameById.set(p.id as string, (p.display_name as string) || (p.id as string).slice(0, 8));
      }

      const { data: progressRows } = await supabase
        .from("progress")
        .select("user_id,lesson_id,item_type,item_id,status")
        .in("user_id", memberIds);

      const { data: attemptRows } = await supabase
        .from("quiz_attempts")
        .select("user_id,quiz_id,score")
        .in("user_id", memberIds);

      const infos: MemberInfo[] = (rows ?? []).map((r) => {
        const uid = r.user_id as string;
        const myProgress = (progressRows ?? []).filter((p) => p.user_id === uid);
        const lessonsVisited = new Set(
          myProgress
            .filter((p) => p.item_type === "lesson")
            .map((p) => p.lesson_id as string),
        ).size;
        const quizzesDone = new Set(
          myProgress
            .filter((p) => p.item_type === "quiz")
            .map((p) => p.item_id as string),
        ).size;

        const quizScores: Record<number, number> = {};
        for (const a of attemptRows ?? []) {
          if (a.user_id !== uid) continue;
          const qid = a.quiz_id as number;
          const score = Number(a.score);
          if (!Number.isFinite(score)) continue;
          quizScores[qid] = Math.max(quizScores[qid] ?? 0, score);
        }
        // Also fold progress.score-like items if present via quiz progress status only.

        const lessonScores: Record<string, number | null> = {};
        for (const lesson of lessons) {
          const related = quizzes.filter((q) => q.lessonId === lesson.id);
          if (related.length === 0) {
            const visited = myProgress.some(
              (p) => p.item_type === "lesson" && p.lesson_id === lesson.id,
            );
            // No quiz for this lesson: mark mid tone if visited, else empty.
            lessonScores[lesson.id] = visited ? 0.55 : null;
            continue;
          }
          const scores = related
            .map((q) => quizScores[q.id])
            .filter((s): s is number => s != null);
          lessonScores[lesson.id] =
            scores.length === 0 ? null : scores.reduce((a, b) => a + b, 0) / scores.length;
        }

        const allScores = Object.values(quizScores);
        const avgScore =
          allScores.length === 0
            ? null
            : allScores.reduce((a, b) => a + b, 0) / allScores.length;

        return {
          userId: uid,
          displayName: nameById.get(uid) || uid.slice(0, 8),
          joinedAt: r.joined_at as string,
          lessonsVisited,
          quizzesDone,
          avgScore,
          lessonScores,
          quizScores,
        };
      });

      infos.sort((a, b) => a.displayName.localeCompare(b.displayName, "zh-CN"));
      setMembers(infos);
    },
    [classId, locale, lessons, quizzes],
  );

  useEffect(() => {
    if (!configured) {
      setReady(true);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setReady(true);
      return;
    }
    let mounted = true;
    void (async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(u);
      if (u) await load(u);
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [configured, load]);

  const copyInvite = async () => {
    if (!klass) return;
    try {
      await navigator.clipboard.writeText(klass.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (!ready) {
    return <p className="text-sm text-zinc-500">{t(locale, "authLoading")}</p>;
  }

  if (!configured || !user) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-medium">{t(locale, "classesNeedLogin")}</p>
        <p className="mt-2">{t(locale, "classesNeedLoginHint")}</p>
        <Link
          href={`/docs/auth?lang=${locale}`}
          className="mt-3 inline-block text-indigo-700 underline dark:text-indigo-300"
        >
          docs/auth.md
        </Link>
      </div>
    );
  }

  if (error && !klass) {
    return <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>;
  }

  if (!klass) {
    return <p className="text-sm text-zinc-500">{t(locale, "classesNotFound")}</p>;
  }

  const isTeacher = klass.teacher_id === user.id;

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h1 className="text-2xl font-bold tracking-tight">{klass.name}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {t(locale, "classesInviteCode")}:{" "}
          <code className="font-mono text-base tracking-wider text-zinc-800 dark:text-zinc-100">
            {klass.invite_code}
          </code>{" "}
          <button
            type="button"
            onClick={() => void copyInvite()}
            className="ml-2 rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
          >
            {copied ? t(locale, "classesCopied") : t(locale, "classesCopyInvite")}
          </button>
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          {t(locale, "classesJoinHint")}:{" "}
          <Link href={`/join?code=${klass.invite_code}&lang=${locale}`} className="underline">
            /join?code={klass.invite_code}
          </Link>
        </p>
        {!isTeacher && (
          <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">
            {t(locale, "classesMemberViewOnly")}
          </p>
        )}
      </div>

      {isTeacher && (
        <>
          <section>
            <h2 className="text-lg font-semibold">
              {t(locale, "classesRoster")} ({members.length})
            </h2>
            {members.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">{t(locale, "classesRosterEmpty")}</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
                      <th className="py-2 pr-3 font-medium">{t(locale, "classesMember")}</th>
                      <th className="py-2 pr-3 font-medium">{t(locale, "progressLessons")}</th>
                      <th className="py-2 pr-3 font-medium">{t(locale, "progressQuizzes")}</th>
                      <th className="py-2 font-medium">{t(locale, "classesAvgScore")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr
                        key={m.userId}
                        className="border-b border-zinc-100 dark:border-zinc-900"
                      >
                        <td className="py-2 pr-3 font-medium">{m.displayName}</td>
                        <td className="py-2 pr-3">{m.lessonsVisited}</td>
                        <td className="py-2 pr-3">{m.quizzesDone}</td>
                        <td className="py-2">{formatScorePct(m.avgScore)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold">{t(locale, "classesHeatmap")}</h2>
            <p className="mt-1 text-sm text-zinc-500">{t(locale, "classesHeatmapHint")}</p>
            {members.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">{t(locale, "classesRosterEmpty")}</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-white py-1 pr-2 text-left font-medium dark:bg-zinc-950">
                        {t(locale, "classesMember")}
                      </th>
                      {lessons.map((lesson) => (
                        <th
                          key={lesson.id}
                          className="px-0.5 py-1 text-center font-medium text-zinc-500"
                          title={localizedTitle(lesson, locale)}
                        >
                          {lesson.id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.userId}>
                        <td className="sticky left-0 z-10 max-w-[8rem] truncate bg-white py-0.5 pr-2 font-medium dark:bg-zinc-950">
                          {m.displayName}
                        </td>
                        {lessons.map((lesson) => {
                          const score = m.lessonScores[lesson.id];
                          return (
                            <td key={lesson.id} className="p-0.5">
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded ${scoreToHeatColor(score)}`}
                                title={`${localizedTitle(lesson, locale)}: ${formatScorePct(score)}`}
                              >
                                {score == null ? "" : Math.round(score * 100)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold">{t(locale, "classesQuizHeatmap")}</h2>
            <p className="mt-1 text-sm text-zinc-500">{t(locale, "classesQuizHeatmapHint")}</p>
            {members.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">{t(locale, "classesRosterEmpty")}</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-white py-1 pr-2 text-left font-medium dark:bg-zinc-950">
                        {t(locale, "classesMember")}
                      </th>
                      {quizzes.map((q) => (
                        <th
                          key={q.id}
                          className="px-0.5 py-1 text-center font-medium text-zinc-500"
                          title={`${q.title} (${q.kind})`}
                        >
                          {q.id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.userId}>
                        <td className="sticky left-0 z-10 max-w-[8rem] truncate bg-white py-0.5 pr-2 font-medium dark:bg-zinc-950">
                          {m.displayName}
                        </td>
                        {quizzes.map((q) => {
                          const score = m.quizScores[q.id] ?? null;
                          return (
                            <td key={q.id} className="p-0.5">
                              <div
                                className={`flex h-6 w-6 items-center justify-center rounded ${scoreToHeatColor(score)}`}
                                title={`${q.title}: ${formatScorePct(score)}`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      <p>
        <Link
          href={`/classes?lang=${locale}`}
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← {t(locale, "classesBack")}
        </Link>
      </p>
    </div>
  );
}
