#!/usr/bin/env node
/**
 * Sparse sync: copy lean curriculum content from a local microsoft/AI-For-Beginners clone
 * into content/ + public/lessons/ without vendoring the 2.3GB tree.
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
import { dirname, join, relative, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const UPSTREAM = process.env.UPSTREAM_PATH || join(root, "..", "AI-For-Beginners");
const PINNED = "392d0df";
const dryRun = process.argv.includes("--dry-run");
const MAX_IMAGE_BYTES = 450 * 1024; // skip huge assets

const manifestPath = join(root, "content", "lessons.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

/** Tier A notebooks to vendor for static rendering (lean). */
const NOTEBOOKS = [
  {
    lessonId: "03",
    src: "lessons/3-NeuralNetworks/03-Perceptron/Perceptron.ipynb",
    destName: "Perceptron.ipynb",
  },
  {
    lessonId: "04",
    src: "lessons/3-NeuralNetworks/04-OwnFramework/OwnFramework.ipynb",
    destName: "OwnFramework.ipynb",
  },
  {
    lessonId: "21",
    src: "lessons/6-Other/21-GeneticAlgorithms/Genetic.ipynb",
    destName: "Genetic.ipynb",
  },
];

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

function copyImagesForLesson(lessonPath, lessonId) {
  // Copy images/ under the lesson dir
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
  // Also copy module-level ../images when present (e.g. 3-NeuralNetworks/images)
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
  // Small data/ images referenced from README (e.g. braille.jpeg) — images only
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
  // Rewrite relative image paths to public URLs served by Next
  let out = md;
  // ![alt](images/foo.png) and ![alt](./images/foo.png)
  out = out.replace(
    /(!\[[^\]]*\]\()(\.?\/?images\/)([^)]+)(\))/g,
    `$1/lessons/${lessonId}/images/$3$4`,
  );
  // <img src="images/..."
  out = out.replace(
    /(<img\b[^>]*\bsrc=["'])(\.?\/?images\/)([^"']+)(["'])/gi,
    `$1/lessons/${lessonId}/images/$3$4`,
  );
  // ../images/ (module-level)
  out = out.replace(
    /(!\[[^\]]*\]\()(\.\.\/images\/)([^)]+)(\))/g,
    `$1/lessons/${lessonId}/module-images/$3$4`,
  );
  out = out.replace(
    /(<img\b[^>]*\bsrc=["'])(\.\.\/images\/)([^"']+)(["'])/gi,
    `$1/lessons/${lessonId}/module-images/$3$4`,
  );
  // data/ images
  out = out.replace(
    /(!\[[^\]]*\]\()(\.?\/?data\/)([^)]+)(\))/g,
    `$1/lessons/${lessonId}/data/$3$4`,
  );
  out = out.replace(
    /(<img\b[^>]*\bsrc=["'])(\.?\/?data\/)([^"']+)(["'])/gi,
    `$1/lessons/${lessonId}/data/$3$4`,
  );
  // Drop sketchnotes relative links (not synced — 13MB)
  out = out.replace(
    /!\[[^\]]*\]\(\.\.\/sketchnotes\/[^)]+\)/g,
    "<!-- sketchnote omitted in MVP sparse sync -->",
  );
  // zh-CN Co-op Translator images: ../../../../translated_images/zh-CN/foo.webp → /translated_images/zh-CN/foo.webp
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

  const result = { en: false, zh: false, images: { copied: 0, skipped: 0 } };

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

  result.images = copyImagesForLesson(lesson.path, lesson.id);
  return result;
}

function syncNotebooks() {
  const synced = [];
  for (const nb of NOTEBOOKS) {
    const from = join(UPSTREAM, nb.src);
    const to = join(root, "content", "lessons", nb.lessonId, "notebooks", nb.destName);
    if (!existsSync(from)) {
      console.warn(`  missing notebook ${nb.src}`);
    } else if (copyOne(from, to)) {
      synced.push({
        lessonId: nb.lessonId,
        file: nb.destName,
        locale: "en",
        bytes: statSync(from).size,
      });
      // Mark in manifest
      const lesson = manifest.lessons.find((l) => l.id === nb.lessonId);
      if (lesson) {
        lesson.hasStaticNotebook = true;
        lesson.staticNotebooks = lesson.staticNotebooks || [];
        if (!lesson.staticNotebooks.includes(nb.destName)) {
          lesson.staticNotebooks.push(nb.destName);
        }
      }
    }

    // zh-CN translation notebooks live under translations/zh-CN/{lesson.path}/
    const zhFrom = join(UPSTREAM, "translations", "zh-CN", nb.src);
    const zhTo = join(
      root,
      "content",
      "lessons",
      nb.lessonId,
      "notebooks",
      "zh-CN",
      nb.destName,
    );
    if (!existsSync(zhFrom)) {
      console.warn(`  missing zh-CN notebook translations/zh-CN/${nb.src}`);
    } else if (copyOne(zhFrom, zhTo)) {
      synced.push({
        lessonId: nb.lessonId,
        file: `zh-CN/${nb.destName}`,
        locale: "zh-CN",
        bytes: statSync(zhFrom).size,
      });
    }
  }
  return synced;
}


function copyTranslatedImages() {
  // Collect refs from rewritten MD and copy only those files (lean)
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
  let copied = 0, missing = 0, skipped = 0;
  for (const rel of refs) {
    const from = join(UPSTREAM, rel);
    const to = join(root, "public", rel);
    if (!existsSync(from)) {
      // try URL-decoded
      try {
        const decoded = decodeURIComponent(rel);
        if (existsSync(join(UPSTREAM, decoded))) {
          if (!dryRun) {
            ensureDir(dirname(to));
            // skip copying URL-encoded oddities; leave for manual map
          }
        }
      } catch {}
      missing++;
      continue;
    }
    const size = statSync(from).size;
    if (size > MAX_IMAGE_BYTES) { skipped++; continue; }
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

  // Clean previous generated lesson content (keep lessons.json)
  const lessonsContent = join(root, "content", "lessons");
  const publicLessons = join(root, "public", "lessons");
  if (!dryRun) {
    if (existsSync(lessonsContent)) rmSync(lessonsContent, { recursive: true, force: true });
    if (existsSync(publicLessons)) rmSync(publicLessons, { recursive: true, force: true });
    ensureDir(lessonsContent);
  }

  const summary = { md: [], notebooks: [], imageCopied: 0, imageSkipped: 0 };

  for (const lesson of manifest.lessons) {
    console.log(`Lesson ${lesson.id} (${lesson.path})`);
    const r = syncLessonMarkdown(lesson);
    lesson.hasLocalMarkdown = { en: r.en, "zh-CN": r.zh };
    // keep sampleContent flag for backward compat if either exists
    lesson.sampleContent = r.en || r.zh;
    summary.md.push({ id: lesson.id, ...r });
    summary.imageCopied += r.images.copied;
    summary.imageSkipped += r.images.skipped;
  }

  console.log("Notebooks:");
  summary.notebooks = syncNotebooks();
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
          notebooks: summary.notebooks,
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
  console.log(`  Notebooks: ${summary.notebooks.map((n) => n.file).join(", ")}`);
}

main();
