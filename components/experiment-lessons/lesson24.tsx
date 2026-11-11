"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { FairExperiment, type FairState } from "@/components/experiments/FairExperiment";

type S = FairState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "acc",
    text: <>你是银行，用这个模型批贷款。拖动门槛，让<b>总体判对率达到 85% 以上</b></>,
    hint: "试试在 50～60 之间找找。",
    doneNote: "判对率不错！但看看乙组：好几个会还钱的人被拒了（黄圈），甲组却几乎没有。",
    check: (s) => !s.split && s.acc >= 0.85,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "lower",
    text: <>把统一门槛往下调，直到<b>乙组没有黄圈</b></>,
    doneNote: "乙组不再被冤枉了，可甲组一堆不会还钱的人也被批了，总体判对率掉了下来。一个门槛照顾不了两组。",
    check: (s) => !s.split && s.missedB === 0 && s.tA >= 25,
  },
  {
    id: "split",
    text: <>点「两组分开设门槛」，让两组都没有黄圈，同时总体判对率 ≥ 95%</>,
    hint: "甲组门槛放在 60 左右，乙组门槛放低一些。",
    doneNote: "分开设门槛能补救——但这只是治标。",
    check: (s) => s.split && s.missedA === 0 && s.missedB === 0 && s.acc >= 0.95,
  },
  {
    id: "why",
    text: <>点「查原因」，看看乙组的分数为什么偏低</>,
    doneNote: "问题出在训练数据：模型学会了「住在哪」和分数的关系，把过去的不公平原样搬了过来。",
    check: (s) => s.revealed,
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "学会检查一个模型对不同人群是否公平，知道偏见常常藏在数据里。",
  play: (
    <Experiment<S>
      intro={<>两组申请人实际还钱的比例完全一样。模型给每个人打了个信用分，分数够门槛就批贷款。</>}
      tasks={playTasks}
      storageKey="exp:24:play"
      render={(report) => <FairExperiment onState={report} />}
    />
  ),
  observe: {
    question: "总体判对率挺高的，这个模型就没问题了吗？",
    options: ["没问题，判对率高就好", "有问题：被冤枉的人几乎都在乙组", "有问题：判对率太低"],
    answer: 1,
    explanation: "总体数字掩盖了分组的差异。对乙组的人来说，这个模型明显更不友好。",
    hintOnWrong: "数一数两组各有几个黄圈。",
  },
  explain: (
    <>
      <p>
        想象一位只在城东生活过的面试官，觉得「说话带城西口音的人不靠谱」。他未必有恶意，只是见得少、印象偏。
      </p>
      <p>
        AI 也一样：它从过去的数据里学。如果过去某群人就很少被批贷款、记录少，模型就会学到「这群人分数低」，再把这种不公平<b>自动、大规模</b>地重复下去。
      </p>
      <p>所以光看总体准确率不够，还要<b>分组检查</b>：各组被拒的比例、被冤枉的比例是不是差不多？发现问题后，要回头检查数据和特征，而不只是调门槛。</p>
    </>
  ),
  terms: [
    {
      name: "偏见",
      definition: <>模型对某些人群系统性地更不利。常见来源是有偏的训练数据（历史上的不公平、某群人数据太少）或不该用的特征（如住址、性别）。负责任的 AI 要分组评估、追查原因、持续监控。</>,
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:24:practice"
      aha={<>准确率高 ≠ 公平。AI 会把数据里的偏见学走并放大，所以用 AI 做决定时，一定要分组检查、追问原因。恭喜你走完了核心路线！</>}
      render={(report) => <FairExperiment controls onState={report} />}
    />
  ),
  quiz: [
    {
      question: "一个贷款模型总体准确率 90%，为什么仍可能不公平？",
      options: ["90% 太低了", "错误可能集中在某一群人身上", "准确率高就一定公平"],
      answer: 1,
      explanation: "总体数字会掩盖分组差异，必须按人群分别检查。",
    },
    {
      question: "模型的偏见最常见的来源是？",
      options: ["电脑本身有坏心眼", "训练数据里本来就有的不公平或缺失", "屏幕颜色"],
      answer: 1,
      explanation: "模型从数据里学习，数据里的历史偏差会被原样学走。",
    },
    {
      question: "发现模型对某组人不公平，最根本的做法是？",
      options: ["假装没看见", "检查和修正数据与特征，并持续分组评估", "把模型准确率再调高一点"],
      answer: 1,
      explanation: "单独调门槛只是补救；根本是找出偏差来源（数据、特征）并持续监控。",
    },
  ],
  summary: <>偏见 = 模型对某些人群系统性不利，常常来自数据；看 AI 不能只看总体准确率，要分组检查。</>,
  next: {
    question: "核心路线走完了！还想继续？去「进阶 / 选修」看看自编码器、生成对抗网络、目标检测……",
    href: "/course?lang=zh-CN",
    label: "回到学习路线 →",
  },
};

export default function Lesson24({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
