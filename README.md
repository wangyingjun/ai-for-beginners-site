# AI 入门互动教学站 / AI for Beginners Site

中文优先的交互式教学站脚手架，基于 [microsoft/AI-For-Beginners](https://github.com/microsoft/AI-For-Beginners)（MIT）。

Chinese-first interactive teaching site scaffold based on Microsoft’s AI-For-Beginners curriculum (MIT).

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- Deploy target: **Vercel**
- Auth / DB (later): **Supabase**
- Browser notebooks (later): JupyterLite / Pyodide
- Content sync: sparse checkout of upstream (see `scripts/sync-upstream.md`)

## JupyterLite (Tier A in-browser)

Pinned: **jupyterlite-core / pyodide-kernel 0.8.6** → Pyodide **314.\*** (CDN). See `docs/jupyterlite.md`.

- UI: [`/lab`](/lab) · static app: `/jupyterlite/`
- Rebuild: `npm run build:jupyterlite` (needs local `.venv-jupyterlite`)

## Interactive demos (pure TypeScript)

- Perceptron (`/demos/perceptron`): click-to-label 2D points, step/epoch training, live decision boundary.
- MLP Playground (`/demos/mlp`): TensorFlow Playground–style (Apache-2.0 attribution); datasets, hidden layers, activations, L2, live heatmap.
- Core algorithms: `lib/ml/{perceptron,mlp,datasets}.ts` — no TF.js / Python required.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Default UI language is **zh-CN**; toggle with `?lang=en`.

```bash
npm run build   # must pass before deploy
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Home (Chinese-first intro + attribution) |
| `/course` | Course index (~25 lessons from `content/lessons.json`) |
| `/lessons/[id]` | Lesson page: lang toggle, framework tabs, notebook/output stubs, Colab/Codespaces/Binder buttons |
| `/demos` | Interactive demos index |
| `/demos/perceptron` | Perceptron decision-boundary playground (also embedded on lesson 03) |
| `/demos/mlp` | MLP playground — layers / activation / L2 (also on lessons 04 & 05) |
| `/lab` | JupyterLite Tier A browser lab |

## Content

- Manifest: `content/lessons.json` (ids, zh/en titles, module, frameworks, tier, notebooks)
- Lesson Markdown: `content/lessons/<id>/README.{en,zh-CN}.md` for **all 25** lessons (sparse sync)
- Images: `public/lessons/<id>/…` (size-capped; sketchnotes omitted)
- Static notebooks (Tier A sample): Perceptron, OwnFramework, Genetic under `content/lessons/<id>/notebooks/`
- Architecture plan: `docs/方案.md`
- Tier A validation: `/workspace/aifb-validate/tier-a-report.md` on the build machine — **10 notebooks** confirmed browser-runnable in Phase 0

## Environment

Copy `.env.example` → `.env.local` after Supabase exists:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Do not commit secrets. This scaffold does **not** create Vercel/Supabase resources.

## Upstream sync stub

```bash
node scripts/sync-upstream.mjs --dry-run
node scripts/sync-upstream.mjs --sample
```

Never vendor the full 2.3 GB upstream tree into this repository.

## License & attribution

- **Site code**: MIT — see `LICENSE` (Copyright 2026 wangyingjun and contributors)
- **Curriculum content** from Microsoft AI-For-Beginners: MIT — see `LICENSE-upstream`

## Phase status

Phase 1 MVP: content site + JupyterLite Tier A + flagship demos (perceptron, MLP). Next: quizzes, Supabase Auth/progress, sync PR bot.
