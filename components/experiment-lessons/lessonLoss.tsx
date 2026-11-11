"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { Yellow } from "@/components/lesson/ui";
import { LossExperiment, type LossState } from "@/components/experiments/LossExperiment";

type S = LossState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "fit",
    text: <>拖动两个滑块，让直线贴着这些点走，把「总误差」降到 1.0 以下</>,
    hint: "先拖「斜率」让线和点一样陡，再拖「截距」上下挪。盯着黄线：黄线越短越好。",
    doneNote: "黄线变短了，总误差这个数字也跟着变小——一个数字就说清了「线画得好不好」。",
    check: (s) => !s.outlier && s.loss <= 1.0,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "sweep",
    text: (
      <>
        <b>只拖斜率</b>：把斜率从最左边慢慢拖到最右边（截距别动），看下面「误差记录」里的黄点排成什么形状。
      </>
    ),
    hint: "要拖到 −0.5 以下和 1.5 以上都经过一次。",
    doneNote: "误差先降后升，像一个山谷。谷底就是最好的斜率——记住这个山谷，下一课要用。",
    check: (s) => s.slopeMin <= -0.5 && s.slopeMax >= 1.5,
  },
  {
    id: "best",
    text: (
      <>
        点「把误差画成正方形」，再把总误差压到 <b>0.5 以下</b>。
      </>
    ),
    hint: "每个正方形的面积就是那个点「错的平方」，总误差就是这些面积的平均。让正方形都变小。",
    doneNote: "差一点点的点，正方形很小；差很多的点，正方形大得多——平方会把大错放大。",
    check: (s) => !s.outlier && s.loss <= 0.5,
  },
  {
    id: "outlier",
    text: (
      <>
        点「加一个怪点」（右下角紫色那个），再把总误差压到最低。线还在原来的位置吗？
      </>
    ),
    hint: "误差要接近这组数据能达到的最低值才算数。",
    doneNote: "一个怪点的大正方形，就能把整条线拽歪——所以真实项目里要先检查、清理数据。",
    check: (s) => s.outlier && s.loss <= s.best * 1.15,
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "用一个数字衡量「模型现在错了多少」，知道这个数字为什么是机器学习的指南针。",
  play: (
    <Experiment<S>
      intro={<>这些点是一些房子的面积和房租。任务：画一条线，大致说出「多大的房子大概多少钱」。</>}
      tasks={playTasks}
      storageKey="exp:loss:play"
      render={(report) => <LossExperiment onState={report} />}
    />
  ),
  observe: {
    question: "什么时候「总误差」这个数字最小？",
    options: ["线越陡越小", "黄线整体越短越小", "线经过左下角时最小"],
    answer: 1,
    explanation: "每根黄线是一个点「猜的」和「真的」之间的差距，总误差把它们合成一个数。黄线都短，数字就小。",
    hintOnWrong: "回去拖一拖滑块，同时盯着黄线和总误差。",
  },
  explain: (
    <>
      <p>
        想象你在玩「猜价格」：每猜一套房子，主持人都告诉你差了多少。你不会只看一套，而是把所有房子的差距合起来，算出
        <b>一个总分</b>——总分越低，说明你的「猜法」越靠谱。
      </p>
      <p>
        刚才的 <Yellow>黄线</Yellow> 就是每套房子「猜的」和「真的」差多少。把它们平方（变成正方形的面积）再平均，就是总误差。
        平方有两个好处：差距不分正负都算错；而且<b>大错会被重罚</b>。
      </p>
      <p>
        有了这个数字，「学得好不好」就不用靠眼睛看了：机器只要想办法<b>让这个数字变小</b>就行。上节课的感知机数的是「站错边的点有几个」，道理一样。
      </p>
    </>
  ),
  terms: [
    {
      name: "损失",
      definition: (
        <>
          也叫误差、损失函数：用<b>一个数字</b>表示模型现在错得有多离谱。刚才的「总误差」（黄线长度平方的平均）是最常用的一种，叫
          <b>均方误差</b>。训练模型 = 想办法把损失降下来。
        </>
      ),
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>多了几个按钮。完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:loss:practice"
      aha={
        <>
          你刚才是<b>用手</b>一点点试出最低点的。真正的模型有成千上万（甚至上亿）个「滑块」，手试不过来。下一课：让机器沿着那个「山谷」
          <b>自己走到谷底</b>。
        </>
      }
      render={(report) => <LossExperiment controls={{ outlier: true, squares: true, history: true }} onState={report} />}
    />
  ),
  quiz: [
    {
      question: "损失（总误差）越小，说明什么？",
      options: ["模型越复杂", "模型的猜测整体上离真实答案越近", "数据越多"],
      answer: 1,
      explanation: "损失衡量的就是「猜的」和「真的」之间的差距，小 = 整体猜得准。",
    },
    {
      question: "为什么常用「差距的平方」而不是直接把差距加起来？",
      options: ["平方算起来更快", "正负差距不会互相抵消，而且大错被罚得更重", "平方后数字更好看"],
      answer: 1,
      explanation: "一个猜高 2、一个猜低 2，直接相加等于 0，好像没错；平方后都是 4。差 3 的点罚 9，比差 1 的点罚得重得多。",
    },
    {
      question: "加了一个离得很远的怪点后，最好的那条线会怎样？",
      options: ["完全不受影响", "被怪点拽过去一些", "变成曲线"],
      answer: 1,
      explanation: "怪点的误差平方特别大，为了让总误差最小，线只好往它那边偏。这就是为什么要先清理数据。",
    },
  ],
  summary: <>损失 = 用一个数字说出「现在错了多少」；训练模型，就是想办法让这个数字变小。</>,
  next: {
    question: "参数太多、没法用手试的时候，机器怎样自己找到误差最低的地方？",
    href: "/lessons/gd",
    label: "去下一课：蒙眼下山（梯度下降）→",
  },
};

export default function LessonLoss({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
