#!/usr/bin/env node
/**
 * Prepare patched Tier A notebooks + data for JupyterLite build.
 * Shims follow /workspace/aifb-validate/tier-a-report.md (Phase 0).
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const UP = process.env.UPSTREAM_PATH || join(root, "..", "AI-For-Beginners");
const VALIDATE = process.env.VALIDATE_PATH || join(root, "..", "aifb-validate");
const OUT = join(root, "jupyterlite-src");
const CONTENTS = join(OUT, "content");

function loadNb(rel) {
  return JSON.parse(readFileSync(join(UP, "lessons", rel), "utf8"));
}

function saveNb(name, nb) {
  writeFileSync(join(CONTENTS, name), JSON.stringify(nb, null, 1) + "\n");
}

function srcOf(cell) {
  return Array.isArray(cell.source) ? cell.source.join("") : cell.source || "";
}

function setSrc(cell, text) {
  cell.source = text.endsWith("\n") ? text : text + "\n";
}

function mapCodeCells(nb, fn) {
  let codeIdx = 0;
  for (const cell of nb.cells) {
    if (cell.cell_type !== "code") continue;
    const next = fn(cell, codeIdx, srcOf(cell));
    if (typeof next === "string") setSrc(cell, next);
    codeIdx++;
  }
}

function prependCell(nb, source) {
  nb.cells.unshift({
    cell_type: "code",
    metadata: { tags: ["jupyterlite-bootstrap"] },
    execution_count: null,
    outputs: [],
    source: source.endsWith("\n") ? source : source + "\n",
  });
}

function replaceAll(text, pairs) {
  let out = text;
  for (const [a, b] of pairs) out = out.split(a).join(b);
  return out;
}

function patchPerceptron() {
  const nb = loadNb("3-NeuralNetworks/03-Perceptron/Perceptron.ipynb");
  mapCodeCells(nb, (_c, _i, src) => {
    if (src.includes("mnist.pkl.gz")) {
      return `# Patched for JupyterLite: use converted MNIST dict (tier-a-report.md)
import gzip, pickle
with gzip.open('data/mnist.pkl.gz', 'rb') as mnist_pickle:
    MNIST = pickle.load(mnist_pickle, encoding='latin1')
`;
    }
    return src;
  });
  prependCell(
    nb,
    `import micropip
await micropip.install(['ipywidgets', 'scikit-learn'])
print('Ready: Perceptron')
`,
  );
  saveNb("Perceptron.ipynb", nb);
}

function patchOwnFramework() {
  const nb = loadNb("3-NeuralNetworks/04-OwnFramework/OwnFramework.ipynb");
  mapCodeCells(nb, (_c, _i, src) =>
    replaceAll(src, [
      ["%matplotlib nbagg", "%matplotlib inline"],
      ["np.NAN", "np.nan"],
      ["ax.collections.pop()", "ax.collections[-1].remove()"],
      ["ax.lines.pop()", "ax.lines[-1].remove()"],
    ]),
  );
  prependCell(
    nb,
    `import micropip
await micropip.install(['scikit-learn'])
print('Ready: OwnFramework (NumPy2/Matplotlib shims applied)')
`,
  );
  saveNb("OwnFramework.ipynb", nb);
}

function patchGenetic() {
  const nb = loadNb("6-Other/21-GeneticAlgorithms/Genetic.ipynb");
  mapCodeCells(nb, (_c, _i, src) => {
    if (src.trim().startsWith("%timeit")) {
      const expr = src.trim().replace(/^%timeit\\s+/, "");
      return `# %timeit replaced for JupyterLite (run once)\\n${expr}\\n`.replace(/\\n/g, "\n");
    }
    return src;
  });
  // fix regex - use real newline
  mapCodeCells(nb, (_c, _i, src) => {
    const t = src.trim();
    if (t.startsWith("%timeit")) {
      return `# %timeit replaced for JupyterLite (run once)\n${t.replace(/^%timeit\s+/, "")}\n`;
    }
    return src;
  });
  saveNb("Genetic.ipynb", nb);
}

function patchOpenCV() {
  const nb = loadNb("4-ComputerVision/06-IntroCV/OpenCV.ipynb");
  prependCell(
    nb,
    `import os
assert os.path.exists('data/braille.jpeg'), 'missing data/braille.jpeg'
assert os.path.exists('data/motionvideo.mp4'), 'missing data/motionvideo.mp4'
print('Ready: OpenCV data files found')
`,
  );
  saveNb("OpenCV.ipynb", nb);
}

function patchLabFrameworks() {
  const nb = loadNb("3-NeuralNetworks/05-Frameworks/lab/LabFrameworks.ipynb");
  prependCell(
    nb,
    `import micropip
await micropip.install(['pandas', 'scikit-learn', 'seaborn'])
print('Ready: LabFrameworks')
`,
  );
  saveNb("LabFrameworks.ipynb", nb);
}

function patchAnimals() {
  const nb = loadNb("2-Symbolic/Animals.ipynb");
  mapCodeCells(nb, (_c, _i, src) => {
    if (src.includes("pip install") && src.includes("experta")) {
      return `# Install experta for JupyterLite (vendored wheel via piplite + modern deps)
import micropip
await micropip.install(['frozendict', 'schema'])
await micropip.install('emfs:/drive/wheels/experta-1.9.4-py3-none-any.whl', deps=False)
print('experta installed')
`;
    }
    return src;
  });
  prependCell(
    nb,
    `# Cells that call input() need JupyterLite stdin (COOP/COEP / SharedArrayBuffer).
print('Ready: Animals')
`,
  );
  saveNb("Animals.ipynb", nb);
}

function patchFamilyOntology() {
  const nb = loadNb("2-Symbolic/FamilyOntology.ipynb");
  mapCodeCells(nb, (_c, _i, src) => {
    if (src.includes("!head") && src.includes("tsars")) {
      return `from pathlib import Path
print('\\n'.join(Path('data/tsars.ged').read_text().splitlines()[:15]))
`;
    }
    if (src.includes("!head") && src.includes("onto")) {
      return `from pathlib import Path
print('\\n'.join(Path('data/onto.ttl').read_text().splitlines()[:20]))
`;
    }
    if (src.includes("pip install python-gedcom")) {
      return `import micropip
await micropip.install('python-gedcom')
print('python-gedcom installed')
`;
    }
    if (src.includes("pip install rdflib") || src.includes("OWL-RL")) {
      return `import micropip
await micropip.install(['rdflib', 'owlrl'])
print('rdflib + owlrl installed')
`;
    }
    if (src.includes("!cp data/onto.ttl")) {
      const rest = src
        .split("\n")
        .filter((l) => !l.trim().startsWith("!cp"))
        .join("\n");
      return `import shutil
shutil.copy('data/onto.ttl', 'onto.ttl')
${rest}`;
    }
    if (src.includes("!rm onto.ttl")) {
      return `import os
if os.path.exists('onto.ttl'):
    os.remove('onto.ttl')
`;
    }
    return src;
  });
  saveNb("FamilyOntology.ipynb", nb);
}

function patchPerceptronMultiClass() {
  const nb = loadNb(
    "3-NeuralNetworks/03-Perceptron/lab/PerceptronMultiClass.ipynb",
  );
  mapCodeCells(nb, (_cell, codeIdx, src) => {
    if (codeIdx === 0 && !src.includes("import random")) {
      return src.replace(
        "import os",
        "import os\nimport random  # required by train()",
      );
    }
    if (src.includes("accuracy(wts,")) {
      return `# Skipped: upstream cell references undefined wts (tier-a-report.md)
pass
`;
    }
    if (
      src.includes("!rm") ||
      src.includes("mnist.pkl.gz!gzip") ||
      src.includes("!gzip")
    ) {
      return `import gzip, pickle
with gzip.open('data/mnist.pkl.gz', 'rb') as f:
    MNIST = pickle.load(f, encoding='latin1')
print('MNIST loaded', list(MNIST.keys()) if isinstance(MNIST, dict) else type(MNIST))
`;
    }
    if (src.includes("open('mnist.pkl'") && src.includes("pickle.load")) {
      return `# MNIST already loaded in previous cell
print('MNIST ready')
`;
    }
    return src;
  });
  saveNb("PerceptronMultiClass.ipynb", nb);
}

function patchMyFW_MNIST() {
  const nb = loadNb("3-NeuralNetworks/04-OwnFramework/lab/MyFW_MNIST.ipynb");
  mapCodeCells(nb, (_c, _i, src) => {
    if (src.includes("wget") || (src.includes("!rm") && src.includes("gzip"))) {
      return `import gzip, pickle
with gzip.open('data/mnist.pkl.gz', 'rb') as f:
    MNIST = pickle.load(f, encoding='latin1')
print('MNIST loaded')
`;
    }
    if (src.includes("open('mnist.pkl'") && src.includes("pickle.load")) {
      return `# MNIST already loaded
print('MNIST ready')
`;
    }
    return src;
  });
  prependCell(
    nb,
    `import micropip
await micropip.install(['scikit-learn'])
print('Ready: MyFW_MNIST')
`,
  );
  saveNb("MyFW_MNIST.ipynb", nb);
}

function patchMSConceptGraph() {
  const nb = loadNb("2-Symbolic/MSConceptGraph.ipynb");
  mapCodeCells(nb, (_c, _i, src) => {
    if (src.includes("newsapi_key") || src.includes("get_news")) {
      return `# OFFLINE FALLBACK — cached headlines (no newsapi / CORS)
import json
from pathlib import Path
all_titles = json.loads(Path('data/news_titles.json').read_text())
print(f'Loaded {len(all_titles)} cached headlines')
print(all_titles[:3])
`;
    }
    if (src.includes("textblob") || src.includes("download_corpora")) {
      return `# textblob optional — NLTK corpora not shipped (~93MB). Skip if unavailable.
try:
    import micropip
    await micropip.install('textblob')
    from textblob import TextBlob
    print('textblob imported (tagging may be limited without NLTK data)')
except Exception as e:
    print('textblob skipped:', e)
    TextBlob = None
`;
    }
    return src;
  });
  prependCell(
    nb,
    `# MSConceptGraph offline / read-only (ConceptNet + newsapi unavailable in Pyodide)
print('Ready: MSConceptGraph (offline fixtures)')
`,
  );
  saveNb("MSConceptGraph.ipynb", nb);
}

function copyData() {
  const dataDir = join(CONTENTS, "data");
  mkdirSync(dataDir, { recursive: true });
  copyFileSync(
    join(VALIDATE, "data", "mnist_dict.pkl.gz"),
    join(dataDir, "mnist.pkl.gz"),
  );
  copyFileSync(
    join(VALIDATE, "data", "news_titles.json"),
    join(dataDir, "news_titles.json"),
  );
  copyFileSync(
    join(UP, "lessons/4-ComputerVision/06-IntroCV/data/braille.jpeg"),
    join(dataDir, "braille.jpeg"),
  );
  copyFileSync(
    join(UP, "lessons/4-ComputerVision/06-IntroCV/data/motionvideo.mp4"),
    join(dataDir, "motionvideo.mp4"),
  );
  copyFileSync(
    join(UP, "lessons/2-Symbolic/data/onto.ttl"),
    join(dataDir, "onto.ttl"),
  );
  copyFileSync(
    join(UP, "lessons/2-Symbolic/data/tsars.ged"),
    join(dataDir, "tsars.ged"),
  );
  const wheels = join(CONTENTS, "wheels");
  mkdirSync(wheels, { recursive: true });
  copyFileSync(
    join(VALIDATE, "data", "experta-1.9.4-py3-none-any.whl"),
    join(wheels, "experta-1.9.4-py3-none-any.whl"),
  );
}

function writeConfig() {
  writeFileSync(
    join(OUT, "jupyter_lite_config.json"),
    JSON.stringify(
      {
        LiteBuildConfig: {
          contents: ["content"],
          output_dir: "../public/jupyterlite",
          apps: ["lab", "notebooks", "tree"],
          no_sourcemaps: true,
        },
      },
      null,
      2,
    ) + "\n",
  );

  writeFileSync(
    join(OUT, "jupyter-lite.json"),
    JSON.stringify(
      {
        "jupyter-lite-schema-version": 0,
        "jupyter-config-data": {
          appName: "AI for Beginners Lab",
        },
      },
      null,
      2,
    ) + "\n",
  );

  writeFileSync(
    join(CONTENTS, "README.md"),
    `# Tier A notebooks (JupyterLite)

Patched for Pyodide. Upstream: microsoft/AI-For-Beginners @ 392d0df.
See \`docs/jupyterlite.md\` on the site.
`,
  );
}

function main() {
  if (existsSync(CONTENTS)) rmSync(CONTENTS, { recursive: true, force: true });
  mkdirSync(CONTENTS, { recursive: true });

  console.log("Patching notebooks…");
  patchPerceptron();
  patchOwnFramework();
  patchGenetic();
  patchOpenCV();
  patchLabFrameworks();
  patchAnimals();
  patchFamilyOntology();
  patchPerceptronMultiClass();
  patchMyFW_MNIST();
  patchMSConceptGraph();
  console.log("Copying data…");
  copyData();
  writeConfig();
  console.log("Prepared", CONTENTS);
  const nbs = readdirSync(CONTENTS).filter((f) => f.endsWith(".ipynb"));
  console.log("Notebooks:", nbs.join(", "));
}


main();
