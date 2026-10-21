// import_source.mjs - Imports the saved GameFAQs HTML into canonical-sources/ (verbatim, no interpretation).
//
// Usage: node scripts/import_source.mjs [--dry-run]
//
// The saved page holds every chapter twice: once as a chapter view (h2, then all its h3 sections) and then
// section by section (h2 + one h3). The section-by-section copies are the canonical text; the chapter views are
// only compared against them (a mismatch is reported) and mined for chapter intro text.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "parse5";
import { PROJECT } from "./project_config.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW_DIR = join(ROOT, "raw-sources");
const OUT_DIR = join(ROOT, "canonical-sources");
const SOURCE_URL = "https://gamefaqs.gamespot.com/vita/641695-persona-4-golden/faqs/76145";

/** Sections the user decided to drop (author admin). They stay listed in the index with the reason. */
const DROPPED = {
  "introduction-version-history": "author admin (decided with the user)",
  "introduction-contact-information": "author admin (decided with the user)",
  "100-guide-update-current-schedule": "author admin (decided with the user)",
};

const warnings = [];
const warn = (m) => warnings.push(m);

// ---------- DOM helpers ----------
const attr = (n, k) => n.attrs?.find((a) => a.name === k)?.value;
const elems = (n) => (n.childNodes ?? []).filter((c) => c.tagName);
const isText = (n) => n.nodeName === "#text";

function find(n, fn) {
  if (fn(n)) return n;
  for (const c of n.childNodes ?? []) {
    const r = find(c, fn);
    if (r) return r;
  }
  return null;
}

// ---------- inline serialisation ----------
const clean = (s) => s.replace(/[ \t\r\n ]+/g, " ");

/** Returns { plain, md } for an inline run. <br> becomes "\n", <strong> bold, <a> link, <i>/<em> italic. */
function inline(node, opts = {}) {
  let plain = "";
  let md = "";
  const walk = (n, bold) => {
    if (isText(n)) {
      const t = clean(n.value);
      plain += t;
      md += t;
      return;
    }
    switch (n.tagName) {
      case "br":
        plain += "\n";
        md += "\n";
        return;
      case "strong":
      case "b": {
        const startMd = md.length;
        for (const c of n.childNodes) walk(c, true);
        if (!bold && md.slice(startMd).trim()) {
          const inner = md.slice(startMd);
          const lead = inner.match(/^\s*/)[0];
          const trail = inner.match(/\s*$/)[0];
          md = md.slice(0, startMd) + lead + "**" + inner.trim() + "**" + trail;
        }
        return;
      }
      case "i":
      case "em": {
        const startMd = md.length;
        for (const c of n.childNodes) walk(c, bold);
        const inner = md.slice(startMd);
        if (inner.trim()) md = md.slice(0, startMd) + "*" + inner.trim() + "*";
        return;
      }
      case "a": {
        if (opts.skipAnchors) return;
        const startP = plain.length;
        const startM = md.length;
        for (const c of n.childNodes) walk(c, bold);
        const label = plain.slice(startP);
        const href = attr(n, "href");
        if (href && label.trim()) md = md.slice(0, startM) + `[${md.slice(startM)}](${href})`;
        return;
      }
      case "span":
      case "small":
      case "u":
      case "sup":
      case "sub":
        for (const c of n.childNodes) walk(c, bold);
        return;
      default:
        warn(`unexpected inline <${n.tagName}> inside ${opts.where ?? "?"}`);
        for (const c of n.childNodes ?? []) walk(c, bold);
    }
  };
  for (const c of node.childNodes ?? []) walk(c, false);
  return { plain: tidy(plain), md: tidy(md) };
}

/** Trims every line and the whole run; keeps single "\n" breaks. */
function tidy(s) {
  return s
    .split("\n")
    .map((l) => l.replace(/ +/g, " ").trim())
    .join("\n")
    .replace(/^\n+|\n+$/g, "");
}

const withMd = (o) => (o.md !== o.plain ? { text: o.plain, md: o.md } : { text: o.plain });

/** Text of a heading, ignoring anchor links. */
const headingText = (n) => inline(n, { skipAnchors: true, where: n.tagName }).plain;

// ---------- block conversion ----------
function cellContent(td) {
  const paras = elems(td).filter((c) => c.tagName === "p");
  const loose = (td.childNodes ?? []).some((c) => isText(c) && c.value.trim());
  if (!paras.length) return inline(td, { where: "td" });
  if (loose || elems(td).some((c) => !["p", "strong", "br", "a", "i", "span"].includes(c.tagName))) {
    // mixed content: serialise the whole cell, paragraphs separated by a line break
  }
  const parts = [];
  let run = { childNodes: [] };
  const flush = () => {
    if (run.childNodes.length) parts.push(inline(run, { where: "td" }));
    run = { childNodes: [] };
  };
  for (const c of td.childNodes) {
    if (c.tagName === "p") {
      flush();
      parts.push(inline(c, { where: "td>p" }));
    } else {
      run.childNodes.push(c);
    }
  }
  flush();
  const nonEmpty = parts.filter((p) => p.plain);
  return { plain: nonEmpty.map((p) => p.plain).join("\n"), md: nonEmpty.map((p) => p.md).join("\n") };
}

function tableBlock(table) {
  const rows = [];
  for (const tbody of elems(table)) {
    for (const tr of elems(tbody).filter((c) => c.tagName === "tr")) {
      rows.push(
        elems(tr)
          .filter((c) => c.tagName === "td" || c.tagName === "th")
          .map((td) => {
            const cell = withMd(cellContent(td));
            const span = attr(td, "colspan");
            if (span && span !== "1") cell.colspan = Number(span);
            const rspan = attr(td, "rowspan");
            if (rspan && rspan !== "1") cell.rowspan = Number(rspan);
            return cell;
          }),
      );
    }
  }
  return { type: "table", rows };
}

function listBlock(list) {
  const items = [];
  for (const li of elems(list).filter((c) => c.tagName === "li")) {
    const lead = { childNodes: (li.childNodes ?? []).filter((c) => c.tagName !== "ul" && c.tagName !== "ol") };
    const item = withMd(inline(lead, { where: "li" }));
    const nested = elems(li).filter((c) => c.tagName === "ul" || c.tagName === "ol");
    if (nested.length) item.children = nested.map(listBlock);
    items.push(item);
  }
  return { type: "list", ordered: list.tagName === "ol", items };
}

function nodeToBlock(n) {
  switch (n.tagName) {
    case "p": {
      const o = inline(n, { where: "p" });
      return o.plain ? { type: "p", ...withMd(o) } : null;
    }
    case "h4": {
      const o = inline(n, { skipAnchors: true, where: "h4" });
      return o.plain ? { type: "h4", ...withMd(o) } : null;
    }
    case "table":
      return tableBlock(n);
    case "ul":
    case "ol":
      return listBlock(n);
    case "blockquote":
      return { type: "quote", blocks: blocksOf(n.childNodes) };
    case "hr":
      return { type: "hr" };
    default:
      warn(`unexpected block <${n.tagName}>`);
      return null;
  }
}

function blocksOf(nodes) {
  const out = [];
  let loose = { childNodes: [] };
  const flush = () => {
    const o = inline(loose, { where: "loose" });
    if (o.plain) out.push({ type: "p", ...withMd(o) });
    loose = { childNodes: [] };
  };
  for (const n of nodes) {
    if (n.tagName && ["p", "h4", "table", "ul", "ol", "blockquote", "hr"].includes(n.tagName)) {
      flush();
      const b = nodeToBlock(n);
      if (b) out.push(b);
    } else if (n.tagName || (isText(n) && n.value.trim())) {
      loose.childNodes.push(n);
    }
  }
  flush();
  return out;
}

/** Flat plain text of a block list (verbatim words, for diffing and search). */
function plainOf(blocks) {
  const lines = [];
  const walk = (bs) => {
    for (const b of bs) {
      if (b.type === "p" || b.type === "h4") lines.push(b.text);
      else if (b.type === "table") for (const r of b.rows) lines.push(r.map((c) => c.text.replace(/\n/g, " / ")).join(" | "));
      else if (b.type === "list") {
        const li = (items) => items.forEach((i) => (lines.push(i.text), (i.children ?? []).forEach((c) => li(c.items))));
        li(b.items);
      } else if (b.type === "quote") walk(b.blocks);
    }
  };
  walk(blocks);
  return lines.join("\n");
}

const norm = (s) => s.replace(/\s+/g, " ").trim();

// ---------- ToC ----------
function readToc(root) {
  const ftoc = find(root, (n) => n.tagName === "div" && attr(n, "class") === "ftoc");
  const entries = [];
  const walk = (n, chapter) => {
    for (const c of n.childNodes ?? []) {
      if (c.tagName === "a") {
        const href = attr(c, "href") ?? "";
        const m = href.match(/\/faqs\/76145\/([a-z0-9-]+)(?:#([a-z0-9-]+))?$/);
        const label = inline(c, { where: "toc" }).plain;
        if (m) entries.push({ chapterSlug: m[1], anchor: m[2] ?? null, label });
      } else walk(c);
    }
  };
  walk(ftoc);
  // Chapters have no anchor; sections have chapter#anchor. Later chapter-level entries without anchor (WAQ list) repeat a slug.
  const chapters = [];
  const sections = [];
  const seen = new Set();
  for (const e of entries) {
    if (!e.anchor) {
      if (!chapters.find((c) => c.slug === e.chapterSlug) && !e.label.startsWith("(WAQ") && !e.label.startsWith("WAQ")) {
        chapters.push({ slug: e.chapterSlug, title: e.label });
      }
    } else {
      const key = `${e.chapterSlug}#${e.anchor}`;
      if (seen.has(key)) continue;
      seen.add(key);
      sections.push({ chapterSlug: e.chapterSlug, anchor: e.anchor, title: e.label });
    }
  }
  return { chapters, sections };
}

const slugify = (t) => t.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const sectionId = (chapterSlug, anchor) => (anchor.startsWith(chapterSlug) ? anchor : `${chapterSlug}-${anchor}`);

const ARCANA_PLAIN = new Set(["formula", "fusion-forecast", "special-fusions"]);
function sectionType(chapterSlug, anchor) {
  switch (chapterSlug) {
    case "100-guide":
      return "reference";
    case "walkthrough":
      return /^(april|may|june|july|august|september|october|november|december|january|february|march|new-game-plus-walkthrough)$/.test(anchor)
        ? "calendar"
        : "article";
    case "dungeons":
      return "dungeon";
    case "persona-compendium":
      return ARCANA_PLAIN.has(anchor) ? "article" : "arcana";
    case "social-links":
      return "social-link";
    case "skill-list":
    case "item-list":
      return "catalog";
    default:
      return "article";
  }
}

// ---------- main ----------
function main() {
  const dryRun = process.argv.includes("--dry-run");
  const htmlFile = readdirSync(RAW_DIR).find((f) => f.endsWith(".html"));
  if (!htmlFile) throw new Error("No .html file in raw-sources/");
  const doc = parse(readFileSync(join(RAW_DIR, htmlFile), "utf8"));
  const wrap = find(doc, (n) => n.tagName === "div" && attr(n, "id") === "faqwrap");
  if (!wrap) throw new Error("div#faqwrap not found");

  const toc = readToc(wrap);

  // Split the flat children into h2 groups.
  const groups = [];
  for (const n of elems(wrap)) {
    if (n.tagName === "div" && attr(n, "class") === "ftoc") continue;
    if (n.tagName === "h2") groups.push({ title: headingText(n), nodes: [] });
    else if (groups.length) groups.at(-1).nodes.push(n);
    else warn(`node <${n.tagName}> before the first h2`);
  }

  // Group per chapter title: first group = chapter view, the rest = per-section copies.
  const byChapter = new Map();
  for (const g of groups) {
    if (!byChapter.has(g.title)) byChapter.set(g.title, []);
    byChapter.get(g.title).push(g);
  }

  const splitByH3 = (nodes) => {
    const intro = [];
    const parts = [];
    for (const n of nodes) {
      if (n.tagName === "h3") parts.push({ title: headingText(n), nodes: [] });
      else if (parts.length) parts.at(-1).nodes.push(n);
      else intro.push(n);
    }
    return { intro, parts };
  };

  const chapterRecords = [];
  const sections = [];
  const problems = [];
  const tocGaps = [];
  let order = 0;

  for (const ch of toc.chapters) {
    const gs = byChapter.get(ch.title);
    if (!gs) {
      problems.push(`chapter "${ch.title}" has no h2 group`);
      continue;
    }
    const [view, ...copies] = gs;
    const { intro, parts: viewParts } = splitByH3(view.nodes);
    const introBlocks = blocksOf(intro);
    chapterRecords.push({ id: ch.slug, title: ch.title, ...(introBlocks.length ? { intro_blocks: introBlocks } : {}) });

    const tocSecs = toc.sections.filter((s) => s.chapterSlug === ch.slug);
    const copyParts = copies.map((g) => {
      const { intro: i2, parts } = splitByH3(g.nodes);
      if (i2.some((n) => blocksOf([n]).length)) problems.push(`${ch.title}: text before h3 in a section copy`);
      if (parts.length !== 1) problems.push(`${ch.title}: a section copy has ${parts.length} h3 headings`);
      return parts[0];
    });

    // The page headings are the authority; the saved ToC is shorter than the page for some chapters.
    const notInToc = [];
    copyParts.forEach((part) => {
      if (!part) return;
      const ts = tocSecs.find((t) => norm(t.title) === norm(part.title));
      const anchor = ts?.anchor ?? slugify(part.title);
      if (!ts) notInToc.push(part.title);
      else if (slugify(part.title) !== ts.anchor) problems.push(`${ch.title}: ToC anchor ${ts.anchor} differs from slug of "${part.title}"`);
      const id = sectionId(ch.slug, anchor);
      const blocks = blocksOf(part.nodes);
      const vp = viewParts.find((p) => norm(p.title) === norm(part.title));
      let viewMatch = "missing";
      if (vp) viewMatch = norm(plainOf(blocksOf(vp.nodes))) === norm(plainOf(blocks)) ? "identical" : "DIFFERENT";
      if (viewMatch !== "identical") problems.push(`${id}: chapter-view copy ${viewMatch}`);
      sections.push({
        id, title: part.title, chapter: ch.title, chapter_id: ch.slug, anchor,
        type: sectionType(ch.slug, anchor), order: ++order, blocks, text: plainOf(blocks), view_match: viewMatch,
      });
    });
    for (const ts of tocSecs) if (!copyParts.some((p) => p && norm(p.title) === norm(ts.title))) problems.push(`${ch.title}: ToC entry "${ts.title}" has no section on the page`);
    if (notInToc.length) tocGaps.push(`${ch.title}: ${notInToc.length} sections missing from the saved ToC (anchors derived from the heading): ${notInToc.join("; ")}`);
  }

  // Chapters on the page but not in the ToC.
  for (const t of byChapter.keys()) if (!toc.chapters.find((c) => c.title === t)) problems.push(`page chapter "${t}" missing from the ToC`);

  // Source identity from the cover headings (verbatim).
  const cover = (chapterRecords[0]?.intro_blocks ?? []).filter((b) => b.type === "h4").map((b) => b.text);
  const version = cover.find((t) => /^Version\b/.test(t));
  const author = cover.find((t) => /^Created by\b/.test(t));

  const kept = sections.filter((s) => !DROPPED[s.id]);
  const dropped = sections.filter((s) => DROPPED[s.id]).map((s) => ({ id: s.id, title: s.title, chapter: s.chapter, reason: DROPPED[s.id] }));
  for (const id of Object.keys(DROPPED)) if (!sections.find((s) => s.id === id)) problems.push(`dropped id ${id} not found`);

  const index = {
    source: {
      game: PROJECT.game,
      title: "Persona 4 Golden - 100% Guide - PlayStation Vita",
      author: author?.replace(/^Created by\s*/, "") ?? "",
      version: version?.replace(/^Version\s*/, "") ?? "",
      platform: "PlayStation Vita",
      url: SOURCE_URL,
      source_file: `raw-sources/${htmlFile}`,
      cover,
    },
    chapters: chapterRecords,
    sections_index: kept.map((s) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      category: s.chapter,
      chapter_id: s.chapter_id,
      order: s.order,
      file: `sections/${s.id}.json`,
    })),
    dropped,
  };

  const report = {
    chapters: chapterRecords.length,
    sections_found: sections.length,
    kept: kept.length,
    dropped: dropped.length,
    byType: kept.reduce((a, s) => ((a[s.type] = (a[s.type] ?? 0) + 1), a), {}),
    emptySections: kept.filter((s) => !s.blocks.length).map((s) => s.id),
    chapterIntros: chapterRecords.filter((c) => c.intro_blocks).map((c) => `${c.id}: ${c.intro_blocks.length} blocks`),
    tocGaps,
    problems,
    warnings: [...new Set(warnings)].slice(0, 30),
  };

  if (dryRun) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  mkdirSync(join(OUT_DIR, "sections"), { recursive: true });
  for (const f of readdirSync(join(OUT_DIR, "sections"))) rmSync(join(OUT_DIR, "sections", f));
  for (const s of kept) {
    const { view_match, ...file } = s;
    writeFileSync(join(OUT_DIR, "sections", `${s.id}.json`), JSON.stringify(file, null, 2) + "\n");
  }
  writeFileSync(join(OUT_DIR, PROJECT.canonicalIndexFile), JSON.stringify(index, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
}

main();
