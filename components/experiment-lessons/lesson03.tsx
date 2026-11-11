"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import {
  PerceptronExperiment,
  type PerceptronExperimentState,
} from "@/components/demos/PerceptronExperiment";

type S = PerceptronExperimentState;

const Red = ({ children = "红点" }: { children?: ReactNode }) => (
  <span className="font-semibold text-red-600 dark:text-red-400">{children}</span>
);
const Blue = ({ children = "蓝点" }: { children?: ReactNode }) => (
  <span className="font-semibold text-blue-600 dark:text-blue-400">{children}</span>
);

const playTasks: ExperimentTask<S>[] = [
  {
    id: "separate",
    text: (
      <>
        让这条线把 <Red /> 和 <Blue /> 完全分开
      </>
    ),
    hint: "一直点「下一步」，盯着那个闪黄圈的点，看线往哪边挪。",
    doneNote: "分开了！注意：线每次都是被一个「站错边」的点拽过去的。",
    check: (s) => s.converged && s.steps > 0,
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "learning-rate",
    text: (
      <>
        <b>调学习率</b>：把「每次挪多少」拖到最大（1.00），点「重置直线」，再点「自动播放」直到分开；然后拖回
        0.10 以下，再重来一次。比较一下两次。
      </>
    ),
    hint: "两次都要让线真正把点分开才算数（下方会记录「第几次分开、挪了几次」）。",
    doneNote: "学习率大：线每次一下子跳很远，容易纠正过头；学习率小：线一点点挪，要多挪几次。",
    check: (s) => s.runs.some((r) => r.lr >= 0.9) && s.runs.some((r) => r.lr <= 0.2),
  },
  {
    id: "outlier",
    text: (
      <>
        <b>当一回捣乱分子</b>：选「放蓝点」，在 <Red>红点堆</Red>的正中间点一下，再点「自动播放」。线还能让所有点都站对吗？
      </>
    ),
    hint: "要放进红点堆里面才算捣乱哦（放好后至少看它挪 15 次）。",
    doneNote: "线一直在抖、停不下来：只要有一个「怪点」，一条直线就没法让所有点都站对。真实数据里总有这样的点，所以准确率很难到 100%。",
    check: (s) => s.outliersAdded > 0 && s.stepsSinceOutlier >= 15,
  },
  {
    id: "xor",
    text: (
      <>
        <b>不可能的任务</b>：点「换一组数据：四角棋盘」（左下和右上是 <Red />，左上和右下是 <Blue />），点「自动播放」，至少看它挪
        30 次。
      </>
    ),
    hint: "线能把它们分开吗？",
    doneNote: "无论怎么转，总有点站错边：一条直线分不开对角同色的棋盘格。",
    check: (s) => s.preset === "xor" && s.steps >= 30,
  },
];

const def: ExperimentLessonDef = {
  minutes: 25,
  goal: "看懂机器是怎么「从错误里学会」画出一条分界线的，并知道一条直线的极限在哪。",
  play: (
    <Experiment<S>
      intro={<>任务：点「下一步」，看看这条线会怎么动。</>}
      tasks={playTasks}
      storageKey="exp:03:play"
      render={(report) => (
        <PerceptronExperiment initialPreset="two-clusters" onState={report} />
      )}
    />
  ),
  observe: {
    question: "每次线动起来之前，发生了什么？",
    options: [
      "线随机乱跳",
      "有一个站错边的点被选中，线就朝它挪了一下",
      "所有点一起推线",
    ],
    answer: 1,
    explanation: "只有站错边的点会让线动；站对了的点，线就不理它。",
    hintOnWrong: "回到上面再按一次「下一步」，盯着闪黄圈的那个点和「拽！」的虚线。",
  },
  explain: (
    <>
      <p>
        想象你在操场上用一根绳子把两队同学分开：<Red>红队</Red>站一边，<Blue>蓝队</Blue>
        站另一边。一开始绳子放歪了，有几个红队的同学被圈到了蓝队那边。
      </p>
      <p>
        你的办法很简单：<b>哪个同学站错了，就把绳子朝他那边挪一点</b>
        ，直到他回到自己队那一侧。一个一个纠正下去，绳子最后就停在能把两队分开的位置。
      </p>
      <p>
        刚才电脑做的就是这件事：没有人告诉它线应该画在哪，它只是<b>一次次被站错的点纠正</b>
        ，最后自己找到了位置。这就是机器「学习」最朴素的样子——<b>从错误里学</b>。
      </p>
    </>
  ),
  terms: [
    {
      name: "感知机",
      definition: (
        <>
          一种「用一条直线把东西分成两类」的最简单的 AI。它靠<b>站错边的例子</b>
          一点点把线挪对。1957 年就被发明出来，是今天所有神经网络的老祖宗。
        </>
      ),
    },
    {
      name: "学习率",
      definition: (
        <>
          每次挪线<b>挪多少</b>。挪得太少，学得慢；挪得太多，一下子就冲过头。
        </>
      ),
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>现在多了几个按钮。按顺序完成 3 个小任务（做完会自动打勾）：</>}
      tasks={practiceTasks}
      storageKey="exp:03:practice"
      aha={
        <>
          一条直线，<b>怎么转都分不开</b>「四角棋盘」。想让分界线拐弯，就得把好几条这样的线叠起来——这就是下一课的
          <b>多层网络</b>。
        </>
      }
      render={(report) => (
        <PerceptronExperiment
          initialPreset="two-clusters"
          presets={["two-clusters", "xor"]}
          controls={{ learningRate: true, addPoints: true, presetSwitch: true, reset: true }}
          onState={report}
        />
      )}
    />
  ),
  quiz: [
    {
      question: "感知机什么时候会调整那条线？",
      options: ["每个点都调一次", "遇到站错边的点时", "只在最后调一次"],
      answer: 1,
      explanation: "站对的点不会引起调整——它只从错误里学习。",
    },
    {
      question: "把学习率调得很大，每一步会怎样？",
      options: ["线完全不动", "线一下子挪得很远，容易纠正过头", "线会变成曲线"],
      answer: 1,
      explanation: "学习率就是每次挪多少。挪得多，单步变化就大，像你在任务 1 里看到的那样。",
    },
    {
      question: "下面哪组数据，感知机不可能把所有点都分对？",
      options: ["红点全在左边，蓝点全在右边", "四角棋盘（对角同色）", "红点在上，蓝点在下"],
      answer: 1,
      explanation: "感知机只会画一条直线。棋盘格需要拐弯的边界，一条直线做不到。",
    },
  ],
  summary: (
    <>
      感知机 = 一条会被「站错边的点」推着走的直线；学习率决定每次推多远；<b>一条直线分不开棋盘格</b>。
    </>
  ),
  next: {
    question: "如果数据像棋盘格那样，怎么让分界线弯起来？",
    href: "/lessons/04",
    label: "去第 04 课：多层感知机 →",
  },
  advancedIntro: (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 text-[15px] leading-relaxed dark:border-zinc-800 dark:bg-zinc-950">
      <p className="font-semibold">用数学写出刚才的过程（选读）</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          每个点有两个坐标 x₁、x₂。感知机算一个分数：<code className="font-mono">z = w₀ + w₁·x₁ + w₂·x₂</code>
          。z ≥ 0 判为红（+1），否则判为蓝（−1）。那条线就是 <code className="font-mono">z = 0</code> 的地方。
        </li>
        <li>
          一个点站错边时更新：<code className="font-mono">w ← w + η · y · x</code>。y 是正确答案（+1 或 −1），
          η（读作「伊塔」）就是学习率。这正是实验里「朝那个点挪一下」。
        </li>
        <li>下面的原文还会讲「感知机准则」和梯度下降，第 04 课会再用动画讲一遍，看不懂可以先跳过。</li>
      </ul>
      <p className="text-sm text-zinc-500">
        配色说明：全站统一 <Red>红色 = +1（正类）</Red>、<Blue>蓝色 = −1（负类）</Blue>，与下方 Notebook 的图一致。
      </p>
    </div>
  ),
};

export function Lesson03({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
