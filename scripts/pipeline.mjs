// pipeline.mjs - Per-section pipeline actions: scaffold, validate, lint, QA, build, check.
//
// The CLI in guide.mjs parses arguments and calls these functions.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT_DIR, loadQaStatus, recordQaResult, auditSection, computeProjectStatus,
  renderCompactSummary, writeStatusMarkdown, pyJson, loadCanonicalIndex } from "./lib/status.mjs";
import { PROJECT } from "./lib/project_config.mjs";
import { getSectionPaths, getCanonicalManifest } from "./lib/sections.mjs";
import { reviewGate } from "./qa/review_gate.mjs";
import { scaffoldGuide } from "./content/scaffold.mjs";
import { iconNameFor } from "../src/lib/icon-rules.mjs";
import { italicGuide, emphasisProblems } from "./emphasis/emphasis.mjs";
import { boldGuide, compilePattern, buildDictionary } from "./emphasis/bold_terms.mjs";
import { verifyPage as verifyGuide, formatMarkdownReport } from "./qa/qa.mjs";
import { validateFile, compileSchemaFile } from "./qa/validate_guide.mjs";

const rel = (p) => relative(ROOT_DIR, p);
const short = (text, limit = 90) => {
  const s = String(text ?? "").split(/\s+/).filter(Boolean).join(" ");
  return s.length <= limit ? s : `${s.slice(0, limit - 3)}...`;
};
const schemaPath = join(ROOT_DIR, "scripts", "content", "schema.json");

/** Writes the full QA report to qa-reports/<id>.md (+ .json) and returns the markdown path. */
function saveQaReport(sectionId, report) {
  const outDir = join(ROOT_DIR, "qa-reports");
  mkdirSync(outDir, { recursive: true });
  const mdPath = join(outDir, `${sectionId}.md`);
  writeFileSync(mdPath, formatMarkdownReport(report) + "\n", "utf8");
  writeFileSync(join(outDir, `${sectionId}.json`), pyJson(report) + "\n", "utf8");
  return mdPath;
}

/** Scaffolds a structured guide JSON draft from the canonical source text. */
export function runScaffold(sec, force = false) {
  const { canonicalPath, structuredPath } = getSectionPaths(sec);
  console.log(`\n--- [1/1] Scaffolding: ${sec.id} (${sec.title}) ---`);
  if (!existsSync(canonicalPath)) {
    console.log(`[FAIL] Canonical file not found: ${canonicalPath}`);
    return false;
  }
  if (existsSync(structuredPath) && !force) {
    console.log(`[WARN] Structured file already exists: ${structuredPath}`);
    console.log("Use --force to overwrite if desired.");
    return true;
  }
  try {
    const { source, sections_index: index } = JSON.parse(readFileSync(join(ROOT_DIR, "canonical-sources", PROJECT.canonicalIndexFile), "utf8"));
    const at = index.findIndex((s) => s.id === sec.id);
    const ref = (s) => (s ? { id: s.id, title: s.title } : undefined);
    const navigation = {};
    if (index[at - 1]) navigation.prev = ref(index[at - 1]);
    if (index[at + 1]) navigation.next = ref(index[at + 1]);
    const { game, author, version, url, source_file } = source;
    const scaffolded = scaffoldGuide(canonicalPath, { source: { game, author, version, url, source_file }, navigation });
    mkdirSync(join(structuredPath, ".."), { recursive: true });
    writeFileSync(structuredPath, pyJson(scaffolded) + "\n", "utf8");
    console.log(`[PASS] Successfully scaffolded: ${rel(structuredPath)}`);
    return true;
  } catch (e) {
    console.log(`[FAIL] Scaffolding failed: ${e.message}`);
    return false;
  }
}

/** Validates structured guide JSON against the JSON Schema. */
export function runValidate(sec) {
  const { structuredPath } = getSectionPaths(sec);
  console.log(`\n--- Schema Validation: ${sec.id} ---`);
  if (!existsSync(structuredPath)) {
    console.log(`[FAIL] Structured file does not exist: ${structuredPath}`);
    return false;
  }
  if (!existsSync(schemaPath)) {
    console.log(`[FAIL] Schema not found at ${schemaPath}`);
    return false;
  }
  const errors = validateFile(structuredPath, compileSchemaFile(schemaPath));
  if (!errors.length) {
    console.log(`[PASS] Schema validation passed: ${structuredPath.split(/[\\/]/).pop()}`);
    return true;
  }
  console.log(`[FAIL] Schema validation failed with ${errors.length} error(s):`);
  for (const err of errors.slice(0, 10)) console.log(`  - ${err}`);
  if (errors.length > 10) console.log(`  ... and ${errors.length - 10} more.`);
  return false;
}

/** Emphasis pass: italic dialogue, then bold game terms. Writes the file only when something changed. */
export function runEmphasis(sec, write = true) {
  const { structuredPath } = getSectionPaths(sec);
  if (!existsSync(structuredPath)) return true;
  const data = JSON.parse(readFileSync(structuredPath, "utf8"));
  const italics = italicGuide(data.guide);
  const bolded = boldGuide(data.guide, compilePattern(buildDictionary()));
  console.log(`\n--- Emphasis: ${sec.id} --- ${italics} dialogue span(s) italicised, ${bolded.length} term(s) bolded`);
  if (write && (italics || bolded.length)) writeFileSync(structuredPath, pyJson(data) + "\n", "utf8");
  return true;
}

/** Lint: navigation ids must exist in the canonical index; dialogue italic; no walls of prose. Warnings fail the run. */
export function runLint(sec) {
  const { structuredPath } = getSectionPaths(sec);
  if (!existsSync(structuredPath)) {
    console.log(`[SKIP] ${sec.id}: not structured`);
    return true;
  }
  const guide = JSON.parse(readFileSync(structuredPath, "utf8")).guide ?? {};
  const known = new Set(loadCanonicalIndex(ROOT_DIR).sections.map((s) => s.id));
  const warns = [];
  for (const dir of ["prev", "next"]) {
    const ref = guide.navigation?.[dir];
    if (ref && !known.has(ref.id)) warns.push(`navigation.${dir}: unknown id '${ref.id}'`);
  }
  warns.push(...emphasisProblems(guide));
  console.log(`
--- Lint: ${sec.id} --- ${warns.length} warning(s)`);
  for (const w of warns) console.log(`  [WARN] ${w}`);
  // Icon coverage is advisory: unmapped titles render the fallback icon, so this never fails the run.
  const unmapped = new Set();
  if (guide.title && !iconNameFor(guide.title)) unmapped.add(guide.title);
  for (const s of guide.sections ?? []) if (s.heading && !iconNameFor(s.heading)) unmapped.add(s.heading);
  (function walk(n) {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n.steps)) {
      if (n.label && !iconNameFor(n.label)) unmapped.add(n.label);
      for (const st of n.steps) if (st.title && !iconNameFor(st.title)) unmapped.add(st.title);
    }
    Object.values(n).forEach(walk);
  })(guide.sections ?? []);
  for (const t of unmapped) console.log(`  [NOTE] no icon rule for '${t}' (fallback icon used): add one to src/lib/icon-rules.mjs`);
  return warns.length === 0;
}

/** Runs QA verification and records the result in qa-status.json. */
export function runQa(sec) {
  const { canonicalPath, structuredPath } = getSectionPaths(sec);
  console.log(`\n--- QA Verification: ${sec.id} ---`);
  if (!existsSync(canonicalPath)) {
    console.log(`[FAIL] Canonical file does not exist: ${canonicalPath}`);
    return false;
  }
  if (!existsSync(structuredPath)) {
    console.log(`[FAIL] Structured file does not exist: ${structuredPath}`);
    return false;
  }
  const canonical = JSON.parse(readFileSync(canonicalPath, "utf8"));
  const structured = JSON.parse(readFileSync(structuredPath, "utf8"));
  const report = verifyGuide(canonical, structured);
  const qa = report.qa;
  const status = qa.status ?? "FAIL";
  const summary = qa.summary ?? {};

  console.log(`QA Status: [${status}]`);
  console.log(`  Critical: ${summary.critical ?? 0} | High: ${summary.high ?? 0} | ` +
    `Medium: ${summary.medium ?? 0} | Low: ${summary.low ?? 0}`);
  for (const f of qa.findings ?? []) {
    console.log(`  ${f.id} [${String(f.severity ?? "").toUpperCase()}] ${f.location}`);
    console.log(`      ${f.category}: ${f.description}`);
    console.log(`      source: ${short(f.source?.text)} | generated: ${short(f.generated?.text)}`);
  }

  const reportPath = saveQaReport(sec.id, report);
  console.log(`  Full report: ${rel(reportPath)}`);
  recordQaResult(ROOT_DIR, sec.id, structuredPath, status, summary);
  return status.startsWith("PASS");
}

/** Runs the Astro build so rendering/type errors surface per section. */
export function runBuild() {
  console.log("\n--- Frontend Build ---");
  const isWin = process.platform === "win32";
  const result = spawnSync(isWin ? "cmd" : "npm", isWin ? ["/c", "npm", "run", "build"] : ["run", "build"],
    { cwd: ROOT_DIR, encoding: "utf8" });
  if (result.status !== 0) {
    console.log("[FAIL] npm run build failed:");
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().split(/\r?\n/);
    console.log(output.slice(-25).join("\n"));
    return false;
  }
  console.log("[PASS] npm run build succeeded.");
  return true;
}

export function updateProjectStatus() {
  console.log("\n--- Updating Project Status ---");
  const data = computeProjectStatus(ROOT_DIR);
  writeStatusMarkdown(ROOT_DIR, data);
  console.log(renderCompactSummary(data));
}

/** Prints one section's status line set. */
export function printSectionStatus(sec) {
  const { canonicalPath, structuredPath } = getSectionPaths(sec);
  console.log(`\nSection Status: ${sec.id} - ${sec.title}`);
  console.log(`  Code:       ${sec.code}`);
  console.log(`  Category:   ${sec.category}`);
  console.log(`  Canonical:  ${existsSync(canonicalPath) ? "EXISTS" : "MISSING"} (${canonicalPath.split(/[\\/]/).pop()})`);
  console.log(`  Structured: ${existsSync(structuredPath) ? "EXISTS" : "MISSING"} (${structuredPath.split(/[\\/]/).pop()})`);
  const qa = auditSection(ROOT_DIR, sec, loadQaStatus(ROOT_DIR)).qa_status;
  console.log(`  QA:         ${qa === "NONE" ? "PENDING (none or stale)" : qa}`);
}

/** Runs QA on every structured section with no current QA result. */
export function resolveBacklog() {
  console.log("\n=== Resolving QA Backlog ===");
  const { sections } = getCanonicalManifest();
  let verified = 0;
  for (const sec of sections) {
    const audited = auditSection(ROOT_DIR, sec, loadQaStatus(ROOT_DIR));
    if (audited.structured && audited.qa_status === "NONE") {
      console.log(`\nProcessing backlog for section: ${sec.id} (${sec.title})`);
      if (!runValidate(sec)) console.log(`[WARN] Validation issues in ${sec.id}, proceeding to QA...`);
      if (runQa(sec)) {
        console.log(`[PASS] Successfully verified ${sec.id}.`);
        verified++;
      } else {
        console.log(`[WARN] QA reported issues for ${sec.id}.`);
      }
    }
  }
  if (verified > 0) {
    updateProjectStatus();
    console.log(`\nResolved backlog for ${verified} section(s).`);
  } else {
    console.log("No pending QA backlog items found.");
  }
  return verified;
}

/** Single per-section gate: emphasis -> validate -> lint -> script QA -> meaning review -> status. */
export function runCheck(sec) {
  let ok;
  runEmphasis(sec);
  if (!runValidate(sec)) {
    console.log("[SKIP] lint and QA skipped: fix schema validation first.");
    ok = false;
  } else {
    ok = runLint(sec) && runQa(sec);
    if (ok) reviewGate(sec);
  }
  updateProjectStatus(); // always: STATUS.md must reflect a failing QA too
  return ok;
}
