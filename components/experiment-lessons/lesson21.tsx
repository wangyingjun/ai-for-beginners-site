"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { GaExperiment, type GaState } from "@/components/experiments/GaExperiment";

type S = GaState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "solve",
    text: <>点「开始进化」，看 16 个随机图案怎样一代代变成目标笑脸</>,
    hint: "通常几十代就能找到。",
    doneNote: "没有人告诉它该怎么画，只是「对得多的留下来、互相拼一拼、偶尔变一变」。",
    check: (s) => s.runs.some((r) => r.solved),
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "zero",
    text: <>把<b>变异率</b>拖到 0，开始进化，至少看 40 代</>,
    doneNote: "很快所有图案都长得一样，然后就再也不动了：没有变异，就没有新东西。",
    check: (s) => s.runs.some((r) => r.mut === 0 && r.gens >= 40),
  },
  {
    id: "high",
    text: <>把变异率拖到 0.30 以上，再进化至少 40 代</>,
    doneNote: "变得太多，好不容易对上的格子又被翻掉，一直在原地打转。",
    check: (s) => s.runs.some((r) => r.mut >= 0.3 && r.gens >= 40),
  },
  {
    id: "just-right",
    text: <>把变异率调到 0.01～0.06 之间，进化到找到笑脸</>,
    doneNote: "一点点变异刚刚好：既有新花样，又不会把好的东西毁掉。",
    check: (s) => s.runs.some((r) => r.mut >= 0.01 && r.mut <= 0.06 && r.solved),
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "知道不用算坡度也能优化：选择、交叉、变异，一代代逼近好答案。",
  play: (
    <Experiment<S>
      intro={<>目标是右边这个 6×6 的笑脸。我们先随机画 16 个图案，然后让它们「进化」：</>}
      tasks={playTasks}
      storageKey="exp:21:play"
      render={(report) => <GaExperiment onState={report} />}
    />
  ),
  observe: {
    question: "每一代，哪些图案更容易「留下后代」？",
    options: ["随机选", "和目标对得多的", "最早出生的"],
    answer: 1,
    explanation: "对得多的更容易被选中当「父母」，所以好特征会越传越多——这就是选择。",
    hintOnWrong: "看最下面的柱子：每代最好的成绩是在涨还是在跌？",
  },
  explain: (
    <>
      <p>
        想象培育更甜的西瓜：每年挑最甜的几个留种，让它们互相授粉，偶尔还会出现一点基因突变。几十年后，西瓜就越来越甜。没人知道「甜」的基因具体怎么写，只要会<b>挑</b>就行。
      </p>
      <p>
        遗传算法照搬这个过程：一群随机答案 → 打分（这里是对了几格）→ 分高的更容易被选中 → 两个答案各取一半拼起来（交叉）→ 偶尔随机改一点（变异）→ 下一代。
      </p>
      <p>和梯度下降不同，它不需要知道「往哪边是下坡」，所以适合那些没法算坡度的问题，比如排课表、设计天线形状。</p>
    </>
  ),
  terms: [
    {
      name: "遗传算法",
      definition: <>模仿生物进化的优化办法：一群候选答案经过「选择（适者生存）、交叉（两两拼接）、变异（随机改动）」一代代变好。不需要坡度，只需要能给答案打分。</>,
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>现在可以调「变异率」了。完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:21:practice"
      aha={<>变异太少会停滞，太多会乱套——又是一个要调得「刚好」的旋钮，就像梯度下降的学习率。</>}
      render={(report) => <GaExperiment showMutation onState={report} />}
    />
  ),
  quiz: [
    {
      question: "遗传算法里「变异」的作用是什么？",
      options: ["让种群里不断出现新花样，避免停滞", "让所有个体变得一样", "直接给出正确答案"],
      answer: 0,
      explanation: "没有变异，种群很快就趋同，再也找不到新答案（任务 1）。",
    },
    {
      question: "和梯度下降相比，遗传算法的特点是？",
      options: ["必须能算出坡度", "只要能给答案打分就行，不需要坡度", "只能用于图片"],
      answer: 1,
      explanation: "它靠「挑好的、拼一拼、变一变」，不需要知道往哪个方向改更好。",
    },
    {
      question: "变异率设得太高会怎样？",
      options: ["进化更快", "好不容易得到的好特征经常被破坏，难以进步", "没有影响"],
      answer: 1,
      explanation: "任务 2 里你看到了：变得太多，就像每代都重新随机。",
    },
  ],
  summary: <>遗传算法 = 选择 + 交叉 + 变异，一代代进化出好答案；不需要坡度，但变异率要刚刚好。</>,
  next: {
    question: "如果连「对了几格」这样的分数都没有，只有「做得好给奖励」呢？",
    href: "/lessons/22",
    label: "去下一课：只给奖励不给答案（强化学习）→",
  },
};

export default function Lesson21({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
