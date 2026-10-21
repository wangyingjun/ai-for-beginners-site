# AI 入门互动教学站 / AI for Beginners Site

中文优先的交互式教学站脚手架，基于 [microsoft/AI-For-Beginners](https://github.com/microsoft/AI-For-Beginners)（MIT）。

Chinese-first interactive teaching site scaffold based on Microsoft’s AI-For-Beginners curriculum (MIT).

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- Deploy target: **Vercel**
- Auth / DB (later): **Supabase**
- Browser notebooks (later): JupyterLite / Pyodide
- Content sync: sparse checkout of upstream (see `scripts/sync-upstream.md`)

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

## Content

- Manifest: `content/lessons.json` (ids, zh/en titles, module, frameworks, tier, notebooks)
- Sample bodies: `content/samples/*.md` (lean excerpts from upstream; full sync later)
- Architecture plan: `docs/方案.md`
- Tier A validation notes (build machine): see `/workspace/aifb-validate/tier-a-report.md` when available locally — **10 notebooks confirmed browser-runnable** in Phase 0

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

Phase 1 MVP step 1: content site scaffold. Next: wire Supabase Auth, Vercel project env vars, and GitHub Actions sparse sync PR bot.
