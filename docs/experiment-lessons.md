# 实验先行课页（Experiment-first lessons）

背景与设计见 `docs/课程优化方案.md`。课页固定 7 段：

① 先玩一下（实验，第一屏无术语）→ ② 你看到了什么 → ③ 发生了什么（大白话）→ ④ 给它起个名字（≤2 个术语，类型强制）→ ⑤ 再玩一次（带任务，自动打勾）→ ⑥ 3 道带解析小测 + 一句话小结 → ⑦ 进阶（默认折叠：公式 + 原 README / Demo 自由版 / Notebook / Lab）

目前已上线：第 03 课（感知机）。仅 `zh-CN` 使用新课页；`?lang=en` 仍显示原课页。

## 组件

| 文件 | 作用 |
|---|---|
| `components/lesson/ExperimentLesson.tsx` | 课页模板 + `ExperimentLessonDef` 类型 |
| `components/lesson/Experiment.tsx` | 通用实验外壳：一句任务说明 + 任务清单（`check(state)` 为真即打勾，可存 localStorage）+ 顿悟卡 |
| `components/lesson/ObserveQuestion.tsx` | 「你看到了什么」单选题 |
| `components/lesson/MiniQuiz.tsx` | 带解析的小测 |
| `components/lesson/TermCard.tsx` | 术语卡 |
| `components/lesson/OpenDetailsOnHash.tsx` | 链接到 `#notebooks` / `#lab` 时自动展开「进阶」 |
| `components/demos/PerceptronExperiment.tsx` | 引导式感知机实验（预设数据、闪黄圈、拽线动画、`onState` 回调） |

## 给新课加实验先行版

1. 让 Demo 能通过 `onState(state)` 回调汇报状态（参考 `PerceptronExperiment`），并支持预设数据和隐藏控件。
2. 新建 `components/experiment-lessons/lessonXX.tsx`（`"use client"`），写一个 `ExperimentLessonDef`：`play` / `practice` 用 `<Experiment render={(report) => <YourDemo onState={report} />} tasks=[...] />`。
3. 在 `components/experiment-lessons/registry.tsx` 注册，并把 id 加进 `lib/experiment-lessons.ts`。
4. 原课内容由 `app/lessons/[id]/page.tsx` 自动放进「进阶」，不用改。

## 约定

- 配色：红 = +1 / 正类，蓝 = −1 / 负类（与上游 notebook 一致）；黄圈 = 站错边 / 需要注意。
- 每课新术语 ≤ 2 个；公式只放进阶。
- 上游内容缺陷在 `lib/content-fixes.ts` 里于加载时修补，上游相对链接由 `lib/lesson-links.ts` 改写（同步后仍生效）。
