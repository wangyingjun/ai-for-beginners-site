/** JupyterLite is built into public/jupyterlite/ (jupyterlite-core 0.8.6 + pyodide-kernel 0.8.6 → Pyodide 314.* CDN). */

export const JUPYTERLITE_BASE = "/jupyterlite";

export function jupyterliteLabUrl(notebook?: string): string {
  const base = `${JUPYTERLITE_BASE}/lab/index.html`;
  if (!notebook) return base;
  return `${base}?path=${encodeURIComponent(notebook)}`;
}

export function jupyterliteNotebookUrl(notebook: string): string {
  return `${JUPYTERLITE_BASE}/notebooks/index.html?path=${encodeURIComponent(notebook)}`;
}
