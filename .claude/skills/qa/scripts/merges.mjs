// merges.mjs - Canonical sections folded into another page.
//
// The decision lives in structured-content/merges.json (committed, reviewed by a person), not in
// the generated qa-status.json. Status, QA and lint all read it from here.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const MERGES_FILE = join("structured-content", "merges.json");

/** Returns { [mergedId]: { into, reason } }. A missing file means nothing is merged. */
export function loadMerges(root) {
  const path = join(root, MERGES_FILE);
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, "utf8")).merges ?? {};
}

/** Problems in a structured guide's prev/next links: links to merged-away ids and to unknown ids. */
export function navigationProblems(nav = {}, knownIds, merges) {
  const problems = [];
  for (const dir of ["prev", "next"]) {
    const id = nav[dir]?.id;
    if (!id) continue;
    if (merges[id]) {
      problems.push(`${dir} links to ${id}, which is merged into ${merges[id].into}; link to ${merges[id].into}`);
    } else if (!knownIds.has(id)) {
      problems.push(`${dir} links to ${id}, which is not in the canonical index`);
    }
  }
  return problems;
}
