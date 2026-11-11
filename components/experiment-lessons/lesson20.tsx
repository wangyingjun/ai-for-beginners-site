"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { PromptExperiment, type PromptState } from "@/components/experiments/PromptExperiment";

type S = PromptState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "vague",
    text: <>点「发送给 AI」，看看它怎么回答这个很随意的提示词</>,
    doneNote: "它说了一大堆，可就是没告诉你哪条是好评、哪条是差评——因为你没说要什么。",
    check: (s) => s.sends.some((x) => !x.flags.clear && !x.flags.format && !x.flags.examples),
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "clear",
    text: <>加上「说清楚要什么」，再发送</>,
    doneNote: "这次它开始判断了，但废话很多，格式也乱，第 3 条还判错了。",
    check: (s) => s.sends.some((x) => x.flags.clear && !x.flags.examples),
  },
  {
    id: "format",
    text: <>再加上「规定输出格式」，发送</>,
    doneNote: "格式整齐了，程序能直接读。可第 3 条「不难吃，但是太贵了」它还是判成了好评。",
    check: (s) => s.sends.some((x) => x.flags.clear && x.flags.format && !x.flags.examples),
  },
  {
    id: "examples",
    text: <>最后加上「给 2 个例子」，发送，争取 3 条全对</>,
    doneNote: "两个带「但是」的例子，让它学会了「看但是后面那半句」，3 条全对。",
    check: (s) => s.sends.some((x) => x.flags.examples && x.correct === 3),
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "写出更好的提示词：说清楚要什么、规定格式、给几个例子。",
  play: (
    <Experiment<S>
      intro={<>你想让 AI 帮你判断 3 条外卖评论是好评还是差评。先随便问问：</>}
      tasks={playTasks}
      storageKey="exp:20:play"
      render={(report) => <PromptExperiment onState={report} />}
    />
  ),
  observe: {
    question: "为什么 AI 没有给出你想要的「好评 / 差评」？",
    options: ["它不会判断", "提示词没说清楚要它做什么，它只好随便聊", "评论太难了"],
    answer: 1,
    explanation: "语言模型只是在「接着你的话往下写」。你说「看看这些评论」，它就写一段读后感。",
    hintOnWrong: "再读一遍你发的提示词：里面有没有说要判断好评差评？",
  },
  explain: (
    <>
      <p>
        想象你请一位很聪明、但<b>第一天来上班</b>的实习生帮忙：你说「看看这些评论」，他只能猜你想要什么。你说「判断每条是好评还是差评，每行写一个结果」，他就知道该交什么了。
      </p>
      <p>
        再给他看两个做好的例子，连「不难吃但太贵」这种绕弯子的说法也知道怎么判。
      </p>
      <p>
        AI 也是这样。上一课我们知道，它是根据前文猜下一个字的——<b>你写的提示词就是前文</b>，写得越清楚，它接下去写的就越接近你要的。
      </p>
    </>
  ),
  terms: [
    {
      name: "提示词",
      definition: <>你发给 AI 的那段话（Prompt）。好的提示词通常包括：要做什么、给什么材料、输出成什么格式、注意什么。设计提示词的技巧叫提示工程。</>,
    },
    {
      name: "少样本",
      definition: <>在提示词里直接给几个「输入 → 答案」的例子，让 AI 照着做（Few-shot）。不用重新训练模型，就能教会它新的格式和判断标准。</>,
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>现在可以给提示词加料了。按顺序完成 3 个小任务（回答是预先录好的示例，用来对比效果）：</>}
      tasks={practiceTasks}
      storageKey="exp:20:practice"
      aha={
        <>
          同一个模型，问法不同，结果天差地别。<b>说清楚 + 定格式 + 给例子</b>，是写提示词最管用的三招。阶段 3 完成！
        </>
      }
      render={(report) => <PromptExperiment controls onState={report} />}
    />
  ),
  quiz: [
    {
      question: "下面哪个提示词最可能得到你想要的结果？",
      options: ["「帮我弄一下这个」", "「把下面 5 条评论分成好评或差评，每行输出：编号｜结果」", "「你觉得呢？」"],
      answer: 1,
      explanation: "它说清楚了任务和格式，AI 不用猜。",
    },
    {
      question: "「少样本」是什么意思？",
      options: ["只给 AI 很少的电量", "在提示词里给几个做好的例子让它照着做", "让 AI 少说几句"],
      answer: 1,
      explanation: "几个「输入 → 答案」的例子，往往比长篇说明更管用。",
    },
    {
      question: "为什么给例子能帮 AI 判对「不难吃，但是太贵了」？",
      options: ["例子让它学会了判断标准（看「但是」后面）", "例子让模型变大了", "其实没有帮助"],
      answer: 0,
      explanation: "例子展示了你想要的判断方式，AI 会顺着这个模式往下写。",
    },
  ],
  summary: <>提示词就是 AI 的「前文」：说清楚要什么、规定格式、再给几个例子（少样本），答案就会好得多。</>,
  next: {
    question: "除了「从数据里学」，还有哪些让机器变聪明的思路？",
    href: "/lessons/02",
    label: "去阶段 4：其他思路与责任 →",
  },
};

export default function Lesson20({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
