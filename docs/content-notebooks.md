# Content notebooks sync

## Source

Local clone of [microsoft/AI-For-Beginners](https://github.com/microsoft/AI-For-Beginners) (default `/workspace/AI-For-Beginners`), pinned commit in `content/lessons.json` → `upstream.commit` (also `content/sync-stamp.json`).

```bash
UPSTREAM_PATH=/path/to/AI-For-Beginners npm run sync:upstream
# or
node scripts/sync-upstream.mjs
```

## What gets synced

| Artifact | Destination |
|---|---|
| Lesson README (en + zh-CN) | `content/lessons/{id}/README.*.md` |
| Lab README | `content/lessons/{id}/lab.*.md` |
| **All** `lessons/**/*.ipynb` (incl. `lab/`) | `content/lessons/{id}/notebooks/` (+ `zh-CN/` when translations exist) |
| Lesson images (size-capped) | `public/lessons/{id}/images/` |
| Large notebook image outputs | `public/lessons/{id}/nb-assets/...` (base64 extracted) |

Junk skipped: `tmp.ipynb`, `Untitled.ipynb`.

## Static outliers (Colab only)

These remain in the lesson `notebooks[]` manifest (Colab / Codespaces / Binder) but are **not** vendored as static JSON because of huge embedded outputs:

- `08/lab/OxfordPets.ipynb` (~5.9 MB)
- `10/StyleTransfer.ipynb` (~4.8 MB)

`StyleTransfer_Keras.ipynb`, `OpenCV.ipynb`, `PetFaces.ipynb`, etc. are included; large `image/png` outputs are extracted to `nb-assets`.

## External open links

Lesson UI and `FrameworkTabs` build links from `lib/lessons.ts` using the pinned upstream commit:

- **Colab**: `https://colab.research.google.com/github/microsoft/AI-For-Beginners/blob/<commit>/<lesson.path>/<file>`
- **Codespaces**: new codespace on that commit / `.devcontainer`
- **Binder**: `mybinder.org` with `filepath=<lesson.path>/<file>`

Tier A lessons may also expose JupyterLite via `lesson.jupyterlite` → `/jupyterlite/...` (see `docs/jupyterlite.md`).

## Manifest fields

Updated by sync on each lesson:

- `notebooks`, `frameworks`, `hasNotebook`
- `staticNotebooks`, `hasStaticNotebook`
- `labNotebooks`, `hasLab`
- `hasLocalMarkdown`
