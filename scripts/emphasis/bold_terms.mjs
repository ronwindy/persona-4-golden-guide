// bold_terms.mjs - Bold important game terms (**term**) in the prose of structured sections.
//
// Dictionary = names mined from the canonical catalogs (see mineTerms) + hand-listed names in scripts/emphasis/term_extras.json
// (characters, locations, deny list). Only prose strings are touched (not table cells, headings or labels).

import { readFileSync, existsSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT_DIR } from "../lib/status.mjs";
import { PROJECT } from "../lib/project_config.mjs";
import { pyJson } from "../lib/status.mjs";
import { eachString } from "./emphasis.mjs";

const EXTRAS = join(ROOT_DIR, PROJECT.termExtrasFile);
const SECTIONS_DIR = join(ROOT_DIR, "canonical-sources", "sections");

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** First-column headers of the canonical tables that list named things (items, skills, personas, enemies). */
const NAME_HEADERS = new Set(["Accessory", "Armor", "Weapon", "Item", "Seed", "Bug", "Fish", "Gem", "Material", "Book",
  "Costume", "Skill", "Persona", "Enemy", "Boss"]);
const usable = (n) => n.length >= 3 && !/^[\d\s,.%+-]+$/.test(n) && !/^N\/A$/i.test(n) && !n.includes("\n");

/**
 * Mines term categories from the canonical sections: first-column names of catalog/arcana/dungeon tables,
 * page titles of arcana, social links and dungeons. Returns Map(category -> Set(name)).
 */
let mined = null;
export function mineTerms() {
  if (mined) return mined;
  const cats = (mined = new Map());
  const add = (cat, name) => {
    const n = String(name ?? "").trim();
    if (!usable(n)) return;
    if (!cats.has(cat)) cats.set(cat, new Set());
    cats.get(cat).add(n);
  };
  if (!existsSync(SECTIONS_DIR)) return cats;
  for (const f of readdirSync(SECTIONS_DIR).filter((x) => x.endsWith(".json"))) {
    const c = JSON.parse(readFileSync(join(SECTIONS_DIR, f), "utf8"));
    if (c.type === "dungeon") add("dungeons", c.title);
    if (c.type === "arcana") add("arcana", c.title);
    if (c.type === "social-link") {
      const [who, arcana] = c.title.split("/");
      add("social-links", who);
      add("arcana", arcana);
    }
    if (!["catalog", "arcana", "dungeon"].includes(c.type)) continue;
    for (const b of c.blocks) {
      if (b.type !== "table" || !NAME_HEADERS.has(b.rows[0]?.[0]?.text?.trim())) continue;
      const header = b.rows[0][0].text.trim();
      for (const row of b.rows.slice(1)) add(header.toLowerCase(), row[0]?.text);
    }
  }
  return cats;
}

/** Arcana names are English words (Strength, Death, Sun...): skipped at sentence start like the "ambiguous" list. */
export function arcanaNames() {
  return mineTerms().get("arcana") ?? new Set();
}

let extras = null;
export function loadExtras() {
  return (extras ??= existsSync(EXTRAS) ? JSON.parse(readFileSync(EXTRAS, "utf8")) : {});
}

export function buildDictionary() {
  const cats = mineTerms();
  const extras = loadExtras();
  const terms = new Set();
  for (const names of cats.values()) for (const n of names) terms.add(n);
  for (const [key, names] of Object.entries(extras)) {
    if (!["deny", "_doc", "numbered", "ambiguous", "italic_deny"].includes(key)) for (const n of names) terms.add(n);
  }
  for (const n of extras.deny ?? []) terms.delete(n);
  return [...terms].sort((a, b) => b.length - a.length || (a < b ? -1 : a > b ? 1 : 0));
}

export function ambiguousTerms() {
  return new Set([...(loadExtras().ambiguous ?? []), ...arcanaNames()]);
}

// --- applying -------------------------------------------------------------------------

function atSentenceStart(before) {
  const tail = before.replace(/ +$/, "");
  return tail === "" ||
    ["\n", ".", "!", "?", ":", '"', "•"].some((c) => tail.endsWith(c)) ||
    /(?:^|\n)\s*-$/.test(tail);
}

export function compilePattern(terms) {
  if (!terms.length) return /(?!)/g; // empty dictionary: match nothing (an empty alternation matches everywhere)
  const numbered = new Set(loadExtras().numbered ?? []);
  const alts = terms.map((t) => escapeRe(t) + (numbered.has(t) ? "(?: No\\. \\d+)?" : "")).join("|");
  // case-sensitive; optional plural; not inside a word
  return new RegExp(`(?<![\\w*])(${alts})(es|s)?(?![\\w*])`, "g");
}

/** Python's pattern.fullmatch(): the whole string must match. */
function fullmatch(pat, s) {
  const m = new RegExp(`^(?:${pat.source})$`, pat.flags.replace("g", "")).exec(s);
  return m !== null;
}

/** '**London** Rats' -> '**London Rats**' when the joined words are one known term. */
function mergeSpans(text, pat) {
  return text.replace(/\*\*([^*]+)\*\*((?: [\w-]+){1,3})/g, (whole, g1, g2) => {
    const words = /^((?: [\w-]+){1,3})/.exec(g2);
    if (words) {
      const parts = words[1].split(" ");
      for (let n = parts.length - 1; n > 0; n--) {
        const tail = parts.slice(0, n + 1).join(" ");
        // keep the words after the term: the Python original dropped them ("**London** Rats are" -> "**London Rats**")
        if (fullmatch(pat, g1 + tail)) return `**${g1}${tail}**${g2.slice(tail.length)}`;
      }
    }
    return whole;
  });
}

/** Bold unmarked occurrences; leave existing **...** spans and `code` spans alone. */
export function boldText(text, pat, ambiguous = ambiguousTerms()) {
  text = mergeSpans(text, pat);
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]*`)/); // capture group: odd indices are protected spans
  let done = "";
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      const part = parts[i];
      const prefix = done;
      parts[i] = part.replace(pat, (match, term, suffix, offset) => {
        if (ambiguous.has(term) && atSentenceStart(prefix + part.slice(0, offset))) return match;
        return `**${term}${suffix ?? ""}**`;
      });
    }
    done += parts[i];
  }
  return parts.join("");
}

/** Bold unmarked occurrences in every prose string of a page; returns the newly bolded terms. */
export function boldGuide(guide, pat, found = []) {
  eachString(guide, (t, kind, _p, set) => {
    if (kind !== "prose") return;
    const n = boldText(t, pat);
    if (n === t) return;
    const spans = (s) => [...s.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1]);
    const before = new Set(spans(t));
    for (const term of spans(n)) if (!before.has(term)) found.push(term);
    set(n);
  });
  return found;
}

/** Bolds terms in one structured file; returns the newly bolded terms (writes only when found). */
export function boldFile(path, pat = compilePattern(buildDictionary()), write = true) {
  const data = JSON.parse(readFileSync(path, "utf8"));
  const found = boldGuide(data.guide, pat);
  if (write && found.length) writeFileSync(path, pyJson(data) + "\n", "utf8");
  return found;
}
