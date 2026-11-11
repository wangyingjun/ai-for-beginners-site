"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { AttnExperiment, type AttnState } from "@/components/experiments/AttnExperiment";

type S = AttnState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "it",
    text: <>点句子里的「它」，看看它在看谁</>,
    doneNote: "「它」把大部分注意力放在「小猫」上——所以模型知道，太饱了的是小猫。",
    check: (s) => s.itSeen.includes("full"),
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "fresh",
    text: <>换成「……因为它不新鲜」，再点「它」</>,
    doneNote: "只改了最后几个字，「它」的注意力就从「小猫」跑到了「鱼」——不新鲜的是鱼。",
    check: (s) => s.itSeen.includes("fresh"),
  },
  {
    id: "others",
    text: <>再点两个别的词（比如「吃」「新鲜」），看看它们各自在看谁</>,
    doneNote: "每个词都在看和自己最相关的词：「吃」看「小猫」和「鱼」（谁吃、吃什么）。每个词都会做一遍。",
    check: (s) => s.others.filter((w) => w !== "小猫").length >= 2,
  },
  {
    id: "baseline",
    text: <>点「关掉注意力」，再点「它」</>,
    doneNote: "只能看前一个词「因为」，根本不知道「它」是谁。注意力让每个词能直接看到整句话里任何一个词。",
    check: (s) => s.baselineSeen,
  },
];

const def: ExperimentLessonDef = {
  minutes: 25,
  goal: "看懂注意力：读到每个词时，模型会去「看」句子里和它最相关的词。",
  play: (
    <Experiment<S>
      intro={<>「小猫没吃鱼，因为它太饱了。」——人一看就知道「它」是小猫。模型怎么知道？</>}
      tasks={playTasks}
      storageKey="exp:18:play"
      render={(report) => <AttnExperiment onState={report} />}
    />
  ),
  observe: {
    question: "「它」主要在看哪个词？",
    options: ["因为", "小猫", "了"],
    answer: 1,
    explanation: "颜色最深的是「小猫」：模型从整句话里挑出了和「它」最相关的词。",
    hintOnWrong: "再点一次「它」，看哪个词的颜色最深、百分比最大。",
  },
  explain: (
    <>
      <p>
        你读到「它」的时候，脑子里会自动回头扫一眼前面：是小猫还是鱼？再结合后面的「太饱了」，马上就明白了。
      </p>
      <p>
        注意力就是让模型做同样的事：对句子里的<b>每一个词</b>，都给其他所有词打一个「相关程度」的分（加起来是 100%），然后按这个比例把它们的信息拿过来，更新对自己的理解。
      </p>
      <p>
        这样，无论两个词隔得多远，都能直接「看到」对方。今天几乎所有大语言模型（Transformer）的核心就是一层层的注意力。（这里的分数是为了演示设计的示意，但真实模型里能看到非常类似的图案。）
      </p>
    </>
  ),
  terms: [
    {
      name: "注意力",
      definition: (
        <>
          让每个词给句子里所有词打「相关度」分、再按比例汇总信息的机制。它让模型能抓住远处的关系（比如代词指谁）。以注意力为核心的模型结构叫 <b>Transformer</b>，GPT 里的 T 就是它。
        </>
      ),
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:18:practice"
      aha={
        <>
          注意力 = 每个词都去「看」最相关的词。一层层叠起来，再加上海量文本预训练，就是今天的大语言模型。下一课：怎样跟它好好说话。
        </>
      }
      render={(report) => <AttnExperiment controls onState={report} />}
    />
  ),
  quiz: [
    {
      question: "注意力机制做的事是什么？",
      options: ["只看前一个词", "让每个词按相关程度去「看」句子里所有其他词", "把句子按字母排序"],
      answer: 1,
      explanation: "每个词都会给所有词打分，再按比例汇总信息。",
    },
    {
      question: "把「它太饱了」换成「它不新鲜」，「它」的注意力为什么会变？",
      options: ["因为句子变短了", "因为后面的词变了，和「它」最相关的对象也跟着变了", "随机变化"],
      answer: 1,
      explanation: "「太饱」更像在说小猫，「不新鲜」更像在说鱼。注意力会根据整句话的上下文来分配。",
    },
    {
      question: "为什么说注意力能处理「隔得很远」的关系？",
      options: ["它会把句子缩短", "每个词都能直接看到任何一个词，不用一个个传过去", "它只看最后一个词"],
      answer: 1,
      explanation: "不管隔多远，两个词之间都有一条直接的「注意力」连线。",
    },
  ],
  summary: <>注意力 = 读到每个词时，按相关程度去「看」句子里的其他词；它是 Transformer 和大语言模型的核心。</>,
  next: {
    question: "模型已经这么强了，为什么同一个问题换种问法，答案差这么多？",
    href: "/lessons/20",
    label: "去下一课：换种问法（提示词）→",
  },
};

export default function Lesson18({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
