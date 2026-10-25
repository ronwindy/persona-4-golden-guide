// review.mjs - Meaning-review triggers for P4G pages.
//
// Script QA (qa.mjs) proves every canonical word survives in order. What it cannot see is a restructure that
// keeps the words but shifts the meaning. This module finds the places where that can happen and builds a compact
// packet for a reviewer. A page with no flags needs no review.
//
// Flags:
//   condition-split   a canonical sentence with a condition word (if/unless/only/before/after/must/not/...) is no
//                     longer inside one structured text unit
//   callout           a warning/discrepancy callout, or a note callout that is not exactly a canonical quote,
//                     or a canonical quote that is not a callout
//   table             a canonical table or a structured table whose rows differ from the other side
//   grouping          a slot label, step title, rank title or info line that is not a standalone canonical line
//                     (grouping is anchored to the source's own labels; anything else is the transformer's guess)

import { words } from "./qa.mjs";

const CONDITION = /\b(?:if|unless|only|before|after|must|never|until|not|cannot|can't|won't|don't|doesn't|without)\b/i;
const SENTENCE_BREAK = /\n+|(?<=[.!?])\s+(?=[A-Z0-9"'*(])/;
const plain = (s) => words(s).join(" ");
const clip = (s, n = 160) => (s.length <= n ? s : `${s.slice(0, n - 3)}...`);

/** Every text unit of the structured page: one string per paragraph, list item, cell, title, option. */
function structuredUnits(guide) {
  const units = [];
  const list = (l) => {
    for (const i of l.items) {
      if (typeof i === "string") units.push(i);
      else { units.push(i.text); list(i.children); }
    }
  };
  const blk = (b) => {
    switch (b.type) {
      case "p": units.push(b.text); break;
      case "list": list(b); break;
      case "callout": b.blocks.forEach(blk); break;
      case "table": for (const r of [b.headers ?? [], ...b.rows]) r.forEach((c) => units.push(c)); break;
      case "info": for (const i of b.items) units.push(i.label, i.value, `${i.label}: ${i.value}`); break;
      case "ranks":
        for (const r of b.ranks) {
          units.push(r.title);
          for (const s of r.scenes) {
            if (s.prompt) units.push(s.prompt);
            for (const o of s.options) units.push(o.text, `${o.label}: ${o.text}`);
          }
        }
        break;
      case "slots":
        for (const sl of b.slots) {
          if (sl.label) units.push(sl.label);
          for (const st of sl.steps) { if (st.title) units.push(st.title); st.blocks.forEach(blk); }
        }
        break;
      default: break;
    }
  };
  for (const s of guide.sections) { if (s.heading) units.push(s.heading); s.blocks.forEach(blk); }
  return units;
}

/** Canonical sentences (paragraphs, list items, quote paragraphs) as plain text. */
function canonicalSentences(blocks, out = []) {
  for (const b of blocks) {
    if (b.type === "quote") canonicalSentences(b.blocks, out);
    else if (b.type === "list") for (const i of b.items ?? []) out.push(...String(typeof i === "string" ? i : i.text).split(SENTENCE_BREAK));
    else if (b.type === "p") out.push(...String(b.text ?? "").split(SENTENCE_BREAK));
  }
  return out;
}

function collect(node, pred, out = []) {
  if (Array.isArray(node)) node.forEach((n) => collect(n, pred, out));
  else if (node && typeof node === "object") {
    if (pred(node)) out.push(node);
    Object.values(node).forEach((n) => collect(n, pred, out));
  }
  return out;
}

const calloutText = (c) => {
  const parts = [];
  const list = (l) => l.items.forEach((i) => { if (typeof i === "string") parts.push(i); else { parts.push(i.text); list(i.children); } });
  c.blocks.forEach((b) => (b.type === "p" ? parts.push(b.text) : list(b)));
  return parts.join(" ");
};
const quoteText = (q) => q.blocks.map((b) => b.text).join(" ");
const tableKey = (rows) => rows.map((r) => r.map(plain).join("|")).join("\n");

/** Canonical lines (paragraph lines, list items, cells, quote paragraphs) as plain text. */
function canonicalLines(blocks, out = []) {
  for (const b of blocks) {
    if (b.type === "quote") canonicalLines(b.blocks, out);
    else if (b.type === "table") for (const r of b.rows) for (const c of r) out.push(...String(c.text).split(/\n/).map(plain));
    else if (b.type === "list") for (const i of b.items ?? []) out.push(...String(typeof i === "string" ? i : i.text).split(/\n/).map(plain));
    else out.push(...String(b.text ?? "").split(/\n/).map(plain));
  }
  return out;
}

/** Labels of slots/ranks/info that the source does not carry as a line of its own: the grouping is a guess. */
function unanchoredGrouping(guide, lines) {
  const exact = new Set(lines), has = (t) => exact.has(plain(t)) || lines.some((l) => l.includes(plain(t)));
  const bad = [];
  const need = (where, text, strict = true) => {
    if (text && !(strict ? exact.has(plain(text)) : has(text))) bad.push(`${where}: ${clip(text, 100)}`);
  };
  for (const s of guide.sections) {
    const at = s.heading ?? s.id;
    for (const b of s.blocks) {
      if (b.type === "slots") for (const sl of b.slots) { need(`[${at}] slot label`, sl.label); for (const st of sl.steps) need(`[${at}] step title`, st.title); }
      else if (b.type === "ranks") {
        for (const r of b.ranks) {
          need(`[${at}] rank title`, r.title);
          for (const sc of r.scenes) { need(`[${at}] ${r.title} prompt`, sc.prompt, false); for (const o of sc.options) need(`[${at}] ${r.title} option`, o.text, false); }
        }
      } else if (b.type === "info") for (const i of b.items) need(`[${at}] info`, `${i.label}: ${i.value}`);
    }
  }
  return bad;
}

export function reviewFlags(canonical, structured) {
  const guide = structured.guide;
  const flags = [];

  // 1. Condition words: the sentence must still live inside one unit.
  const units = structuredUnits(guide).map((u) => ` ${plain(u)} `);
  for (const sent of canonicalSentences(canonical.blocks)) {
    const w = words(sent);
    if (w.length < 3 || !CONDITION.test(sent)) continue;
    const needle = ` ${w.join(" ")} `;
    if (units.some((u) => u.includes(needle))) continue;
    const head = ` ${w.slice(0, 3).join(" ")}`, tail = `${w.slice(-3).join(" ")} `;
    const near = units.filter((u) => u.includes(head) || u.includes(tail)).slice(0, 3).map((u) => clip(u.trim()));
    flags.push({ kind: "condition-split", canonical: clip(sent.trim(), 300), structured: near.length ? near : ["(start and end are in no unit)"] });
  }

  // 2. Callouts.
  const boxes = collect(canonical.blocks, (n) => n.type === "quote" || (n.type === "table" && n.rows.length === 1 && n.rows[0].length === 1));
  const boxText = (n) => (n.type === "quote" ? quoteText(n) : n.rows[0][0].text);
  const quotes = boxes.map((q) => plain(boxText(q)));
  const callouts = collect(guide.sections, (n) => n.type === "callout");
  const calloutKeys = callouts.map((c) => plain(calloutText(c)));
  callouts.forEach((c, i) => {
    if (c.kind !== "note") flags.push({ kind: "callout", canonical: "(severity chosen by the transformer)", structured: [`${c.kind}: ${clip(calloutText(c), 240)}`] });
    else if (!quotes.includes(calloutKeys[i])) flags.push({ kind: "callout", canonical: "(no canonical quote with these words)", structured: [`note: ${clip(calloutText(c), 240)}`] });
  });
  boxes.forEach((q, i) => {
    if (!calloutKeys.includes(quotes[i])) flags.push({ kind: "callout", canonical: `quote: ${clip(boxText(q), 240)}`, structured: ["(not rendered as a callout with the same words)"] });
  });

  // 3. Tables.
  const cTables = collect(canonical.blocks, (n) => n.type === "table" && !(n.rows.length === 1 && n.rows[0].length === 1)).map((t) => t.rows.map((r) => r.map((c) => c.text)));
  const sTables = collect(guide.sections, (n) => n.type === "table").map((t) => [...(t.headers ? [t.headers] : []), ...t.rows]);
  const cKeys = cTables.map(tableKey), sKeys = sTables.map(tableKey);
  cTables.forEach((t, i) => {
    if (!sKeys.includes(cKeys[i])) flags.push({ kind: "table", canonical: clip(t.slice(0, 3).map((r) => r.join(" | ")).join(" // ")), structured: ["(no structured table with the same rows)"] });
  });
  sTables.forEach((t, i) => {
    if (!cKeys.includes(sKeys[i])) flags.push({ kind: "table", canonical: "(no canonical table with the same rows)", structured: [clip(t.slice(0, 3).map((r) => r.join(" | ")).join(" // "))] });
  });

  // 4. Regrouped blocks must hang on labels the source itself carries.
  const bad = unanchoredGrouping(guide, canonicalLines(canonical.blocks));
  if (bad.length) flags.push({ kind: "grouping", canonical: "(no standalone canonical line for these)", structured: bad.slice(0, 25) });

  return flags;
}

/** Text packet for the reviewer: only the flagged places, each with canonical and structured side by side. */
export function formatPacket(sec, flags) {
  const out = [`Review packet: ${sec.id} (${sec.title}) - ${flags.length} flag(s). Words and order are already verified by script QA; judge meaning only.`,
    "Question per flag: did the restructure keep every condition attached to its action, every warning at its severity, every group intact?", ""];
  flags.forEach((f, i) => {
    out.push(`#${i + 1} [${f.kind}]`);
    out.push(`  canonical:  ${f.canonical}`);
    for (const s of f.structured) out.push(`  structured: ${s}`);
    out.push("");
  });
  return out.join("\n");
}
