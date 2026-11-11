"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { AdvancedNote } from "@/components/lesson/ui";
import { SegmentExperiment, type SegState } from "@/components/experiments/SegmentExperiment";

type S = SegState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "box",
    text: <>先点「如果只用方框标…」，看方框里有多少格其实不是猫</>,
    doneNote: "猫的尾巴翘出去，方框就得画很大，近一半的格子是背景。",
    check: (s) => s.shape === "cat" && s.boxShown,
  },
  {
    id: "paint",
    text: <>现在一格一格<b>把猫涂出来</b>，吻合度达到 85% 以上</>,
    hint: "按住拖动可以连着涂；涂错了再点一下擦掉。",
    doneNote: "这样标出来的就是猫的真实形状，连尾巴都不多不少。",
    check: (s) => s.shape === "cat" && !s.model && s.match >= 0.85,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "exact",
    text: <>把猫涂到吻合度 ≥ 95%（几乎一格不差）</>,
    check: (s) => s.shape === "cat" && !s.model && s.match >= 0.95,
  },
  {
    id: "model",
    text: <>点「检查模型的答案」，找出模型判错的 5 个格子</>,
    hint: "注意边缘：耳朵、尾巴、身体边上。",
    doneNote: "模型的错误几乎都在边缘上——中间好判断，边界最难。",
    check: (s) => s.model && s.found >= s.flips,
  },
  {
    id: "dog",
    text: <>点「涂狗」，把狗也涂出来，吻合度 ≥ 90%</>,
    check: (s) => s.shape === "dog" && !s.model && s.match >= 0.9,
  },
];

const def: ExperimentLessonDef = {
  minutes: 20,
  goal: "知道「逐个像素判断类别」和画方框有什么不同、为什么有用。",
  play: (
    <Experiment<S>
      intro={<>上一课用方框标出物体。可是物体不是方的——这次试试一格一格地标。</>}
      tasks={playTasks}
      storageKey="exp:12:play"
      render={(report) => <SegmentExperiment onState={report} />}
    />
  ),
  observe: {
    question: "和方框比，一格一格涂出来的好处是？",
    options: ["更快", "能得到物体的真实形状，不包含背景", "颜色更好看"],
    answer: 1,
    explanation: "逐格标注不多不少，所以能算出物体面积、精确抠图、知道路面在哪儿。",
  },
  explain: (
    <>
      <p>想想小时候的填色本：每个区域都要涂成该涂的颜色，不能出线。</p>
      <p>
        分割模型就是自动填色：它对图片里的<b>每一个像素</b>都回答一遍「这是猫？是草地？是天空？」。输出是一张和原图一样大的「类别图」。
      </p>
      <p>自动驾驶靠它知道哪里是路面、哪里是行人；医生用它圈出 X 光片里病灶的准确范围。</p>
    </>
  ),
  terms: [
    { name: "语义分割", definition: <>给图片里每个像素都标上类别（猫、草地、天空…），得到一张和原图一样大的「类别图」。和目标检测比，它给出的是精确轮廓，而不是方框。常用的网络是 U-Net 一类「先缩小再放大」的结构。</> },
  ],
  practice: (
    <Experiment<S>
      intro={<>完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:12:practice"
      aha={<>语义分割 = 逐像素分类，得到物体的精确形状；最难的永远是边缘。图片这部分到这里告一段落，接下来回到文字：机器怎样从大量文字里自己学会词语的意思？</>}
      render={(report) => <SegmentExperiment controls onState={report} />}
    />
  ),
  quiz: [
    {
      question: "语义分割的输出是什么？",
      options: ["一个类别名", "几个方框", "每个像素各自的类别"],
      answer: 2,
      explanation: "分割对每个像素分类，输出和原图一样大的类别图。",
    },
    {
      question: "分割模型最容易出错的地方通常在？",
      options: ["物体正中间", "物体边缘", "图片四个角"],
      answer: 1,
      explanation: "边缘像素一半像物体一半像背景，最难判断。",
    },
    {
      question: "下面哪个任务更需要分割而不是方框？",
      options: ["数一数图里有几只猫", "精确算出肿瘤的面积", "判断图里有没有狗"],
      answer: 1,
      explanation: "面积需要精确轮廓；方框会把背景也算进去。",
    },
  ],
  summary: <>语义分割 = 给每个像素标类别，得到精确轮廓；它比方框精细，边缘最难。</>,
  next: { question: "回到文字：机器能不能靠「猜被遮住的词」自己学会词义？", href: "/lessons/15", label: "去下一课：猜被遮住的词（语言模型）→" },
  advancedIntro: (
    <AdvancedNote>
      <p>原文第 12 课用 PyTorch 实现 SegNet 和 U-Net，在皮肤病变数据集上训练分割模型。实验里的「吻合度」就是分割常用的交并比（按像素算）。</p>
    </AdvancedNote>
  ),
};

export default function Lesson12({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
