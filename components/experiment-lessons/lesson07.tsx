"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { SlideDetectExperiment, type SlideState } from "@/components/experiments/SlideDetectExperiment";

type S = SlideState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "move",
    text: <>点格子（或用方向键）把 × 挪到至少 3 个不同的位置，同时看上面两个检测器</>,
    hint: "试着把它挪出黄框。",
    doneNote: "「只看固定位置」的检测器一离开黄框就瞎了；「滑着找 + 取最大」在哪儿都能找到。",
    check: (s) => s.visited.length >= 3 && s.fixedMissed,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "neg3",
    text: <>在得分图上点开<b>得 −3 的格子</b>，看看是哪些格子在扣分</>,
    hint: "−3 的格子是蓝色的，就在得分 5 的格子上下左右。点开后看展开的算式，蓝色的积就是在扣分。",
    doneNote: "窗口和完整的 × 对不齐时，不该亮的格亮了，检测器就扣分，几笔加起来是 −3。",
    check: (s) => s.inspectedNeg3,
  },
  {
    id: "corner",
    text: <>把 × 挪到<b>右下角</b>（贴着右边和下边）</>,
    doneNote: "得分表里红色的格子跟着跑到了右下角，最大值还是 5。",
    check: (s) => s.r === 5 && s.c === 5 && s.pattern === "x",
  },
  {
    id: "pool",
    text: <>点「显示池化」，然后把 × 挪一格、再挪一格，看池化后的 3×3 小图</>,
    hint: "至少有一次挪动后，最强的那一格（最红的）位置和数值都没变才算。",
    doneNote: "挪一点点，池化后的结果几乎不变——这让网络对「稍微挪了位置」不那么敏感，而且图变小了，算得更快。",
    check: (s) => s.pooling && s.pooledSameMoves >= 1,
  },
  {
    id: "other",
    text: <>点「图案换成 ○」，看 × 检测器还会不会报警</>,
    doneNote: "得分最高才 2 左右，不会报警：一个卷积核只认一种图案。真正的网络会同时学几十上百个核，各认各的。",
    check: (s) => s.pattern === "o" && !s.slideFound,
  },
];

const def: ExperimentLessonDef = {
  minutes: 25,
  goal: "解释为什么卷积神经网络换了位置也能认出图案，以及「池化」在做什么。",
  play: (
    <Experiment<S>
      intro={<>两个「× 检测器」比赛：一个只盯着黄框那一块，另一个把小窗口滑遍全图、取最大的得分。</>}
      tasks={playTasks}
      storageKey="exp:07:play"
      render={(report) => <SlideDetectExperiment onState={report} />}
    />
  ),
  observe: {
    question: "为什么「滑着找 + 取最大」在哪儿都能找到 ×？",
    options: ["因为它更大", "因为同一个小窗口在每个位置都检查了一遍，只要有一处吻合就算找到", "因为它记住了 × 的位置"],
    answer: 1,
    explanation: "它把同一套检查标准用在了所有位置上，所以图案在哪里都一样能被发现。",
    hintOnWrong: "看看右边的得分表：× 挪到哪，红色的高分格就跟到哪。",
  },
  explain: (
    <>
      <p>
        想象你在一张大合照里找朋友：你不会只盯着照片左上角，而是<b>拿同一张「朋友长什么样」的印象，从左到右、从上到下扫一遍</b>
        。只要哪里对得上，就说「找到了」。
      </p>
      <p>
        卷积神经网络就是这样：同一个卷积核在所有位置上滑（上一课学过），得到一张「哪里像」的得分图；然后每一小块只留最大的分数，把图缩小——这一步叫池化。
      </p>
      <p>
        最关键的是：卷积核上的数字<b>不是人写的，是训练时用梯度下降自己学出来的</b>。第一层学会找边，后面的层把边拼成眼睛、轮子，再拼成猫脸、汽车。
      </p>
    </>
  ),
  terms: [
    {
      name: "卷积神经网络",
      definition: (
        <>
          简称 CNN：一层层「卷积（滑窗口找图案）+ 池化（缩小只留最大）」叠起来的神经网络，卷积核上的数字靠训练学出来。几乎所有认图片的 AI 都基于它。
        </>
      ),
    },
    {
      name: "池化",
      definition: <>把得分图切成小块（比如 2×2），每块只留一个数（通常是最大值）。图变小、算得快，而且图案挪动一点点时结果几乎不变。</>,
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>多了「点开得分格看计算」、池化和换图案。完成下面的小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:07:practice"
      aha={
        <>
          滑窗口让网络「在哪儿都能认」，池化让它「挪一点也不怕」，多个卷积核让它「认很多种图案」。可是从零训练一个这样的网络需要海量照片——下一课看看怎么「借用」别人训练好的网络。
        </>
      }
      render={(report) => <SlideDetectExperiment poolingControl patternSwitch onState={report} />}
    />
  ),
  quiz: [
    {
      question: "卷积神经网络为什么能认出不同位置的同一个图案？",
      options: ["给每个位置单独训练一个检测器", "同一个卷积核在所有位置上滑动检查", "把图片缩小成一个点"],
      answer: 1,
      explanation: "同一套标准用在所有位置，图案在哪都会触发高分。",
    },
    {
      question: "2×2 最大池化做了什么？",
      options: ["每 2×2 个格子只留最大的那个数", "把图片放大 2 倍", "把 4 个格子加起来"],
      answer: 0,
      explanation: "每小块取最大值：图变成原来的四分之一大，最强的信号保留了下来。",
    },
    {
      question: "卷积神经网络里卷积核上的数字是怎么来的？",
      options: ["工程师一个个手写", "训练时根据误差自动学出来", "随机的，永远不变"],
      answer: 1,
      explanation: "和前面学的一样：算误差 → 反向传播 → 梯度下降，卷积核的数字就是被调的参数。",
    },
  ],
  summary: <>卷积神经网络 = 滑窗口找图案（在哪都能认）+ 池化缩小（挪一点不怕），卷积核的数字靠训练学出来。</>,
  next: {
    question: "从零训练要几百万张照片。只有几十张时怎么办？",
    href: "/lessons/08",
    label: "去下一课：站在巨人肩上（迁移学习）→",
  },
};

export default function Lesson07({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
