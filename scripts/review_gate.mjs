// review_gate.mjs - Meaning-review gate and verdict recording.
//
// Script QA proves the words and their order. This gate finds restructures that could shift meaning
// (see p4g/review.mjs), prints a compact packet when there are any, and stores the reviewer's verdict.
// The verdict is tied to the structured file and to the flag set, so any later edit makes it stale.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { ROOT_DIR, pyJson } from "./status.mjs";
import { getSectionPaths, sectionType, isReferenceType } from "./sections.mjs";
import { reviewFlags, formatPacket } from "./p4g/review.mjs";
import { validateInstance, compileSchemaFile } from "./validate_guide.mjs";

const verdictSchemaPath = join(ROOT_DIR, ".claude", "skills", "qa", "schemas", "qa-verdict.schema.json");
const sha = (data) => createHash("sha256").update(data).digest("hex");
const reviewPath = (sec) => join(ROOT_DIR, "qa-reports", `${sec.id}.review.json`);

/** Structured path and review flags for a section (null when a file is missing). */
function loadReview(sec) {
  const { canonicalPath, structuredPath } = getSectionPaths(sec);
  if (!existsSync(canonicalPath) || !existsSync(structuredPath)) return null;
  const canonical = JSON.parse(readFileSync(canonicalPath, "utf8"));
  const structured = JSON.parse(readFileSync(structuredPath, "utf8"));
  return { structuredPath, flags: reviewFlags(canonical, structured) };
}

/** No flags: nothing to review. Flags with a current verdict: done. Otherwise prints the packet. */
export function reviewGate(sec) {
  if (isReferenceType(sectionType(sec))) return; // verbatim text: the word check is the whole review
  const loaded = loadReview(sec);
  if (!loaded) return;
  const { structuredPath, flags } = loaded;
  console.log(`\n--- Meaning review: ${sec.id} ---`);
  if (!flags.length) {
    console.log("[PASS] No risky restructure (no condition split, callout, table or grouping change): script QA is sufficient.");
    return;
  }
  let recorded = null;
  try { recorded = JSON.parse(readFileSync(reviewPath(sec), "utf8")); } catch { /* no verdict yet */ }
  if (recorded?.structured_sha256 === sha(readFileSync(structuredPath)) && recorded?.packet_sha256 === sha(JSON.stringify(flags))) {
    console.log(`[PASS] Review verdict is current: ${recorded.verdict} (${flags.length} flag(s)).`);
    return;
  }
  console.log(recorded ? "[WARN] Review verdict is stale (page or flags changed); review the packet again.\n" : "[REVIEW] Review required.\n");
  console.log(formatPacket(sec, flags));
  console.log(`Record the outcome: node scripts/guide.mjs verdict ${sec.id} pass   (or a verdict JSON file for findings)`);
}

/** Records the verdict: "pass", or a JSON file / stdin ("-") matching qa-verdict.schema.json. */
export function runVerdict(sec, verdictArg, readStdin) {
  console.log(`\n--- Review Verdict: ${sec.id} ---`);
  const loaded = loadReview(sec);
  if (!loaded) {
    console.log("[FAIL] Canonical or structured file is missing.");
    return false;
  }
  let verdict;
  if (/^pass$/i.test(verdictArg)) {
    verdict = { section_id: sec.id, verdict: "PASS", spot_checked: loaded.flags.map((f, i) => `#${i + 1} ${f.kind}`), findings: [] };
  } else {
    try {
      const raw = verdictArg === "-" ? readStdin() : readFileSync(verdictArg, "utf8");
      verdict = JSON.parse(raw.replace(/^﻿/, ""));
    } catch (err) {
      console.log(`[FAIL] Cannot read verdict JSON '${verdictArg}': ${err.message}`);
      return false;
    }
  }
  const errors = validateInstance(verdict, compileSchemaFile(verdictSchemaPath));
  if (errors.length) {
    console.log(`[FAIL] Verdict does not match qa-verdict.schema.json (${errors.length} error(s)):`);
    for (const e of errors.slice(0, 10)) console.log(`  - ${e.path.join("/") || "<root>"}: ${e.message}`);
    return false;
  }
  if (verdict.section_id !== sec.id) {
    console.log(`[FAIL] Verdict is for '${verdict.section_id}', not '${sec.id}'`);
    return false;
  }
  mkdirSync(join(ROOT_DIR, "qa-reports"), { recursive: true });
  verdict.structured_sha256 = sha(readFileSync(loaded.structuredPath));
  verdict.packet_sha256 = sha(JSON.stringify(loaded.flags));
  writeFileSync(reviewPath(sec), pyJson(verdict) + "\n", "utf8");
  const findings = verdict.findings ?? [];
  console.log(`Verdict: [${verdict.verdict}] with ${findings.length} finding(s)`);
  for (const f of findings) console.log(`  [${String(f.severity).toUpperCase()}] ${f.category} @ ${f.location}: ${f.issue}`);
  console.log(`  Stored: qa-reports/${sec.id}.review.json`);
  return verdict.verdict !== "FAIL";
}
