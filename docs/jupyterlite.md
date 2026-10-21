# JupyterLite / Pyodide (Tier A)

## Pinned versions

| Package | Version | Notes |
|---------|---------|--------|
| `jupyterlite-core` | **0.8.6** | CLI + static app shell |
| `jupyterlite-pyodide-kernel` | **0.8.6** | Matches **Pyodide 314.\*** (CDN) |
| Validation harness | Pyodide **314.0.7** | `/workspace/aifb-validate` |

Build env (local, not committed): `.venv-jupyterlite/`.

## Rebuild

```bash
python3 -m venv .venv-jupyterlite
.venv-jupyterlite/bin/pip install 'jupyterlite-core==0.8.6' 'jupyterlite-pyodide-kernel==0.8.6' 'jupyterlab==4.6.*'
node scripts/prepare-jupyterlite.mjs
cd jupyterlite-src && ../.venv-jupyterlite/bin/jupyter lite build \
  --contents content --output-dir ../public/jupyterlite \
  --apps lab --apps notebooks --apps tree --no-sourcemaps
```

Or: `npm run build:jupyterlite`

Output is committed under `public/jupyterlite/` (~34 MB; Pyodide itself loads from CDN at runtime).

## Patched notebooks

See `jupyterlite-src/content/*.ipynb` and Phase 0 report `tier-a-report.md`:

Perceptron, PerceptronMultiClass, OwnFramework, MyFW_MNIST, LabFrameworks, OpenCV, Genetic, Animals, FamilyOntology, MSConceptGraph (offline).

Data: converted `data/mnist.pkl.gz` (dict), OpenCV media, ontology files, `news_titles.json`, vendored `wheels/experta-*.whl`.

## Open URLs

- Lab UI: `/lab`
- JupyterLite: `/jupyterlite/lab/index.html`
- Notebook: `/jupyterlite/notebooks/index.html?path=Perceptron.ipynb`

## Headers

Next.js sets `COOP: same-origin` + `COEP: credentialless` on `/jupyterlite/*` for SharedArrayBuffer/`input()` while still allowing CDN Pyodide.
