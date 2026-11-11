"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { Blue, Red } from "@/components/lesson/ui";
import { DataExperiment, type DataState } from "@/components/experiments/DataExperiment";

type S = DataState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "separate",
    text: (
      <>
        换一换横轴、竖轴，找到一种组合，让 <Red>好评</Red> 和 <Blue>差评</Blue> 能被一条直线分开
      </>
    ),
    hint: "现在用的是「字数」和「感叹号」，红蓝混在一起。哪些数字更能说明一条评论是夸还是骂？",
    doneNote: "绿色虚线出现了！挑对了「看什么」，两类评论自然分到两边。",
    check: (s) => s.separated && !(s.xf === "len" && s.yf === "bang") && !(s.xf === "bang" && s.yf === "len"),
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "tap",
    text: <>点图上任意 3 个点，看看每个点是哪条评论、它的坐标是怎么来的</>,
    hint: "点在圆点或方块上。",
    doneNote: "每条评论都被变成了两个数字，也就是坐标纸上的一个点。",
    check: (s) => s.tapped >= 3,
  },
  {
    id: "one-axis",
    text: (
      <>
        找一个<b>只看横轴</b>就能分开好评差评的数字（竖直的一刀就够了）
      </>
    ),
    hint: "试试把不同的数字放到横轴上，看红点和蓝块是不是分在左右两边。",
    doneNote: "有的数字单独一个就够用，有的（像字数）怎么都没用——挑数字这件事，就是在找有用的特征。",
    check: (s) => s.xAlone,
  },
  {
    id: "custom",
    text: <>在下面自己写一条评论，选好评或差评，放到图上，看它落在哪</>,
    hint: "试试写一句「不难吃，就是有点慢」这种夸里带骂的。",
    doneNote: "电脑并不懂你写的意思，它只认那几个数出来的数字。数字挑得不好，它就会被骗。",
    check: (s) => s.custom >= 1,
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "把一样东西变成坐标纸上的一个点，并学会挑出「有用的角度」（特征）。",
  play: (
    <Experiment<S>
      intro={<>这是 15 条外卖评论，每条都被数出了几个数字，画成一个点。任务：</>}
      tasks={playTasks}
      storageKey="exp:data:play"
      render={(report) => <DataExperiment onState={report} />}
    />
  ),
  observe: {
    question: "为什么换成「好词数」「坏词数」以后就分开了？",
    options: ["因为点变多了", "因为这两个数字跟「夸还是骂」有关系，而字数、感叹号关系不大", "因为电脑读懂了评论"],
    answer: 1,
    explanation: "字数长短、有没有感叹号，好评差评都可能有；好词坏词才真正反映态度。电脑从头到尾都没「读懂」文字。",
    hintOnWrong: "点几个点看看：好评和差评的字数、感叹号是不是差不多？",
  },
  explain: (
    <>
      <p>
        电脑不会读评论、看照片、听声音，它只会算数。所以任何东西想交给 AI，第一步都是<b>变成一串数字</b>：一条评论 → （好词 2 个，坏词 0 个）→ 坐标纸上的一个点。
      </p>
      <p>
        就像挑西瓜：你看的是「纹路清不清楚、敲起来声音脆不脆」，而不是「西瓜放在第几排」。<b>看什么</b>，决定了你能不能挑准。
      </p>
      <p>
        挑对了数字，两类东西在坐标纸上自然分成两堆，一条直线就能分开——下一课，你会看到电脑<b>自己学会</b>画这条线。
      </p>
    </>
  ),
  terms: [
    {
      name: "特征",
      definition: (
        <>
          描述一样东西的某个数字，比如评论的「好词数」、房子的「面积」、图片里某个格子的亮度。选哪些特征，就是告诉 AI「看哪些地方」。一个点有几个特征，就有几个坐标。
        </>
      ),
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>多了「自己写评论」。完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:data:practice"
      aha={
        <>
          数据 = 一堆点；特征 = 每个点的坐标。挑对了特征，<Red>红点</Red>和<Blue>蓝点</Blue>就分在两边。下一课：让电脑自己找出那条分界线。
        </>
      }
      render={(report) => <DataExperiment allowCustom onState={report} />}
    />
  ),
  quiz: [
    {
      question: "电脑「看」一条评论时，实际上处理的是什么？",
      options: ["评论的意思", "从评论里数出来的一串数字", "评论的字体"],
      answer: 1,
      explanation: "电脑只会算数。文字、图片、声音都要先变成数字（特征）才能交给模型。",
    },
    {
      question: "想区分好评和差评，下面哪个特征最有用？",
      options: ["评论发布的时间是几点", "评论里出现了几个「难吃」「凉了」之类的词", "评论用的是什么手机发的"],
      answer: 1,
      explanation: "坏词数和「是不是差评」直接相关；另外两个和态度几乎没关系。",
    },
    {
      question: "如果选的特征和要分的东西没关系，会怎样？",
      options: ["两类点混在一起，怎么画线都分不开", "电脑会自动换一个好特征", "分得更开"],
      answer: 0,
      explanation: "就像一开始用「字数 × 感叹号」：红蓝搅在一起，模型再聪明也分不开。",
    },
  ],
  summary: <>任何东西交给 AI 前都要变成数字；描述它的那些数字叫特征，挑对了特征，分类就成功了一大半。</>,
  next: {
    question: "点已经分在两边了，电脑能不能自己学会画那条分界线？",
    href: "/lessons/03",
    label: "去下一课：画一条线把两类分开（感知机）→",
  },
};

export default function LessonData({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
