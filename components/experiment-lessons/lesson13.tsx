"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { BowExperiment, type BowState } from "@/components/experiments/BowExperiment";

type S = BowState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "convert",
    text: <>这两句话意思正好相反。点「变成数字」，看看电脑把它们变成了什么</>,
    doneNote: "切成词、数一数——两句话数出来一模一样！对电脑来说，这两句话没有区别。",
    check: (s) => s.converted && s.presetIndex === 0,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "own-pair",
    text: <>自己改写 A、B 两句话，找出<b>另一对</b>「意思不同、但数出来一样」的句子</>,
    hint: "提示：把词的顺序调换一下，比如「我追猫」和「猫追我」。（不能直接用例句。）",
    doneNote: "只要词一样、顺序不同，词袋就分不出来——它把「顺序」整个扔掉了。",
    check: (s) => s.customSamePair,
  },
  {
    id: "bigram",
    text: <>点「例句 1」，再点「改成两个词一组数」</>,
    doneNote: "「不好吃」和「不贵」成了不同的组合，两句话终于分开了。但组合越多，表格越大，而且「好吃」和「美味」仍然毫无关系。",
    check: (s) => s.bigram && s.presetIndex === 0 && !s.same,
  },
  {
    id: "dog",
    text: <>点「例句 2」（狗咬人 / 人咬狗），分别用「一个词一个词」和「两个词一组」各看一次</>,
    hint: "切换两种数法，看提示条的变化。",
    doneNote: "一个一个数：分不开；两两一组：分开了。顺序里藏着意思。",
    check: (s) => s.presetIndex === 1 && s.bigram && !s.same,
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "学会最简单的「把一句话变成一串数字」的办法，并说出它丢掉了什么。",
  play: (
    <Experiment<S>
      intro={<>电脑只会算数，所以文字也得先变成数字。最简单的办法：数一数每个词出现了几次。</>}
      tasks={playTasks}
      storageKey="exp:13:play"
      render={(report) => <BowExperiment onState={report} />}
    />
  ),
  observe: {
    question: "为什么「不好吃，很贵」和「很好吃，不贵」变成的数字一样？",
    options: ["电脑算错了", "两句话用的词完全相同，只是顺序不同，而数词只管「有几个」不管顺序", "因为它们一样长"],
    answer: 1,
    explanation: "都是「不、好吃、很、贵」各一次。数词的办法把顺序扔掉了，而这两句话的区别全在顺序里。",
    hintOnWrong: "看看两句话「切成词」那一行：用的词是不是一样？",
  },
  explain: (
    <>
      <p>
        想象你把一句话剪成一个个词，<b>扔进一个袋子里摇一摇</b>，然后只记下袋子里每种词有几个。这就是电脑处理文字最古老的办法。
      </p>
      <p>
        它其实挺好用：一条评论里「好吃」「推荐」多，大概是好评；「难吃」「凉了」多，大概是差评。很多垃圾邮件过滤器就是这样起步的。
      </p>
      <p>
        但袋子一摇，<b>顺序就没了</b>：「狗咬人」和「人咬狗」装进袋子是一样的。把相邻的两个词绑成一组再数，能找回一点顺序；可要真正理解意思，还需要下一课的新办法。
      </p>
    </>
  ),
  terms: [
    {
      name: "词袋",
      definition: <>把一句话切成词，只数每个词出现几次、不管顺序，得到一串数字。简单好用，但会丢掉词序；把相邻词组合起来数（N-gram）能找回一部分。</>,
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>现在两句话都可以自己改了。完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:13:practice"
      aha={
        <>
          词袋只会数「有没有」，不管顺序，也不知道「好吃」和「美味」是一个意思。下一课：让意思相近的词，变成相近的数字。
        </>
      }
      render={(report) => <BowExperiment editable bigramControl onState={report} />}
    />
  ),
  quiz: [
    {
      question: "词袋方法把一句话变成数字时，记下了什么？",
      options: ["每个词出现了几次", "每个词的意思", "词出现的先后顺序"],
      answer: 0,
      explanation: "词袋只数次数，所以叫「袋子」：倒进去就不分先后了。",
    },
    {
      question: "下面哪对句子，用词袋（一个词一个词数）分不开？",
      options: ["「我爱猫」和「我爱狗」", "「我追猫」和「猫追我」", "「好吃」和「难吃」"],
      answer: 1,
      explanation: "「我追猫」和「猫追我」用的词一样，只是顺序不同，词袋数出来完全相同。",
    },
    {
      question: "把相邻两个词组成一组来数，有什么好处？",
      options: ["表格变小了", "能保留一部分词序，比如区分「不好吃」和「很好吃」", "能知道每个词的意思"],
      answer: 1,
      explanation: "两两一组记住了「谁挨着谁」，找回了部分顺序；代价是组合更多、表格更大。",
    },
  ],
  summary: <>词袋 = 把句子切成词、数次数；简单好用，但丢了顺序，也不懂近义词。</>,
  next: {
    question: "怎样让「好吃」和「美味」变成相近的数字？",
    href: "/lessons/14",
    label: "去下一课：意思相近的词住得近（词向量）→",
  },
};

export default function Lesson13({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
