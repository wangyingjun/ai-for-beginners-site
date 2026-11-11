"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { AdvancedNote } from "@/components/lesson/ui";
import { AutoencoderExperiment, type AeState } from "@/components/experiments/AutoencoderExperiment";

type S = AeState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "squeeze",
    text: <>把滑块拖到 <b>4 个数以下</b>，看还原出来的笑脸变成什么样</>,
    doneNote: "糊了，但大概轮廓还在——4 个数记住了「大致长什么样」。",
    check: (s) => s.img === "smile" && s.k <= 4,
  },
  {
    id: "min",
    text: <>慢慢往右拖，找到<b>一格不差</b>需要的最少个数（不用全部 64 个）</>,
    hint: "十几个数就够了。",
    doneNote: "64 格的图，大约 11 个数就能完全还原：有规律的图可以被压缩。",
    check: (s) => s.img === "smile" && s.wrong === 0 && s.k <= 12,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "heart",
    text: <>换成「爱心」，用 <b>6 个数以内</b>做到一格不差</>,
    doneNote: "爱心比笑脸更规整，需要的数更少。",
    check: (s) => s.img === "heart" && !s.noisy && s.wrong === 0 && s.k <= 6,
  },
  {
    id: "noise",
    text: <>换成「乱点」，同样做到一格不差，看看要多少个数</>,
    doneNote: "要 30 多个！毫无规律的图几乎没法压缩——压缩靠的就是规律。",
    check: (s) => s.img === "noise" && !s.noisy && s.wrong === 0,
  },
  {
    id: "denoise",
    text: <>换回「爱心」，点「给输入加噪点」，把个数调小，让还原图和<b>干净原图</b>只差 3 格以内</>,
    hint: "试试 6～10 个数。数太多会把噪点也原样记住。",
    doneNote: "瓶颈小，噪点这种「不合规律」的东西挤不过去——还原图反而比输入更干净。这就是去噪。",
    check: (s) => s.img === "heart" && s.noisy && s.k <= 10 && s.wrongVsClean <= 3,
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "知道「用很少的数字记住一张图」是什么意思，以及它能用来去噪。",
  play: (
    <Experiment<S>
      intro={<>左边一张 8×8 = 64 格的小图。中间只允许留下几个数，右边再用这几个数把图画回来。</>}
      tasks={playTasks}
      storageKey="exp:09:play"
      render={(report) => <AutoencoderExperiment onState={report} />}
    />
  ),
  observe: {
    question: "64 格的图只用十几个数就能完全还原，说明了什么？",
    options: ["电脑偷偷存了整张图", "这张图有规律，规律可以用很少的数描述", "随便什么图都能这样压缩"],
    answer: 1,
    explanation: "笑脸左右对称、线条连续，这些规律让少量数字就够用。下面「乱点」会告诉你：没规律就压不下去。",
    hintOnWrong: "想想乱七八糟的图能不能这么省。",
  },
  explain: (
    <>
      <p>想象你给朋友打电话描述一张图：不会一格一格念「黑白黑白…」，而是说「一个圆脸，两只眼，一张笑嘴」。几句话，对方就能画出来。</p>
      <p>
        这节的实验分两半：前一半把 64 格<b>压</b>成几个数，后一半再用这几个数<b>还原</b>。中间那个窄口越小，越只能留下最重要的「大致样子」。
      </p>
      <p>
        真正的 AI 版本里，压缩和还原这两半都是神经网络，训练目标就一个：还原出来的图尽量和原图一样。练得多了，网络自己就学会了「该记住什么」。（实验里用的是一种固定的压缩方法，原理相同。）
      </p>
    </>
  ),
  terms: [
    { name: "自编码器", definition: <>一种「先压缩、再还原」的神经网络：前半段叫编码器，把输入压成几个数；后半段叫解码器，把这几个数还原回去。训练时只要求输出尽量等于输入，所以不需要人工标注。</> },
    { name: "瓶颈", definition: <>编码器和解码器之间那个最窄的地方（实验里的「中间留几个数」）。瓶颈越窄，网络越只能留下最本质的特征；这几个数也常被拿来做分类、去噪、生成新图。</> },
  ],
  practice: (
    <Experiment<S>
      intro={<>完成 3 个小任务（下面可以换图、加噪点）：</>}
      tasks={practiceTasks}
      storageKey="exp:09:practice"
      aha={<>压缩靠规律：有规律的图几个数就能记住，乱点几乎压不动；窄窄的瓶颈还能把不合规律的噪点挡在外面。下一课，我们让 AI 不只还原，而是画出从没见过的新图。</>}
      render={(report) => <AutoencoderExperiment controls onState={report} />}
    />
  ),
  quiz: [
    {
      question: "自编码器训练时，「正确答案」是什么？",
      options: ["人工给的标签", "输入本身", "随机数"],
      answer: 1,
      explanation: "它要求输出尽量等于输入，所以不需要额外标注。",
    },
    {
      question: "为什么「乱点」图很难压缩？",
      options: ["因为它颜色太深", "因为它没有规律，每一格都得单独记", "因为电脑不喜欢它"],
      answer: 1,
      explanation: "压缩就是用规律代替逐格记忆；没有规律，就省不下来。",
    },
    {
      question: "瓶颈窄一点，为什么能去噪？",
      options: ["噪点不合图的规律，挤不过窄口", "瓶颈会自动删除黑色格子", "去噪和瓶颈无关"],
      answer: 0,
      explanation: "窄瓶颈只留得下主要规律，零散的噪点被丢掉，还原图反而更干净。",
    },
  ],
  summary: <>自编码器 = 先压缩再还原的网络；中间最窄的「瓶颈」逼它只记住最重要的规律，所以能压缩、能去噪。</>,
  next: { question: "能不能让 AI 画出一张全新的、以假乱真的图？", href: "/lessons/10", label: "去下一课：造假者和鉴定员（生成对抗网络）→" },
  advancedIntro: (
    <AdvancedNote>
      <p>
        原文第 09 课用 TensorFlow/Keras 搭卷积自编码器，在 MNIST 手写数字上训练，并介绍去噪、超分辨率和变分自编码器（VAE）。实验里用固定的「频率压缩」（DCT，JPEG 用的就是它）代替训练出来的编码器，思路一样：只留最重要的几个数。
      </p>
    </AdvancedNote>
  ),
};

export default function Lesson09({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
