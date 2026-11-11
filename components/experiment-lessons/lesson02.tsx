"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { ExpertExperiment, type ExpertState } from "@/components/experiments/ExpertExperiment";

type S = ExpertState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "tiger",
    text: <>动物选「老虎」，点「开始推理」，看规则一条条被用上</>,
    doneNote: "有毛发 → 哺乳动物 → 吃肉 → 食肉动物 → 有条纹 → 老虎。每一步都说得清为什么。",
    check: (s) => s.identified["老虎"] === "老虎",
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "penguin",
    text: <>换成「企鹅」，推理一次</>,
    doneNote: "有羽毛 → 鸟 → 不会飞且会游泳 → 企鹅。规则写到了，就能认出来。",
    check: (s) => s.identified["企鹅"] === "企鹅",
  },
  {
    id: "platypus",
    text: <>换成「鸭嘴兽」（有毛、会下蛋、会游泳），推理一次</>,
    doneNote: "推到「哺乳动物」就卡住了：专家没想到有会下蛋的哺乳动物，系统只能说「我不知道」。",
    check: (s) => "鸭嘴兽" in s.identified && s.identified["鸭嘴兽"] === null,
  },
  {
    id: "rule",
    text: <>在下面自己写一条规则，让系统认出鸭嘴兽，然后再推理一次</>,
    hint: "比如：如果 有毛发 且 下蛋 → 鸭嘴兽。",
    doneNote: "加一条规则就修好了——但世界上的例外无穷无尽，每个都得靠人一条条补。",
    check: (s) => s.customRules > 0 && s.identified["鸭嘴兽"] === "鸭嘴兽",
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "说出规则式 AI（专家系统）的长处——讲得清为什么，和短处——规则永远写不全。",
  play: (
    <Experiment<S>
      intro={<>这是一个「认动物」的小系统：没有任何训练数据，只有专家写好的 7 条规则。</>}
      tasks={playTasks}
      storageKey="exp:02:play"
      render={(report) => <ExpertExperiment onState={report} />}
    />
  ),
  observe: {
    question: "这个系统是怎么得出「老虎」的？",
    options: ["看了很多老虎照片学会的", "按专家写好的规则，一步步从已知事实推出来", "随机猜的"],
    answer: 1,
    explanation: "它没有学习，只是把规则一条条套上去。好处是每一步都能解释。",
    hintOnWrong: "看推理过程里的每一行：都写着用了哪条规则。",
  },
  explain: (
    <>
      <p>
        第 01 课说过让电脑变聪明有两条路：写规则、给例子。这一课就是<b>写规则</b>那条路：请动物学家把知识写成「如果……那么……」，电脑负责一条条往下推。
      </p>
      <p>
        上世纪 70～80 年代，这种系统很火，被用来诊断疾病、配置电脑。它的优点很明显：<b>每个结论都能说出理由</b>，出了错也知道是哪条规则的问题。
      </p>
      <p>
        但真实世界的例外太多了：鸭嘴兽、不会飞的鸟、没有条纹的白老虎……专家很难把所有情况都想到并写出来。这正是后来人们转向「从数据里学」的原因。
      </p>
    </>
  ),
  terms: [
    {
      name: "专家系统",
      definition: <>把专家的知识写成「如果……那么……」规则，让电脑据此推理的 AI。讲得清理由，但规则要靠人写、很难写全，遇到没想到的情况就无能为力。</>,
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>多了「自己写规则」。完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:02:practice"
      aha={<>规则系统像一本说明书：写到的都会，没写到的一点不会。数据驱动的 AI 能自己从例子里学，但又说不太清理由——两条路各有长短。</>}
      render={(report) => <ExpertExperiment ruleBuilder onState={report} />}
    />
  ),
  quiz: [
    {
      question: "专家系统的知识从哪里来？",
      options: ["从大量数据里自动学出来", "由人类专家写成规则", "从互联网上下载"],
      answer: 1,
      explanation: "规则是专家一条条写进去的，系统本身不会学习。",
    },
    {
      question: "专家系统最大的优点是？",
      options: ["不需要任何知识", "能说清楚每个结论是怎么推出来的", "什么情况都能处理"],
      answer: 1,
      explanation: "推理过程就是规则链，可以完整地解释给人听。",
    },
    {
      question: "为什么专家系统认不出鸭嘴兽？",
      options: ["电脑算力不够", "没有一条规则覆盖「会下蛋的哺乳动物」这种例外", "鸭嘴兽不是动物"],
      answer: 1,
      explanation: "规则没写到的情况，系统就推不出来。真实世界的例外太多，很难全部写完。",
    },
  ],
  summary: <>专家系统 = 人写规则、电脑推理：讲得清理由，但规则写不全，遇到例外就卡住。</>,
  next: {
    question: "不写规则、也不求坡度，还能怎么找到好答案？",
    href: "/lessons/21",
    label: "去下一课：物竞天择找答案（遗传算法）→",
  },
};

export default function Lesson02({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
