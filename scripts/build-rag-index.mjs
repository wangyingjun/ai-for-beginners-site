#!/usr/bin/env node
/**
 * Build a local/build-time RAG chunk index from lesson Markdown + notebook cells.
 * No embeddings required — keyword/BM25 fallback uses this JSON offline.
 *
 * Usage: node scripts/build-rag-index.mjs
 * Output: content/rag/chunks.json
 */
import { readFile, writeFile, readdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LESSONS_DIR = path.join(ROOT, "content", "lessons");
const OUT = path.join(ROOT, "content", "rag", "chunks.json");

/** Rough token estimate: CJK ~1.5 chars/token, Latin ~4 chars/token. */
function estimateTokens(text) {
  const cjk = (text.match(/[\u3400-\u9fff]/g) || []).length;
  const rest = text.length - cjk;
  return Math.max(1, Math.ceil(cjk / 1.5 + rest / 4));
}

function splitByHeadings(md) {
  const lines = md.split(/\r?\n/);
  const sections = [];
  let heading = "";
  let buf = [];
  for (const line of lines) {
    const m = /^(#{1,3})\s+(.+)$/.exec(line);
    if (m) {
      if (buf.length) {
        sections.push({ heading, text: buf.join("\n").trim() });
      }
      heading = m[2].trim();
      buf = [line];
    } else {
      buf.push(line);
    }
  }
  if (buf.length) sections.push({ heading, text: buf.join("\n").trim() });
  return sections.filter((s) => s.text.length > 0);
}

/** Pack text into ~500–800 token chunks, preferring paragraph boundaries. */
function packChunks(text, targetMin = 500, targetMax = 800) {
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const out = [];
  let cur = [];
  let curTok = 0;
  const flush = () => {
    if (!cur.length) return;
    out.push(cur.join("\n\n"));
    cur = [];
    curTok = 0;
  };
  for (const p of paras) {
    const t = estimateTokens(p);
    if (curTok >= targetMin && curTok + t > targetMax) flush();
    if (t > targetMax && !cur.length) {
      // hard-split oversized paragraph by sentences / lines
      const pieces = p.split(/(?<=[。！？.!?])\s+|\n/).filter(Boolean);
      let pieceBuf = [];
      let pieceTok = 0;
      for (const piece of pieces) {
        const pt = estimateTokens(piece);
        if (pieceTok >= targetMin && pieceTok + pt > targetMax) {
          out.push(pieceBuf.join(""));
          pieceBuf = [];
          pieceTok = 0;
        }
        pieceBuf.push(piece);
        pieceTok += pt;
      }
      if (pieceBuf.length) out.push(pieceBuf.join(""));
      continue;
    }
    cur.push(p);
    curTok += t;
    if (curTok >= targetMax) flush();
  }
  flush();
  return out;
}

function joinSource(source) {
  if (!source) return "";
  return Array.isArray(source) ? source.join("") : String(source);
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const manifest = JSON.parse(
    await readFile(path.join(ROOT, "content", "lessons.json"), "utf8"),
  );
  const upstreamSha = manifest?.upstream?.commit ?? null;
  const lessonIds = (await readdir(LESSONS_DIR)).filter((d) => !d.startsWith("."));
  const chunks = [];
  let seq = 0;

  for (const lessonId of lessonIds.sort()) {
    const base = path.join(LESSONS_DIR, lessonId);

    for (const [lang, file] of [
      ["zh-CN", "README.zh-CN.md"],
      ["en", "README.en.md"],
    ]) {
      const fp = path.join(base, file);
      if (!(await exists(fp))) continue;
      const md = await readFile(fp, "utf8");
      const sections = splitByHeadings(md);
      const rel = `content/lessons/${lessonId}/${file}`;
      for (const sec of sections) {
        for (const body of packChunks(sec.text)) {
          chunks.push({
            id: `${lessonId}-md-${lang}-${seq++}`,
            lesson_id: lessonId,
            path: rel,
            heading: sec.heading || null,
            cell_index: null,
            lang,
            content: body,
            token_estimate: estimateTokens(body),
            kind: "markdown",
          });
        }
      }
    }

    const nbDir = path.join(base, "notebooks");
    if (!(await exists(nbDir))) continue;
    const nbs = (await readdir(nbDir)).filter((f) => f.endsWith(".ipynb"));
    for (const nbName of nbs) {
      const fp = path.join(nbDir, nbName);
      let nb;
      try {
        nb = JSON.parse(await readFile(fp, "utf8"));
      } catch {
        continue;
      }
      const cells = nb.cells || [];
      const rel = `content/lessons/${lessonId}/notebooks/${nbName}`;
      // Notebooks in this repo are English source; tag as en (zh overlays rare).
      const lang = "en";
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const ctype = cell.cell_type;
        if (ctype !== "markdown" && ctype !== "code") continue;
        const source = joinSource(cell.source).trim();
        if (!source) continue;
        const heading =
          ctype === "markdown"
            ? (source.match(/^#+\s+(.+)$/m)?.[1]?.trim() ?? `cell ${i}`)
            : `code cell ${i}`;
        const labeled =
          ctype === "code"
            ? `\`\`\`python\n${source}\n\`\`\``
            : source;
        for (const body of packChunks(labeled, 400, 800)) {
          chunks.push({
            id: `${lessonId}-nb-${nbName}-${i}-${seq++}`,
            lesson_id: lessonId,
            path: rel,
            heading,
            cell_index: i,
            lang,
            content: body,
            token_estimate: estimateTokens(body),
            kind: ctype,
          });
        }
      }
    }
  }

  // Merge adjacent small chunks within the same source file toward 500–800 tokens.
  const byKey = new Map();
  for (const c of chunks) {
    const k = `${c.path}::${c.lang}`;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(c);
  }
  const merged = [];
  for (const group of byKey.values()) {
    let cur = null;
    for (const c of group) {
      if (!cur) {
        cur = { ...c };
        continue;
      }
      if (
        cur.token_estimate < 500 &&
        cur.token_estimate + c.token_estimate <= 800
      ) {
        cur.content = `${cur.content}\n\n${c.content}`;
        cur.token_estimate += c.token_estimate;
        if (!cur.heading && c.heading) cur.heading = c.heading;
      } else {
        merged.push(cur);
        cur = { ...c };
      }
    }
    if (cur) merged.push(cur);
  }
  merged.forEach((c, i) => {
    c.id = `${c.lesson_id}-${c.lang}-${i}`;
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    upstreamSha,
    chunkCount: merged.length,
    targetTokens: { min: 500, max: 800 },
    note:
      "Build-time keyword index for offline MVP retrieval. Embeddings upsert to Supabase doc_chunks when OPENAI_API_KEY (or compatible) is set — see docs/ai-tutor.md.",
    chunks: merged,
  };

  await writeFile(OUT, JSON.stringify(payload), "utf8");
  const avg =
    merged.reduce((s, c) => s + c.token_estimate, 0) / Math.max(1, merged.length);
  console.log(
    `Wrote ${merged.length} chunks → ${path.relative(ROOT, OUT)} (avg ~${avg.toFixed(0)} tokens)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
