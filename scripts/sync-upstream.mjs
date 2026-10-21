#!/usr/bin/env node
/**
 * Sparse sync: copy lean curriculum content from a local microsoft/AI-For-Beginners clone
 * into content/ + public/lessons/ without vendoring the 2.3GB tree.
 *
 * Syncs ALL lesson notebooks (not just Tier A), including labs and zh-CN when present.
 * Oversized notebooks (OxfordPets, StyleTransfer) are listed for Colab but not vendored
 * as static JSON — see docs/content-notebooks.md.
 *
 * Usage:
 *   node scripts/sync-upstream.mjs
 *   UPSTREAM_PATH=/path/to/AI-For-Beginners node scripts/sync-upstream.mjs
 *   node scripts/sync-upstream.mjs --dry-run
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "fs";
import { dirname, join, relative, extname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const UPSTREAM = process.env.UPSTREAM_PATH || join(root, "..", "AI-For-Beginners");
const PINNED = "392d0df";
const dryRun = process.argv.includes("--dry-run");
const MAX_IMAGE_BYTES = 450 * 1024; // skip huge lesson images
/** Skip vendoring these as static notebooks (still appear in notebooks[] for Colab). */
const SKIP_STATIC_BASENAMES = new Set([
  "OxfordPets.ipynb", // ~5.9MB base64 outputs
  "StyleTransfer.ipynb", // ~4.8MB
  "tmp.ipynb",
  "Untitled.ipynb",
]);
/** Extract inline images larger than this into public/lessons/.../nb-assets/ */
const EXTRACT_IMAGE_MIN_CHARS = 80_000; // ~60KB base64

const manifestPath = join(root, "content", "lessons.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"]);

function ensureDir(p) {
  if (!dryRun) mkdirSync(p, { recursive: true });
}

function copyOne(from, to) {
  if (!existsSync(from)) return false;
  if (dryRun) {
    console.log(`  copy ${relative(UPSTREAM, from)} -> ${relative(root, to)}`);
    return true;
  }
  ensureDir(dirname(to));
  copyFileSync(from, to);
  return true;
}

function listFilesRecursive(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...listFilesRecursive(p));
    else out.push(p);
  }
  return out;
}

function detectFramework(fileName) {
  const n = fileName.toLowerCase();
  if (n.includes("pytorch") || n.includes("torch")) return "pytorch";
  if (n.includes("keras")) return "tensorflow";
  if (
    n.includes("tensorflow") ||
    n.includes("tf.") ||
    /(?:^|[^a-z])tf(?:[^a-z]|$)/i.test(fileName) ||
    n.endsWith("tf.ipynb") ||
    n.includes("tf.ipynb") ||
    /TF\.ipynb$/i.test(fileName) ||
    /_TF\.ipynb$/i.test(fileName) ||
    /GANTF|RNNTF|CBoW-TF|NER-TF|IntroKeras/i.test(fileName)
  ) {
    return "tensorflow";
  }
  return "numpy";
}

function copyImagesForLesson(lessonPath, lessonId) {
  const imgDir = join(UPSTREAM, lessonPath, "images");
  const publicBase = join(root, "public", "lessons", lessonId, "images");
  let copied = 0;
  let skipped = 0;
  for (const file of listFilesRecursive(imgDir)) {
    const ext = extname(file).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) continue;
    const size = statSync(file).size;
    if (size > MAX_IMAGE_BYTES) {
      skipped++;
      console.log(`  skip large image (${(size / 1024).toFixed(0)}KB): ${relative(UPSTREAM, file)}`);
      continue;
    }
    const rel = relative(imgDir, file);
    if (copyOne(file, join(publicBase, rel))) copied++;
  }
  const parts = lessonPath.split("/");
  if (parts.length >= 3) {
    const moduleImages = join(UPSTREAM, parts[0], parts[1], "images");
    const modulePublic = join(root, "public", "lessons", lessonId, "module-images");
    for (const file of listFilesRecursive(moduleImages)) {
      const ext = extname(file).toLowerCase();
      if (!IMAGE_EXTS.has(ext)) continue;
      const size = statSync(file).size;
      if (size > MAX_IMAGE_BYTES) {
        skipped++;
        continue;
      }
      const rel = relative(moduleImages, file);
      if (copyOne(file, join(modulePublic, rel))) copied++;
    }
  }
  const dataDir = join(UPSTREAM, lessonPath, "data");
  const dataPublic = join(root, "public", "lessons", lessonId, "data");
  for (const file of listFilesRecursive(dataDir)) {
    const ext = extname(file).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) continue;
    const size = statSync(file).size;
    if (size > MAX_IMAGE_BYTES) {
      skipped++;
      continue;
    }
    const rel = relative(dataDir, file);
    if (copyOne(file, join(dataPublic, rel))) copied++;
  }
  return { copied, skipped };
}

function rewriteMarkdown(md, lessonId) {
  let out = md;
  out = out.replace(
    /(!\[[^\]]*\]\()(\.?\/?images\/)([^)]+)(\))/g,
    `$1/lessons/${lessonId}/images/$3$4`,
  );
  out = out.replace(
    /(<img\b[^>]*\bsrc=["'])(\.?\/?images\/)([^"']+)(["'])/gi,
    `$1/lessons/${lessonId}/images/$3$4`,
  );
  out = out.replace(
    /(!\[[^\]]*\]\()(\.\.\/images\/)([^)]+)(\))/g,
    `$1/lessons/${lessonId}/module-images/$3$4`,
  );
  out = out.replace(
    /(<img\b[^>]*\bsrc=["'])(\.\.\/images\/)([^"']+)(["'])/gi,
    `$1/lessons/${lessonId}/module-images/$3$4`,
  );
  out = out.replace(
    /(!\[[^\]]*\]\()(\.?\/?data\/)([^)]+)(\))/g,
    `$1/lessons/${lessonId}/data/$3$4`,
  );
  out = out.replace(
    /(<img\b[^>]*\bsrc=["'])(\.?\/?data\/)([^"']+)(["'])/gi,
    `$1/lessons/${lessonId}/data/$3$4`,
  );
  out = out.replace(
    /!\[[^\]]*\]\(\.\.\/sketchnotes\/[^)]+\)/g,
    "<!-- sketchnote omitted in MVP sparse sync -->",
  );
  out = out.replace(
    /(\(\s*|src=["'])(?:\.\.\/)+(translated_images\/[^)"'\s]+)/g,
    (_m, prefix, path) => `${prefix}/${path}`,
  );
  return out;
}

function syncLessonMarkdown(lesson) {
  const enSrc = join(UPSTREAM, lesson.path, "README.md");
  const zhSrc = join(UPSTREAM, "translations", "zh-CN", lesson.path, "README.md");
  const destDir = join(root, "content", "lessons", lesson.id);
  ensureDir(destDir);

  const result = { en: false, zh: false, images: { copied: 0, skipped: 0 }, lab: false };

  if (existsSync(enSrc)) {
    const raw = readFileSync(enSrc, "utf8");
    const rewritten = rewriteMarkdown(raw, lesson.id);
    const dest = join(destDir, "README.en.md");
    if (!dryRun) writeFileSync(dest, rewritten);
    else console.log(`  write ${relative(root, dest)}`);
    result.en = true;
  }
  if (existsSync(zhSrc)) {
    const raw = readFileSync(zhSrc, "utf8");
    const rewritten = rewriteMarkdown(raw, lesson.id);
    const dest = join(destDir, "README.zh-CN.md");
    if (!dryRun) writeFileSync(dest, rewritten);
    else console.log(`  write ${relative(root, dest)}`);
    result.zh = true;
  }

  // Lab README (Assignment card)
  const labEn = join(UPSTREAM, lesson.path, "lab", "README.md");
  const labZh = join(UPSTREAM, "translations", "zh-CN", lesson.path, "lab", "README.md");
  if (existsSync(labEn)) {
    const raw = readFileSync(labEn, "utf8");
    if (!dryRun) writeFileSync(join(destDir, "lab.en.md"), rewriteMarkdown(raw, lesson.id));
    result.lab = true;
  }
  if (existsSync(labZh)) {
    const raw = readFileSync(labZh, "utf8");
    if (!dryRun) writeFileSync(join(destDir, "lab.zh-CN.md"), rewriteMarkdown(raw, lesson.id));
    result.lab = true;
  }

  result.images = copyImagesForLesson(lesson.path, lesson.id);
  return result;
}

/**
 * Walk a lesson directory for *.ipynb (including lab/), skip junk.
 * Returns { relFromLesson, isLab, base }[]
 */
function discoverNotebooks(lessonPath) {
  const lessonDir = join(UPSTREAM, lessonPath);
  if (!existsSync(lessonDir)) return [];
  const found = [];
  for (const file of listFilesRecursive(lessonDir)) {
    if (extname(file).toLowerCase() !== ".ipynb") continue;
    const base = basename(file);
    if (base.startsWith(".")) continue;
    if (base === "tmp.ipynb" || base === "Untitled.ipynb") continue;
    const rel = relative(lessonDir, file).replace(/\\/g, "/");
    const isLab = rel.startsWith("lab/") || rel.includes("/lab/");
    found.push({ abs: file, rel, isLab, base });
  }
  return found;
}

/**
 * Optionally extract huge base64 image outputs into public assets and rewrite
 * the notebook JSON so static pages stay lean.
 */
function vendorNotebook(fromAbs, toAbs, lessonId, destName) {
  if (dryRun) {
    console.log(`  notebook ${relative(UPSTREAM, fromAbs)} -> ${relative(root, toAbs)}`);
    return { bytes: statSync(fromAbs).size, extracted: 0 };
  }
  ensureDir(dirname(toAbs));
  const raw = readFileSync(fromAbs, "utf8");
  let extracted = 0;
  let outRaw = raw;
  try {
    const nb = JSON.parse(raw);
    const assetBase = join(root, "public", "lessons", lessonId, "nb-assets", destName.replace(/\.ipynb$/i, ""));
    let assetIdx = 0;
    for (let ci = 0; ci < (nb.cells || []).length; ci++) {
      const cell = nb.cells[ci];
      for (let oi = 0; oi < (cell.outputs || []).length; oi++) {
        const o = cell.outputs[oi];
        if (!o.data) continue;
        for (const mime of ["image/png", "image/jpeg", "image/jpg"]) {
          if (!o.data[mime]) continue;
          const val = Array.isArray(o.data[mime]) ? o.data[mime].join("") : o.data[mime];
          if (typeof val !== "string" || val.length < EXTRACT_IMAGE_MIN_CHARS) continue;
          // If already a path (from prior sync), skip
          if (val.startsWith("/lessons/")) continue;
          const ext = mime.includes("png") ? "png" : "jpg";
          const fname = `c${ci}-o${oi}-${assetIdx}.${ext}`;
          assetIdx++;
          const absAsset = join(assetBase, fname);
          ensureDir(dirname(absAsset));
          const b64 = val.replace(/\s/g, "");
          writeFileSync(absAsset, Buffer.from(b64, "base64"));
          const url = `/lessons/${lessonId}/nb-assets/${destName.replace(/\.ipynb$/i, "")}/${fname}`;
          o.data[mime] = url; // NotebookViewer treats leading / as asset URL
          extracted++;
        }
      }
    }
    outRaw = JSON.stringify(nb);
  } catch (e) {
    console.warn(`  warn: could not process notebook JSON ${fromAbs}: ${e.message}`);
    outRaw = raw;
  }
  writeFileSync(toAbs, outRaw);
  return { bytes: Buffer.byteLength(outRaw), extracted };
}

function syncNotebooks() {
  const synced = [];
  const skippedStatic = [];

  for (const lesson of manifest.lessons) {
    const discovered = discoverNotebooks(lesson.path);
    const notebooks = [];
    const staticNotebooks = [];
    const labNotebooks = [];
    const frameworks = new Set();

    for (const nb of discovered) {
      const fw = detectFramework(nb.base);
      frameworks.add(fw);
      const destName = nb.isLab ? `lab/${nb.base}` : nb.base;
      notebooks.push({ framework: fw, file: destName });
      if (nb.isLab) labNotebooks.push(destName);

      const skipStatic = SKIP_STATIC_BASENAMES.has(nb.base);
      if (skipStatic) {
        skippedStatic.push({ lessonId: lesson.id, file: destName, reason: "oversized/junk" });
        continue;
      }

      const from = nb.abs;
      const to = join(root, "content", "lessons", lesson.id, "notebooks", destName);
      const { bytes, extracted } = vendorNotebook(from, to, lesson.id, destName);
      synced.push({
        lessonId: lesson.id,
        file: destName,
        locale: "en",
        bytes,
        extracted,
      });
      staticNotebooks.push(destName);

      // zh-CN translation notebooks
      const zhFrom = join(UPSTREAM, "translations", "zh-CN", lesson.path, nb.rel);
      if (existsSync(zhFrom)) {
        const zhTo = join(
          root,
          "content",
          "lessons",
          lesson.id,
          "notebooks",
          "zh-CN",
          destName,
        );
        const zh = vendorNotebook(zhFrom, zhTo, lesson.id, `zh-CN/${destName}`);
        synced.push({
          lessonId: lesson.id,
          file: `zh-CN/${destName}`,
          locale: "zh-CN",
          bytes: zh.bytes,
          extracted: zh.extracted,
        });
      }
    }

    // Preserve curated jupyterlite list if present; do not invent new ones here.
    lesson.notebooks = notebooks.length ? notebooks : lesson.notebooks;
    lesson.hasNotebook = notebooks.length > 0;
    if (notebooks.length) {
      lesson.frameworks = [...frameworks];
      lesson.staticNotebooks = staticNotebooks;
      lesson.hasStaticNotebook = staticNotebooks.length > 0;
      lesson.labNotebooks = labNotebooks;
      if (labNotebooks.length > 0 || existsSync(join(UPSTREAM, lesson.path, "lab", "README.md"))) {
        lesson.hasLab = true;
      }
    } else {
      lesson.staticNotebooks = [];
      lesson.hasStaticNotebook = false;
      lesson.labNotebooks = [];
    }
  }

  return { synced, skippedStatic };
}

function copyTranslatedImages() {
  const refs = new Set();
  const lessonsDir = join(root, "content", "lessons");
  if (!existsSync(lessonsDir)) return { copied: 0, missing: 0 };
  for (const id of readdirSync(lessonsDir)) {
    const dir = join(lessonsDir, id);
    if (!statSync(dir).isDirectory()) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".md")) continue;
      const text = readFileSync(join(dir, f), "utf8");
      const re = /\/?(translated_images\/[^\s)"']+)/g;
      let m;
      while ((m = re.exec(text))) refs.add(m[1]);
    }
  }
  let copied = 0,
    missing = 0,
    skipped = 0;
  for (const rel of refs) {
    const from = join(UPSTREAM, rel);
    const to = join(root, "public", rel);
    if (!existsSync(from)) {
      missing++;
      continue;
    }
    const size = statSync(from).size;
    if (size > MAX_IMAGE_BYTES) {
      skipped++;
      continue;
    }
    if (copyOne(from, to)) copied++;
  }
  console.log(`translated_images: copied ${copied}, missing ${missing}, skipped ${skipped}`);
  return { copied, missing, skipped };
}

function main() {
  if (!existsSync(UPSTREAM)) {
    console.error(`Upstream not found: ${UPSTREAM}`);
    process.exit(1);
  }
  console.log(`Sync from ${UPSTREAM} (pinned ${PINNED})`);
  if (dryRun) console.log("(dry-run)");

  const lessonsContent = join(root, "content", "lessons");
  const publicLessons = join(root, "public", "lessons");
  if (!dryRun) {
    if (existsSync(lessonsContent)) rmSync(lessonsContent, { recursive: true, force: true });
    if (existsSync(publicLessons)) rmSync(publicLessons, { recursive: true, force: true });
    ensureDir(lessonsContent);
  }

  const summary = { md: [], notebooks: [], imageCopied: 0, imageSkipped: 0, skippedStatic: [] };

  for (const lesson of manifest.lessons) {
    console.log(`Lesson ${lesson.id} (${lesson.path})`);
    const r = syncLessonMarkdown(lesson);
    lesson.hasLocalMarkdown = { en: r.en, "zh-CN": r.zh };
    lesson.sampleContent = r.en || r.zh;
    if (r.lab) lesson.hasLab = true;
    summary.md.push({ id: lesson.id, ...r });
    summary.imageCopied += r.images.copied;
    summary.imageSkipped += r.images.skipped;
  }

  console.log("Notebooks:");
  const nbResult = syncNotebooks();
  summary.notebooks = nbResult.synced;
  summary.skippedStatic = nbResult.skippedStatic;
  for (const s of nbResult.skippedStatic) {
    console.log(`  skip static ${s.lessonId}/${s.file} (${s.reason})`);
  }
  console.log("translated_images:");
  summary.translated = copyTranslatedImages();

  manifest.upstream.commit = PINNED;
  manifest.upstream.syncedAt = new Date().toISOString();

  if (!dryRun) {
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    writeFileSync(
      join(root, "content", "sync-stamp.json"),
      JSON.stringify(
        {
          upstreamCommit: PINNED,
          syncedAt: manifest.upstream.syncedAt,
          lessonsWithMd: summary.md.filter((x) => x.en || x.zh).length,
          notebooks: summary.notebooks.map((n) => ({
            lessonId: n.lessonId,
            file: n.file,
            locale: n.locale,
            bytes: n.bytes,
          })),
          skippedStatic: summary.skippedStatic,
          imagesCopied: summary.imageCopied,
          imagesSkipped: summary.imageSkipped,
        },
        null,
        2,
      ) + "\n",
    );
  }

  console.log("\nDone.");
  console.log(
    `  MD: ${summary.md.filter((x) => x.en).length} en, ${summary.md.filter((x) => x.zh).length} zh-CN`,
  );
  console.log(`  Images copied: ${summary.imageCopied}, skipped: ${summary.imageSkipped}`);
  console.log(`  Notebooks vendored: ${summary.notebooks.length}`);
  console.log(`  Skipped static: ${summary.skippedStatic.length}`);
}

main();
