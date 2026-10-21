import type { RetrievedChunk } from "./types";

export function buildSystemPrompt(locale: "zh-CN" | "en"): string {
  const lang =
    locale === "en"
      ? "Answer in English unless the learner writes in Chinese."
      : "默认用简体中文回答；若学习者用英文提问，可用英文。";

  return [
    "你是「AI 入门互动教学站」的课程助教，基于 microsoft/AI-For-Beginners（MIT）教材答疑。",
    lang,
    "规则：",
    "1. 只依据下方【检索到的课程片段】回答；不要编造课程里没有的事实、API 或代码行为。",
    "2. 不确定时明确说「根据当前课程材料无法确定」，并建议去对应课程页阅读。",
    "3. 回答末尾用 Markdown 列出引用来源，格式：`- [课号 标题](课程链接)`，链接用片段里的 lessonHref。",
    "4. 鼓励思考：可以给提示、思路、相关概念；不要直接给出作业/测验的完整标准答案。",
    "5. 保持简洁、友好；需要时用简短代码示例，并标明来自哪一课。",
    "6. 回答中注明：AI 生成，仅供参考。",
  ].join("\n");
}

export function formatRetrievedContext(chunks: RetrievedChunk[]): string {
  if (!chunks.length) {
    return "【检索到的课程片段】\n（无匹配片段；请如实告知无法从教材定位，并建议打开 /course。）";
  }
  const blocks = chunks.map((c, i) => {
    const head = c.heading ? ` · ${c.heading}` : "";
    return [
      `### 片段 ${i + 1} [课 ${c.lesson_id}${head}]`,
      `路径: ${c.path}`,
      `链接: ${c.lessonHref}`,
      c.content.slice(0, 2400),
    ].join("\n");
  });
  return `【检索到的课程片段】\n\n${blocks.join("\n\n")}`;
}
