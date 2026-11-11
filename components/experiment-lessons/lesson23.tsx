"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { AdvancedNote } from "@/components/lesson/ui";
import { GameExperiment, type GameState } from "@/components/experiments/GameExperiment";

type S = GameState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "ten",
    text: <>和「神秘对手」玩完 10 轮，每轮选合作还是背叛</>,
    doneNote: "发现了吗？它每一轮都照搬你上一轮的做法：你合作它就合作，你背叛它就报复。",
    check: (s) => s.opp === "mystery" && s.finished,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "nice",
    text: <>对手是「老好人」（永远合作）。10 轮拿到 <b>40 分以上</b></>,
    hint: "它从不报复……",
    doneNote: "对付老好人，一直背叛分最高（50 分）。",
    check: (s) => s.opp === "nice" && s.finished && s.myScore >= 40,
  },
  {
    id: "copy",
    text: <>换成「学你的人」（照搬你上一轮）。10 轮拿到 <b>28 分以上</b></>,
    hint: "如果一直背叛，它也会一直背叛你，只能拿十几分。",
    doneNote: "对付会报复的人，合作才划算。最好的做法取决于对手是谁。",
    check: (s) => s.opp === "copy" && s.finished && s.myScore >= 28,
  },
  {
    id: "evo",
    text: <>点「开始演化」，看看 30 代以后小镇上谁最多</>,
    doneNote: "先是「总是背叛」靠欺负老好人壮大，老好人被欺负光以后，它碰到的都是会报复的人，反被「学对方上一步」取代。",
    check: (s) => s.evoDone && s.winner === "TFT",
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "通过重复博弈看出：当别人也会调整策略时，你的最优策略会跟着改变。",
  play: (
    <Experiment<S>
      intro={<>前面的 AI 都是自己学。如果世界上有好几个 AI，彼此的选择会互相影响，会怎样？玩个小游戏感受一下。</>}
      tasks={playTasks}
      storageKey="exp:23:play"
      render={(report) => <GameExperiment onState={report} />}
    />
  ),
  observe: {
    question: "神秘对手的策略是什么？",
    options: ["永远合作", "永远背叛", "照搬你上一轮的做法"],
    answer: 2,
    explanation: "这叫「以牙还牙」：第一轮先合作，之后学你上一步。简单，却在很多比赛里拿了冠军。",
  },
  explain: (
    <>
      <p>想象两家相邻的奶茶店：都不降价，各赚一份；一家偷偷降价，抢走对方客人；两家都降价，谁都赚不到钱。今天怎么做，取决于对方昨天怎么做。</p>
      <p>
        当环境里有好几个会学习、会调整的智能体时（自动驾驶的车流、拍卖里的出价机器人、游戏里的 AI 队友），你的最好策略不再固定，而是取决于其他人用什么策略——而他们也在因为你而改变。
      </p>
    </>
  ),
  terms: [
    { name: "多智能体", definition: <>同一个环境里有多个会自己做决定的 AI（智能体），它们可能合作，也可能竞争。每个智能体都要考虑别人会怎么反应。</> },
    { name: "博弈", definition: <>研究「几个参与者互相影响的决策」的学问。实验里的游戏叫「囚徒困境」：单看一轮背叛更划算，可大家都背叛反而最差；重复玩时，合作才会出现。</> },
  ],
  practice: (
    <Experiment<S>
      intro={<>完成 3 个小任务（可以换对手、看小镇演化）：</>}
      tasks={practiceTasks}
      storageKey="exp:23:practice"
      aha={<>多智能体的世界里没有一成不变的「最优解」：对手变了，最优策略也跟着变；长期看，「先合作、会报复、肯原谅」往往最稳。最后一课，看看机器怎样把图和文字放进同一个空间。</>}
      render={(report) => <GameExperiment controls onState={report} />}
    />
  ),
  quiz: [
    {
      question: "对手永远合作时，你的最高分策略是？",
      options: ["永远合作", "永远背叛", "学对方上一步"],
      answer: 1,
      explanation: "对方从不报复，背叛每轮都拿 5 分。",
    },
    {
      question: "对手会照搬你上一轮的做法时，为什么合作更划算？",
      options: ["因为背叛会招来报复，两人都只能拿 1 分", "因为规则禁止背叛", "因为合作得 5 分"],
      answer: 0,
      explanation: "一直背叛只能换来一直被背叛；合作能每轮各拿 3 分。",
    },
    {
      question: "「多智能体」学习比单个 AI 学习难在哪里？",
      options: ["电脑不够快", "别人也在变，环境本身在不断变化", "没有难点"],
      answer: 1,
      explanation: "每个智能体的最优策略取决于其他人，而其他人也在学习和调整。",
    },
  ],
  summary: <>多智能体 = 多个 AI 在同一环境里互相影响；在博弈中，最优策略取决于对手，而对手也在变。</>,
  next: { question: "AI 怎样不经训练就认出一张从没见过的图？", href: "/lessons/X1", label: "去下一课：图和字住进同一个空间（多模态）→" },
  advancedIntro: (
    <AdvancedNote>
      <p>原文第 23 课介绍多智能体系统的分类，并用 NetLogo / Python 演示狼羊捕食等多主体模拟。实验里的小镇演化是经典的「复制者动态」：得分高的策略按比例增加。</p>
    </AdvancedNote>
  ),
};

export default function Lesson23({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
