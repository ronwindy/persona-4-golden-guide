// Shared helpers for reading the saved source HTML. Used by extract.mjs and verify.mjs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parse } from 'parse5';

export const ROOT = path.resolve(import.meta.dirname, '..', '..');
export const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'project.config.json'), 'utf8'));

export const attr = (n, k) => n.attrs?.find((a) => a.name === k)?.value;

const BLOCKS = new Set(['address', 'blockquote', 'dd', 'details', 'div', 'dl', 'dt', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'li', 'ol', 'p', 'section', 'summary', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'ul']);

/** Visible text of a node. <br> and block element edges count as a space; scripts/styles/comments carry no text. */
export function textOf(n) {
  if (n.nodeName === '#text') return n.value;
  if (n.nodeName === 'br') return ' ';
  if (n.nodeName === '#comment' || n.nodeName === 'script' || n.nodeName === 'style') return '';
  const inner = (n.childNodes || []).map(textOf).join('');
  return BLOCKS.has(n.nodeName) ? ` ${inner} ` : inner;
}

/** Word tokens of a list of nodes; the word-by-word comparison unit. */
export const tokensOf = (nodes) => nodes.map(textOf).join(' ').split(/\s+/).filter(Boolean);

const stripEdge = (w) => w.replace(/^[-~]+|[-~]+$/g, '');
const isMarker = (w) => /^[-~]+$/.test(w) || /^\d{1,3}[.)]$/.test(w);

/**
 * Compares source words with page words. Allowed differences: a source token that is pure marker
 * ("----", "~", "1.") may be absent from the page, and a source token may lose leading/trailing
 * "-" or "~" decoration. Nothing else may differ. Returns { ok: true, skipped } or { ok: false, ... }.
 */
export function alignTokens(src, page) {
  let i = 0, j = 0, skipped = 0;
  while (i < src.length || j < page.length) {
    const a = src[i], b = page[j];
    if (a !== undefined && b !== undefined && (a === b || (stripEdge(a) && b === stripEdge(a)))) { i++; j++; }
    else if (a !== undefined && isMarker(a)) { skipped++; i++; }
    else return { ok: false, at: i, src: src.slice(Math.max(0, i - 3), i + 4).join(' '), page: page.slice(Math.max(0, j - 3), j + 4).join(' ') };
  }
  return { ok: true, skipped };
}

export function findById(root, id) {
  let hit = null;
  (function walk(n) {
    if (hit) return;
    if (attr(n, 'id') === id) { hit = n; return; }
    (n.childNodes || []).forEach(walk);
  })(root);
  return hit;
}

export function loadSource() {
  const dir = path.join(ROOT, config.extract.sourceDir);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.html')) : [];
  if (files.length !== 1) throw new Error(`Expected exactly one .html in ${config.extract.sourceDir}/, found ${files.length}.`);
  const buf = fs.readFileSync(path.join(dir, files[0]));
  const doc = parse(buf.toString('utf8'));
  const body = findById(doc, config.extract.bodyId);
  if (!body) throw new Error(`No element with id="${config.extract.bodyId}" in ${files[0]}.`);
  return {
    file: files[0],
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    bytes: buf.length,
    doc,
    body,
    children: body.childNodes,
  };
}
