"use client";

import { useEffect, useState } from "react";
import { StatusPill, btnPrimary, chip } from "@/components/lesson/ui";

const FACTS = ["有毛发", "有羽毛", "会飞", "下蛋", "吃肉", "有条纹", "会游泳"] as const;
type Fact = (typeof FACTS)[number];
type Cond = { fact: string; not?: boolean };
type Rule = { id: string; if: Cond[]; then: string; custom?: boolean };

const ANIMALS: Record<string, Fact[]> = {
  老虎: ["有毛发", "吃肉", "有条纹"],
  斑马: ["有毛发", "有条纹"],
  企鹅: ["有羽毛", "下蛋", "会游泳"],
  老鹰: ["有羽毛", "会飞", "下蛋", "吃肉"],
  鸭嘴兽: ["有毛发", "下蛋", "会游泳"],
};
const FINAL = Object.keys(ANIMALS);

const BASE_RULES: Rule[] = [
  { id: "R1", if: [{ fact: "有毛发" }], then: "哺乳动物" },
  { id: "R2", if: [{ fact: "有羽毛" }], then: "鸟" },
  { id: "R3", if: [{ fact: "哺乳动物" }, { fact: "吃肉" }], then: "食肉动物" },
  { id: "R4", if: [{ fact: "食肉动物" }, { fact: "有条纹" }], then: "老虎" },
  { id: "R5", if: [{ fact: "哺乳动物" }, { fact: "有条纹" }, { fact: "吃肉", not: true }], then: "斑马" },
  { id: "R6", if: [{ fact: "鸟" }, { fact: "会飞", not: true }, { fact: "会游泳" }], then: "企鹅" },
  { id: "R7", if: [{ fact: "鸟" }, { fact: "会飞" }, { fact: "吃肉" }], then: "老鹰" },
];

const condText = (c: Cond) => (c.not ? `不${c.fact.replace(/^会/, "会")}` : c.fact);

function infer(animal: string, rules: Rule[]) {
  const known = new Set<string>(ANIMALS[animal]);
  const holds = (c: Cond) => (c.not ? !known.has(c.fact) : known.has(c.fact));
  const trace: { rule: Rule; ok: boolean }[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const r of rules) {
      if (known.has(r.then)) continue;
      if (r.if.every(holds)) {
        known.add(r.then);
        trace.push({ rule: r, ok: true });
        changed = true;
      }
    }
  }
  const result = FINAL.find((a) => known.has(a) && rules.some((r) => r.then === a && trace.some((t) => t.rule === r))) ?? null;
  return { trace, result };
}

export type ExpertState = { identified: Record<string, string | null>; customRules: number };

export function ExpertExperiment({
  ruleBuilder = false,
  onState,
}: {
  ruleBuilder?: boolean;
  onState?: (s: ExpertState) => void;
}) {
  const [animal, setAnimal] = useState("老虎");
  const [rules, setRules] = useState<Rule[]>(BASE_RULES);
  const [run, setRun] = useState<ReturnType<typeof infer> | null>(null);
  const [shown, setShown] = useState(0);
  const [identified, setIdentified] = useState<Record<string, string | null>>({});
  const [draftConds, setDraftConds] = useState<Fact[]>([]);
  const [draftThen, setDraftThen] = useState("鸭嘴兽");

  useEffect(() => {
    onState?.({ identified, customRules: rules.filter((r) => r.custom).length });
  }, [identified, rules, onState]);

  useEffect(() => {
    if (!run || shown > run.trace.length) return;
    const t = window.setTimeout(() => {
      setShown((n) => n + 1);
      if (shown === run.trace.length) setIdentified((m) => ({ ...m, [animal]: run.result }));
    }, 450);
    return () => window.clearTimeout(t);
  }, [run, shown, animal]);

  const start = () => {
    setRun(infer(animal, rules));
    setShown(0);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-medium">要认的动物：</span>
        {Object.keys(ANIMALS).map((a) => (
          <button key={a} type="button" className={chip(animal === a)} onClick={() => { setAnimal(a); setRun(null); }}>
            {a}
          </button>
        ))}
      </div>
      <p className="text-sm">
        已知事实：
        {ANIMALS[animal].map((f) => (
          <span key={f} className="mr-1 rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
            {f}
          </span>
        ))}
        <span className="text-zinc-500">（其余都「不是」）</span>
      </p>
      <details className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800" open>
        <summary className="cursor-pointer font-medium">专家写好的规则（{rules.length} 条）</summary>
        <ol className="mt-2 space-y-1">
          {rules.map((r) => {
            const fired = run?.trace.slice(0, shown).some((t) => t.rule === r);
            return (
              <li key={r.id} className={`rounded px-2 py-1 ${fired ? "bg-emerald-100 dark:bg-emerald-900/50" : ""} ${r.custom ? "border border-dashed border-indigo-400" : ""}`}>
                <span className="font-mono text-xs text-zinc-400">{r.id}</span> 如果 {r.if.map(condText).join(" 且 ")} → <b>{r.then}</b>
                {fired && " ✓"}
              </li>
            );
          })}
        </ol>
      </details>
      <button type="button" className={btnPrimary} onClick={start}>
        开始推理
      </button>
      {run && (
        <div className="space-y-1 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900" aria-live="polite">
          {run.trace.slice(0, shown).map((t, i) => (
            <p key={i}>
              用 {t.rule.id}：{t.rule.if.map(condText).join(" 且 ")} → 推出「{t.rule.then}」
            </p>
          ))}
          {shown > run.trace.length && (
            <StatusPill ok={run.result === animal}>
              {run.result ? `结论：这是${run.result}！` : "没有一条规则能推出是什么动物——我不知道"}
            </StatusPill>
          )}
        </div>
      )}
      {ruleBuilder && (
        <div className="space-y-2 rounded-lg border border-dashed border-indigo-300 p-3 dark:border-indigo-800">
          <p className="text-sm font-medium">自己写一条规则：</p>
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span>如果</span>
            {FACTS.map((f) => (
              <button key={f} type="button" className={chip(draftConds.includes(f))} onClick={() => setDraftConds((d) => (d.includes(f) ? d.filter((x) => x !== f) : [...d, f]))}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span>那么是</span>
            {FINAL.map((a) => (
              <button key={a} type="button" className={chip(draftThen === a)} onClick={() => setDraftThen(a)}>
                {a}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={btnPrimary}
            disabled={draftConds.length === 0}
            onClick={() => {
              setRules((r) => [...r, { id: `R${r.length + 1}`, if: draftConds.map((f) => ({ fact: f })), then: draftThen, custom: true }]);
              setDraftConds([]);
              setRun(null);
            }}
          >
            加入规则
          </button>
        </div>
      )}
    </div>
  );
}
