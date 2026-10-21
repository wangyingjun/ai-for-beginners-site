/**
 * Forward-chaining animal identification expert system (lesson 02).
 * Pure TypeScript — mirrors the classic AND-OR / production-rule demo.
 */

export type FactId =
  | "has_hair"
  | "gives_milk"
  | "has_feathers"
  | "flies"
  | "lays_eggs"
  | "eats_meat"
  | "has_pointed_teeth"
  | "has_claws"
  | "has_forward_eyes"
  | "has_hoofs"
  | "chews_cud"
  | "has_tawny_color"
  | "has_dark_spots"
  | "has_black_stripes"
  | "has_long_neck"
  | "has_long_legs"
  | "is_black_and_white"
  | "swims"
  | "mammal"
  | "bird"
  | "carnivore"
  | "ungulate"
  | "animal";

export type Answer = "yes" | "no" | "unknown";

export type Condition = { fact: FactId; negate?: boolean };

export type Rule = {
  id: string;
  ifAll: Condition[];
  then: FactId;
  /** When true, this rule names a concrete animal. */
  namesAnimal?: boolean;
  label: { "zh-CN": string; en: string };
};

export type Question = {
  fact: FactId;
  label: { "zh-CN": string; en: string };
};

/** Observable questions asked of the user (not derived facts). */
export const QUESTIONS: Question[] = [
  { fact: "has_hair", label: { "zh-CN": "有毛发？", en: "Has hair?" } },
  { fact: "gives_milk", label: { "zh-CN": "产奶？", en: "Gives milk?" } },
  { fact: "has_feathers", label: { "zh-CN": "有羽毛？", en: "Has feathers?" } },
  { fact: "flies", label: { "zh-CN": "会飞？", en: "Can fly?" } },
  { fact: "lays_eggs", label: { "zh-CN": "下蛋？", en: "Lays eggs?" } },
  { fact: "eats_meat", label: { "zh-CN": "吃肉？", en: "Eats meat?" } },
  {
    fact: "has_pointed_teeth",
    label: { "zh-CN": "有尖牙？", en: "Has pointed teeth?" },
  },
  { fact: "has_claws", label: { "zh-CN": "有爪子？", en: "Has claws?" } },
  {
    fact: "has_forward_eyes",
    label: { "zh-CN": "眼睛朝前？", en: "Has forward-facing eyes?" },
  },
  { fact: "has_hoofs", label: { "zh-CN": "有蹄？", en: "Has hoofs?" } },
  { fact: "chews_cud", label: { "zh-CN": "反刍？", en: "Chews cud?" } },
  {
    fact: "has_tawny_color",
    label: { "zh-CN": "黄褐色？", en: "Tawny colored?" },
  },
  {
    fact: "has_dark_spots",
    label: { "zh-CN": "有深色斑点？", en: "Has dark spots?" },
  },
  {
    fact: "has_black_stripes",
    label: { "zh-CN": "有黑色条纹？", en: "Has black stripes?" },
  },
  {
    fact: "has_long_neck",
    label: { "zh-CN": "有长脖子？", en: "Has a long neck?" },
  },
  {
    fact: "has_long_legs",
    label: { "zh-CN": "有长腿？", en: "Has long legs?" },
  },
  {
    fact: "is_black_and_white",
    label: { "zh-CN": "黑白相间？", en: "Black and white?" },
  },
  { fact: "swims", label: { "zh-CN": "会游泳？", en: "Can swim?" } },
];

function c(fact: FactId, negate?: boolean): Condition {
  return negate ? { fact, negate: true } : { fact };
}

export const RULES: Rule[] = [
  {
    id: "R1",
    ifAll: [c("has_hair")],
    then: "mammal",
    label: { "zh-CN": "有毛发 → 哺乳动物", en: "hair → mammal" },
  },
  {
    id: "R2",
    ifAll: [c("gives_milk")],
    then: "mammal",
    label: { "zh-CN": "产奶 → 哺乳动物", en: "milk → mammal" },
  },
  {
    id: "R3",
    ifAll: [c("has_feathers")],
    then: "bird",
    label: { "zh-CN": "有羽毛 → 鸟类", en: "feathers → bird" },
  },
  {
    id: "R4",
    ifAll: [c("flies"), c("lays_eggs")],
    then: "bird",
    label: { "zh-CN": "会飞且下蛋 → 鸟类", en: "flies ∧ eggs → bird" },
  },
  {
    id: "R5",
    ifAll: [c("eats_meat")],
    then: "carnivore",
    label: { "zh-CN": "吃肉 → 食肉动物", en: "eats meat → carnivore" },
  },
  {
    id: "R6",
    ifAll: [c("has_pointed_teeth"), c("has_claws"), c("has_forward_eyes")],
    then: "carnivore",
    label: {
      "zh-CN": "尖牙∧爪子∧前视眼 → 食肉动物",
      en: "teeth ∧ claws ∧ eyes → carnivore",
    },
  },
  {
    id: "R7",
    ifAll: [c("mammal"), c("has_hoofs")],
    then: "ungulate",
    label: { "zh-CN": "哺乳∧有蹄 → 有蹄类", en: "mammal ∧ hoofs → ungulate" },
  },
  {
    id: "R8",
    ifAll: [c("mammal"), c("chews_cud")],
    then: "ungulate",
    label: { "zh-CN": "哺乳∧反刍 → 有蹄类", en: "mammal ∧ cud → ungulate" },
  },
  {
    id: "R9",
    ifAll: [
      c("mammal"),
      c("carnivore"),
      c("has_tawny_color"),
      c("has_dark_spots"),
    ],
    then: "animal",
    namesAnimal: true,
    label: {
      "zh-CN": "哺乳∧食肉∧黄褐∧斑点 → 豹子",
      en: "mammal ∧ carnivore ∧ tawny ∧ spots → leopard",
    },
  },
  {
    id: "R10",
    ifAll: [
      c("mammal"),
      c("carnivore"),
      c("has_tawny_color"),
      c("has_black_stripes"),
    ],
    then: "animal",
    namesAnimal: true,
    label: {
      "zh-CN": "哺乳∧食肉∧黄褐∧条纹 → 老虎",
      en: "mammal ∧ carnivore ∧ tawny ∧ stripes → tiger",
    },
  },
  {
    id: "R11",
    ifAll: [
      c("ungulate"),
      c("has_long_neck"),
      c("has_long_legs"),
      c("has_dark_spots"),
    ],
    then: "animal",
    namesAnimal: true,
    label: {
      "zh-CN": "有蹄∧长颈∧长腿∧斑点 → 长颈鹿",
      en: "ungulate ∧ neck ∧ legs ∧ spots → giraffe",
    },
  },
  {
    id: "R12",
    ifAll: [c("ungulate"), c("has_black_stripes")],
    then: "animal",
    namesAnimal: true,
    label: {
      "zh-CN": "有蹄∧条纹 → 斑马",
      en: "ungulate ∧ stripes → zebra",
    },
  },
  {
    id: "R13",
    ifAll: [c("bird"), c("does_not_fly" as FactId)],
    then: "animal",
    namesAnimal: false,
    label: { "zh-CN": "(占位)", en: "(placeholder)" },
  },
];

// Fix R13/R14 properly without fake FactId
RULES.splice(
  RULES.findIndex((r) => r.id === "R13"),
  1,
  {
    id: "R13",
    ifAll: [c("bird"), c("flies"), c("is_black_and_white"), c("swims")],
    then: "animal",
    namesAnimal: true,
    label: {
      "zh-CN": "鸟∧会飞∧黑白∧游泳 → 海鸟（示例）",
      en: "bird ∧ flies ∧ B&W ∧ swims → seabird (demo)",
    },
  },
  {
    id: "R14",
    ifAll: [
      c("bird"),
      c("flies", true),
      c("has_long_neck"),
      c("is_black_and_white"),
    ],
    then: "animal",
    namesAnimal: true,
    label: {
      "zh-CN": "鸟∧不会飞∧长颈∧黑白 → 鸵鸟",
      en: "bird ∧ ¬flies ∧ neck ∧ B&W → ostrich",
    },
  },
);

export const CONCLUSIONS: Record<
  string,
  { "zh-CN": string; en: string; emoji: string }
> = {
  R9: { "zh-CN": "豹子", en: "Leopard", emoji: "🐆" },
  R10: { "zh-CN": "老虎", en: "Tiger", emoji: "🐅" },
  R11: { "zh-CN": "长颈鹿", en: "Giraffe", emoji: "🦒" },
  R12: { "zh-CN": "斑马", en: "Zebra", emoji: "🦓" },
  R13: { "zh-CN": "海鸟（示例）", en: "Seabird (demo)", emoji: "🐧" },
  R14: { "zh-CN": "鸵鸟", en: "Ostrich", emoji: "🐦" },
};

export type Knowledge = Partial<Record<FactId, boolean>>;

export type TraceStep = {
  kind: "ask" | "fire" | "conclude" | "stuck";
  fact?: FactId;
  ruleId?: string;
  conclusionId?: string;
  message: { "zh-CN": string; en: string };
};

function condTrue(kb: Knowledge, cond: Condition): boolean {
  const v = kb[cond.fact];
  if (v === undefined) return false;
  return cond.negate ? v === false : v === true;
}

export function forwardChainOnce(
  kb: Knowledge & { __named?: string },
): {
  kb: Knowledge & { __named?: string };
  fired: Rule[];
} {
  const next: Knowledge & { __named?: string } = { ...kb };
  const fired: Rule[] = [];
  for (const rule of RULES) {
    if (rule.namesAnimal) {
      if (next.__named) continue;
    } else if (next[rule.then] === true) {
      continue;
    }
    const ok = rule.ifAll.every((f) => condTrue(next, f));
    if (!ok) continue;
    if (rule.namesAnimal) next.__named = rule.id;
    else next[rule.then] = true;
    fired.push(rule);
  }
  return { kb: next, fired };
}

export function forwardChainToFixpoint(kb: Knowledge): {
  kb: Knowledge;
  fired: Rule[];
} {
  let current = { ...kb } as Knowledge & { __named?: string };
  const allFired: Rule[] = [];
  for (let i = 0; i < 20; i++) {
    const { kb: next, fired } = forwardChainOnce(current);
    if (fired.length === 0) break;
    allFired.push(...fired);
    current = next as Knowledge & { __named?: string };
  }
  return { kb: current, fired: allFired };
}

export function nextQuestion(kb: Knowledge): Question | null {
  for (const q of QUESTIONS) {
    if (kb[q.fact] === undefined) return q;
  }
  return null;
}

export function findConclusion(
  kb: Knowledge & { __named?: string },
): string | null {
  if (kb.__named) return kb.__named;
  for (const rule of RULES) {
    if (!rule.namesAnimal) continue;
    if (rule.ifAll.every((f) => condTrue(kb, f))) return rule.id;
  }
  return null;
}

export type SessionState = {
  kb: Knowledge & { __named?: string };
  trace: TraceStep[];
  pendingFact: FactId | null;
  done: boolean;
  conclusionId: string | null;
};

export function createSession(): SessionState {
  const q = nextQuestion({});
  return {
    kb: {},
    trace: [
      {
        kind: "ask",
        fact: q?.fact,
        message: {
          "zh-CN": "开始正向推理：请回答关于动物特征的问题。",
          en: "Starting forward chaining — answer feature questions.",
        },
      },
    ],
    pendingFact: q?.fact ?? null,
    done: false,
    conclusionId: null,
  };
}

export function answerQuestion(
  state: SessionState,
  answer: Answer,
): SessionState {
  if (state.done || !state.pendingFact || answer === "unknown") return state;

  const kb: Knowledge & { __named?: string } = {
    ...state.kb,
    [state.pendingFact]: answer === "yes",
  };
  const trace = [...state.trace];
  const q = QUESTIONS.find((x) => x.fact === state.pendingFact);
  trace.push({
    kind: "ask",
    fact: state.pendingFact,
    message: {
      "zh-CN": `已知：${q?.label["zh-CN"] ?? state.pendingFact} → ${answer === "yes" ? "是" : "否"}`,
      en: `Fact: ${q?.label.en ?? state.pendingFact} → ${answer}`,
    },
  });

  const { kb: chained, fired } = forwardChainToFixpoint(kb);
  for (const rule of fired) {
    trace.push({
      kind: "fire",
      ruleId: rule.id,
      message: {
        "zh-CN": `触发规则 ${rule.id}：${rule.label["zh-CN"]}`,
        en: `Fired ${rule.id}: ${rule.label.en}`,
      },
    });
  }

  const conclusionId = findConclusion(chained as Knowledge & { __named?: string });
  if (conclusionId && CONCLUSIONS[conclusionId]) {
    const c = CONCLUSIONS[conclusionId];
    trace.push({
      kind: "conclude",
      conclusionId,
      message: {
        "zh-CN": `结论：这是 ${c.emoji} ${c["zh-CN"]}`,
        en: `Conclusion: ${c.emoji} ${c.en}`,
      },
    });
    return {
      kb: chained as SessionState["kb"],
      trace,
      pendingFact: null,
      done: true,
      conclusionId,
    };
  }

  const next = nextQuestion(chained);
  if (!next) {
    trace.push({
      kind: "stuck",
      message: {
        "zh-CN": "规则库无法推出具体动物。试试老虎或斑马预设。",
        en: "No animal matched. Try the tiger or zebra preset.",
      },
    });
    return {
      kb: chained as SessionState["kb"],
      trace,
      pendingFact: null,
      done: true,
      conclusionId: null,
    };
  }

  return {
    kb: chained as SessionState["kb"],
    trace,
    pendingFact: next.fact,
    done: false,
    conclusionId: null,
  };
}

export const PRESETS: Array<{
  id: string;
  label: { "zh-CN": string; en: string };
  answers: Partial<Record<FactId, boolean>>;
}> = [
  {
    id: "tiger",
    label: { "zh-CN": "演示：老虎路径", en: "Demo: tiger path" },
    answers: {
      has_hair: true,
      gives_milk: true,
      has_feathers: false,
      flies: false,
      lays_eggs: false,
      eats_meat: true,
      has_pointed_teeth: true,
      has_claws: true,
      has_forward_eyes: true,
      has_hoofs: false,
      chews_cud: false,
      has_tawny_color: true,
      has_dark_spots: false,
      has_black_stripes: true,
      has_long_neck: false,
      has_long_legs: false,
      is_black_and_white: false,
      swims: false,
    },
  },
  {
    id: "zebra",
    label: { "zh-CN": "演示：斑马路径", en: "Demo: zebra path" },
    answers: {
      has_hair: true,
      gives_milk: true,
      has_feathers: false,
      flies: false,
      lays_eggs: false,
      eats_meat: false,
      has_pointed_teeth: false,
      has_claws: false,
      has_forward_eyes: false,
      has_hoofs: true,
      chews_cud: true,
      has_tawny_color: false,
      has_dark_spots: false,
      has_black_stripes: true,
      has_long_neck: false,
      has_long_legs: false,
      is_black_and_white: true,
      swims: false,
    },
  },
];

export function applyPreset(presetId: string): SessionState {
  const preset = PRESETS.find((p) => p.id === presetId);
  if (!preset) return createSession();
  let state = createSession();
  // Answer in question order for facts we care about
  let guard = 0;
  while (!state.done && state.pendingFact && guard++ < 40) {
    const v = preset.answers[state.pendingFact];
    state = answerQuestion(state, v === undefined ? "no" : v ? "yes" : "no");
  }
  return state;
}

export function pendingQuestion(state: SessionState): Question | null {
  if (!state.pendingFact) return null;
  return QUESTIONS.find((q) => q.fact === state.pendingFact) ?? null;
}
