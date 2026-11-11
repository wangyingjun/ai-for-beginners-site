"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { TransferExperiment, type TransferState } from "@/components/experiments/TransferExperiment";

type S = TransferState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "pick",
    text: <>在任意一张图上点 <b>2 只猫 + 2 只狗</b> 当例子，比较左右两边的准确率</>,
    hint: "红圆点 = 猫，蓝方块 = 狗。点到的会套上圈，再点一次取消。",
    doneNote: "同样 4 个例子：左边差不多是瞎猜（五成上下），右边几乎全对。",
    check: (s) => s.task === "catdog" && s.perClass[0] >= 2 && s.perClass[1] >= 2,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "one-shot",
    text: <>点「清空例子」，这次<b>每类只给 1 个</b>例子</>,
    doneNote: "右边只靠 1 张猫 1 张狗就能分得不错——因为「眼睛」早就练好了，只差告诉它哪边叫猫。",
    check: (s) => s.task === "catdog" && s.perClass[0] === 1 && s.perClass[1] === 1 && (s.accFeat ?? 0) >= 0.85,
  },
  {
    id: "more",
    text: <>给左边多加例子：一共选到 <b>10 个以上</b>，看「从零开始」能追上吗？</>,
    doneNote: "多了几个例子，左边还是不行：从零开始的模型要几千上万张照片才能学会「看」。",
    check: (s) => s.task === "catdog" && s.perClass[0] + s.perClass[1] >= 10,
  },
  {
    id: "new-task",
    text: <>换成新任务「老虎 vs 狼」，每类选 2 个例子</>,
    doneNote: "预训练的「眼睛」从没专门学过老虎和狼，照样好用——学到的「看」的本事可以搬到新任务上。",
    check: (s) => s.task === "tigerwolf" && s.perClass[0] >= 2 && s.perClass[1] >= 2 && (s.accFeat ?? 0) >= 0.85,
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "知道为什么只给几张图，也能借别人训练好的模型做出好用的分类器。",
  play: (
    <Experiment<S>
      intro={<>你只有很少几张标好的照片。左右两张图是同一批照片，只是「看照片的眼睛」不一样：</>}
      tasks={playTasks}
      storageKey="exp:08:play"
      render={(report) => <TransferExperiment onState={report} />}
    />
  ),
  observe: {
    question: "为什么右边用同样几个例子就准得多？",
    options: ["右边的照片更清楚", "右边的「眼睛」已经看过海量照片，会把猫和狗放到不同的地方", "右边作弊看了答案"],
    answer: 1,
    explanation: "照片是同一批。区别在于右边先用一个预训练模型把照片变成特征，猫和狗在特征里本来就分得开。",
    hintOnWrong: "看看两张图里红点和蓝块的分布：哪边自己就分成了两堆？",
  },
  explain: (
    <>
      <p>
        一个会画素描的人去学水彩，比完全没碰过画笔的人快得多：观察形状、比例、光影的本事是<b>通用的</b>，只需要学新东西里不一样的那一点。
      </p>
      <p>
        AI 也一样。大公司用几百万张照片训练了一个卷积神经网络，它的前面几十层已经学会了「看」：边、纹理、眼睛、毛发、轮廓……我们把这部分<b>直接拿来</b>，把照片变成特征，再用自己的几张例子在最后一步教它「哪边叫猫」。
      </p>
      <p>这样只要几十张甚至几张照片，就能做出好用的分类器，而且训练只要几分钟。</p>
    </>
  ),
  terms: [
    {
      name: "预训练",
      definition: <>先在一个超大数据集（比如上百万张各种照片）上把模型训练好，学到通用的「看」的本事。这样的模型叫预训练模型。</>,
    },
    {
      name: "迁移学习",
      definition: <>把预训练模型学到的本事搬到你自己的新任务上：保留它提取特征的部分，只用少量数据训练最后一小步。</>,
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:08:practice"
      aha={
        <>
          不用每次都从零开始：借一双练好的「眼睛」，少量数据就够了。今天的大语言模型也是这样——先预训练，再针对任务微调。阶段 2 完成！接下来让机器读懂文字。
        </>
      }
      render={(report) => <TransferExperiment taskSwitch onState={report} />}
    />
  ),
  quiz: [
    {
      question: "迁移学习最大的好处是什么？",
      options: ["不需要任何数据", "只用很少的数据和时间，就能在新任务上做得很好", "模型会变得更小"],
      answer: 1,
      explanation: "通用的本事已经学好了，新任务只需要少量数据教最后一步。",
    },
    {
      question: "预训练模型从没见过「老虎 vs 狼」这个任务，为什么还能用？",
      options: ["因为它学到的是通用的「看」的本事（纹理、形状……）", "因为它偷偷联网查了", "其实不能用"],
      answer: 0,
      explanation: "毛发纹理、脸型、耳朵这些特征对很多动物都有用，所以能迁移到新任务。",
    },
    {
      question: "只有 20 张自己的照片，最好的做法是？",
      options: ["从零训练一个大网络", "用预训练模型提取特征，再训练最后一层", "放弃"],
      answer: 1,
      explanation: "从零训练需要海量数据，20 张会严重过拟合；迁移学习正适合这种情况。",
    },
  ],
  summary: <>预训练 = 先在海量数据上学会「看」；迁移学习 = 把这本事搬到新任务，只用少量数据教最后一步。</>,
  next: {
    question: "图片是像素数字，那文字怎么变成数字？",
    href: "/lessons/13",
    label: "去阶段 3：让机器读懂文字 →",
  },
};

export default function Lesson08({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
