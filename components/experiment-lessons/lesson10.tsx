"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { AdvancedNote } from "@/components/lesson/ui";
import { GanExperiment, type GanState } from "@/components/experiments/GanExperiment";

type S = GanState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "fool",
    text: <>你是造假者。拖动两个滑块，让鉴定员的分辨率降到 <b>60% 以下</b></>,
    hint: "先把蓝柱的中心挪到红柱那里，再调分散程度。",
    doneNote: "仿作的分布和真作品几乎重合，鉴定员只能靠猜了。",
    check: (s) => s.acc <= 0.6,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "auto",
    text: <>这次不用你动手：点「让两者自动对练」，看造假者怎么一步步骗过鉴定员（降到 55% 以下）</>,
    doneNote: "每一回合，造假者都朝「鉴定员觉得更像真的」方向挪一点——这就是生成对抗网络的训练。",
    check: (s) => s.lastAuto !== null && s.lastAuto.data === "one" && s.lastAuto.acc <= 0.55,
  },
  {
    id: "weak",
    text: <>把真作品换成「两个峰」，造假者仍「只会画一个峰」，再对练一次</>,
    doneNote: "怎么练都骗不过（70% 左右）：造假者的本事不够，画不出两个峰。",
    check: (s) => s.lastAuto !== null && s.lastAuto.data === "two" && !s.lastAuto.two,
  },
  {
    id: "strong",
    text: <>给造假者升级成「会画两个峰」，再对练，降到 55% 以下</>,
    doneNote: "本事够了就能学会。真正的生成器是很大的神经网络，所以能画出人脸、风景这么复杂的东西。",
    check: (s) => s.lastAuto !== null && s.lastAuto.data === "two" && s.lastAuto.two && s.lastAuto.acc <= 0.55,
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "理解「造假者和鉴定员互相较劲」怎样让 AI 学会画出以假乱真的东西。",
  play: (
    <Experiment<S>
      intro={<>红柱是真画家作品的分布，蓝柱是你的仿作。鉴定员看到一件作品，要猜它是真是假。</>}
      tasks={playTasks}
      storageKey="exp:10:play"
      render={(report) => <GanExperiment onState={report} />}
    />
  ),
  observe: {
    question: "鉴定员的分辨率降到 50% 附近，说明什么？",
    options: ["鉴定员坏掉了", "仿作和真作品已经分不出来，他只能瞎猜", "仿作比真作品还多"],
    answer: 1,
    explanation: "50% 就是抛硬币。造假者的目标就是把鉴定员逼到这一步。",
  },
  explain: (
    <>
      <p>想象一个造假画的人和一个鉴定专家。鉴定员每次指出「这里不像」，造假者就照着改；造假者越来越像，鉴定员也得越看越仔细。两个人互相逼着进步。</p>
      <p>
        AI 里也是两个网络：一个负责<b>造</b>，从随机数出发画出作品；一个负责<b>鉴别</b>，判断作品是真是假。轮流训练，最后造出来的东西连鉴定员都分不出来。
      </p>
      <p>实验里的「作品」只有一个数，所以能画成柱状图；真正的网络处理的是整张图片，原理一样。</p>
    </>
  ),
  terms: [
    { name: "生成器", definition: <>负责「造」的网络：输入一串随机数，输出一张图（或一段文字、声音）。它从不直接看真图，只靠判别器的反馈来改进。</> },
    { name: "判别器", definition: <>负责「鉴别」的网络：输入一张图，输出它是真图的可能性。生成器和判别器一起组成生成对抗网络（GAN）。</> },
  ],
  practice: (
    <Experiment<S>
      intro={<>完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:10:practice"
      aha={<>生成器和判别器互相较劲，生成器越来越会造；但它能造多复杂的东西，取决于它本身有多大本事。下一课换个方向：不造图，而是在图里找东西。</>}
      render={(report) => <GanExperiment controls onState={report} />}
    />
  ),
  quiz: [
    {
      question: "生成对抗网络里，生成器靠什么改进？",
      options: ["直接复制真图", "判别器的反馈：哪里看起来不像真的", "人工逐张打分"],
      answer: 1,
      explanation: "生成器不看真图，只朝着让判别器更难分辨的方向调整。",
    },
    {
      question: "训练理想时，判别器的分辨率会接近多少？",
      options: ["100%", "50%", "0%"],
      answer: 1,
      explanation: "真假完全分不出时，判别器只能靠猜，正确率约 50%。",
    },
    {
      question: "真作品有两个峰，生成器只会画一个峰，结果会怎样？",
      options: ["很快就能骗过判别器", "怎么练都骗不过，因为它本事不够", "判别器会认输"],
      answer: 1,
      explanation: "生成器的表达能力决定了它能学到多复杂的分布。",
    },
  ],
  summary: <>生成对抗网络 = 生成器（造假者）+ 判别器（鉴定员），两者互相较劲，直到造出的东西真假难辨。</>,
  next: { question: "AI 能不能在一张照片里找出猫在哪儿？", href: "/lessons/11", label: "去下一课：把东西框出来（目标检测）→" },
  advancedIntro: (
    <AdvancedNote>
      <p>原文第 10 课用 TensorFlow/Keras 训练 DCGAN 生成图片，并介绍风格迁移。实验里把「作品」简化成一个数，鉴定员是理论上最好的判别器，造假者每回合朝骗过它的方向挪一小步。</p>
    </AdvancedNote>
  ),
};

export default function Lesson10({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
