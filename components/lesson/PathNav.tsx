import Link from "next/link";
import { pathNeighbors, stageOf } from "@/lib/learning-path";

/** Prev / next along the beginner learning path (zh-CN). */
export function PathNav({ lessonId }: { lessonId: string }) {
  const { prev, next } = pathNeighbors(lessonId);
  const stage = stageOf(lessonId);
  return (
    <nav className="mt-12 space-y-3 border-t border-zinc-200 pt-6 text-sm dark:border-zinc-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {prev ? (
          <Link href={`/lessons/${prev.id}?lang=zh-CN`} className="text-indigo-600 hover:underline dark:text-indigo-400">
            ← 上一课：{prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/lessons/${next.id}?lang=zh-CN`} className="text-indigo-600 hover:underline sm:text-right dark:text-indigo-400">
            下一课：{next.title} →
          </Link>
        ) : (
          <span />
        )}
      </div>
      <Link href="/course?lang=zh-CN" className="inline-block text-zinc-500 hover:underline">
        ↑ 返回学习路线{stage ? `（${stage.title}）` : ""}
      </Link>
    </nav>
  );
}
