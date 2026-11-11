"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { AdvancedNote } from "@/components/lesson/ui";
import { NerExperiment, type NerState } from "@/components/experiments/NerExperiment";

type S = NerState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "tag",
    text: <>给「李白出生在碎叶城」打标签：把<b>人名</b>和<b>地名</b>标出来</>,
    hint: "点「李白」一次变人名；点「碎叶城」两次变地名。",
    doneNote: "你一眼就知道李白是人、碎叶城是地方。下面看看机器怎么做。",
    check: (s) => s.mode === "user" && s.sent === "s0" && s.userAllRight,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "new",
    text: <>点「你来标：第 2 句」，把「张小花去杭州旅游」标对</>,
    doneNote: "「张小花」你从没见过，但看「张」姓和后面的「去」就知道是个人。",
    check: (s) => s.mode === "user" && s.sent === "c" && s.userAllRight,
  },
  {
    id: "dict",
    text: <>点「看『查词典』规则」，找出它标错或漏标的 2 个词</>,
    hint: "一个是「苹果」，一个是词典里没有的名字。",
    doneNote: "只查词典有两个毛病：同一个词在不同句子里意思不同（吃的苹果 vs 苹果公司）；新名字永远查不全。",
    check: (s) => s.mode === "dict" && s.found >= s.dictErrors,
  },
  {
    id: "context",
    text: <>点「规则再看看前后的词」，看它能不能三句全对</>,
    doneNote: "看前后词就对了：「吃了一个」后面的苹果是水果，「去」前面的「张小花」是人。真正的模型也是靠上下文判断，只不过规则是自己学出来的。",
    check: (s) => s.mode === "dict" && s.context && s.ruleAllRight,
  },
];

const def: ExperimentLessonDef = {
  minutes: 15,
  goal: "知道 AI 怎样从句子里找出人名、地名、机构名，以及为什么要看上下文。",
  play: (
    <Experiment<S>
      intro={<>从新闻、合同、病历里自动找出「谁、在哪儿、哪家公司」，是很常见的 AI 任务。先自己当一回标注员。</>}
      tasks={playTasks}
      storageKey="exp:19:play"
      render={(report) => <NerExperiment onState={report} />}
    />
  ),
  observe: {
    question: "你是怎么知道「碎叶城」是地名的？",
    options: ["背过所有地名", "看字面（「城」）和前面的「出生在」", "随便猜的"],
    answer: 1,
    explanation: "我们靠词本身和上下文一起判断。机器也要学会这一点。",
  },
  explain: (
    <>
      <p>就像用荧光笔在课本上画重点：人名一种颜色，地名一种颜色，公司名一种颜色。</p>
      <p>
        最简单的做法是查一本「名字词典」，可它查不全，也分不清同一个词的不同意思。现代的做法是让模型逐词判断，判断时参考前后的词——比如看到「吃了一个」，后面的苹果就不是公司。
      </p>
    </>
  ),
  terms: [
    { name: "命名实体", definition: <>文本里有专门名字的东西：人名、地名、机构名，有时也包括日期、金额等。找出它们的任务叫命名实体识别（NER），本质是给每个词打一个标签。</> },
  ],
  practice: (
    <Experiment<S>
      intro={<>完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:19:practice"
      aha={<>命名实体识别 = 给每个词打「人名/地名/机构/无」的标签；光查词典不够，要看上下文。到这里，文字相关的进阶课就结束了。</>}
      render={(report) => <NerExperiment controls onState={report} />}
    />
  ),
  quiz: [
    {
      question: "命名实体识别本质上是在做什么？",
      options: ["翻译句子", "给句子里的每个词打标签", "生成新句子"],
      answer: 1,
      explanation: "每个词得到一个标签：人名、地名、机构或无。",
    },
    {
      question: "只查词典的方法，为什么会把「我吃了一个苹果」里的苹果标成公司？",
      options: ["因为词典错了", "因为它不看上下文，同一个词只有一种标签", "因为苹果是红色的"],
      answer: 1,
      explanation: "同一个词在不同句子里意思不同，必须结合前后文。",
    },
    {
      question: "遇到词典里没有的新名字（如「张小花」），怎么办？",
      options: ["没办法", "参考字面特征和上下文来判断", "把它删掉"],
      answer: 1,
      explanation: "姓氏、后面的动词等线索都能帮助判断，模型会从数据里学到这些线索。",
    },
  ],
  summary: <>命名实体识别 = 找出文本里的人名、地名、机构名；关键是结合上下文，而不只是查词典。</>,
  next: { question: "如果有好几个 AI 一起玩、互相影响，会发生什么？", href: "/lessons/23", label: "去下一课：对手也在学（多智能体）→" },
  advancedIntro: (
    <AdvancedNote>
      <p>原文第 19 课用 TensorFlow 训练 LSTM 做 NER，并介绍用 BERT 微调的方法、BIO 标注格式（B-人名表示实体的开头，I-人名表示中间）。实验里的「看前后词」规则是人写的，真实模型是从标注数据里学出来的。</p>
    </AdvancedNote>
  ),
};

export default function Lesson19({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
