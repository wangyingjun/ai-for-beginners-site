#!/usr/bin/env node
/**
 * Upstream sync stub for microsoft/AI-For-Beginners
 *
 * Phase 1 MVP: documents the sparse-checkout plan and optionally pulls
 * a tiny sample (lesson READMEs) without cloning the 2.3GB tree.
 *
 * Usage:
 *   node scripts/sync-upstream.mjs --dry-run
 *   node scripts/sync-upstream.mjs --sample   # copy 1–2 READMEs if local clone exists
 *
 * Full pipeline (later):
 *   1. sparse-checkout: lessons/ etc/quiz-src/ data/ examples/
 *      translations/zh-CN/ (+ matching translated_images)
 *   2. parse curriculum from root README → content/lessons.json
 *   3. emit markdown/notebook JSON for Next.js SSG
 *   4. open PR "Sync upstream @<sha>"
 *
 * Do NOT commit the full upstream tree into this repo.
 */

import { existsSync, copyFileSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const UPSTREAM_DEFAULT = join(root, "..", "AI-For-Beginners");
const PINNED_COMMIT = "392d0df";

const SAMPLE_PATHS = [
  {
    src: "lessons/1-Intro/README.md",
    dest: "content/samples/01-intro.en.md",
  },
  {
    src: "translations/zh-CN/lessons/1-Intro/README.md",
    dest: "content/samples/01-intro.zh-CN.md",
  },
  {
    src: "lessons/3-NeuralNetworks/03-Perceptron/README.md",
    dest: "content/samples/03-perceptron.en.md",
  },
  {
    src: "translations/zh-CN/lessons/3-NeuralNetworks/03-Perceptron/README.md",
    dest: "content/samples/03-perceptron.zh-CN.md",
  },
];

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const doSample = args.has("--sample");

console.log("AI-For-Beginners sync stub");
console.log(`  pinned commit: ${PINNED_COMMIT}`);
console.log(`  sparse paths (planned):`);
console.log(`    lessons/`);
console.log(`    etc/quiz-src/`);
console.log(`    etc/quiz-app/src/assets/translations/`);
console.log(`    data/`);
console.log(`    examples/`);
console.log(`    translations/zh-CN/`);
console.log(`  exclude: translations/* (except zh-CN), translated_images bulk`);

if (dryRun && !doSample) {
  console.log("\nDry run only. Pass --sample to copy lean README samples from a local clone.");
  process.exit(0);
}

if (doSample) {
  const upstream = process.env.UPSTREAM_PATH || UPSTREAM_DEFAULT;
  if (!existsSync(upstream)) {
    console.error(`Local upstream not found at ${upstream}`);
    console.error("Set UPSTREAM_PATH or clone microsoft/AI-For-Beginners nearby.");
    process.exit(1);
  }
  for (const { src, dest } of SAMPLE_PATHS) {
    const from = join(upstream, src);
    const to = join(root, dest);
    if (!existsSync(from)) {
      console.warn(`skip missing: ${src}`);
      continue;
    }
    if (dryRun) {
      console.log(`would copy ${src} -> ${dest}`);
      continue;
    }
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
    console.log(`copied ${src} -> ${dest}`);
  }
  const stamp = {
    upstreamCommit: PINNED_COMMIT,
    syncedAt: new Date().toISOString(),
    mode: "sample",
  };
  writeFileSync(
    join(root, "content", "sync-stamp.json"),
    JSON.stringify(stamp, null, 2) + "\n",
  );
  console.log("wrote content/sync-stamp.json");
}

// Touch manifest note so CI can assert the stub exists
const note = join(root, "scripts", "sync-upstream.md");
if (!existsSync(note)) {
  // written separately in repo
}
