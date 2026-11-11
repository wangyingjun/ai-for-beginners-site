"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { AdvancedNote } from "@/components/lesson/ui";
import { RnnExperiment, type RnnState } from "@/components/experiments/RnnExperiment";

type S = RnnState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "read",
    text: <>点「读下一个词」，一个词一个词读完这条评论，盯着记忆条怎么变</>,
    doneNote: "每读到夸的词，记忆往右挪；读到「贵」往左挪一点，但前面攒的好感还在，最后判好评。",
    check: (s) => s.sentence === "s1" && s.finished && s.correct,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "forget",
    text: <>把「保留多少旧记忆」拖到 <b>0.1 以下</b>，再把第 1 条评论读完</>,
    doneNote: "判错了！几乎不保留旧记忆，读完只记得最后一个词「贵」。",
    check: (s) => s.sentence === "s1" && s.keep <= 0.1 && s.finished && !s.correct,
  },
  {
    id: "never",
    text: <>换到第 2 条评论，把保留比例拖到 <b>1</b>（什么都不忘），读完</>,
    doneNote: "又错了！以前的好话攒太多，盖过了「现在难吃还贵」。什么都记住也不行。",
    check: (s) => s.sentence === "s2" && s.keep >= 0.99 && s.finished && !s.correct,
  },
  {
    id: "both",
    text: <>找一个保留比例，让<b>两条评论都判对</b></>,
    hint: "在 0.85～0.95 之间找找。",
    doneNote: "记忆要「慢慢淡忘」：新内容分量大一点，旧内容也不完全丢。真正的网络会自己学会该记多少、该忘多少。",
    check: (s) => s.bothRight,
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "理解「一个词一个词地读、边读边更新记忆」是怎么回事，以及记忆为什么要会遗忘。",
  play: (
    <Experiment<S>
      intro={<>这个 AI 读评论不是一眼看完，而是像人一样一个词一个词地读，脑子里留着一个「记忆」。</>}
      tasks={playTasks}
      storageKey="exp:16:play"
      render={(report) => <RnnExperiment onState={report} />}
    />
  ),
  observe: {
    question: "读完整句后，AI 靠什么做判断？",
    options: ["只看最后一个词", "看读完时脑子里的那个「记忆」", "看评论有多长"],
    answer: 1,
    explanation: "记忆里攒着前面所有词的影响（旧的会慢慢淡化），最后就看它偏哪边。",
  },
  explain: (
    <>
      <p>你听别人讲故事时，不会把每个字都背下来，而是脑子里一直更新一个「到目前为止讲了什么」的印象。</p>
      <p>
        这类网络就是这样：每读一个词，就把「旧记忆」和「新词」混在一起，得到新记忆，再去读下一个词。同一套计算一遍遍循环使用，所以叫「循环」。
      </p>
      <p>
        难点在于记多少：全记住，旧信息会压过新信息；记太少，读到后面就忘了前面。后来出现的 LSTM 等改进网络，就是加了「门」，让网络自己决定什么该记、什么该忘。
      </p>
    </>
  ),
  terms: [
    { name: "循环神经网络", definition: <>英文 RNN。按顺序处理一串输入（词、音符、股价…），每一步都用同一套参数，把「上一步的记忆」和「这一步的输入」合成新的记忆。第 17 课的写诗模型就可以用它实现。</> },
    { name: "隐藏状态", definition: <>RNN 的「记忆」（实验里的记忆条），是一组数字，记录到目前为止读到的内容的要点。真实网络里它有几百个数，而不是一个。</> },
  ],
  practice: (
    <Experiment<S>
      intro={<>完成 3 个小任务（可以切换两条评论）：</>}
      tasks={practiceTasks}
      storageKey="exp:16:practice"
      aha={<>循环神经网络边读边更新隐藏状态；记得太多、太少都会出错，所以要学会遗忘。可是长句子还是容易忘——第 18 课的「注意力」直接回头看任何一个词，解决了这个问题。</>}
      render={(report) => <RnnExperiment controls onState={report} />}
    />
  ),
  quiz: [
    {
      question: "循环神经网络为什么叫「循环」？",
      options: ["因为它会无限运行", "因为每读一个词都重复用同一套计算更新记忆", "因为它只能读圆形的字"],
      answer: 1,
      explanation: "同一套参数一步步循环使用，每步把旧记忆和新输入合成新记忆。",
    },
    {
      question: "保留比例为 0 时会发生什么？",
      options: ["什么都记住", "只记得最后读到的词", "无法运行"],
      answer: 1,
      explanation: "旧记忆全部清零，判断只取决于最后一个词。",
    },
    {
      question: "LSTM 这类改进网络加了「门」，主要是为了？",
      options: ["让网络自己决定该记住和该忘掉什么", "让网络跑得更快", "让网络能看图片"],
      answer: 0,
      explanation: "门控机制按需保留或丢弃信息，缓解了长句子里的遗忘问题。",
    },
  ],
  summary: <>循环神经网络一个词一个词地读，用隐藏状态当记忆；关键在于记多少、忘多少。</>,
  next: { question: "AI 怎样从一句话里找出人名、地名？", href: "/lessons/19", label: "去下一课：找出人名地名（命名实体识别）→" },
  advancedIntro: (
    <AdvancedNote>
      <p>原文第 16 课用 PyTorch/TensorFlow 实现 RNN、LSTM、GRU 做新闻分类。实验里的记忆只有一个数、权重手工设定；真实网络的隐藏状态是一个向量，更新规则也是学出来的。</p>
    </AdvancedNote>
  ),
};

export default function Lesson16({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
