// Raw GameFAQs HTML -> one verbatim HTML file per page in src/data/pages + manifest.json (with a ledger
// of where every top-level source node went). No text is rewritten; only link targets and a table wrapper change.
// Fails (exit 1) instead of guessing whenever the source does not match the expected shape.
import fs from 'node:fs';
import path from 'node:path';
import { serialize } from 'parse5';
import { ROOT, config, attr, textOf, tokensOf, findById, loadSource } from './lib/source.mjs';

const cfg = config.extract;
const OUT = path.join(ROOT, 'src', 'data');
const fail = (msg) => { console.error(`[FAIL] ${msg}`); process.exit(1); };
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const slug = (s) => norm(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isBlank = (n) => n.nodeName === '#text' && !n.value.trim();
const isTag = (n, name) => n.nodeName === name;

const src = loadSource();
const kids = src.children;
const tokens = (from, to) => tokensOf(kids.slice(from, to));

// ---- 1. Anything before the first h2 must be the site TOC or blank ----
const ledger = [];
const push = (from, to, kind, extra = {}) => {
  const last = ledger[ledger.length - 1];
  if (last && last.kind === kind && last.to === from && kind !== 'page' && kind !== 'duplicate' && last.reason === extra.reason) { last.to = to; return; }
  ledger.push({ from, to, kind, ...extra });
};
const h2s = kids.map((n, i) => (isTag(n, cfg.chapterTag) ? i : -1)).filter((i) => i >= 0);
if (!h2s.length) fail(`No <${cfg.chapterTag}> found in the guide body.`);
const dropClass = new Set(cfg.dropClasses);
let tocNode = null;
for (let i = 0; i < h2s[0]; i++) {
  const n = kids[i];
  if (isBlank(n)) push(i, i + 1, 'dropped', { reason: 'whitespace' });
  else if (dropClass.has(attr(n, 'class'))) { tocNode = n; push(i, i + 1, 'dropped', { reason: 'site-toc' }); }
  else fail(`Unexpected content before the first <${cfg.chapterTag}> (child ${i}: ${n.nodeName}).`);
}

// ---- 2. Blocks (h2 .. next h2) grouped by repeated chapter title ----
const blocks = h2s.map((from, i) => ({ from, to: h2s[i + 1] ?? kids.length, title: norm(textOf(kids[from])) }));
const groups = [];
for (const b of blocks) {
  const g = groups[groups.length - 1];
  if (g && g[0].title === b.title) g.push(b); else groups.push([b]);
}

const pages = [];
const usedIds = new Set();
const uniqueId = (base) => { let id = base, n = 2; while (usedIds.has(id)) id = `${base}-${n++}`; usedIds.add(id); return id; };
const addPage = (from, to, category, title) => {
  const cs = slug(category), ts = slug(title);
  const id = uniqueId(ts === cs || ts.startsWith(`${cs}-`) ? ts : `${cs}-${ts}`);
  pages.push({ id, title, category, from, to });
  push(from, to, 'page', { page: id });
  return id;
};
const sectionTitle = (b) => {
  const h3 = kids.slice(b.from, b.to).find((n) => isTag(n, cfg.sectionTag));
  return h3 ? norm(textOf(h3)) : null;
};

for (const g of groups) {
  if (g.length === 1) {
    const b = g[0];
    addPage(b.from, b.to, b.title, sectionTitle(b) ?? b.title);
    continue;
  }
  const [overview, ...rest] = g;
  const firstSection = kids.findIndex((n, i) => i > overview.from && i < overview.to && isTag(n, cfg.sectionTag));
  if (firstSection < 0) fail(`Chapter "${overview.title}": first block has no <${cfg.sectionTag}>.`);

  // The overview's sections must be word-for-word the same as the per-section blocks that follow.
  const want = tokens(firstSection, overview.to);
  const got = rest.flatMap((r) => tokens(r.from + 1, r.to));
  if (want.length !== got.length || want.some((w, i) => w !== got[i])) {
    const at = want.findIndex((w, i) => w !== got[i]);
    fail(`Chapter "${overview.title}": overview text differs from its section blocks at word ${at} (${want.length} vs ${got.length} words): "${want.slice(Math.max(0, at - 4), at + 4).join(' ')}" vs "${got.slice(Math.max(0, at - 4), at + 4).join(' ')}".`);
  }

  // Overview preamble (text between the chapter heading and the first section) is unique content: keep it.
  const preamble = tokens(overview.from + 1, firstSection);
  if (preamble.length) addPage(overview.from, firstSection, overview.title, cfg.overviewLabel);
  else push(overview.from, firstSection, 'duplicate', { reason: 'chapter heading repeated at the head of every section block', of: [{ from: rest[0].from, to: rest[0].from + 1 }] });
  push(firstSection, overview.to, 'duplicate', {
    reason: 'full-chapter copy; identical to the per-section blocks that follow',
    of: rest.map((r) => ({ from: r.from + 1, to: r.to })),
  });
  for (const r of rest) {
    const title = sectionTitle(r);
    if (!title) fail(`Chapter "${r.title}": block at child ${r.from} has no <${cfg.sectionTag}>.`);
    addPage(r.from, r.to, r.title, title);
  }
}
ledger.sort((a, b) => a.from - b.from);

// ---- 3. Link targets: GameFAQs section URLs -> local pages ----
const anchorPage = new Map();
const anchorInPage = new Set();
const collectAnchors = (nodes, pageFor, inPage) => {
  for (const top of nodes) {
    const page = pageFor(top);
    (function walk(n) {
      if (isTag(n, 'a') && attr(n, 'id') && page && !anchorPage.has(attr(n, 'id'))) {
        anchorPage.set(attr(n, 'id'), page);
        if (inPage) anchorInPage.add(attr(n, 'id'));
      }
      (n.childNodes || []).forEach(walk);
    })(top);
  }
};
for (const p of pages) collectAnchors(kids.slice(p.from, p.to), () => p.id, true);
// Anchors that only exist in a dropped duplicate copy point at the page holding the same section.
for (const l of ledger.filter((x) => x.kind === 'duplicate')) {
  const chapter = pages.find((p) => p.from <= l.of[0].from && l.of[0].from < p.to).category;
  let current = null;
  collectAnchors(kids.slice(l.from, l.to), (top) => {
    if (isTag(top, config.extract.sectionTag)) current = pages.find((p) => p.category === chapter && p.title === norm(textOf(top)))?.id ?? null;
    return current;
  }, false);
}
const chapterSlugToTitle = new Map();
const LINK = /^https?:\/\/gamefaqs\.gamespot\.com\/[^/]+\/[^/]+\/faqs\/\d+\/([^#/?]+)(?:#(.*))?$/;
(function walk(n) {
  if (isTag(n, 'a')) {
    const m = LINK.exec(attr(n, 'href') ?? '');
    if (m && !m[2]) chapterSlugToTitle.set(m[1], norm(textOf(n)));
  }
  (n.childNodes || []).forEach(walk);
})(tocNode ?? { childNodes: [] });
const firstPageOf = (title) => pages.find((p) => p.category === title)?.id;

let rewritten = 0;
const unresolved = [];
for (const p of pages) {
  (function walk(n) {
    if (isTag(n, 'a')) {
      const href = attr(n, 'href');
      const m = href && LINK.exec(href);
      if (m) {
        const anchor = m[2] ?? m[1];
        const target = anchorPage.get(anchor) || firstPageOf(chapterSlugToTitle.get(m[1]));
        if (target) {
          n.attrs.find((a) => a.name === 'href').value = `./${target}${anchorInPage.has(anchor) ? `#${anchor}` : ''}`;
          rewritten++;
        } else unresolved.push({ page: p.id, href });
      }
    }
    (n.childNodes || []).forEach(walk);
  })({ childNodes: kids.slice(p.from, p.to) });
}

// ---- 4. Write pages (verbatim markup; tables get a scroll wrapper) ----
const html = (n) => serialize({ nodeName: '#document-fragment', childNodes: [n] });
fs.rmSync(path.join(OUT, 'pages'), { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'pages'), { recursive: true });
for (const p of pages) {
  const body = kids.slice(p.from, p.to).map((n) => (isTag(n, 'table') ? `<div class="table-wrap">${html(n)}</div>` : html(n))).join('');
  fs.writeFileSync(path.join(OUT, 'pages', `${p.id}.html`), body);
}
const manifest = {
  game: config.game,
  source: { file: src.file, sha256: src.sha256, bytes: src.bytes, bodyChildren: kids.length },
  pages: pages.map(({ id, title, category, from, to }) => ({ id, title, category, from, to })),
  ledger,
};
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));

// ---- 5. Report for the user: everything that is not a page ----
const count = (k) => ledger.filter((l) => l.kind === k).reduce((a, l) => a + tokens(l.from, l.to).length, 0);
const outside = [];
const content = src.body.parentNode;
(function walk(n) {
  if (n === src.body) return;
  if (['script', 'style', 'noscript', 'template'].includes(n.nodeName)) return;
  if (n.nodeName === '#text') { const t = norm(n.value); if (t && t.length > 1) outside.push(t); return; }
  (n.childNodes || []).forEach(walk);
})(findById(src.doc, 'content') ?? src.doc);
const outsideUnique = [...new Set(outside)];
const report = `# Extraction report

Generated by \`node scripts/extract.mjs\`. Source: \`${src.file}\` (${(src.bytes / 1e6).toFixed(2)} MB, sha256 \`${src.sha256.slice(0, 16)}…\`).

## Result
- Guide body children: ${kids.length}; pages written: ${pages.length}.
- Words kept in pages: ${ledger.filter((l) => l.kind === 'page').reduce((a, l) => a + tokens(l.from, l.to).length, 0)}.
- Words in verified duplicate copies (dropped): ${count('duplicate')}.
- Words in other dropped parts (site-generated table of contents): ${count('dropped')}.
- Links rewritten to local pages: ${rewritten}. Unresolved (left as the original URL): ${unresolved.length}.
${unresolved.map((u) => `  - ${u.page}: ${u.href}`).join('\n')}
- Images in the guide body: ${(() => { let c = 0; (function w(n) { if (n.nodeName === 'img') c++; (n.childNodes || []).forEach(w); })({ childNodes: kids }); return c; })()}.

## Dropped, with reason
${ledger.filter((l) => l.kind !== 'page').map((l) => `- children ${l.from}–${l.to - 1}: ${l.kind} (${l.reason}), ${tokens(l.from, l.to).length} words`).join('\n')}

Duplicates are only dropped after \`verify\` proves their words equal the kept copy, in order.

## Page text outside the guide body (not carried over)
GameFAQs site chrome and listing details around the guide. Review for anything you want kept (author line, version, updated date):

${outsideUnique.slice(0, 120).map((t) => `- ${t.slice(0, 160)}`).join('\n')}
`;
fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs', 'extract-report.md'), report);
console.log(`[OK] ${pages.length} pages, ${count('duplicate')} duplicate words dropped, ${rewritten} links rewritten, ${unresolved.length} unresolved. Report: docs/extract-report.md`);
