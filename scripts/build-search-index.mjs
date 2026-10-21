/**
 * Build content/search/index.json from lessons.json + lesson Markdown excerpts.
 * Run: node scripts/build-search-index.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(root, "content/lessons.json"), "utf8"));
const outDir = join(root, "content/search");
mkdirSync(outDir, { recursive: true });

function stripMd(md) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/[#>*_`~\-]+/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(text, max = 400) {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

function loadMd(lessonId, locale) {
  const base = join(root, "content/lessons", lessonId);
  const preferred =
    locale === "zh-CN" ? join(base, "README.zh-CN.md") : join(base, "README.en.md");
  const fallback =
    locale === "zh-CN" ? join(base, "README.en.md") : join(base, "README.zh-CN.md");
  for (const f of [preferred, fallback]) {
    if (existsSync(f)) return readFileSync(f, "utf8");
  }
  return "";
}

const docs = [];
for (const lesson of manifest.lessons) {
  for (const locale of ["zh-CN", "en"]) {
    const raw = loadMd(lesson.id, locale);
    const body = stripMd(raw);
    docs.push({
      id: `${lesson.id}:${locale}`,
      lessonId: lesson.id,
      locale,
      title: lesson.title[locale] || lesson.title["zh-CN"] || lesson.title.en,
      module: lesson.module,
      excerpt: excerpt(body, 480),
      text: excerpt(body, 4000).toLowerCase(),
    });
  }
}

const payload = {
  version: 1,
  builtAt: new Date().toISOString(),
  count: docs.length,
  docs,
};

writeFileSync(join(outDir, "index.json"), JSON.stringify(payload));
console.log(`Search index: ${docs.length} docs → content/search/index.json`);
