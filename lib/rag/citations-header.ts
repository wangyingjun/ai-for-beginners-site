/**
 * Encode / decode citation JSON in response headers without corrupting UTF-8
 * (Chinese headings broke the old Latin-1 atob-only path).
 */

import type { ChatCitation } from "./types";

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 =
    typeof btoa === "function"
      ? btoa(bin)
      : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(header: string): Uint8Array {
  const pad =
    header.length % 4 === 0 ? "" : "=".repeat(4 - (header.length % 4));
  const b64 = header.replace(/-/g, "+").replace(/_/g, "/") + pad;
  if (typeof atob === "function") {
    const binary = atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, "base64"));
}

export function encodeCitationsHeader(citations: ChatCitation[]): string {
  const json = JSON.stringify(citations);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(json, "utf8").toString("base64url");
  }
  return bytesToBase64Url(new TextEncoder().encode(json));
}

export function decodeCitationsHeader(header: string | null): ChatCitation[] {
  if (!header) return [];
  // Legacy: percent-encoded JSON
  if (header.includes("%7B") || header.includes("%22")) {
    try {
      return JSON.parse(decodeURIComponent(header)) as ChatCitation[];
    } catch {
      /* fall through */
    }
  }
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(header));
    return JSON.parse(json) as ChatCitation[];
  } catch {
    return [];
  }
}
