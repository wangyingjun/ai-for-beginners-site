"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { OverfitExperiment, type OverfitState } from "@/components/experiments/OverfitExperiment";

type S = OverfitState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "wiggle",
    text: <>把「弯曲程度」往右拖，直到曲线穿过每一个黑点（练习误差几乎为 0）</>,
    hint: "练习误差降到 0.01 以下，标签会变绿。",
    doneNote: "每个黑点都对上了！可是看看点和点之间，曲线是不是在乱扭？",
    check: (s) => !s.moreData && s.trainErr < 0.01,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "exam",
    text: (
      <>
        点「显示考试题」，然后把弯曲程度从 <b>1 一路拖到 9</b>，看下面灰柱和绿柱怎么变。
      </>
    ),
    hint: "至少经过 6 个不同的弯曲程度，包括 1～2 和 8～9。",
    doneNote: "灰柱（练习误差）一路下降；绿柱（考试误差）先降后升——太弯以后，练习题全对，考试反而考砸。",
    check: (s) => s.showVal && s.visited.length >= 6 && Math.min(...s.visited) <= 2 && Math.max(...s.visited) >= 8,
  },
  {
    id: "best",
    text: <>只有 8 道练习题时，找到让<b>考试误差最低</b>的弯曲程度。</>,
    hint: "看绿柱哪根最矮。",
    doneNote: "最好的不是最弯的，而是「刚刚好」的——这正是用考试题挑模型的意义。",
    check: (s) => s.showVal && !s.moreData && s.nearBestVal,
  },
  {
    id: "more-data",
    text: (
      <>
        点「多给点练习题」，再把弯曲程度拖到 <b>8 以上</b>。考试误差怎么样了？
      </>
    ),
    hint: "记得打开考试题。",
    doneNote: "练习题多了，曲线没法在每个点之间乱扭，考试误差明显变小——多给数据是治「死记硬背」的好办法。",
    check: (s) => s.showVal && s.moreData && s.degree >= 8,
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "能从「练习误差」和「考试误差」两条线，看出模型是真学会了，还是在死记硬背。",
  play: (
    <Experiment<S>
      intro={<>这些黑点是一些测量数据。任务：让曲线尽量贴住它们。</>}
      tasks={playTasks}
      storageKey="exp:05:play"
      render={(report) => <OverfitExperiment onState={report} />}
    />
  ),
  observe: {
    question: "曲线穿过了每一个黑点，它是不是就找到了数据背后的规律？",
    options: ["是，误差都是 0 了", "不一定：点和点之间乱扭，换一个新的点它很可能猜错", "是，曲线越弯越聪明"],
    answer: 1,
    explanation: "它是把这 8 个点「背」下来了，而不是学会了大致的走势。下面用没见过的「考试题」来验证。",
    hintOnWrong: "回去看看弯曲程度最大时，点与点之间的曲线长什么样。",
  },
  explain: (
    <>
      <p>
        想象两个准备考试的同学：一个把练习册的答案<b>一字不差背下来</b>，一个<b>弄懂了解题思路</b>
        。做练习册时两人都满分；可考试换了新题，背答案的那个就露馅了。
      </p>
      <p>
        模型也一样。太弯的曲线（太复杂的模型）可以穿过每个练习点，但那只是背答案；真正有用的是对<b>没见过的数据</b>也猜得准。
      </p>
      <p>
        所以我们会故意<b>留一部分数据不给它学</b>，专门当考试题。练习误差在降、考试误差却在升，就说明它开始死记硬背了。治法：换个简单点的模型、多给数据，或者早点停止训练。
      </p>
    </>
  ),
  terms: [
    {
      name: "过拟合",
      definition: (
        <>
          模型把训练数据「背」了下来（练习误差很低），却没学到真正的规律，遇到新数据就猜错（考试误差高）。反过来，太简单、连练习题都做不好，叫<b>欠拟合</b>。
        </>
      ),
    },
    {
      name: "验证集",
      definition: (
        <>
          特意留出来、训练时不给模型看的数据，也就是刚才的「考试题」。用它的误差来判断模型是不是过拟合、该选多复杂的模型。
        </>
      ),
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>现在多了「考试题」（绿圈，模型学的时候看不到）和误差柱状图。完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:05:practice"
      aha={
        <>
          练习误差低 ≠ 真学会了。永远留一份模型没见过的数据来「考试」——全站后面的课里，你会一直看到训练集和验证集这两条线。
        </>
      }
      render={(report) => <OverfitExperiment controls onState={report} />}
    />
  ),
  quiz: [
    {
      question: "练习误差（训练集）一直在降，考试误差（验证集）开始上升，说明什么？",
      options: ["模型越来越好", "模型开始过拟合（死记硬背）", "数据出错了"],
      answer: 1,
      explanation: "它对见过的题越来越熟，对新题却越来越差——典型的过拟合。",
    },
    {
      question: "验证集里的数据，训练时可以给模型看吗？",
      options: ["可以，看得越多越好", "不可以，否则它就不是「没见过的考试题」了", "只能看一半"],
      answer: 1,
      explanation: "验证集的意义就是检验模型对新数据的表现，被看过就失去了作用。",
    },
    {
      question: "下面哪种做法能减轻过拟合？",
      options: ["把模型变得更复杂", "收集更多训练数据", "只看训练误差"],
      answer: 1,
      explanation: "就像你在任务 3 里看到的：数据多了，模型没法在每个点之间乱扭。用更简单的模型、早点停也有帮助。",
    },
  ],
  summary: <>过拟合 = 练习题全对、考试考砸；用模型没见过的验证集来考它，挑「刚刚好」的复杂度。</>,
  next: {
    question: "学会了「机器怎么学」，接下来让它学会看图片：图片在电脑眼里是什么？",
    href: "/lessons/06",
    label: "去阶段 2：让机器看懂图片 →",
  },
};

export default function Lesson05({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
