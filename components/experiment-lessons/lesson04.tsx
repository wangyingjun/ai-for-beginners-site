"use client";

import type { ReactNode } from "react";
import { Experiment, type ExperimentTask } from "@/components/lesson/Experiment";
import { ExperimentLesson, type ExperimentLessonDef } from "@/components/lesson/ExperimentLesson";
import { Blue, Red, Yellow } from "@/components/lesson/ui";
import { MlpExperiment, type MlpExpState } from "@/components/experiments/MlpExperiment";

type S = MlpExpState;

const playTasks: ExperimentTask<S>[] = [
  {
    id: "no-hidden",
    text: (
      <>
        <Red>红点</Red>在中间，<Blue>蓝点</Blue>围一圈。点「开始训练」，看看只有一条线能不能把红点圈起来（训练 60 轮以上）。
      </>
    ),
    hint: "背景颜色是网络的判断：偏红 = 它觉得是红点，偏蓝 = 蓝点。黄圈 = 判断错的点。",
    doneNote: "卡在七成多：一条直线怎么摆都圈不住一个圆。",
    check: (s) => s.runs.some((r) => r.hidden === 0 && r.epochs >= 60),
  },
  {
    id: "hidden",
    text: <>点「加一层（4 个神经元）」，再训练，让准确率超过 92%</>,
    hint: "多训练一会儿，看背景颜色怎么变。",
    doneNote: "边界弯起来了，把红点围在了中间！",
    check: (s) => s.runs.some((r) => r.hidden > 0 && r.dataset === "circle" && r.bestAcc >= 0.92),
  },
];

const practiceTasks: ExperimentTask<S>[] = [
  {
    id: "neurons",
    text: (
      <>
        <b>神经元够不够</b>：隐藏层只留 <b>2</b> 个神经元训练 100 轮以上；再换成 <b>6</b> 个，训练到准确率超过 92%。
      </>
    ),
    hint: "换神经元个数会自动重新开始。",
    doneNote: "每个隐藏神经元其实就是一条直线。2 条线围不成圈；3 条以上就能拼成多边形把红点围住。",
    check: (s) =>
      s.runs.some((r) => r.hidden === 2 && r.dataset === "circle" && r.epochs >= 100) &&
      s.runs.some((r) => r.hidden >= 5 && r.dataset === "circle" && r.bestAcc >= 0.92),
  },
  {
    id: "xor",
    text: (
      <>
        <b>回到第 03 课的难题</b>：数据换成「四角棋盘」，用隐藏层把它分开（准确率超过 90%）。
      </>
    ),
    hint: "记得选一个大于 0 的神经元个数。",
    doneNote: "感知机怎么都分不开的棋盘格，叠一层就分开了。",
    check: (s) => s.runs.some((r) => r.dataset === "xor" && r.hidden > 0 && r.bestAcc >= 0.9),
  },
  {
    id: "trace",
    text: (
      <>
        <b>误差怎么分给每一层</b>：在有隐藏层时点「追查一个错点」，看右边网络图里误差怎样一步步往回传。
      </>
    ),
    hint: "最好在训练了一会儿、还有黄圈的时候点。动画分 4 步。",
    doneNote: "输出错了多少 → 顺着连线往回分 → 每个隐藏神经元按「责任」改自己的线。这就是反向传播。",
    check: (s) => s.traced > 0 && s.hidden > 0,
  },
];

const def: ExperimentLessonDef = {
  minutes: 25,
  goal: "知道为什么要「叠一层」才能画出弯曲的分界线，以及训练时误差怎样往回分配给每一层。",
  play: (
    <Experiment<S>
      intro={<>这一次红点被蓝点围在中间了。先试试只有一条线的网络：</>}
      tasks={playTasks}
      storageKey="exp:04:play"
      render={(report) => <MlpExperiment initialHidden={0} onState={report} />}
    />
  ),
  observe: {
    question: "加了一层以后，分界线有什么变化？",
    options: ["还是一条直线，只是挪了位置", "变弯了，能把红点围起来", "没有变化"],
    answer: 1,
    explanation: "隐藏层里的每个神经元各画一条线，输出把它们组合起来，于是边界可以拐弯、围成一圈。",
    hintOnWrong: "回去在「不加隐藏层」和「加一层」之间切换，各训练一次，比较背景颜色的形状。",
  },
  explain: (
    <>
      <p>
        想象你要用<b>几根直尺</b>在桌上把一枚硬币圈起来：一根尺子做不到，但三四根尺子拼成一个多边形就可以。
      </p>
      <p>
        网络也是这样：中间那一层的每个神经元，就是一根「直尺」（一条线）。最后的输出把它们的结果组合起来，于是整体的分界线就能弯曲、围圈。线越多，能拼出的形状越复杂。
      </p>
      <p>
        那训练时，每根线怎么知道自己该怎么挪？从输出开始算错了多少，再<b>顺着连线往回</b>
        ，按每根线的「责任大小」把误差分下去，每根线都朝着让误差变小的方向挪一点（还是上一课的下山）。你在
        <Yellow>黄色动画</Yellow>里看到的就是这个过程。
      </p>
    </>
  ),
  terms: [
    {
      name: "隐藏层",
      definition: (
        <>
          夹在输入和输出之间的一层神经元，从外面看不见，所以叫「隐藏」。每个神经元画一条线，组合起来就能画出弯曲的边界。叠了隐藏层的网络叫<b>多层感知机</b>。
        </>
      ),
    },
    {
      name: "反向传播",
      definition: (
        <>
          训练多层网络的办法：先算出输出错了多少，再<b>从后往前</b>一层层把误差分给每根连线，每根线按分到的份额用梯度下降改一点。
        </>
      ),
    },
  ],
  practice: (
    <Experiment<S>
      intro={<>现在可以调神经元个数、换数据、追查误差了。完成 3 个小任务：</>}
      tasks={practiceTasks}
      storageKey="exp:04:practice"
      aha={
        <>
          叠一层 = 把好几条直线组合成弯曲的边界；反向传播告诉每根线该怎么改。但能力越强，也越容易「死记硬背」训练数据——下一课就来看这个陷阱。
        </>
      }
      render={(report) => (
        <MlpExperiment initialHidden={4} neuronChoices={[0, 1, 2, 3, 4, 6, 8]} datasetSwitch trace onState={report} />
      )}
    />
  ),
  quiz: [
    {
      question: "为什么只有输入和输出、没有隐藏层的网络圈不住中间的红点？",
      options: ["因为训练时间不够", "因为它只能画一条直线", "因为红点太少"],
      answer: 1,
      explanation: "没有隐藏层，它就和感知机一样只能画直线。直线怎么摆都围不成圈。",
    },
    {
      question: "隐藏层里只有 2 个神经元时，为什么还是不太行？",
      options: ["2 条直线拼不出一个能围住红点的形状", "神经元越少训练越快", "2 个神经元只能认蓝点"],
      answer: 0,
      explanation: "每个隐藏神经元相当于一条线。至少 3 条线才能拼出一个把中间围住的三角形。",
    },
    {
      question: "反向传播里的「反向」指的是什么？",
      options: ["把数据倒过来输入", "误差从输出往输入方向一层层分下去", "把训练好的网络删掉重来"],
      answer: 1,
      explanation: "先在输出算出错了多少，再从后往前分给每一层的连线，所以叫反向。",
    },
  ],
  summary: <>叠一层隐藏层，直线就能拼成弯曲的边界；反向传播把误差从输出往回分，告诉每根线怎么改。</>,
  next: {
    question: "网络越大越强，是不是就越好？",
    href: "/lessons/05",
    label: "去下一课：死记硬背 vs 真懂了 →",
  },
  advancedIntro: (
    <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 text-[15px] leading-relaxed dark:border-zinc-800 dark:bg-zinc-950">
      <p className="font-semibold">和原文的对应（选读）</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>隐藏神经元 = 原文里的一层「全连接层」+ 激活函数（实验里用 tanh）。没有激活函数的话，叠多少层都还是一条直线。</li>
        <li>「追查一个错点」里每个神经元的百分比 = 输出误差 × 连线权重 × 激活函数的坡度，也就是链式法则。</li>
        <li>下面的原文和 Notebook 会从零写出这个网络，再用 PyTorch / TensorFlow 搭建；第一次学可以先跳过。</li>
      </ul>
      <p className="text-sm text-zinc-500">
        网络图配色：<Red>红线 = 正权重</Red>，<Blue>蓝线 = 负权重</Blue>，线越粗权重越大。
      </p>
    </div>
  ),
};

export default function Lesson04({ advanced }: { advanced?: ReactNode }) {
  return <ExperimentLesson def={def} advanced={advanced} />;
}
