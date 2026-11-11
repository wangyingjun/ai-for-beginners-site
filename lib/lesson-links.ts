import { getLessonById, getLessons, githubBlobUrl, UPSTREAM_COMMIT, UPSTREAM_REPO } from "@/lib/lessons";

/**
 * Resolve a relative link found in synced upstream Markdown to something that
 * works on this site. Upstream links are relative to the lesson folder (or its
 * lab/ subfolder) in microsoft/AI-For-Beginners; zh-CN translations add extra
 * "../" hops back to the repo root. Unknown targets fall back to GitHub.
 */

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export function isRelativeHref(href: string): boolean {
  return !SCHEME.test(href) && !href.startsWith("/") && !href.startsWith("#");
}

function normalize(p: string): string {
  const out: string[] = [];
  for (const seg of p.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") out.pop();
    else out.push(seg);
  }
  return out.join("/");
}

/** Upstream repo-root path for a relative href. */
export function upstreamPathFor(href: string, baseDir: string): string {
  const clean = href.split("#")[0];
  // Translation-relative links like ../../../../lessons/1-Intro/x.gif
  const m = clean.match(/^(?:\.\.\/)+(lessons\/.*)$/);
  if (m) return normalize(m[1]);
  return normalize(`${baseDir}/${clean}`);
}

export function resolveLessonHref(
  href: string,
  lessonId: string,
  sub: "" | "lab" = "",
): string {
  if (!isRelativeHref(href)) return href;
  const lesson = getLessonById(lessonId);
  if (!lesson) return href;
  const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "";
  const base = sub ? `${lesson.path}/${sub}` : lesson.path;
  const target = upstreamPathFor(href, base);
  const decoded = decodeURI(target);

  // Same lesson: lab material → lab card, notebooks → notebook section.
  if (decoded.startsWith(`${lesson.path}/lab/`) || decoded === `${lesson.path}/lab`) {
    return "#lab";
  }
  if (decoded.startsWith(`${lesson.path}/`) && decoded.endsWith(".ipynb")) {
    return "#notebooks";
  }

  // Another lesson's README / notebook.
  for (const l of getLessons()) {
    if (l.id === lesson.id) continue;
    if (decoded === `${l.path}/README.md` || decoded === l.path) {
      return `/lessons/${l.id}`;
    }
    if (decoded.startsWith(`${l.path}/`) && decoded.endsWith(".ipynb")) {
      return `/lessons/${l.id}#notebooks`;
    }
  }

  if (/\.(png|jpe?g|gif|svg|webp|mp4)$/i.test(decoded)) {
    return rawUrl(decoded);
  }
  return `${githubBlobUrl(decoded)}${hash}`;
}

export function rawUrl(repoPath: string): string {
  return `https://raw.githubusercontent.com/${UPSTREAM_REPO}/${UPSTREAM_COMMIT}/${repoPath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

/** Relative image src → raw GitHub URL (site-rewritten /translated_images stay). */
export function resolveLessonImg(src: string, lessonId: string, sub: "" | "lab" = ""): string {
  if (!isRelativeHref(src)) return src;
  const lesson = getLessonById(lessonId);
  if (!lesson) return src;
  const base = sub ? `${lesson.path}/${sub}` : lesson.path;
  return rawUrl(upstreamPathFor(src, base));
}
