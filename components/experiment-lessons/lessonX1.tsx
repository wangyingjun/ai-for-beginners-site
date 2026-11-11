"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { AdvancedNote } from "@/components/lesson/ui";
import { ClipExperiment, type ClipState } from "@/components/experiments/ClipExperiment";

type S = ClipState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "three",
    text: <>点 3 张不同的图，看 AI 是不是都认对了</>,
    doneNote: "每张图都和对应的词最接近：图和词被放进了同一个空间。",
    check: (s) => s.correctKnown >= 3,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "zeroshot",
    text: <>点右下角的「新图」🦒：候选词里没有它，AI 会认错。加一个合适的候选词，让它认对</>,
    hint: "在「加一个候选词」里找。",
    doneNote: "没有专门训练过「长颈鹿」，只是多给了一个词，它就认出来了——因为图和词在同一个空间里，长颈鹿的图本来就离「长颈鹿」这个词最近。",
    check: (s) => s.tapped === "giraffe" && s.tappedCorrect && s.labels.includes("长颈鹿"),
  },
  {
    id: "fly",
    text: <>反过来，用文字搜图：点「会飞的东西」</>,
    doneNote: "排在最前的是鸟和飞机：一个是动物、一个是机器，但它们都「会飞」，在空间里这一方向上靠得近。",
    check: (s) => s.query === "fly" && s.topIds.includes("bird") && s.topIds.includes("plane"),
  },
  {
    id: "neck",
    text: <>再搜「长脖子的动物」</>,
    doneNote: "没人给过「长脖子」的标签，它还是找到了长颈鹿。",
    check: (s) => s.query === "neck" && s.topIds[0] === "giraffe",
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "解释为什么把图和文字放进同一个空间后，AI 不用专门训练也能认出新东西。",
  play: (
    <Experiment<S>
      intro={<>这个 AI 有两只「眼睛」：一只看图，一只读字。它把图和词都变成一串数，放进同一张「地图」里。</>}
      tasks={playTasks}
      storageKey="exp:X1:play"
      render={(report) => <ClipExperiment onState={report} />}
    />
  ),
  observe: {
    question: "AI 是怎样给图片挑词的？",
    options: ["查一个「图片 → 名字」的表", "找和这张图在空间里离得最近的那个词", "随机挑一个"],
    answer: 1,
    explanation: "图和词住在同一个空间里，挑离得最近的词就行，候选词随时可以换。",
  },
  explain: (
    <>
      <p>
        还记得第 14 课的词向量地图吗？意思相近的词住得近。现在把<b>图片</b>也搬进这张地图：猫的照片住在「猫」这个词旁边，飞机的照片住在「飞机」旁边。
      </p>
      <p>
        怎么做到的？用网上几亿对「图片 + 配文」训练：让每张图和它自己的配文靠近、和别人的配文远离。练完以后，想认一张新图，只要写几个候选词，看图离哪个词最近——不用再为新类别专门训练。
      </p>
      <p>实验里的「地图」是手工搭的（每个数代表「会飞」「长脖子」之类的特点），真实模型的空间有几百维，是自己学出来的。</p>
    </>
  ),
  terms: [
    { name: "多模态", definition: <>同时处理不止一种信息形式（文字、图片、声音、视频…）。实验里的模型同时懂图和字，就是多模态模型，代表是 OpenAI 的 CLIP。现在的很多大模型也能看图说话。</> },
    { name: "零样本", definition: <>没有专门给某个类别提供训练样本，模型照样能认出来（实验里的长颈鹿）。做法是把类别写成文字，看图片离哪个文字最近。</> },
  ],
  practice: (
    <Experiment<S>
      intro={<>完成 3 个小任务（可以加候选词、用文字搜图）：</>}
      tasks={practiceTasks}
      storageKey="exp:X1:practice"
      aha={<>多模态模型把图和字放进同一个空间：用文字就能给图分类（零样本），也能用文字搜图。恭喜你，全部课程都走完了！回到学习路线看看还有哪节没做。</>}
      render={(report) => <ClipExperiment controls onState={report} />}
    />
  ),
  quiz: [
    {
      question: "「零样本」识别是指？",
      options: ["一张图都没有", "没为这个类别专门训练，也能认出来", "识别正确率为零"],
      answer: 1,
      explanation: "只需写出类别名称，模型在共享空间里找最近的那个。",
    },
    {
      question: "像 CLIP 这样的模型是怎么训练的？",
      options: ["人工给每张图标类别", "用大量「图片 + 配文」，让配对的图和文字靠近", "只用文字训练"],
      answer: 1,
      explanation: "网上现成的图文配对就是训练数据，不需要专门标注类别。",
    },
    {
      question: "为什么搜「会飞的东西」能同时找到鸟和飞机？",
      options: ["因为它们颜色一样", "因为在共享空间里，它们都在「会飞」这个方向上", "因为名字都是两个字"],
      answer: 1,
      explanation: "空间里的方向代表某种特点，文字和图片都按这些特点摆放。",
    },
  ],
  summary: <>多模态 = 同时懂图和字；把它们放进同一个空间，就能用文字给图分类（零样本）、用文字搜图。</>,
  next: { question: "全部课程走完了！回学习路线看看还有哪些课没做完。", href: "/course?lang=zh-CN", label: "回到学习路线 →" },
  advancedIntro: (
    <AdvancedNote>
      <p>原文的多模态一课介绍 OpenAI CLIP、用 CLIP 做零样本分类和以文搜图，以及 VQGAN+CLIP 生成图片。实验里的空间是手工搭的 11 维「特点空间」，相似度用的就是 CLIP 也用的余弦相似度。</p>
    </AdvancedNote>
  ),
};

export default function LessonX1({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
