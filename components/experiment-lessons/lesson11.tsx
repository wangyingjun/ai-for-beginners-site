"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { AdvancedNote } from "@/components/lesson/ui";
import { DetectExperiment, type DetectState } from "@/components/experiments/DetectExperiment";

type S = DetectState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "cat",
    text: <>在图上按住拖动，<b>把猫框起来</b>，重合度达到 0.5 以上</>,
    hint: "从猫的左上角拖到右下角。不满意就重新画一个。",
    doneNote: "框得越贴，重合度越接近 1。",
    check: (s) => s.iouCat >= 0.5,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "dog",
    text: <>把狗框起来，这次要更准：重合度 ≥ 0.7</>,
    doneNote: "检测模型训练时，就是拿它的框和标准框比重合度，越高越好。",
    check: (s) => s.iouDog >= 0.7,
  },
  {
    id: "huge",
    text: <>耍个赖：画一个<b>很大的框</b>（盖住大半张图），把猫整个包进去</>,
    doneNote: "猫确实被框住了，可重合度很低——多框的空白也算错。所以不能靠「框大一点」来作弊。",
    check: (s) => s.coversCat && s.area >= 0.6,
  },
  {
    id: "model",
    text: <>点「显示模型找到的框」，拖动把握门槛，让<b>每个动物正好只剩一个框</b></>,
    hint: "模型对同一只猫给了两个框，还在树上错框了一个「狗」。",
    doneNote: "低把握的错框和重复框都被去掉了。真实模型还会把重合度很高的重复框合并掉。",
    check: (s) => s.showModel && s.keptOk,
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "知道 AI 怎样「把东西框出来」，以及怎样用重合度给框打分。",
  play: (
    <Experiment<S>
      intro={<>认出「图里有猫」还不够，还要说出猫<b>在哪儿</b>。用手指（或鼠标）画个框试试。</>}
      tasks={playTasks}
      storageKey="exp:11:play"
      render={(report) => <DetectExperiment onState={report} />}
    />
  ),
  observe: {
    question: "怎样判断一个框画得好不好？",
    options: ["框越大越好，保证包住", "看它和标准框重叠得多不多、多出来的空白少不少", "颜色越深越好"],
    answer: 1,
    explanation: "重合度同时惩罚「漏了」和「多了」：只有又贴又全的框才能接近 1。",
  },
  explain: (
    <>
      <p>就像在合照里圈出每个人的脸：不光要说「有 3 个人」，还要每人画一个框。</p>
      <p>
        目标检测模型一次输出很多候选框，每个框带一个标签（猫/狗）和一个把握。训练时，拿它的框和人工画的标准框比重合度；用的时候，把把握太低的框和重复的框去掉，就是最终答案。
      </p>
    </>
  ),
  terms: [
    { name: "边界框", definition: <>框住一个物体的矩形，用左上角和右下角（或中心点加宽高）四个数表示。目标检测模型对每个物体输出一个边界框、一个类别和一个把握。</> },
    { name: "交并比", definition: <>英文 IoU，就是实验里的「重合度」：两个框重叠部分的面积 ÷ 两个框合起来的面积。1 表示完全一样，0 表示毫不相干；通常 ≥ 0.5 才算找对了。</> },
  ],
  practice: (
    <Experiment<S>
      intro={<>完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:11:practice"
      aha={<>检测 = 为每个物体给出一个边界框 + 类别 + 把握；交并比衡量框得准不准，把握门槛去掉低质量的框。但框总是方的——下一课，我们一格一格地抠出物体的真实形状。</>}
      render={(report) => <DetectExperiment controls onState={report} />}
    />
  ),
  quiz: [
    {
      question: "目标检测比「图片分类」多做了什么？",
      options: ["多说出物体在哪儿（画框）", "把图片变彩色", "什么也没多做"],
      answer: 0,
      explanation: "分类只回答「是什么」，检测还要回答「在哪儿」，并且一张图里可以有好几个物体。",
    },
    {
      question: "把整张图框起来，和猫的交并比会怎样？",
      options: ["等于 1", "很低，因为多出来的空白太多", "无法计算"],
      answer: 1,
      explanation: "交并比的分母是两个框合起来的面积，框太大分母就大，重合度就低。",
    },
    {
      question: "模型输出了很多框，最后怎么挑？",
      options: ["全部保留", "去掉把握低的，合并重复的", "随机留一个"],
      answer: 1,
      explanation: "把握门槛去掉不可靠的框，重复的框只留把握最高的那个。",
    },
  ],
  summary: <>目标检测 = 找出每个物体的边界框 + 类别；交并比（重合度）衡量框得准不准。</>,
  next: { question: "框总是方的，能不能把猫的轮廓一格一格精确抠出来？", href: "/lessons/12", label: "去下一课：一格一格涂出来（语义分割）→" },
  advancedIntro: (
    <AdvancedNote>
      <p>原文第 11 课介绍滑窗、R-CNN 系列和 YOLO 等检测模型，并用预训练模型做实验。实验里的「把握门槛」对应模型的置信度阈值，去重复框对应非极大值抑制（NMS）。</p>
    </AdvancedNote>
  ),
};

export default function Lesson11({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
