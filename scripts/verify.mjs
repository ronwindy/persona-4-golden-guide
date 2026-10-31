// Fidelity proof. Re-reads the raw source and the generated pages independently of extract.mjs and checks:
//  1. the ledger covers every top-level source node exactly once, in order;
//  2. each page file's words equal the source words of its range, word for word;
//  3. each dropped duplicate's words equal the words of the kept ranges it claims to duplicate;
//  4. the only other dropped parts are blank nodes or the site-generated TOC.
// Exit code 1 on any difference.
import fs from 'node:fs';
import path from 'node:path';
import { parseFragment } from 'parse5';
import { ROOT, tokensOf, loadSource } from './lib/source.mjs';

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'manifest.json'), 'utf8'));
const src = loadSource();
const kids = src.children;
const errors = [];
const err = (m) => errors.push(m);
const tok = (from, to) => tokensOf(kids.slice(from, to));
const same = (a, b) => a.length === b.length && a.every((w, i) => w === b[i]);
const diffAt = (a, b) => { const i = a.findIndex((w, k) => w !== b[k]); return `at word ${i < 0 ? Math.min(a.length, b.length) : i} (${a.length} vs ${b.length} words): "${a.slice(Math.max(0, i - 3), i + 4).join(' ')}" vs "${b.slice(Math.max(0, i - 3), i + 4).join(' ')}"`; };

if (manifest.source.sha256 !== src.sha256) err(`Source changed since extraction (hash mismatch). Re-run extract.`);
if (manifest.source.bodyChildren !== kids.length) err(`Body child count ${kids.length} != manifest ${manifest.source.bodyChildren}.`);

// 1. Coverage
let cursor = 0;
for (const l of manifest.ledger) {
  if (l.from !== cursor) err(`Ledger gap/overlap at child ${cursor} (next entry starts at ${l.from}).`);
  cursor = l.to;
}
if (cursor !== kids.length) err(`Ledger ends at ${cursor}, body has ${kids.length} children.`);

// 2. Pages
const pageById = new Map(manifest.pages.map((p) => [p.id, p]));
let keptWords = 0;
for (const p of manifest.pages) {
  const file = path.join(ROOT, 'src', 'data', 'pages', `${p.id}.html`);
  if (!fs.existsSync(file)) { err(`Missing page file ${p.id}.html`); continue; }
  const frag = parseFragment(fs.readFileSync(file, 'utf8'));
  const got = tokensOf(frag.childNodes);
  const want = tok(p.from, p.to);
  keptWords += want.length;
  if (!same(want, got)) err(`Page ${p.id}: words differ from source ${diffAt(want, got)}`);
}

// 3 + 4. Dropped parts
let dupWords = 0;
let otherDropped = 0;
for (const l of manifest.ledger) {
  if (l.kind === 'page') {
    const p = pageById.get(l.page);
    if (!p || p.from !== l.from || p.to !== l.to) err(`Ledger page entry ${l.page} does not match manifest.pages.`);
  } else if (l.kind === 'duplicate') {
    const want = tok(l.from, l.to);
    const got = l.of.flatMap((r) => {
      if (!manifest.pages.some((p) => r.from >= p.from && r.to <= p.to)) err(`Duplicate at ${l.from} points at a range (${r.from}-${r.to}) that is not inside a kept page.`);
      return tok(r.from, r.to);
    });
    dupWords += want.length;
    if (!same(want, got)) err(`Duplicate at children ${l.from}-${l.to - 1} differs from the kept copy ${diffAt(want, got)}`);
  } else if (l.kind === 'dropped') {
    const words = tok(l.from, l.to).length;
    if (l.reason === 'whitespace' && words) err(`Dropped "whitespace" at ${l.from} has ${words} words.`);
    else if (l.reason !== 'whitespace' && l.reason !== 'site-toc') err(`Unknown drop reason "${l.reason}" at ${l.from}.`);
    otherDropped += words;
  } else err(`Unknown ledger kind "${l.kind}".`);
}

const total = tok(0, kids.length).length;
if (keptWords + dupWords + otherDropped !== total) err(`Word accounting: kept ${keptWords} + duplicate ${dupWords} + dropped ${otherDropped} != ${total}.`);

if (errors.length) {
  console.error(errors.slice(0, 25).map((e) => `[FAIL] ${e}`).join('\n'));
  if (errors.length > 25) console.error(`... and ${errors.length - 25} more`);
  process.exit(1);
}
console.log(`[OK] fidelity verified: ${manifest.pages.length} pages; ${keptWords} words kept, ${dupWords} words in proven duplicates, ${otherDropped} words in dropped site TOC; total ${total}.`);
