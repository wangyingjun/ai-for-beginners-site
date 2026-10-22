/**
 * Strip model "thinking / reasoning" blocks from assistant text before UI display.
 * Many local models (Qwen, DeepSeek-R1 distill, etc.) emit XML-ish tags inline
 * in the completion stream; assistant-ui only hides structured Reasoning parts,
 * so literal tags must be filtered from plain text.
 *
 * Safe during streaming: incomplete open tags and partial tag prefixes at the
 * end of the buffer are withheld until complete or closed.
 */

const BLOCK_NAMES =
  "thinking|think|reasoning|reflection|scratchpad|redacted_reasoning|redacted_thinking";

const NAME_LIST = BLOCK_NAMES.split("|");

/** Complete paired blocks. */
const COMPLETE_BLOCK = new RegExp(
  `<(${BLOCK_NAMES})(\\s[^>]*)?>[\\s\\S]*?<\\/\\1\\s*>`,
  "gi",
);

const ORPHAN_CLOSE = new RegExp(`<\\/(?:${BLOCK_NAMES})\\s*>`, "gi");

/** Opening tag (full) — find an unclosed block at EOF while streaming. */
const OPEN_TAG = new RegExp(`<(${BLOCK_NAMES})(\\s[^>]*)?>`, "gi");

function stripTrailingPartialTag(out: string): string {
  const lt = out.lastIndexOf("<");
  if (lt < 0) return out;
  const tail = out.slice(lt);
  if (tail.includes(">")) return out;
  // </? + optional name + optional attrs (no '>')
  const m = /^<\/?([a-zA-Z_][\w:-]*)?(\s[^>]*)?$/.exec(tail);
  if (!m) return out;
  const name = (m[1] || "").toLowerCase();
  const attrs = m[2];
  if (name === "") {
    // bare "<" / "</" only — not "< 3" or other non-tag leftovers
    if (attrs) return out;
    return out.slice(0, lt);
  }
  const maybeReasoning = NAME_LIST.some(
    (n) => n.startsWith(name) || name.startsWith(n),
  );
  return maybeReasoning ? out.slice(0, lt) : out;
}

/**
 * Remove reasoning/thinking markup from accumulated assistant text.
 * Call on every stream delta (and once more when the run completes).
 */
export function stripReasoningBlocks(text: string): string {
  if (!text) return text;

  let out = text.replace(COMPLETE_BLOCK, "");
  out = out.replace(ORPHAN_CLOSE, "");

  OPEN_TAG.lastIndex = 0;
  let lastOpen = -1;
  let m: RegExpExecArray | null;
  while ((m = OPEN_TAG.exec(out)) !== null) {
    lastOpen = m.index;
  }
  if (lastOpen >= 0) {
    const after = out.slice(lastOpen);
    const openName = after.match(
      new RegExp(`^<(${BLOCK_NAMES})`, "i"),
    )?.[1];
    if (openName) {
      const closeRe = new RegExp(`<\\/${openName}\\s*>`, "i");
      if (!closeRe.test(after)) {
        out = out.slice(0, lastOpen);
      }
    }
  }

  out = stripTrailingPartialTag(out);
  return out.replace(/\n{3,}/g, "\n\n").replace(/^[ \t]+\n/gm, "\n");
}
