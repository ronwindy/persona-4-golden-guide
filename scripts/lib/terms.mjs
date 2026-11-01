// Builds the list of guide terms (items, personas, skills, arcana, places, characters, shadows/bosses)
// from the guide's own appendix tables and page titles, as configured in project.config.json "extract.emphasis.sources".
// Only reads source nodes; used by extract.mjs to drive the "emphasis" transform. It never changes any text.
import { textOf } from './source.mjs';

const norm = (s) => s.replace(/\s+/g, ' ').trim();
const walk = (n, fn) => { fn(n); (n.childNodes || []).forEach((c) => walk(c, fn)); };
const cells = (tr) => (tr.childNodes || []).filter((c) => c.nodeName === 'td' || c.nodeName === 'th');
const usable = (t) => t.length >= 2 && /[A-Za-z]/.test(t) && !/^[?\-–]+$/.test(t);

/** pages: [{ category, title, from, to }]; nodesOf(page) returns that page's source nodes. Returns Map<term, type>. */
export function collectTerms(pages, nodesOf, sources, extra = {}) {
  const terms = new Map();
  const add = (t, type) => { t = norm(t); if (usable(t) && !terms.has(t)) terms.set(t, type); };

  for (const s of sources) {
    for (const p of pages.filter((x) => x.category === s.category)) {
      if (s.headers) {
        walk({ childNodes: nodesOf(p) }, (n) => {
          if (n.nodeName !== 'table') return;
          const rows = [];
          walk(n, (r) => { if (r.nodeName === 'tr') rows.push(r); });
          const head = rows[0] && cells(rows[0])[0] && norm(textOf(cells(rows[0])[0]));
          if (!s.headers.includes(head)) return;
          for (const r of rows.slice(1)) {
            const first = cells(r)[0];
            const t = first && norm(textOf(first));
            if (t && !s.headers.includes(t)) add(t, s.type);
          }
        });
      } else if (!(s.exclude ?? []).includes(p.title) && (!s.titles || s.titles.includes(p.title))) {
        if (!s.names) { add(p.title, s.type); continue; }
        // Social Link titles look like "Yukiko Amagi/Priestess": the part before "/" names the character(s).
        for (const person of p.title.split('/')[0].split(/\s+and\s+/)) {
          add(person, s.type);
          if (!(s.noSplit ?? []).includes(person)) for (const w of person.split(' ')) if (w.length >= 3) add(w, s.type);
        }
      }
    }
  }
  for (const [t, type] of Object.entries(extra)) add(t, type);
  return terms;
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+').replace(/['’]/g, "['’]");

/** One regex for all terms: longest first, not glued to other letters or digits. */
export function termRegex(terms) {
  const list = [...terms.keys()].sort((a, b) => b.length - a.length || a.localeCompare(b));
  return new RegExp(`(?<![A-Za-z0-9])(?:${list.map(esc).join('|')})(?![A-Za-z0-9])`, 'g');
}
