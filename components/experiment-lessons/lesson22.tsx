"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { CartExperiment, type CartExpState } from "@/components/experiments/CartExperiment";

type S = CartExpState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "manual",
    text: <>点「开始」，按住「← 推」「推 →」，试着让杆子别倒，玩一局</>,
    hint: "杆子往哪边倒，就往哪边推车。已经放慢了速度。",
    doneNote: "没那么容易吧？可你也没有「标准答案」，只能边试边感觉——这正是强化学习面对的情况。",
    check: (s) => s.manualEpisodes >= 1,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "try",
    text: <>点「让 AI 自己试 10 局」，看看它每局的成绩</>,
    doneNote: "一开始大多很快就倒，偶尔有一局特别好——AI 会记住那局用的策略，在它附近接着试。",
    check: (s) => s.trials - s.zeroRewardTrials >= 10,
  },
  {
    id: "learn",
    text: <>继续让 AI 试，直到最好的策略能坚持 <b>200 步以上</b>，然后点「看最好的策略玩一局」</>,
    hint: "可能要多点几次，每次 10 局。",
    doneNote: "它比你稳多了！没有人教它该怎么推，只是靠「奖励多的留下」摸索出来的。",
    check: (s) => s.best >= 200 && s.watched >= 1,
  },
  {
    id: "no-reward",
    text: <>点「关掉奖励」，再让 AI 试 10 局</>,
    doneNote: "每局都是 0 分，AI 分不出好坏，什么也学不到。奖励是强化学习唯一的老师。",
    check: (s) => s.zeroRewardTrials >= 10,
  },
];

const def: ExperimentLessonDef = {
  minutes: 25,
  goal: "用平衡小车说明强化学习：不给标准答案，只给奖励，靠试错学出策略。",
  play: (
    <Experiment<S>
      intro={<>经典的「平衡小车」：左右推小车，让上面的杆子不倒。每坚持一步，奖励 +1。</>}
      tasks={playTasks}
      storageKey="exp:22:play"
      render={(report) => <CartExperiment onState={report} />}
    />
  ),
  observe: {
    question: "玩的时候，有人告诉你「这一刻该往左还是往右」吗？",
    options: ["有，每一步都有标准答案", "没有，只知道杆子倒没倒、坚持了多久", "有，屏幕上有提示"],
    answer: 1,
    explanation: "你只能得到一个结果分数（奖励），要自己琢磨怎么做更好。这和前面「每个例子都带答案」的学习很不一样。",
    hintOnWrong: "回想一下：屏幕上只有「奖励」这个数字。",
  },
  explain: (
    <>
      <p>
        想想你怎么教小狗坐下：你没法把「坐下的标准姿势」讲给它听，只能在它做对时给块零食。小狗试来试去，慢慢明白「这样做有零食」。
      </p>
      <p>
        强化学习就是这样：AI（叫智能体）在环境里做动作，环境告诉它得了多少奖励，它的目标是让总奖励尽量多。没有标准答案，全靠<b>试错</b>。
      </p>
      <p>
        AlphaGo 下围棋、机器人学走路、大语言模型学着「回答得更讨人喜欢」（RLHF），用的都是这个思路。
      </p>
    </>
  ),
  terms: [
    {
      name: "奖励",
      definition: <>环境给 AI 的打分信号：做得好给正分，做得不好给负分或零分。AI 学习的目标就是让长期的总奖励最大。奖励设计得不好，AI 就会学歪。</>,
    },
    {
      name: "策略",
      definition: <>AI 根据当前看到的情况（杆子角度、车的速度……）决定做什么动作的规则。强化学习就是在不断改进策略。</>,
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>现在交给 AI。完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:22:practice"
      aha={<>不给答案、只给奖励，AI 也能靠试错学会。但它学什么完全取决于奖励——没有奖励就学不到，奖励设计错了就会学歪。</>}
      render={(report) => <CartExperiment agent onState={report} />}
    />
  ),
  quiz: [
    {
      question: "强化学习和前面学的「给例子」学习最大的区别是？",
      options: ["强化学习不需要电脑", "强化学习没有标准答案，只有奖励", "强化学习只能玩游戏"],
      answer: 1,
      explanation: "它不知道每一步的正确动作，只知道结果好不好，所以要靠试错。",
    },
    {
      question: "为什么关掉奖励后，AI 学不到东西？",
      options: ["因为电脑太慢", "因为每局都是 0 分，它分不出哪种策略更好", "因为杆子太长"],
      answer: 1,
      explanation: "奖励是它判断好坏的唯一依据。全是 0，就没有「更好」可言。",
    },
    {
      question: "下面哪个最适合用强化学习？",
      options: ["给一万张标好的猫狗照片分类", "让机器人通过不断尝试学会走路", "数一句话里有几个词"],
      answer: 1,
      explanation: "走路没有现成的「每一步标准答案」，但能判断走得远不远（奖励），正适合试错学习。",
    },
  ],
  summary: <>强化学习 = 没有答案只有奖励：智能体不断试错，改进策略，让总奖励最大。</>,
  next: {
    question: "AI 越来越能干了，它会不会对某些人不公平？",
    href: "/lessons/24",
    label: "去下一课：准确率高也可能伤人（AI 伦理）→",
  },
};

export default function Lesson22({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
