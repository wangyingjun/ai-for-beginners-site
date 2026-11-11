"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { Yellow } from "@/components/lesson/ui";
import { GdExperiment, type GdState } from "@/components/experiments/GdExperiment";

type S = GdState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "bottom",
    text: <>点「走一步」（或「自动走」），让小球走到谷底</>,
    hint: "注意黄线（坡度）：坡越陡，小球一步走得越远；越接近谷底，步子越小。",
    doneNote: "小球每一步都朝「下坡」的方向走，坡缓了步子就变小，最后停在谷底。",
    check: (s) => s.atBottom,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "tiny",
    text: (
      <>
        <b>步子太小</b>：把「步子大小」拖到 0.03 以下，点「小球放回起点」，再走 20 步以上。
      </>
    ),
    hint: "可以用「自动走」，走满 20 步就算数。",
    doneNote: "一步一挪，20 步了还在半山腰——学习率太小，训练会非常慢。",
    check: (s) => s.runs.some((r) => r.lr <= 0.03 && r.steps >= 20),
  },
  {
    id: "zigzag",
    text: (
      <>
        <b>步子很大</b>：把步子调到 0.80～0.95 之间，放回起点，走到谷底。
      </>
    ),
    hint: "看小球的路线（黄色虚线）是怎么走的。",
    doneNote: "小球一下子跨过谷底，又跳回来，左右横跳着才停下。",
    check: (s) => s.runs.some((r) => r.lr >= 0.8 && r.lr <= 0.95 && r.result === "bottom"),
  },
  {
    id: "fly",
    text: (
      <>
        <b>步子太大</b>：把步子调到 1.00 以上，放回起点，再走几步。
      </>
    ),
    hint: "会发生什么？",
    doneNote: "每跳一次都比上次离谷底更远，最后飞出了山谷——学习率太大，训练会「炸掉」。",
    check: (s) => s.runs.some((r) => r.result === "flew"),
  },
];

const def: ExperimentLessonDef = {
  minutes: 25,
  goal: "看懂机器怎样一步步把误差降下来（梯度下降），以及「步子大小」为什么要调得刚好。",
  play: (
    <Experiment<S>
      intro={
        <>
          这条曲线就是上一课的「误差山谷」：横轴是斜率，高度是总误差。任务：让小球走到最低处。
        </>
      }
      tasks={playTasks}
      storageKey="exp:gd:play"
      render={(report) => <GdExperiment onState={report} />}
    />
  ),
  observe: {
    question: "小球每一步往哪边走？",
    options: ["随机选一边", "往下坡的方向走，坡越陡走得越远", "一直往右走"],
    answer: 1,
    explanation: "它只看脚下的坡度：哪边低就往哪边走；坡陡说明离谷底还远，所以一步迈得大。",
    hintOnWrong: "回去再按几次「走一步」，看黄线的倾斜方向和绿箭头。",
  },
  explain: (
    <>
      <p>
        想象你<b>蒙着眼站在山坡上</b>，想走到山谷最低处。你看不见整座山，但能用脚感觉脚下哪边往下斜。于是你每次都朝下坡的方向迈一步，坡越陡就迈得越大。走着走着，就到了谷底。
      </p>
      <p>
        机器也看不见「整座误差山」（参数一多，这座山有成千上万个方向）。它只会在当前位置算出<Yellow>坡度</Yellow>
        ，然后朝下坡挪一步。重复几百几千次，误差就降下来了。
      </p>
      <p>
        每一步迈多大，就是第 03 课见过的<b>学习率</b>：太小走得慢，太大会跨过谷底甚至越跳越远。
      </p>
    </>
  ),
  terms: [
    {
      name: "梯度下降",
      definition: (
        <>
          训练几乎所有神经网络的办法：算出误差在当前位置的<b>坡度</b>（梯度），然后朝下坡方向挪一小步，一遍遍重复，直到误差不再下降。
        </>
      ),
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>现在可以调「步子大小」了（就是学习率）。完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:gd:practice"
      aha={
        <>
          步子太小走不动，太大会横跳甚至飞出去。真实训练里调<b>学习率</b>
          ，就是在调这一步迈多大。下一课：当分界线需要「拐弯」时，网络要怎么搭。
        </>
      }
      render={(report) => <GdExperiment showLr onState={report} />}
    />
  ),
  quiz: [
    {
      question: "梯度下降每一步根据什么决定往哪走？",
      options: ["随便选一个方向", "当前位置的坡度：往误差变小的方向走", "直接跳到最低点"],
      answer: 1,
      explanation: "机器看不到整座山，只知道脚下的坡度，所以每次朝下坡挪一点。",
    },
    {
      question: "学习率设得太大，可能发生什么？",
      options: ["训练特别稳", "跨过谷底来回跳，甚至越跳越远", "小球停在原地不动"],
      answer: 1,
      explanation: "就像你在任务 2、3 里看到的：步子大了会横跳，再大就飞出山谷（误差越来越大）。",
    },
    {
      question: "为什么快到谷底时，小球的步子会自动变小？",
      options: ["因为程序设置了倒计时", "因为谷底附近坡度变缓，算出来的一步就小", "因为学习率自动变了"],
      answer: 1,
      explanation: "一步走多远 = 学习率 × 坡度。谷底附近几乎是平的，坡度小，步子自然小。",
    },
  ],
  summary: <>梯度下降 = 蒙眼下山：看脚下坡度，往下坡挪一步，反复走；学习率决定一步迈多大。</>,
  next: {
    question: "第 03 课的「四角棋盘」一条直线分不开，下山也没用。怎么办？",
    href: "/lessons/04",
    label: "去下一课：让线拐弯（多层网络）→",
  },
  advancedIntro: (
    <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 text-[15px] leading-relaxed dark:border-zinc-800 dark:bg-zinc-950">
      <p className="font-semibold">用数学写出来（选读）</p>
      <p>
        实验里的山谷是 <code className="font-mono">L(w) = (w − 3)²</code>，坡度（导数）是 <code className="font-mono">2(w − 3)</code>
        。每一步：<code className="font-mono">w ← w − η · 2(w − 3)</code>，η 是学习率。
      </p>
      <p>
        可以算出：η &lt; 0.5 时一路滑下去；0.5 &lt; η &lt; 1 时左右横跳但会收敛；η &gt; 1 时每次离谷底更远（发散）——正是你在实验里看到的三种情况。
      </p>
      <p className="text-sm text-zinc-500">本课是本站补充的小课，上游课程在第 03、04 课里用公式讲了梯度下降。</p>
    </div>
  ),
};

export default function LessonGd({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
