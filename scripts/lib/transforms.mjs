// Structural transforms applied to each page at extract time, driven by project.config.json "transforms".
// They may add wrappers, classes, headings, lists and paragraph breaks, and drop pure marker tokens
// ("----", "1.", ...). They must never change, reorder or add a word: verify.mjs proves it per page.
import { attr, tokensOf } from './source.mjs';
import { headerIconName } from '../../src/lib/header-icon-rules.mjs';

const NS = 'http://www.w3.org/1999/xhtml';
const isEl = (n, ...names) => n.nodeName !== '#text' && n.nodeName !== '#comment' && (!names.length || names.includes(n.nodeName));
const text = (value) => ({ nodeName: '#text', value, parentNode: null });
const el = (tag, attrs = [], childNodes = []) => {
  const n = { nodeName: tag, tagName: tag, attrs, namespaceURI: NS, childNodes, parentNode: null };
  childNodes.forEach((c) => { c.parentNode = n; });
  return n;
};
const setClass = (n, cls) => {
  const a = n.attrs.find((x) => x.name === 'class');
  if (a) a.value = `${a.value} ${cls}`; else n.attrs.push({ name: 'class', value: cls });
};

export function clone(n) {
  const c = { ...n, parentNode: null };
  if (n.attrs) c.attrs = n.attrs.map((a) => ({ ...a }));
  if (n.childNodes) { c.childNodes = n.childNodes.map(clone); c.childNodes.forEach((k) => { k.parentNode = c; }); }
  return c;
}

/** Post-order rewrite: children first, then fn(node) may return replacement nodes (or null to keep). */
function rewrite(nodes, fn) {
  const out = [];
  for (const n of nodes) {
    if (n.childNodes) {
      n.childNodes = rewrite(n.childNodes, fn);
      n.childNodes.forEach((c) => { c.parentNode = n; });
    }
    const r = isEl(n) ? fn(n) : null;
    out.push(...(r ?? [n]));
  }
  return out;
}

// ---- callouts: severity class on a <blockquote> whose first paragraph opens with a bold heading ----
function callouts(nodes, rules, stats) {
  return rewrite(nodes, (n) => {
    if (n.nodeName !== 'blockquote' || n.attrs.length) return null;
    const p = n.childNodes[0];
    const strong = p && isEl(p, 'p') && p.childNodes[0];
    const first = strong && isEl(strong, 'strong') && strong.childNodes[0];
    if (!first || first.nodeName !== '#text') return null;
    const h = first.value.trim().toUpperCase();
    const rule = rules.find((r) => (r.startsWith ?? []).some((s) => h.startsWith(s)) || (r.includes ?? []).some((s) => h.includes(s)));
    if (!rule) return null;
    setClass(n, rule.class);
    stats.callouts++;
    return null;
  });
}

// ---- "----<br>~April 11th~<br>----" day dividers -> heading; the dashes and tildes are decoration ----
function dateMarkers(nodes, cfg, stats) {
  return rewrite(nodes, (n) => {
    if (n.nodeName !== 'p' || n.attrs.length) return null;
    const c = n.childNodes;
    if (c.length !== 5 || c[0].nodeName !== '#text' || !isEl(c[1], 'br') || c[2].nodeName !== '#text' || !isEl(c[3], 'br') || c[4].nodeName !== '#text') return null;
    const m = /^~([^~]+)~$/.exec(c[2].value);
    if (!/^-{4,}$/.test(c[0].value) || !m || !/^-{4,}$/.test(c[4].value)) return null;
    stats.dateMarkers++;
    stats.stripped += 2;
    return [el(cfg.tag, [{ name: 'class', value: cfg.class }], [text(m[1])])];
  });
}

// ---- "-Label-" paragraphs -> heading ----
function labelMarkers(nodes, cfg, stats) {
  const re = new RegExp(`^-([A-Za-z][^<>~]{0,${cfg.maxLength - 1}})-$`);
  return rewrite(nodes, (n) => {
    if (n.nodeName !== 'p' || n.attrs.length || n.childNodes.length !== 1 || n.childNodes[0].nodeName !== '#text') return null;
    const m = re.exec(n.childNodes[0].value);
    if (!m) return null;
    stats.labelMarkers++;
    return [el(cfg.tag, [{ name: 'class', value: cfg.class }, { name: 'data-icon', value: headerIconName(m[1]) }], [text(m[1])])];
  });
}

// ---- top-level paragraphs that are only one bold phrase ("Afternoon", "Trophies") -> heading ----
function partMarkers(nodes, cfg, stats) {
  return nodes.map((n) => {
    if (n.nodeName !== 'p' || n.attrs.length || n.childNodes.length !== 1) return n;
    const s = n.childNodes[0];
    if (!isEl(s, 'strong') || s.attrs.length || s.childNodes.length !== 1 || s.childNodes[0].nodeName !== '#text') return n;
    const label = s.childNodes[0].value;
    if (!label.trim() || label.length > cfg.maxLength) return n;
    stats.partMarkers++;
    return el(cfg.tag, [{ name: 'class', value: cfg.class }, { name: 'data-icon', value: headerIconName(label) }], [text(label)]);
  });
}

// ---- "FAQ1: question<br>answer" paragraphs -> collapsible <details> ----
function faq(nodes, cfg, stats) {
  const re = new RegExp(cfg.prefix);
  return rewrite(nodes, (n) => {
    if (n.nodeName !== 'p' || n.attrs.length) return null;
    const [q, br, ...answer] = n.childNodes;
    if (!q || q.nodeName !== '#text' || !re.test(q.value) || !br || !isEl(br, 'br')) return null;
    stats.faq++;
    return [el('details', [{ name: 'class', value: 'faq' }], [
      el('summary', [], [text(q.value)]),
      el('div', [{ name: 'class', value: 'faq-answer' }], answer),
    ])];
  });
}

// ---- "lead:<br>1. a<br>2. b" -> lead paragraph + <ol>; the typed numbers become list numbering ----
function numberedLines(nodes, stats) {
  return rewrite(nodes, (n) => {
    if (n.nodeName !== 'p' || !n.childNodes.some((c) => isEl(c, 'br'))) return null;
    const lines = [[]];
    for (const c of n.childNodes) { if (isEl(c, 'br')) lines.push([]); else lines[lines.length - 1].push(c); }
    const num = (line) => { const m = line[0]?.nodeName === '#text' && /^(\d{1,3})[.)]\s+/.exec(line[0].value); return m ? Number(m[1]) : null; };
    const segs = [];
    for (let i = 0; i < lines.length; i++) {
      const k = num(lines[i]);
      const prev = segs[segs.length - 1];
      if (k !== null && prev?.type === 'ol' && num(prev.lines[prev.lines.length - 1]) + 1 === k) prev.lines.push(lines[i]);
      else if (k !== null) segs.push({ type: 'ol', lines: [lines[i]] });
      else if (prev?.type === 'p') prev.lines.push(lines[i]);
      else segs.push({ type: 'p', lines: [lines[i]] });
    }
    // A numbered line that did not continue a run of at least two stays plain text.
    for (const s of segs) if (s.type === 'ol' && s.lines.length < 2) s.type = 'p';
    if (!segs.some((s) => s.type === 'ol')) return null;
    const merged = [];
    for (const s of segs) {
      const prev = merged[merged.length - 1];
      if (s.type === 'p' && prev?.type === 'p') prev.lines.push(...s.lines); else merged.push(s);
    }
    stats.numberedLists++;
    return merged.map((s) => {
      if (s.type === 'p') {
        const kids = s.lines.flatMap((l, i) => (i ? [el('br'), ...l] : l));
        return el('p', n.attrs.map((a) => ({ ...a })), kids);
      }
      const start = num(s.lines[0]);
      const items = s.lines.map((l) => {
        const [first, ...rest] = l;
        stats.stripped++;
        return el('li', [], [text(first.value.replace(/^\d{1,3}[.)]\s+/, '')), ...rest]);
      });
      return el('ol', start === 1 ? [] : [{ name: 'start', value: String(start) }], items);
    });
  });
}

// ---- long paragraphs -> several paragraphs, breaking only at sentence ends ----
const INLINE = new Set(['strong', 'em', 'b', 'i', 'a', 'span', 'u']);
const NOT_SENTENCE_END = new Set(['e.g.', 'i.e.', 'vs.', 'mr.', 'mrs.', 'ms.', 'dr.', 'st.', 'jr.', 'sr.', 'no.', 'lv.', 'lvl.', 'vol.', 'ch.', 'ex.', 'fig.', 'approx.', 'ca.']);
const wordsIn = (nodes) => tokensOf(nodes).length;

function sentenceAtoms(children) {
  const atoms = [];
  for (const c of children) {
    if (c.nodeName !== '#text') { atoms.push({ node: c, end: false }); continue; }
    let from = 0, next;
    for (const m of c.value.matchAll(/([.!?]['")\]]?)(\s+)(?=[A-Z0-9'"(\[])/g)) {
      const upto = m.index + m[1].length;
      const word = c.value.slice(0, upto).split(/\s+/).pop().toLowerCase();
      if (NOT_SENTENCE_END.has(word) || /^[a-z]\.$/.test(word) || /^\d+\.$/.test(word)) continue;
      next = m.index + m[0].length;
      atoms.push({ node: text(c.value.slice(from, next)), end: true });
      from = next;
    }
    atoms.push({ node: from ? text(c.value.slice(from)) : c, end: false });
  }
  return atoms;
}

function chunkAtoms(atoms, cfg) {
  const chunks = [];
  let cur = [], words = 0, sentences = 0;
  for (const a of atoms) {
    cur.push(a);
    words += wordsIn([a.node]);
    if (!a.end) continue;
    sentences++;
    if (words >= cfg.maxWords || (words >= cfg.targetWords && sentences >= 2) || (words >= cfg.targetWords * 0.75 && sentences >= 3)) {
      chunks.push(cur); cur = []; words = 0; sentences = 0;
    }
  }
  if (cur.length) {
    if (chunks.length && wordsIn(cur.map((a) => a.node)) < cfg.minTail) chunks[chunks.length - 1].push(...cur); else chunks.push(cur);
  }
  return chunks;
}

function trimEdges(nodes) {
  const out = nodes.slice();
  if (out[0]?.nodeName === '#text') out[0] = text(out[0].value.replace(/^\s+/, ''));
  const last = out.length - 1;
  if (out[last]?.nodeName === '#text') out[last] = text(out[last].value.replace(/\s+$/, ''));
  return out.filter((n) => n.nodeName !== '#text' || n.value);
}

function splitParagraphs(nodes, cfg, stats) {
  const splitContainer = (n) => {
    if (n.childNodes.some((c) => c.nodeName !== '#text' && !(isEl(c) && INLINE.has(c.nodeName)))) return null;
    if (wordsIn(n.childNodes) <= cfg.minWords) return null;
    const chunks = chunkAtoms(sentenceAtoms(n.childNodes), cfg);
    if (chunks.length < 2) return null;
    stats.splitParagraphs++;
    return chunks.map((ch) => trimEdges(ch.map((a) => a.node)));
  };
  return rewrite(nodes, (n) => {
    if (n.nodeName === 'p') {
      const parts = splitContainer(n);
      return parts && parts.map((kids) => el('p', n.attrs.map((a) => ({ ...a })), kids));
    }
    if (n.nodeName === 'div' && attr(n, 'class') === 'faq-answer') {
      const parts = splitContainer(n);
      if (!parts) return null;
      n.childNodes = parts.map((kids) => el('p', [], kids));
      n.childNodes.forEach((c) => { c.parentNode = n; });
    }
    return null;
  });
}

// ---- page ToC: ids on the chosen headings (attributes only) and the entry list for the manifest ----
function pageToc(nodes, cfg) {
  const entries = [];
  const used = new Set();
  const plain = (n) => (n.nodeName === '#text' ? n.value : (n.childNodes || []).map(plain).join(''));
  rewrite(nodes, (n) => {
    if (n.nodeName !== cfg.tag) return null;
    const title = plain(n).replace(/\s+/g, ' ').trim();
    if (!title) return null;
    const base = `toc-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section'}`;
    let id = base;
    for (let i = 2; used.has(id); i++) id = `${base}-${i}`;
    used.add(id);
    n.attrs = n.attrs.filter((a) => a.name !== 'id');
    n.attrs.push({ name: 'id', value: id });
    entries.push({ id, title });
    return null;
  });
  return entries.length >= cfg.minEntries ? entries : [];
}

// ---- emphasis: "double quoted" spans -> <em>; known guide terms -> <strong class="term">. Wrappers only, no text change ----
const NO_TERMS_IN = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'script', 'style']);

function italicQuotes(parent, stats) {
  for (const c of parent.childNodes) if (isEl(c) && c.nodeName !== 'em') italicQuotes(c, stats);
  const quotes = parent.childNodes.reduce((n, c) => n + (c.nodeName === '#text' ? (c.value.match(/"/g) ?? []).length : 0), 0);
  if (!quotes) return;
  if (quotes % 2) { stats.quotesUnpaired++; return; }
  const out = [];
  let open = null;
  const put = (n) => (open ? open.push(n) : out.push(n));
  for (const c of parent.childNodes) {
    if (c.nodeName !== '#text') { put(c); continue; }
    const s = c.value;
    let from = 0;
    for (let i = s.indexOf('"'); i >= 0; i = s.indexOf('"', i + 1)) {
      if (!open) {
        if (i > from) out.push(text(s.slice(from, i)));
        open = [];
        from = i;
      } else {
        open.push(text(s.slice(from, i + 1)));
        out.push(el('em', [], open));
        stats.quotes++;
        open = null;
        from = i + 1;
      }
    }
    if (from < s.length) put(text(s.slice(from)));
  }
  parent.childNodes = out;
  out.forEach((c) => { c.parentNode = parent; });
}

// Capitalized words and runs the author wrote mid-sentence ("Vending Machine", "Seekers of Truth"). A run may continue
// through the small connector words; a lone word or a run that opens a sentence is bold only when it is longer than one word.
const CAP_WORD = "[A-Z](?:[A-Za-z0-9]|['’-](?=[A-Za-z0-9]))*";
export const capRegex = (connectors) => new RegExp(`(?<![A-Za-z0-9'’-])${CAP_WORD}(?:(?:\\s+(?:${connectors.join('|')}))?\\s+${CAP_WORD})*(?![A-Za-z0-9])`, 'g');
// A number right after a bold term or run belongs to it ("Persona 4", "Rank 9", "April 11th").
const NUMBER_AFTER = /^ (?:\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(?:st|nd|rd|th)?(?![A-Za-z0-9])/;
const withNumber = (s, end, limit) => { const m = NUMBER_AFTER.exec(s.slice(end, limit)); return m ? end + m[0].length : end; };
const SENTENCE_END = /[.!?]["')\]”]*\s*$/;
const startsSentence = (before, blockStart) => {
  const rest = before.replace(/[\s"'“‘(\[]+$/, '');
  return rest ? SENTENCE_END.test(rest) : blockStart;
};

function addHit(map, key, atStart) {
  const hit = map.get(key) ?? { n: 0, start: 0 };
  hit.n++;
  if (atStart) hit.start++;
  map.set(key, hit);
}

function boldTerms(parent, ctx, st = { start: true }) {
  const out = [];
  const term = (s) => el('strong', [{ name: 'class', value: 'term' }], [text(s)]);
  for (const c of parent.childNodes) {
    if (c.nodeName !== '#text') {
      if (isEl(c, 'br')) st.start = true;
      else if (isEl(c) && NO_TERMS_IN.has(c.nodeName)) st.start = true;
      else if (isEl(c)) { boldTerms(c, ctx, INLINE.has(c.nodeName) ? st : { start: true }); if (INLINE.has(c.nodeName)) st.start = false; }
      out.push(c);
      continue;
    }
    const s = c.value;
    const known = ctx.re ? [...s.matchAll(ctx.re)] : [];
    let from = 0;
    const gap = (to) => {
      // Text between known terms: bold capitalized runs that are not just a sentence's first word.
      if (!ctx.cap) { if (to > from) out.push(text(s.slice(from, to))); return; }
      const part = s.slice(from, to);
      let at = 0;
      for (const m of part.matchAll(ctx.cap.re)) {
        const first = startsSentence(s.slice(0, from + m.index), st.start && from + m.index === 0);
        const words = m[0].split(/\s+/);
        if (first && words.length === 1) continue;
        // "What", "Can I", "I've": plain English, not terms.
        if (words.every((w) => ctx.cap.stop.has(w) || ctx.cap.connectors.has(w))) continue;
        if (m.index > at) out.push(text(part.slice(at, m.index)));
        const end = withNumber(part, m.index + m[0].length, part.length);
        const run = part.slice(m.index, end);
        out.push(term(run));
        addHit(ctx.auto, run.replace(/\s+/g, ' ').replace(/’/g, "'"), first);
        at = end;
      }
      if (at < part.length) out.push(text(part.slice(at)));
    };
    for (const m of known) {
      if (m.index < from) continue;
      gap(m.index);
      const end = withNumber(s, m.index + m[0].length, s.length);
      out.push(term(s.slice(m.index, end)));
      addHit(ctx.hits, m[0].replace(/\s+/g, ' ').replace(/’/g, "'"), startsSentence(s.slice(0, m.index), st.start && m.index === 0));
      from = end;
    }
    gap(s.length);
    if (s.trim()) st.start = SENTENCE_END.test(s);
  }
  parent.childNodes = out;
  out.forEach((c) => { c.parentNode = parent; });
}

function emphasize(nodes, cfg, ctx, stats) {
  const root = { nodeName: 'root', childNodes: nodes };
  if (cfg.quotes) italicQuotes(root, stats);
  if ((ctx?.re || ctx?.cap) && !(cfg.skipCategories ?? []).includes(ctx.category)) boldTerms(root, ctx);
  root.childNodes.forEach((c) => { c.parentNode = null; });
  return root.childNodes;
}

/**
 * Applies the configured transforms to cloned nodes. Returns the new nodes and counters (stripped = marker tokens dropped).
 * ctx (emphasis only): { re, hits: Map, category } where re matches the guide terms and hits collects per-term counts.
 */
export function applyTransforms(sourceNodes, cfg = {}, ctx = {}) {
  const stats = { callouts: 0, dateMarkers: 0, labelMarkers: 0, partMarkers: 0, faq: 0, numberedLists: 0, splitParagraphs: 0, stripped: 0, quotes: 0, quotesUnpaired: 0 };
  let nodes = sourceNodes.map(clone);
  if (cfg.callouts) nodes = callouts(nodes, cfg.callouts, stats);
  if (cfg.dateMarker) nodes = dateMarkers(nodes, cfg.dateMarker, stats);
  if (cfg.labelMarker) nodes = labelMarkers(nodes, cfg.labelMarker, stats);
  if (cfg.partMarker) nodes = partMarkers(nodes, cfg.partMarker, stats);
  if (cfg.faq) nodes = faq(nodes, cfg.faq, stats);
  if (cfg.numberedLines) nodes = numberedLines(nodes, stats);
  if (cfg.emphasis) nodes = emphasize(nodes, cfg.emphasis, ctx, stats);
  if (cfg.splitParagraphs) nodes = splitParagraphs(nodes, cfg.splitParagraphs, stats);
  const toc = cfg.toc ? pageToc(nodes, cfg.toc) : [];
  return { nodes, stats, toc };
}
