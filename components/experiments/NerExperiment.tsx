"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusPill, chip } from "@/components/lesson/ui";

type Tag = "" | "人名" | "地名" | "机构";
const CYCLE: Tag[] = ["", "人名", "地名", "机构"];
const TAG_CLS: Record<Exclude<Tag, "">, string> = {
  人名: "bg-emerald-100 text-emerald-800 ring-emerald-500 dark:bg-emerald-950 dark:text-emerald-200",
  地名: "bg-violet-100 text-violet-800 ring-violet-500 dark:bg-violet-950 dark:text-violet-200",
  机构: "bg-pink-100 text-pink-800 ring-pink-500 dark:bg-pink-950 dark:text-pink-200",
};
type Sent = { id: string; toks: string[]; gold: Tag[] };
export const NER_SENTS: Sent[] = [
  { id: "s0", toks: ["李白", "出生", "在", "碎叶城", "。"], gold: ["人名", "", "", "地名", ""] },
  { id: "a", toks: ["苹果", "发布", "了", "新", "手机", "。"], gold: ["机构", "", "", "", "", ""] },
  { id: "b", toks: ["我", "吃了", "一个", "苹果", "。"], gold: ["", "", "", "", ""] },
  { id: "c", toks: ["张小花", "去", "杭州", "旅游", "。"], gold: ["人名", "", "地名", "", ""] },
];
const DICT: Record<string, Tag> = { 李白: "人名", 杜甫: "人名", 北京: "地名", 杭州: "地名", 碎叶城: "地名", 苹果: "机构", 华为: "机构" };
const SURNAMES = "张王李赵刘陈杨";
const RULE_SENTS = NER_SENTS.slice(1);

function ruleTags(s: Sent, context: boolean): Tag[] {
  return s.toks.map((w, i) => {
    let t: Tag = DICT[w] ?? "";
    if (!context) return t;
    const prev = s.toks[i - 1] ?? "";
    const next = s.toks[i + 1] ?? "";
    if (t === "机构" && (prev === "一个" || prev === "吃了")) t = "";
    if (!t && w.length >= 2 && w.length <= 3 && SURNAMES.includes(w[0]) && ["去", "说", "是"].includes(next)) t = "人名";
    return t;
  });
}

export type NerState = { mode: "user" | "dict"; sent: string; userAllRight: boolean; dictErrors: number; found: number; context: boolean; ruleAllRight: boolean };

export function NerExperiment({ controls = false, onState }: { controls?: boolean; onState?: (s: NerState) => void }) {
  const [si, setSi] = useState(0);
  const [mode, setMode] = useState<"user" | "dict">("user");
  const [tags, setTags] = useState<Record<string, Tag[]>>(() => Object.fromEntries(NER_SENTS.map((s) => [s.id, s.toks.map(() => "" as Tag)])));
  const [context, setContext] = useState(false);
  const [found, setFound] = useState<string[]>([]);
  const s = NER_SENTS[si];
  const userTags = tags[s.id];
  const userAllRight = userTags.every((t, i) => t === s.gold[i]);
  const ruled = useMemo(() => RULE_SENTS.map((x) => ({ s: x, tags: ruleTags(x, context) })), [context]);
  const dictErrorKeys = useMemo(
    () => RULE_SENTS.flatMap((x) => ruleTags(x, false).map((t, i) => (t !== x.gold[i] ? `${x.id}:${i}` : "")).filter(Boolean)),
    [],
  );
  const ruleAllRight = ruled.every((r) => r.tags.every((t, i) => t === r.s.gold[i]));

  useEffect(() => {
    onState?.({ mode, sent: s.id, userAllRight, dictErrors: dictErrorKeys.length, found: found.length, context, ruleAllRight });
  }, [mode, s.id, userAllRight, dictErrorKeys.length, found.length, context, ruleAllRight, onState]);

  const tok = (w: string, t: Tag, key: string, onClick?: () => void, mark?: "wrong" | "found") => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className={`min-h-10 rounded-lg px-2.5 py-1 text-base ${t ? `${TAG_CLS[t]} ring-1` : "bg-zinc-100 dark:bg-zinc-800"} ${mark === "found" ? "outline outline-[3px] outline-amber-400" : ""}`}
    >
      {w}
      {t && <span className="ml-1 text-[11px]">{t}</span>}
    </button>
  );

  return (
    <div className="space-y-3">
      {mode === "user" ? (
        <>
          <StatusPill ok={userAllRight}>{userAllRight ? "全部标对了！" : "点词给它打标签：点一次 = 人名，再点 = 地名，再点 = 机构，再点 = 取消"}</StatusPill>
          <div className="flex flex-wrap gap-2">
            {s.toks.map((w, i) =>
              tok(w, userTags[i], `${s.id}${i}`, () =>
                setTags((all) => ({ ...all, [s.id]: all[s.id].map((t, j) => (j === i ? CYCLE[(CYCLE.indexOf(t) + 1) % CYCLE.length] : t)) })),
              ),
            )}
          </div>
        </>
      ) : (
        <>
          <StatusPill ok={ruleAllRight}>
            {context ? "词典 + 看前后词的规则" : "只查词典的规则"}：{ruleAllRight ? "三句全对" : `找到它的错误 ${found.length} / ${dictErrorKeys.length}`}
          </StatusPill>
          <p className="text-xs text-zinc-500">规则手里的词典：李白、杜甫（人名）；北京、杭州、碎叶城（地名）；苹果、华为（机构）。点一下你觉得它标错（或漏标）的词。</p>
          {ruled.map((r) => (
            <div key={r.s.id} className="flex flex-wrap gap-2">
              {r.s.toks.map((w, i) => {
                const k = `${r.s.id}:${i}`;
                return tok(w, r.tags[i], k, () => {
                  if (dictErrorKeys.includes(k) && !found.includes(k)) setFound((f) => [...f, k]);
                }, found.includes(k) ? "found" : undefined);
              })}
            </div>
          ))}
        </>
      )}
      {controls && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(mode === "user" && si === 0)} onClick={() => { setMode("user"); setSi(0); }}>
            你来标：第 1 句
          </button>
          <button type="button" className={chip(mode === "user" && si === 3)} onClick={() => { setMode("user"); setSi(3); }}>
            你来标：第 2 句
          </button>
          <button type="button" className={chip(mode === "dict" && !context)} onClick={() => { setMode("dict"); setContext(false); }}>
            看「查词典」规则
          </button>
          <button type="button" className={chip(mode === "dict" && context)} onClick={() => { setMode("dict"); setContext(true); }}>
            规则再看看前后的词
          </button>
        </div>
      )}
    </div>
  );
}
