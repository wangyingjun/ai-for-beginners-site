"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { KnnDrawExperiment, type KnnState } from "@/components/experiments/KnnDrawExperiment";

type S = KnnState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "guess",
    text: <>在画板上随便画一个 ○ 或 ×，点「让电脑猜」</>,
    hint: "用手指或鼠标在格子上涂。画歪一点也没关系。",
    doneNote: (
      <>
        它不是「看懂」了你的画，而是在记住的例子里找<b>最像</b>的那个（黄框）。
      </>
    ),
    check: (s) => s.guesses >= 1,
  },
  {
    id: "feedback",
    text: <>告诉它猜得对不对；猜错了就点「错了，其实是…」教它</>,
    hint: "每教一次，下面「记住的例子」就多一个。",
    doneNote: "你给的每个例子都会变成它下次比较的依据。",
    check: (s) => s.taught >= 1 || s.correctStreak >= 1,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "empty",
    text: (
      <>
        点「清空所有例子」，再画一个让它猜。
      </>
    ),
    hint: "没有例子时，它会怎么说？",
    doneNote: "一个例子都没有，它什么也做不了——AI 的本事全来自例子。",
    check: (s) => s.noExampleGuess,
  },
  {
    id: "teach",
    text: (
      <>
        重新教它：○ 和 × <b>各教至少 2 个</b>，然后让它<b>连续猜对 3 次</b>。
      </>
    ),
    hint: "用「直接教它：这是 ○ / 这是 ×」。画得越多样，它越不容易认错。",
    doneNote: "你刚刚亲手「训练」了一个模型：给例子 → 它学 → 它能认新的画。",
    check: (s) => (s.perLabel["○"] ?? 0) >= 2 && (s.perLabel["×"] ?? 0) >= 2 && s.correctStreak >= 3,
  },
  {
    id: "triangle",
    text: (
      <>
        点「添加新类别：△」，教它一个三角形，再画一个三角形，让它猜出 △。
      </>
    ),
    hint: "如果它把三角形认成了别的，就多教它一两个三角形。",
    doneNote: "没教过 △ 时，它只会在 ○ 和 × 里硬选一个；教了，它就会了——它只认识你教过的东西。",
    check: (s) => s.guessedLabels.includes("△"),
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "说清楚「写规则」和「给例子」两种让电脑变聪明的办法，知道今天的 AI 主要靠后一种。",
  play: (
    <Experiment<S>
      intro={<>电脑已经记住了 4 个例子（2 个 ○、2 个 ×）。看看它能不能认出你的画：</>}
      tasks={playTasks}
      storageKey="exp:01:play"
      render={(report) => <KnnDrawExperiment onState={report} />}
    />
  ),
  observe: {
    question: "电脑是怎么决定猜 ○ 还是 × 的？",
    options: ["它有一条写好的规则：「圆的就是 ○」", "它在记住的例子里找最像的那个，跟着那个的答案猜", "随机猜"],
    answer: 1,
    explanation: "没有人给它写过「什么是圆」的规则，它只是拿你的画和每个例子比一比，挑最像的。",
    hintOnWrong: "看看猜完后出现的黄框：它在指哪个例子？",
  },
  explain: (
    <>
      <p>
        想教一个小朋友认猫，你有两种办法：一是<b>写一份说明书</b>（有胡子、尖耳朵、四条腿……），二是<b>给他看很多猫的照片</b>
        ，看多了他自然就认得。
      </p>
      <p>
        第一种办法很快会碰壁：总有说明书没写到的情况（没胡子的猫？侧脸的猫？）。第二种办法不需要你说清楚「为什么」，只要例子够多。
      </p>
      <p>
        早期的 AI 主要靠写规则；今天的 AI 几乎都靠<b>给例子</b>：你刚才的画板就是缩小版——例子越多、越多样，它认得越准；没教过的东西，它就不会。
      </p>
    </>
  ),
  terms: [
    {
      name: "训练数据",
      definition: <>拿来教 AI 的例子，每个例子都带着正确答案（这张画是 ○）。刚才「电脑记住的例子」就是训练数据。</>,
    },
    {
      name: "模型",
      definition: (
        <>
          从训练数据里学出来的那个「会猜答案的东西」。给它一个新输入（你的画），它给出一个答案（○ 或 ×）。用数据把模型教会的过程叫<b>训练</b>。
        </>
      ),
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>现在你可以清空例子、加新类别了。完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:01:practice"
      aha={
        <>
          AI 不是被「写」出来的，是被「教」出来的：<b>例子决定了它会什么</b>。下一课看看：电脑眼里的「例子」到底长什么样？
        </>
      }
      render={(report) => <KnnDrawExperiment advanced onState={report} />}
    />
  ),
  quiz: [
    {
      question: "下面哪个是「给例子」的办法，而不是「写规则」？",
      options: ["写下「有 4 条腿、会汪汪叫的是狗」", "给电脑看 1 万张标好了「狗 / 不是狗」的照片", "规定「体重大于 20 公斤是大狗」"],
      answer: 1,
      explanation: "另外两个都是人写好的规则；只有第二个是让电脑从带答案的例子里自己学。",
    },
    {
      question: "电脑一个例子都没有的时候，它能认出你画的 ○ 吗？",
      options: ["能，它天生就认识 ○", "不能，它没有任何可以比较的依据", "能，只是慢一点"],
      answer: 1,
      explanation: "这种 AI 的本事完全来自训练数据。没有数据，就没有模型。",
    },
    {
      question: "只教过 ○ 和 × 的模型，看到一个三角形会怎样？",
      options: ["回答「这是三角形」", "在 ○ 和 × 里硬选一个最像的", "自动学会三角形"],
      answer: 1,
      explanation: "它只知道教过的类别，所以只能在里面挑。想让它认三角形，就得给三角形的例子。",
    },
  ],
  summary: <>今天的 AI 靠「给例子」学会本领：训练数据决定模型会什么，没教过的它就不会。</>,
  next: {
    question: "你的画在电脑眼里是一格格的 0 和 1。那一条外卖评论呢？",
    href: "/lessons/data",
    label: "去下一课：数据就是一堆点 →",
  },
  advancedIntro: (
    <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 text-[15px] leading-relaxed dark:border-zinc-800 dark:bg-zinc-950">
      <p className="font-semibold">实验背后（选读）</p>
      <p>
        画板用的是最简单的一种机器学习办法：<b>最近邻</b>（k-Nearest Neighbors，k=1）——把新输入和每个训练例子逐格比较，取最像的那个的答案。真正的图像识别用的是后面会学的神经网络，但「从带答案的例子里学」这一点完全一样。
      </p>
      <p className="text-sm text-zinc-500">下面是原课程第 01 课：人工智能简介与历史（符号主义 vs 神经网络等），可以当作阅读材料。</p>
    </div>
  ),
};

export default function Lesson01({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
