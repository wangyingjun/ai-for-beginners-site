# Upstream sync

Source: [microsoft/AI-For-Beginners](https://github.com/microsoft/AI-For-Beginners) @ `392d0df` (MIT).

## What the stub copies

```bash
npm run sync:upstream
# or: node scripts/sync-upstream.mjs
# UPSTREAM_PATH=/path/to/clone node scripts/sync-upstream.mjs --dry-run
```

Into this repo (lean):

| Target | Content |
|--------|---------|
| `content/lessons/<id>/README.en.md` | English lesson README (image paths rewritten) |
| `content/lessons/<id>/README.zh-CN.md` | zh-CN translation README |
| `public/lessons/<id>/images/` | Relative images ≤450KB each (skips huge GIFs / DALL·E assets) |
| `public/lessons/<id>/module-images/` | Module-level `../images/` when referenced |
| `content/lessons/<id>/notebooks/*.ipynb` | Tier A samples: Perceptron, OwnFramework, Genetic |

Does **not** copy: full `translations/` tree, `sketchnotes/` (13MB), `translated_images/`, datasets, or the 2.3GB upstream checkout.

## Later (GitHub Actions)

Sparse-checkout → parse curriculum → PR `Sync upstream @<sha>`. See `docs/方案.md`.
