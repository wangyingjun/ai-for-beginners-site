"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { CharLmExperiment, type CharLmState } from "@/components/experiments/CharLmExperiment";

type S = CharLmState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "five",
    text: <>一直点「下一个字」，让它写出至少 5 个字</>,
    hint: "每点一次，先看看下面的候选条，再看它选了哪个。",
    doneNote: "它每次都从候选里按可能性抽一个字——可能性大的更容易被抽中，但不一定。",
    check: (s) => s.generated >= 5,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "cold",
    text: (
      <>
        把<b>温度</b>拖到 0.3 以下，点「连写 15 个字」
      </>
    ),
    doneNote: "几乎每次都选最可能的那个字，写出来很「稳」，但容易重复、绕圈。",
    check: (s) => s.runs.some((r) => r.temperature <= 0.3 && r.generated >= 15),
  },
  {
    id: "hot",
    text: (
      <>
        把温度拖到 1.5 以上，再连写 15 个字
      </>
    ),
    doneNote: "冷门的字也常被选中，写出来更「放飞」，也更容易胡言乱语。",
    check: (s) => s.runs.some((r) => r.temperature >= 1.5 && r.generated >= 15),
  },
  {
    id: "context",
    text: (
      <>
        把温度调回 1.0 左右，点「看前 2 个字」，连写 15 个字，和「只看前 1 个字」比一比
      </>
    ),
    hint: "温度在 0.8～1.2 之间都算。",
    doneNote: "多看一个字，句子明显更像诗了——看得越多（上下文越长），猜得越准。大模型能一次看几十万字。",
    check: (s) => s.runs.some((r) => r.order === 2 && r.temperature >= 0.8 && r.temperature <= 1.2 && r.generated >= 15),
  },
];

const def: ExperimentLessonDef = {
  minutes: 25,
  goal: "明白 AI 写作就是一次次「按概率选下一个字」，以及「温度」怎样控制它多大胆。",
  play: (
    <Experiment<S>
      intro={<>这个迷你 AI 只读过十首唐诗。它唯一会的事：看最后一个字，猜下一个字。</>}
      tasks={playTasks}
      storageKey="exp:17:play"
      render={(report) => <CharLmExperiment onState={report} />}
    />
  ),
  observe: {
    question: "它是怎么决定下一个字的？",
    options: ["每次都选可能性最大的那个", "按候选的可能性「抽签」，可能性大的更容易抽中", "完全随机"],
    answer: 1,
    explanation: "候选条越长越容易被选中，但短的也有机会。所以同样的开头，每次写出来都可能不一样。",
    hintOnWrong: "点「清空重写」几次，每次都从「春」开始，看看写出来是不是都一样。",
  },
  explain: (
    <>
      <p>
        玩过「词语接龙」吗？这个迷你 AI 做的是「字接龙」：它数过诗里每个字后面通常跟什么字——「明」后面常是「月」，「春」后面常是「风」「来」「眠」——然后照着这个比例抽签。
      </p>
      <p>
        ChatGPT 这样的大语言模型本质上也在做同一件事：<b>根据前面的内容，猜下一个字（词）</b>
        ，一个接一个。区别是它读过几乎整个互联网，而且一次能看前面很长一段话，所以猜得准得多。
      </p>
      <p>「温度」控制抽签有多「偏心」：温度低，几乎只抽最常见的字；温度高，冷门的字也常被抽到。</p>
    </>
  ),
  terms: [
    {
      name: "语言模型",
      definition: <>根据前面的文字，给「下一个字（词）是什么」打出概率的模型。一次次地预测、抽取、接上，就能写出整段话。大语言模型（LLM）就是特别大的语言模型。</>,
    },
    {
      name: "温度",
      definition: <>控制抽签随机程度的旋钮。温度低：稳、保守、容易重复；温度高：多样、有创意，但容易跑偏。很多 AI 产品里都能调。</>,
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>现在可以调温度、调「往前看几个字」了。完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:17:practice"
      aha={
        <>
          AI 写作 = 一次次猜下一个字。看得越远猜得越准——可前面的字那么多，<b>该重点看哪几个</b>？下一课：注意力。
        </>
      }
      render={(report) => <CharLmExperiment controls onState={report} />}
    />
  ),
  quiz: [
    {
      question: "语言模型写一段话的基本动作是什么？",
      options: ["一次性想好整段话", "根据前文一次猜一个字（词），接上后再猜下一个", "从网上找一段现成的"],
      answer: 1,
      explanation: "它是一步一步「接龙」出来的，每一步都在预测下一个字的概率。",
    },
    {
      question: "把温度调得很低，写出来的内容通常会怎样？",
      options: ["更有创意", "更保守、更容易重复", "完全随机"],
      answer: 1,
      explanation: "低温几乎总选最可能的那个字，稳但容易绕圈。",
    },
    {
      question: "为什么「看前 2 个字」比「只看前 1 个字」写得更通顺？",
      options: ["因为它读的诗更多", "因为上下文更多，猜下一个字更有依据", "因为温度变了"],
      answer: 1,
      explanation: "读过的诗没变，变的是每次参考的上下文长度。上下文越长，越知道接下来该写什么。",
    },
  ],
  summary: <>语言模型 = 看前文、猜下一个字、按概率抽一个接上；温度决定抽签多大胆，上下文越长猜得越准。</>,
  next: {
    question: "前文很长时，模型怎么知道「它」指的是谁？",
    href: "/lessons/18",
    label: "去下一课：读到「它」时该看谁（注意力）→",
  },
};

export default function Lesson17({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
