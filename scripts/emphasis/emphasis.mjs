// emphasis.mjs - Inline emphasis for structured P4G pages: italic dialogue (*"..."*) and the presentation lint.
//
// Bold terms live in bold_terms.mjs. Markup in structured strings: **bold** for game terms, *italic* for spoken
// dialogue. A spoken line is any straight-quoted span ("..."); the quote marks are part of the italic run.
// Quotes that are not speech go in scripts/emphasis/term_extras.json under "italic_deny" (exact text between the quotes).

import { loadExtras } from "./bold_terms.mjs";

/** Calls visit(text, kind, path, set) for every text string of a page. kind: "prose" | "cell". set(v) writes back. */
export function eachString(guide, visit) {
  const list = (l, p) =>
    l.items.forEach((it, i) => {
      const at = `${p}.items[${i}]`;
      if (typeof it === "string") visit(it, "prose", at, (v) => { l.items[i] = v; });
      else {
        visit(it.text, "prose", at, (v) => { it.text = v; });
        if (it.children) list(it.children, `${at}.children`);
      }
    });
  const blocks = (bs, p) =>
    bs.forEach((b, i) => {
      const at = `${p}[${i}]`;
      switch (b.type) {
        case "p": visit(b.text, "prose", `${at}.text`, (v) => { b.text = v; }); break;
        case "list": list(b, at); break;
        case "callout": blocks(b.blocks, `${at}.blocks`); break;
        case "table":
          b.rows.forEach((r, ri) => r.forEach((c, ci) => visit(c, "cell", `${at}.rows[${ri}][${ci}]`, (v) => { b.rows[ri][ci] = v; })));
          break;
        case "info": b.items.forEach((it, k) => visit(it.value, "prose", `${at}.items[${k}].value`, (v) => { it.value = v; })); break;
        case "slots":
          b.slots.forEach((sl, li) => sl.steps.forEach((st, si) => blocks(st.blocks, `${at}.slots[${li}].steps[${si}].blocks`)));
          break;
        case "ranks":
          b.ranks.forEach((r, ri) => r.scenes.forEach((s, si) => {
            const sp = `${at}.ranks[${ri}].scenes[${si}]`;
            if (s.prompt) visit(s.prompt, "prose", `${sp}.prompt`, (v) => { s.prompt = v; });
            s.options.forEach((o, oi) => visit(o.text, "prose", `${sp}.options[${oi}].text`, (v) => { o.text = v; }));
          }));
          break;
      }
    });
  for (const s of guide.sections ?? []) blocks(s.blocks, `${s.id}`);
}

const denySet = () => new Set(loadExtras().italic_deny ?? []);
const quoteCount = (t) => (t.match(/"/g) ?? []).length;

/** Wraps every straight-quoted span in *...*; idempotent. Text with an odd number of quotes is left alone. */
export function italicText(text, deny = denySet()) {
  if (quoteCount(text) % 2 !== 0) return text;
  return text.replace(/"([^"]*)"/g, (m, inner, off, whole) => {
    if (!inner.trim() || deny.has(inner)) return m;
    if (whole[off - 1] === "*" && whole[off + m.length] === "*") return m; // already italic
    return `*${m}*`;
  });
}

/** Italicises one parsed page; returns the number of spans changed. */
export function italicGuide(guide, deny = denySet()) {
  let changed = 0;
  eachString(guide, (t, _kind, _p, set) => {
    const n = italicText(t, deny);
    if (n !== t) { set(n); changed++; }
  });
  return changed;
}

// --- lint ----------------------------------------------------------------------------------

export const MAX_WORDS = 40;
export const MAX_SENTENCES = 3;
export const MIN_WORDS_FOR_SENTENCES = 12;

const dialogueFree = (t) => t.replace(/\*?"[^"]*"\*?/g, " ").replace(/\*+/g, "");
const sentenceCount = (t) => t.trim().split(/(?<=[.!?]["')\]]?)\s+(?=[A-Z"(])/).filter((s) => /\w/.test(s)).length;

/** Presentation problems of one page: unitalicised dialogue, unbalanced quotes, prose that should be a list. */
export function emphasisProblems(guide, deny = denySet()) {
  const out = [];
  eachString(guide, (t, kind, path) => {
    if (quoteCount(t) % 2 !== 0) { out.push(`${path}: unbalanced double quote; cannot italicise dialogue`); return; }
    for (const m of t.matchAll(/"([^"]*)"/g)) {
      const italic = t[m.index - 1] === "*" && t[m.index + m[0].length] === "*";
      if (!italic && m[1].trim() && !deny.has(m[1])) out.push(`${path}: dialogue not italic: ${m[0].slice(0, 50)}`);
    }
    if (kind !== "prose") return;
    const rest = dialogueFree(t);
    const words = rest.split(/\s+/).filter(Boolean).length;
    const sentences = sentenceCount(rest);
    // Short exclamation banners ("NOTE! NOTE! NOTE!") are not prose: the sentence rule needs real length.
    if (words >= MAX_WORDS || (sentences >= MAX_SENTENCES && words >= MIN_WORDS_FOR_SENTENCES)) {
      out.push(`${path}: ${words} words, ${sentences} sentence(s); break into a bullet/numbered list (children for sub-points)`);
    }
  });
  return out;
}
