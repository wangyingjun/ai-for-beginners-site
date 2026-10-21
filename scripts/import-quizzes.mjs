#!/usr/bin/env node
/**
 * Re-import English quiz bank from upstream AI-For-Beginners lesson-*.json.
 * Usage (from repo root, with upstream checked out nearby):
 *   UPSTREAM=/workspace/AI-For-Beginners node scripts/import-quizzes.mjs
 * Then refresh zh-CN: python3 scripts/generate-quiz-zh.py
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const upstream =
  process.env.UPSTREAM || path.join(root, "..", "AI-For-Beginners");
const src = path.join(
  upstream,
  "etc/quiz-app/src/assets/translations/en",
);

const quizzes = [];
const legacyMap = {};

for (let lessonNo = 1; lessonNo <= 24; lessonNo++) {
  const file = path.join(src, `lesson-${lessonNo}.json`);
  if (!fs.existsSync(file)) {
    console.warn("missing", file);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const q of data[0].quizzes) {
    const mkId = q.id;
    const kind = mkId < 200 ? "pre" : "post";
    const lessonId = String(lessonNo).padStart(2, "0");
    const legacy =
      lessonNo <= 23
        ? kind === "pre"
          ? 2 * lessonNo - 1
          : 2 * lessonNo
        : kind === "pre"
          ? 47
          : 48;
    legacyMap[String(legacy)] = mkId;
    quizzes.push({
      id: mkId,
      lessonId,
      lessonNo,
      kind,
      legacyUrlNo: legacy,
      title: q.title,
      questions: q.quiz.map((qq, i) => ({
        order: i,
        questionText: qq.questionText,
        answerOptions: qq.answerOptions.map((a) => ({
          answerText: a.answerText,
          isCorrect: Boolean(a.isCorrect),
        })),
      })),
    });
  }
}

const outDir = path.join(root, "content/quizzes");
fs.mkdirSync(outDir, { recursive: true });
const bank = {
  version: 1,
  source: "microsoft/AI-For-Beginners etc/quiz-app/.../en",
  count: {
    quizzes: quizzes.length,
    questions: quizzes.reduce((n, q) => n + q.questions.length, 0),
  },
  quizzes,
};
fs.writeFileSync(
  path.join(outDir, "bank.en.json"),
  JSON.stringify(bank, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(outDir, "legacy-map.json"),
  JSON.stringify(
    {
      description:
        "Maps ff-quizzes.netlify.app /quiz/N to mk_id. Lesson 24 azure quiz/5|6 → 124|224 via lesson context.",
      byLegacy: legacyMap,
      lesson24Azure: { "5": 124, "6": 224 },
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Wrote ${quizzes.length} quizzes / ${bank.count.questions} questions → content/quizzes/bank.en.json`,
);
