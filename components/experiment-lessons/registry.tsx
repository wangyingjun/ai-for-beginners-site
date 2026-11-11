"use client";

import type { ComponentType, ReactNode } from "react";
import { Lesson03 } from "@/components/experiment-lessons/lesson03";

/** lessonId → experiment-first lesson component. Keep in sync with lib/experiment-lessons.ts. */
const REGISTRY: Record<string, ComponentType<{ advanced?: ReactNode }>> = {
  "03": Lesson03,
};

export function ExperimentLessonById({
  lessonId,
  advanced,
}: {
  lessonId: string;
  advanced?: ReactNode;
}) {
  const Comp = REGISTRY[lessonId];
  if (!Comp) return <>{advanced}</>;
  return <Comp advanced={advanced} />;
}
