"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { AdvancedNote } from "@/components/lesson/ui";
import { MaskFillExperiment, type MaskState } from "@/components/experiments/MaskFillExperiment";

type S = MaskState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "widen",
    text: <>只看前 1 个词「一杯」，AI 猜错了。把滑块往右拖，直到它猜出<b>「咖啡」</b></>,
    hint: "要让它看到「早上」这个词。",
    doneNote: "看到「早上」才猜对：在它读过的句子里，「早上」总和「咖啡」一起出现。",
    check: (s) => s.q === "q1" && s.correct,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "q2",
    text: <>换到第 2 题「晚上我想喝一杯？」，调到 AI 猜出「牛奶」</>,
    doneNote: "这次得看 5 个词才看得到「晚上」。看得越远，线索越多。",
    check: (s) => s.q === "q2" && s.correct,
  },
  {
    id: "q3",
    text: <>换到第 3 题「？在水里游」：空格在开头，前面没词可看。想办法让 AI 猜出「小鱼」</>,
    hint: "试试「也看后面的词」。",
    doneNote: "前后两边的词都能当线索。很多模型（比如 BERT）就是这样，靠前后文猜被遮住的词来学习。",
    check: (s) => s.q === "q3" && s.both && s.correct,
  },
  {
    id: "data",
    text: <>回到第 1 题、看 5 个词，点「给它多读一句」，直到 AI 改口猜「茶」</>,
    doneNote: "AI 没有自己的口味，它只是学会了读过的文字里的规律。读的东西变了，答案就变了。",
    check: (s) => s.q === "q1" && s.window >= 4 && s.extras >= 1 && s.guess === "茶",
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "知道机器怎样靠「猜被遮住的词」从大量文字里自己学习。",
  play: (
    <Experiment<S>
      intro={<>句子里有一个词被遮住了。AI 读过十几句话，它会根据身边的词来猜。</>}
      tasks={playTasks}
      storageKey="exp:15:play"
      render={(report) => <MaskFillExperiment onState={report} />}
    />
  ),
  observe: {
    question: "为什么看的词多了，AI 就猜对了？",
    options: ["它变聪明了", "多看到的词（如「早上」）提供了新线索", "它是随便猜的"],
    answer: 1,
    explanation: "「一杯」后面什么饮料都行，「早上」才把范围缩小到咖啡。",
  },
  explain: (
    <>
      <p>做语文的完形填空时，你也是看空格前后的词来猜。看得越多，猜得越准。</p>
      <p>
        语言模型的训练就是海量的完形填空：从网上的文章里随便遮住一个词，让模型猜，猜错了就调整。它不需要任何人标注，文章本身就是答案。猜得多了，它就学到了词和词之间的关系。
      </p>
      <p>每次能看的词有个范围：看得太少线索不够；现在的大模型一次能看几万甚至几十万个词。</p>
    </>
  ),
  terms: [
    { name: "上下文窗口", definition: <>模型猜一个词时能看到的周围词的范围（实验里的「往前看几个词」）。窗口越大线索越多，计算也越费；大语言模型说的「支持 128K 上下文」就是指窗口大小。</> },
  ],
  practice: (
    <Experiment<S>
      intro={<>完成 3 个小任务（可以换题、看后面的词、多喂句子）：</>}
      tasks={practiceTasks}
      storageKey="exp:15:practice"
      aha={<>语言模型靠「猜被遮住的词」从文字本身学习；上下文窗口决定它能看到多少线索，读过的语料决定它学到什么。但一次看一大段很费劲——下一课看看早期的网络怎样「边读边记」。</>}
      render={(report) => <MaskFillExperiment controls onState={report} />}
    />
  ),
  quiz: [
    {
      question: "「猜被遮住的词」这种训练方式，最大的好处是？",
      options: ["不需要人工标注，文章本身就是答案", "猜得最快", "只能用于中文"],
      answer: 0,
      explanation: "遮住一个词，原文就是标准答案，所以可以用海量文字训练。",
    },
    {
      question: "上下文窗口太小会怎样？",
      options: ["算得更慢", "线索不够，容易猜错", "没有影响"],
      answer: 1,
      explanation: "实验里只看「一杯」时，咖啡、茶、牛奶都有可能。",
    },
    {
      question: "AI 的答案从「咖啡」变成「茶」，原因是？",
      options: ["它改变了口味", "它读的句子变了，统计出的规律也变了", "滑块坏了"],
      answer: 1,
      explanation: "模型学到的是数据里的规律；数据变了，答案就跟着变。",
    },
  ],
  summary: <>语言模型通过「猜被遮住的词」自学；上下文窗口 = 它一次能看到的词的范围。</>,
  next: { question: "如果一个词一个词地读，怎样记住前面读过的内容？", href: "/lessons/16", label: "去下一课：边读边记（循环神经网络）→" },
  advancedIntro: (
    <AdvancedNote>
      <p>原文第 15 课用 PyTorch/TensorFlow 训练 Word2Vec（CBOW、Skip-Gram）。CBOW 正是「用前后几个词猜中间的词」，实验里用词共现统计代替神经网络，窗口概念完全一样。</p>
    </AdvancedNote>
  ),
};

export default function Lesson15({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
