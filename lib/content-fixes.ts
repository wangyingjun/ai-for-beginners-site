/**
 * Render-time fixes for known upstream content defects.
 *
 * Upstream Markdown is synced verbatim (see scripts/sync-upstream.mjs), so we
 * patch at load time instead of editing synced files — fixes survive re-sync.
 */

type Fix = {
  lessonId?: string;
  /** Restrict to README or lab Markdown; omit to apply to both. */
  kind?: "readme" | "lab";
  find: RegExp;
  replace: string;
};

const FIXES: Fix[] = [
  // Lesson 04: leftover upstream TODO under the compute-graph image.
  { lessonId: "04", find: /^>\s*TODO:\s*(图片引用|image citation)\s*$\n?/gm, replace: "" },
  // Lesson 03: sample training loop adds `weights.shape` instead of the example.
  {
    lessonId: "03",
    find: /weights = weights \+ eta\*weights\.shape/g,
    replace: "weights = weights + eta*pos",
  },
  {
    lessonId: "03",
    find: /weights = weights - eta\*weights\.shape/g,
    replace: "weights = weights - eta*neg",
  },
  // Generic: any stray "> TODO" quote lines anywhere.
  { find: /^>\s*TODO\b.*$\n?/gm, replace: "" },
];

export function applyContentFixes(
  markdown: string,
  lessonId: string,
  kind: "readme" | "lab" = "readme",
): string {
  let out = markdown;
  for (const fix of FIXES) {
    if (fix.lessonId && fix.lessonId !== lessonId) continue;
    if (fix.kind && fix.kind !== kind) continue;
    out = out.replace(fix.find, fix.replace);
  }
  return out;
}
