"use client";

import dynamic from "next/dynamic";
import type { ComponentType, ReactNode } from "react";

type LessonComp = ComponentType<{ advanced?: ReactNode }>;

/**
 * lessonId → experiment-first lesson component (code-split per lesson).
 * Keep in sync with lib/experiment-lessons.ts.
 */
const REGISTRY: Record<string, LessonComp> = {
  "01": dynamic(() => import("./lesson01")),
  data: dynamic(() => import("./lessonData")),
  "03": dynamic(() => import("./lesson03")),
  loss: dynamic(() => import("./lessonLoss")),
  gd: dynamic(() => import("./lessonGd")),
  "04": dynamic(() => import("./lesson04")),
  "05": dynamic(() => import("./lesson05")),
};

export function ExperimentLessonById({
  lessonId,
  advanced,
}: {
  lessonId: string;
  advanced?: ReactNode;
}) {
  const Comp = REGISTRY[lessonId];
  if (!Comp)
    return advanced ? <>{advanced}</> : <p className="text-zinc-500">这节实验课正在制作中，先去学习路线里的其他课吧。</p>;
  return <Comp advanced={advanced} />;
}
