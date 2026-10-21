# Upstream sync plan

Source: [microsoft/AI-For-Beginners](https://github.com/microsoft/AI-For-Beginners) (MIT), pinned baseline commit `392d0df`.

## Goals

- Keep this site repo **lean** (no 2.3 GB tree).
- Sparse-checkout only what we need for zh-CN + en curriculum pages.
- Emit a content package consumed by Next.js SSG; never edit upstream files in place (use `overlays/`).

## Sparse paths

```
lessons/
etc/quiz-src/
etc/quiz-app/src/assets/translations/
data/
examples/
translations/zh-CN/
```

Exclude bulk `translations/` (other locales) and most of `translated_images/` until needed.

## Pipeline (later GitHub Action)

1. Sparse clone / fetch upstream at a tracked SHA.
2. Diff against last synced SHA; only rebuild changed lessons.
3. Parse root README curriculum table → refresh `content/lessons.json`.
4. remark/rehype Markdown; nbformat → structured notebook JSON (static outputs).
5. Classify runtime tiers A/B/C (see Tier A report under `/workspace/aifb-validate` in the build machine; pointer in README).
6. Open PR `Sync upstream @<sha>`.

## Local stub

```bash
node scripts/sync-upstream.mjs --dry-run
node scripts/sync-upstream.mjs --sample   # needs sibling clone at ../AI-For-Beginners
```

## Attribution

Curriculum content remains Copyright (c) Microsoft Corporation under MIT. Site scaffolding is separately MIT-licensed; see `LICENSE` and `LICENSE-upstream`.
