"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { EmbedExperiment, type EmbedState } from "@/components/experiments/EmbedExperiment";

type S = EmbedState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "explore",
    text: <>在词语地图上点 <b>3 个不同的词</b>，看看谁是它的邻居</>,
    hint: "点词语旁边的圆点。黄线连着离它最近的 3 个词。",
    doneNote: "猫的邻居是狗、老虎；苹果的邻居是香蕉、橙子——意思相近的词住在一起。",
    check: (s) => s.clicked.length >= 3,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "king",
    text: <>词语算术：直接点「算一下」，算出 <b>国王 − 男人 + 女人</b></>,
    doneNote: "得到「女王」！「男人 → 女人」这一步的方向，和「国王 → 女王」的方向是一样的。",
    check: (s) => s.analogies.includes("国王-男人+女人=女王"),
  },
  {
    id: "capital",
    text: <>把三个空换成 <b>巴黎 − 法国 + 英国</b>，再算一下</>,
    hint: "先点一个空格（变蓝），再到地图上点词。三个空依次是：巴黎、法国、英国。",
    doneNote: "得到「伦敦」：「国家 → 首都」也是一个固定的方向。",
    check: (s) => s.analogies.includes("巴黎-法国+英国=伦敦"),
  },
  {
    id: "baby",
    text: <>自己试一个：<b>小狗 − 狗 + 猫</b> 等于什么？</>,
    doneNote: "小猫！「变成小的」也是一个方向。真实的词向量有几百个方向，能表示很多种关系。",
    check: (s) => s.analogies.includes("小狗-狗+猫=小猫"),
  },
];

const def: ExperimentLessonDef = {
  minutes: 25,
  goal: "知道「词向量」是什么：每个词是地图上的一个点，意思相近的词靠得近，词和词之间的关系还能拿来做加减。",
  play: (
    <Experiment<S>
      intro={<>每个词都被放到了一张地图上（这张图是简化的示意，真实模型有几百维）。任务：</>}
      tasks={playTasks}
      storageKey="exp:14:play"
      render={(report) => <EmbedExperiment onState={report} />}
    />
  ),
  observe: {
    question: "地图上，哪些词会住在一起？",
    options: ["字数一样的词", "意思或用法相近的词", "笔画差不多的词"],
    answer: 1,
    explanation: "猫、狗、老虎在一块，苹果、香蕉在一块。位置反映的是意思，不是字形。",
    hintOnWrong: "点一下「猫」和「苹果」，分别看看它们的邻居。",
  },
  explain: (
    <>
      <p>
        上一课的词袋里，每个词都是孤零零的一格，「好吃」和「美味」毫无关系。现在换个办法：给每个词<b>一个坐标</b>，就像城市在地图上有经纬度。
      </p>
      <p>
        坐标怎么来？让电脑读海量文章，发现「猫」和「狗」总出现在相似的句子里（「我家的__很可爱」），就把它们放得近一点。读得越多，位置越准。
      </p>
      <p>
        神奇的是，方向也有意思：从「男人」走到「女人」的那一步，和从「国王」走到「女王」几乎一样。所以 国王 − 男人 + 女人 ≈ 女王。
      </p>
    </>
  ),
  terms: [
    {
      name: "词向量",
      definition: (
        <>
          用一串数字（坐标）表示一个词，意思相近的词坐标相近。也叫<b>词嵌入</b>（Embedding）。真实模型里每个词有几百个数字，今天的大语言模型的第一步就是把字词变成这样的向量。
        </>
      ),
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>多了「词语算术」。完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:14:practice"
      aha={
        <>
          把词变成坐标以后，「意思」变成了可以计算的东西：远近 = 像不像，方向 = 什么关系。下一课：用这些向量，让 AI 自己写句子。
        </>
      }
      render={(report) => <EmbedExperiment analogyControl onState={report} />}
    />
  ),
  quiz: [
    {
      question: "在词向量里，「猫」和「狗」的位置会怎样？",
      options: ["离得很远，因为是不同的字", "离得比较近，因为用法相似", "完全重合"],
      answer: 1,
      explanation: "它们经常出现在相似的句子里，所以被放得很近，但不会完全一样。",
    },
    {
      question: "「国王 − 男人 + 女人 ≈ 女王」说明了什么？",
      options: ["电脑背下了这道题", "词和词之间的关系（比如性别）在地图上是一个固定的方向", "国王和女王是同一个词"],
      answer: 1,
      explanation: "男人→女人、国王→女王是同一个方向，所以可以拿来做加减。",
    },
    {
      question: "词向量比词袋好在哪里？",
      options: ["能表示词与词之间的相似和关系", "数字更少", "完全保留了句子顺序"],
      answer: 0,
      explanation: "词袋里每个词互不相关；词向量让相近的词有相近的数字。（词序问题要靠后面的模型解决。）",
    },
  ],
  summary: <>词向量 = 给每个词一个坐标：意思相近就靠得近，关系是一个方向，所以 国王 − 男人 + 女人 ≈ 女王。</>,
  next: {
    question: "有了词的坐标，AI 怎么一个字一个字地写出句子？",
    href: "/lessons/17",
    label: "去下一课：猜下一个字（语言模型）→",
  },
};

export default function Lesson14({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
