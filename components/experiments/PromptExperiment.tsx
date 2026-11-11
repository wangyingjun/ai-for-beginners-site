"use client";

import { useEffect, useState } from "react";
import { StatusPill, btnPrimary, chip } from "@/components/lesson/ui";

const REVIEWS = ["超级好吃，下次还点", "等了一个半小时，饭都凉了", "不难吃，但是太贵了，不会再点"];
const TRUTH = ["好评", "差评", "差评"];

type Flags = { clear: boolean; format: boolean; examples: boolean };

function promptText(f: Flags): string[] {
  const lines: string[] = [];
  if (f.clear) lines.push("请判断下面每条外卖评论是「好评」还是「差评」。");
  else lines.push("帮我看看这些评论：");
  if (f.format) lines.push("每条只输出一行：编号｜好评 或 差评，不要解释。");
  if (f.examples) {
    lines.push("例子：");
    lines.push("「不贵，但是难吃」→ 差评");
    lines.push("「虽然有点慢，但是很好吃」→ 好评");
  }
  REVIEWS.forEach((r, i) => lines.push(`${i + 1}. ${r}`));
  return lines;
}

function answer(f: Flags): { text: string; labels: (string | null)[]; formatOk: boolean } {
  if (f.examples) return { text: "1｜好评\n2｜差评\n3｜差评", labels: ["好评", "差评", "差评"], formatOk: true };
  if (f.clear && f.format) return { text: "1｜好评\n2｜差评\n3｜好评", labels: ["好评", "差评", "好评"], formatOk: true };
  if (f.clear)
    return {
      text: "好的！第一条顾客很满意，是好评。第二条等了很久、饭也凉了，应该算差评。第三条说「不难吃」，说明味道还可以，我认为是好评。希望对你有帮助！",
      labels: ["好评", "差评", "好评"],
      formatOk: false,
    };
  if (f.format) return { text: "1｜还行\n2｜不太行\n3｜还行", labels: [null, null, null], formatOk: true };
  return {
    text: "这三条评论各有特点。第一条看起来顾客挺满意的；第二条提到送餐时间比较长；第三条对价格有一些看法。总体来说，这家店在配送和定价方面还有改进空间。需要我帮你写几条回复吗？",
    labels: [null, null, null],
    formatOk: false,
  };
}

export type PromptState = { sends: { flags: Flags; correct: number; formatOk: boolean }[] };

export function PromptExperiment({
  controls = false,
  onState,
}: {
  controls?: boolean;
  onState?: (s: PromptState) => void;
}) {
  const [flags, setFlags] = useState<Flags>({ clear: false, format: false, examples: false });
  const [shown, setShown] = useState<ReturnType<typeof answer> | null>(null);
  const [typing, setTyping] = useState(0);
  const [sends, setSends] = useState<PromptState["sends"]>([]);

  useEffect(() => {
    onState?.({ sends });
  }, [sends, onState]);

  useEffect(() => {
    if (!shown || typing >= shown.text.length) return;
    const t = window.setTimeout(() => setTyping((n) => Math.min(shown.text.length, n + 3)), 16);
    return () => window.clearTimeout(t);
  }, [shown, typing]);

  const send = () => {
    const a = answer(flags);
    setShown(a);
    setTyping(0);
    const correct = a.labels.filter((l, i) => l === TRUTH[i]).length;
    setSends((s) => [...s, { flags, correct, formatOk: a.formatOk }]);
  };

  const toggle = (k: keyof Flags) => {
    setFlags((f) => ({ ...f, [k]: !f[k] }));
    setShown(null);
  };

  const correct = shown ? shown.labels.filter((l, i) => l === TRUTH[i]).length : 0;
  return (
    <div className="space-y-3">
      {controls && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium">给提示词加上：</span>
          <button type="button" className={chip(flags.clear)} onClick={() => toggle("clear")}>
            说清楚要什么
          </button>
          <button type="button" className={chip(flags.format)} onClick={() => toggle("format")}>
            规定输出格式
          </button>
          <button type="button" className={chip(flags.examples)} onClick={() => toggle("examples")}>
            给 2 个例子
          </button>
        </div>
      )}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm leading-relaxed dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-1 text-xs font-semibold text-zinc-500">你的提示词</p>
        {promptText(flags).map((l, i) => (
          <p key={i} className={l.startsWith("「") || l === "例子：" ? "text-emerald-700 dark:text-emerald-300" : ""}>
            {l}
          </p>
        ))}
      </div>
      <button type="button" className={btnPrimary} onClick={send}>
        发送给 AI
      </button>
      {shown && (
        <div className="space-y-2">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm leading-relaxed whitespace-pre-line dark:border-indigo-900 dark:bg-indigo-950/40" aria-live="polite">
            <p className="mb-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">AI 的回答（预先录好的示例）</p>
            {shown.text.slice(0, typing)}
          </div>
          {typing >= shown.text.length && (
            <div className="flex flex-wrap gap-2">
              <StatusPill ok={correct === 3}>判对 {correct} / 3 条</StatusPill>
              <StatusPill ok={shown.formatOk}>{shown.formatOk ? "格式整齐，程序能直接用" : "格式不统一，程序没法直接用"}</StatusPill>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
