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
  "06": dynamic(() => import("./lesson06")),
  "07": dynamic(() => import("./lesson07")),
  "08": dynamic(() => import("./lesson08")),
  "13": dynamic(() => import("./lesson13")),
  "14": dynamic(() => import("./lesson14")),
  "17": dynamic(() => import("./lesson17")),
  "18": dynamic(() => import("./lesson18")),
  "20": dynamic(() => import("./lesson20")),
  "02": dynamic(() => import("./lesson02")),
  "21": dynamic(() => import("./lesson21")),
  "22": dynamic(() => import("./lesson22")),
  "24": dynamic(() => import("./lesson24")),
  "09": dynamic(() => import("./lesson09")),
  "10": dynamic(() => import("./lesson10")),
  "11": dynamic(() => import("./lesson11")),
  "12": dynamic(() => import("./lesson12")),
  "15": dynamic(() => import("./lesson15")),
  "16": dynamic(() => import("./lesson16")),
  "19": dynamic(() => import("./lesson19")),
  "23": dynamic(() => import("./lesson23")),
  X1: dynamic(() => import("./lessonX1")),
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
