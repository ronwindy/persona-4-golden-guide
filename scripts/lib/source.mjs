// Shared helpers for reading the saved source HTML. Used by extract.mjs and verify.mjs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parse } from 'parse5';

export const ROOT = path.resolve(import.meta.dirname, '..', '..');
export const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'project.config.json'), 'utf8'));

export const attr = (n, k) => n.attrs?.find((a) => a.name === k)?.value;

/** Visible text of a node. <br> counts as a space; scripts/styles/comments carry no text. */
export function textOf(n) {
  if (n.nodeName === '#text') return n.value;
  if (n.nodeName === 'br') return ' ';
  if (n.nodeName === '#comment' || n.nodeName === 'script' || n.nodeName === 'style') return '';
  return (n.childNodes || []).map(textOf).join('');
}

/** Word tokens of a list of nodes; the word-by-word comparison unit. */
export const tokensOf = (nodes) => nodes.map(textOf).join(' ').split(/\s+/).filter(Boolean);

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
