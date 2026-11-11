/**
 * Lessons that have an experiment-first (zh-CN) version.
 * Server-safe list; the client registry lives in components/experiment-lessons/registry.tsx.
 * To add a lesson: write components/experiment-lessons/lessonXX.tsx, register it there,
 * and add the id here. See docs/experiment-lessons.md.
 */
export const EXPERIMENT_LESSON_IDS = ["03"] as const;

export function hasExperimentLesson(lessonId: string, locale: string): boolean {
  return locale === "zh-CN" && (EXPERIMENT_LESSON_IDS as readonly string[]).includes(lessonId);
}
