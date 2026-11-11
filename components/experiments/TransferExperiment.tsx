"use client";

import { useEffect, useMemo, useState } from "react";
import { COLORS, ExpCanvas, StatusPill, btnSecondary, chip, isDark } from "@/components/lesson/ui";
import { mulberry32 } from "@/lib/ml/perceptron";

type Task = "catdog" | "tigerwolf";
type Item = { id: number; label: 0 | 1; raw: [number, number]; feat: [number, number] };
const TASKS: Record<Task, { names: [string, string]; seed: number }> = {
  catdog: { names: ["狗", "猫"], seed: 5 },
  tigerwolf: { names: ["狼", "老虎"], seed: 17 },
};

function gauss(rnd: () => number) {
  return (rnd() + rnd() + rnd() + rnd() - 2) / 0.58;
}

/** raw = "pixel similarity" view (classes heavily mixed); feat = pretrained feature view (clustered). */
export function makeItems(task: Task): Item[] {
  const rnd = mulberry32(TASKS[task].seed);
  const out: Item[] = [];
  for (let i = 0; i < 24; i++) {
    const label: 0 | 1 = i % 2 === 0 ? 1 : 0;
    const raw: [number, number] = [0.08 + rnd() * 0.84, 0.08 + rnd() * 0.84];
    const cx = label === 1 ? 0.3 : 0.7;
    const cy = label === 1 ? 0.65 : 0.35;
    const feat: [number, number] = [
      Math.min(0.95, Math.max(0.05, cx + gauss(rnd) * 0.09)),
      Math.min(0.95, Math.max(0.05, cy + gauss(rnd) * 0.09)),
    ];
    out.push({ id: i, label, raw, feat });
  }
  return out;
}

export function centroidAcc(items: Item[], chosen: number[], key: "raw" | "feat") {
  const train = items.filter((it) => chosen.includes(it.id));
  const c: Record<0 | 1, [number, number] | null> = { 0: null, 1: null };
  for (const lab of [0, 1] as const) {
    const pts = train.filter((t) => t.label === lab);
    if (pts.length) c[lab] = [pts.reduce((s, p) => s + p[key][0], 0) / pts.length, pts.reduce((s, p) => s + p[key][1], 0) / pts.length];
  }
  if (!c[0] || !c[1]) return { acc: null as number | null, c };
  const test = items.filter((it) => !chosen.includes(it.id));
  let ok = 0;
  for (const t of test) {
    const d0 = (t[key][0] - c[0][0]) ** 2 + (t[key][1] - c[0][1]) ** 2;
    const d1 = (t[key][0] - c[1][0]) ** 2 + (t[key][1] - c[1][1]) ** 2;
    if ((d1 < d0 ? 1 : 0) === t.label) ok++;
  }
  return { acc: test.length ? ok / test.length : null, c };
}

export type TransferState = {
  task: Task;
  perClass: [number, number];
  accRaw: number | null;
  accFeat: number | null;
};

export function TransferExperiment({
  taskSwitch = false,
  onState,
}: {
  taskSwitch?: boolean;
  onState?: (s: TransferState) => void;
}) {
  const [task, setTask] = useState<Task>("catdog");
  const [chosen, setChosen] = useState<number[]>([]);
  const items = useMemo(() => makeItems(task), [task]);
  const names = TASKS[task].names;
  const raw = useMemo(() => centroidAcc(items, chosen, "raw"), [items, chosen]);
  const feat = useMemo(() => centroidAcc(items, chosen, "feat"), [items, chosen]);
  const perClass: [number, number] = [
    items.filter((i) => chosen.includes(i.id) && i.label === 0).length,
    items.filter((i) => chosen.includes(i.id) && i.label === 1).length,
  ];

  useEffect(() => {
    onState?.({ task, perClass, accRaw: raw.acc, accFeat: feat.acc });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, perClass[0], perClass[1], raw.acc, feat.acc, onState]);

  const toggle = (id: number) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const makeDraw = (key: "raw" | "feat", cent: typeof raw.c) => (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const dark = isDark();
    if (cent[0] && cent[1]) {
      const step = 12;
      for (let y = 0; y < h; y += step)
        for (let x = 0; x < w; x += step) {
          const u = (x + step / 2) / w;
          const v = 1 - (y + step / 2) / h;
          const d0 = (u - cent[0][0]) ** 2 + (v - cent[0][1]) ** 2;
          const d1 = (u - cent[1][0]) ** 2 + (v - cent[1][1]) ** 2;
          ctx.fillStyle = d1 < d0 ? "rgba(220,38,38,0.12)" : "rgba(37,99,235,0.12)";
          ctx.fillRect(x, y, step, step);
        }
    }
    for (const it of items) {
      const x = it[key][0] * w;
      const y = (1 - it[key][1]) * h;
      const sel = chosen.includes(it.id);
      ctx.globalAlpha = sel ? 1 : 0.75;
      ctx.fillStyle = it.label === 1 ? COLORS.red : COLORS.blue;
      ctx.beginPath();
      if (it.label === 1) ctx.arc(x, y, 7, 0, Math.PI * 2);
      else ctx.rect(x - 6, y - 6, 12, 12);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (sel) {
        ctx.strokeStyle = dark ? "#f4f4f5" : "#18181b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };
  const drawRaw = makeDraw("raw", raw.c);
  const drawFeat = makeDraw("feat", feat.c);

  const onPick = (key: "raw" | "feat") => (u: number, v: number, kind: "down" | "move" | "up") => {
    if (kind !== "down") return;
    let best = -1;
    let bd = 1e9;
    for (const it of items) {
      const d = (it[key][0] - u) ** 2 + (1 - it[key][1] - v) ** 2;
      if (d < bd) {
        bd = d;
        best = it.id;
      }
    }
    if (best >= 0 && bd < 0.004) toggle(best);
  };

  const pct = (a: number | null) => (a === null ? "—" : `${Math.round(a * 100)}%`);
  return (
    <div className="space-y-3">
      <p className="text-sm">
        <span className="font-semibold text-red-600">● {names[1]}</span>　<span className="font-semibold text-blue-600">■ {names[0]}</span>　
        点一下某个点 = 把它当成「带答案的例子」（套上圈）；其余的点拿来考试。
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">从零开始：直接比像素</span>
            <StatusPill ok={(raw.acc ?? 0) >= 0.9}>准确率 {pct(raw.acc)}</StatusPill>
          </div>
          <ExpCanvas draw={drawRaw} version={`${task}|${chosen.join(",")}`} maxWidth={320} onPointer={onPick("raw")} ariaLabel={`按像素相似度摆放的${names[1]}和${names[0]}`} />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">借用预训练模型的「眼睛」</span>
            <StatusPill ok={(feat.acc ?? 0) >= 0.9}>准确率 {pct(feat.acc)}</StatusPill>
          </div>
          <ExpCanvas draw={drawFeat} version={`${task}|${chosen.join(",")}`} maxWidth={320} onPointer={onPick("feat")} ariaLabel={`按预训练特征摆放的${names[1]}和${names[0]}`} />
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        两张图是<b>同一批照片</b>，只是摆放方式不同：左边按「像素像不像」摆，右边按一个看过上百万张照片的模型提取的特征摆。背景颜色 = 用你选的例子（取每类的平均位置）做出的判断。
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnSecondary} onClick={() => setChosen([])}>
          清空例子
        </button>
        {taskSwitch &&
          (Object.keys(TASKS) as Task[]).map((t) => (
            <button key={t} type="button" className={chip(task === t)} onClick={() => { setTask(t); setChosen([]); }}>
              任务：{TASKS[t].names[1]} vs {TASKS[t].names[0]}
            </button>
          ))}
      </div>
    </div>
  );
}
