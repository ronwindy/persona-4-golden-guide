// scaffold.mjs - Deterministic scaffold: canonical section JSON -> structured P4G page.
//
// Copies the source text exactly; only the shape changes (headings, lists, tables, info lists,
// rank-up scenes). Page-type passes live in this file; unknown shapes fall back to the generic pass.

import { readFileSync } from "node:fs";

export const slug = (s) => String(s).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const lines = (s) => String(s).split("\n").map((l) => l.trim()).filter(Boolean);
const mdOf = (b) => b.md ?? b.text ?? "";

/** A paragraph whose whole content is bold is a sub-heading in the source. */
const headingText = (b) => {
  if (b.type !== "p") return null;
  const m = /^\*\*([^*]+)\*\*$/.exec(mdOf(b).trim());
  return m ? m[1].trim() : null;
};
/** "-Label-" lines are inline sub-headings in the source. */
const dashLabel = (b) => {
  if (b.type !== "p") return null;
  const m = /^-([^-].*[^-]|[^-])-$/.exec(b.text.trim());
  return m ? m[1].trim() : null;
};

const isBoldCell = (c) => /^\*\*.+\*\*$/s.test((c.md ?? "").trim());

export function tableBlock(b) {
  const rows = b.rows.map((r) => r.map((c) => c.text ?? ""));
  const firstBold = b.rows.length > 1 && b.rows[0].every(isBoldCell);
  return firstBold ? { type: "table", headers: rows[0], rows: rows.slice(1) } : { type: "table", headers: null, rows };
}

function textBlock(b) {
  const ls = lines(mdOf(b));
  return ls.length > 1 ? { type: "list", ordered: false, items: ls } : { type: "p", text: ls[0] ?? "" };
}

/** Converts a canonical block that is not a heading into a structured block. */
function plainBlock(b) {
  if (b.type === "p") return textBlock(b);
  if (b.type === "table") return tableBlock(b);
  if (b.type === "quote") return { type: "callout", kind: "note", blocks: b.blocks.map(plainBlock) };
  if (b.type === "list") {
    return { type: "list", ordered: Boolean(b.ordered), items: (b.items ?? []).map((i) => (typeof i === "string" ? i : i.md ?? i.text)) };
  }
  throw new Error(`Unhandled canonical block type '${b.type}'`);
}

const OPTION = /^(Option [A-Z](?: \([^)]*\))?|Any option):\s*(.*)$/;

/** Rank Up Scenes: "-Rank N-" groups; a prompt line followed by its Option lines forms one scene. */
function rankBlock(blocks) {
  const ranks = [];
  for (const b of blocks) {
    const label = dashLabel(b);
    if (label) { ranks.push({ title: label, scenes: [] }); continue; }
    if (!ranks.length) throw new Error("Rank Up Scenes: content before the first -Rank- label");
    const cur = ranks[ranks.length - 1];
    const ls = lines(b.text);
    const opts = ls.map((l) => OPTION.exec(l));
    if (opts.length && opts.every(Boolean)) {
      const scene = cur.scenes[cur.scenes.length - 1];
      if (!scene || scene.options.length) cur.scenes.push({ options: [] });
      cur.scenes[cur.scenes.length - 1].options.push(...opts.map((m) => ({ label: m[1], text: m[2] })));
    } else {
      cur.scenes.push({ prompt: ls.join(" "), options: [] });
    }
  }
  return { type: "ranks", ranks };
}

function infoBlock(blocks) {
  const items = [];
  for (const b of blocks) {
    const m = /^([^:\n]+):\s*(.*)$/s.exec(b.text);
    if (!m) throw new Error(`Information: line without 'Label: value': ${b.text}`);
    items.push({ label: m[1].trim(), value: m[2].trim() });
  }
  return { type: "info", items };
}

/** Splits canonical blocks into [{heading, blocks}] at bold-only paragraphs. */
function splitSections(blocks) {
  const out = [{ heading: null, raw: [] }];
  for (const b of blocks) {
    const h = headingText(b);
    if (h) out.push({ heading: h, raw: [] });
    else out[out.length - 1].raw.push(b);
  }
  return out.filter((s) => s.heading || s.raw.length);
}

function buildSection(sec, type) {
  let blocks;
  if (type === "social-link" && sec.heading === "Rank Up Scenes") blocks = [rankBlock(sec.raw)];
  else if (type === "social-link" && sec.heading === "Information") blocks = [infoBlock(sec.raw)];
  else blocks = sec.raw.map(plainBlock);
  return { id: sec.heading ? slug(sec.heading) : "intro", heading: sec.heading, blocks };
}

export function scaffoldGuide(canonicalPath, ctx = {}) {
  const c = JSON.parse(readFileSync(canonicalPath, "utf8"));
  const sections = splitSections(c.blocks).map((s) => buildSection(s, c.type));
  const ids = new Set();
  for (const s of sections) {
    if (ids.has(s.id)) throw new Error(`Duplicate section id '${s.id}'`);
    ids.add(s.id);
  }
  const guide = { id: c.id, title: c.title, type: c.type, category: c.chapter, sections };
  if (ctx.source) guide.source = ctx.source;
  if (ctx.navigation) guide.navigation = ctx.navigation;
  return { guide };
}
