/**
 * Lessons that have an experiment-first (zh-CN) version.
 * Server-safe list; the client registry lives in components/experiment-lessons/registry.tsx.
 * To add a lesson: write components/experiment-lessons/lessonXX.tsx (default export),
 * register it there, and add the id here. See docs/experiment-lessons.md.
 */
export const EXPERIMENT_LESSON_IDS: readonly string[] = ["01", "data", "03", "loss", "gd", "04", "05", "06", "07", "08"];

export function hasExperimentLesson(lessonId: string, locale: string): boolean {
  return locale === "zh-CN" && EXPERIMENT_LESSON_IDS.includes(lessonId);
}
