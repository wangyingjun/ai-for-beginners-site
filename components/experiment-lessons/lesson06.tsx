"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { KernelExperiment, type KernelState } from "@/components/experiments/KernelExperiment";

type S = KernelState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "numbers",
    text: <>点「显示数字」，看看这张小图在电脑眼里是什么</>,
    doneNote: "每个格子就是一个数字：0 最暗，9 最亮。整张图 = 一张数字表格。",
    check: (s) => s.showNumbers,
  },
  {
    id: "scan",
    text: <>点「自动滑」（或一直点「滑一步」），让黄色小窗口扫完整张图</>,
    hint: "右边的结果会一格格出现。",
    doneNote: "房子的左右两条竖边亮了起来（红 / 蓝），平坦的地方都是白的。",
    check: (s) => s.completed.includes("vertical"),
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "horizontal",
    text: <>换成「找横边」，从头扫一遍。这次亮的是哪里？</>,
    doneNote: "这次亮的是屋顶、屋檐和底边这些横着的边。换一个小窗口，找的东西就变了。",
    check: (s) => s.completed.includes("horizontal"),
  },
  {
    id: "blur",
    text: <>换成「模糊」，扫一遍，看结果像什么</>,
    doneNote: "每个格子变成周围 9 个格子的平均，边缘糊开了——手机修图里的「模糊」就是这么做的。",
    check: (s) => s.completed.includes("blur"),
  },
  {
    id: "edit",
    text: <>在原图上点几个格子画点东西（比如一扇窗），再用任意小窗口扫一遍</>,
    hint: "点格子会在黑白之间切换；改完图后要重新扫完才算。",
    doneNote: "你画的新东西，它的边也被找出来了——小窗口不管图里画的是什么，只认「明暗变化」这种局部图案。",
    check: (s) => s.completedAfterEdit,
  },
];

const def: ExperimentLessonDef = {
  minutes: 25,
  goal: "知道电脑眼里的图片就是一张数字表格，以及一个 3×3 的小窗口怎样从里面找出边缘。",
  play: (
    <Experiment<S>
      intro={<>这是一张只有 10×10 个格子的小图（一座房子）。任务：</>}
      tasks={playTasks}
      storageKey="exp:06:play"
      render={(report) => <KernelExperiment onState={report} />}
    />
  ),
  observe: {
    question: "小窗口扫完以后，结果里哪些地方最亮（颜色最深）？",
    options: ["房子里面一整块", "房子的竖边：从暗到亮、从亮到暗的地方", "背景"],
    answer: 1,
    explanation: "这个小窗口把左边减右边：两边一样亮时得 0，明暗突变（边缘）时数值才大。",
    hintOnWrong: "再看看右边的结果图：白色是 0，红和蓝出现在哪？",
  },
  explain: (
    <>
      <p>
        把照片放大到极致，你会看到一个个小方块，每个方块只有一个颜色。电脑存的就是这些方块的<b>亮度数字</b>（彩色照片是红绿蓝三张表）。
      </p>
      <p>
        想在数字里找「边」，可以拿一个 3×3 的小窗口（就像一个放大镜）在图上一格格地滑：每到一个位置，把窗口里的 9 个数和窗口上写的 9 个数<b>对应相乘再加起来</b>
        。窗口上写着「左边 −1、右边 +1」，那么只有左右明暗不同的地方得分才高——也就是竖边。
      </p>
      <p>换一组窗口上的数字，就能找横边、斜边、斑点……这是所有图像 AI 的第一步。</p>
    </>
  ),
  terms: [
    {
      name: "像素",
      definition: <>图片里最小的那个小方块。每个像素用数字表示亮度（彩色图用红、绿、蓝三个数字）。一张 1000 万像素的照片，就是 1000 万个这样的小方块。</>,
    },
    {
      name: "卷积核",
      definition: (
        <>
          那个在图上滑来滑去的 3×3 小窗口，上面写的 9 个数决定它找什么图案（竖边、横边、模糊……）。拿它在整张图上滑一遍算一遍的过程叫<b>卷积</b>。
        </>
      ),
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>现在可以换小窗口、改原图了。完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:06:practice"
      aha={
        <>
          一个小窗口只找一种局部图案，换一组数字就找另一种。如果让电脑<b>自己学</b>窗口上该写什么数字呢？这就是下一课的卷积神经网络。
        </>
      }
      render={(report) => <KernelExperiment kernels={["vertical", "horizontal", "blur", "identity"]} editable onState={report} />}
    />
  ),
  quiz: [
    {
      question: "一张黑白照片在电脑里是怎么存的？",
      options: ["存成一句描述，比如「一座房子」", "存成一张表格，每格是一个像素的亮度数字", "存成很多条线"],
      answer: 1,
      explanation: "图片 = 像素表格。电脑处理图片，其实就是在算这张表格里的数字。",
    },
    {
      question: "「找竖边」的卷积核扫过一大片同样亮的区域，结果是多少？",
      options: ["很大", "接近 0", "等于 9"],
      answer: 1,
      explanation: "左边 −1、右边 +1，两边一样亮就互相抵消，得 0。只有明暗变化的地方才会「亮」。",
    },
    {
      question: "想让卷积核找横边而不是竖边，要改什么？",
      options: ["换一张图片", "改卷积核上的 9 个数", "让它滑得快一点"],
      answer: 1,
      explanation: "卷积核找什么完全由它上面的数字决定。把 −1 / +1 从左右换成上下，就变成找横边。",
    },
  ],
  summary: <>图片就是一格格的像素数字；卷积核是一个 3×3 小窗口，在图上滑一遍就能把某种局部图案（比如边缘）找出来。</>,
  next: {
    question: "如果图案换了个位置，怎样还能认出来？卷积核上的数字又该谁来定？",
    href: "/lessons/07",
    label: "去下一课：在哪儿都能认出来（卷积神经网络）→",
  },
  advancedIntro: (
    <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 text-[15px] leading-relaxed dark:border-zinc-800 dark:bg-zinc-950">
      <p className="font-semibold">和原文的对应（选读）</p>
      <p>
        原文第 06 课介绍 OpenCV 等图像处理工具和「运动检测」等例子；实验里的卷积核在 OpenCV 里就是 <code className="font-mono">cv2.filter2D</code>
        。下面还保留了原来的自由卷积演示，可以上传真实图片试不同的核。
      </p>
    </div>
  ),
};

export default function Lesson06({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
