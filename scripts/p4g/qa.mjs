// qa.mjs - Script QA for P4G pages: ordered word-for-word fidelity of the structured page against canonical.
//
// Every word of the canonical page (paragraphs, quotes, table cells, lists) must appear in the structured
// page in the same order, and nothing may be added. Markdown marks, "-Label-" dashes and punctuation are
// ignored; headings are compared as words too. Every divergence is listed (aligned word diff), not just the first.

export const words = (s) =>
  String(s ?? "").toLowerCase().replace(/\]\(guide:[a-z0-9-]+\)/g, "").replace(/\*\*/g, "").replace(/[^a-z0-9+?]+/g, " ").split(" ").filter(Boolean);

function canonicalWords(blocks, out = []) {
  for (const b of blocks) {
    if (b.type === "table") for (const r of b.rows) for (const c of r) out.push(...words(c.text));
    else if (b.type === "quote") canonicalWords(b.blocks, out);
    else if (b.type === "list") for (const i of b.items ?? []) out.push(...words(typeof i === "string" ? i : i.text));
    else out.push(...words(b.text));
  }
  return out;
}

/** List items are strings or { text, children } (sub-points); nesting only regroups, so words stay in reading order. */
function listWords(l, out) {
  for (const i of l.items) {
    if (typeof i === "string") out.push(...words(i));
    else { out.push(...words(i.text)); listWords(i.children, out); }
  }
}

function structuredWords(guide) {
  const out = [];
  const blk = (b) => {
    switch (b.type) {
      case "p": out.push(...words(b.text)); break;
      case "list": listWords(b, out); break;
      case "callout": b.blocks.forEach(blk); break;
      case "table": for (const r of [b.headers ?? [], ...b.rows]) for (const c of r) out.push(...words(c)); break;
      case "info": for (const i of b.items) out.push(...words(`${i.label}: ${i.value}`)); break;
      case "ranks":
        for (const r of b.ranks) {
          out.push(...words(r.title));
          for (const s of r.scenes) {
            if (s.prompt) out.push(...words(s.prompt));
            for (const o of s.options) out.push(...words(`${o.label}: ${o.text}`));
          }
        }
        break;
      case "slots":
        for (const sl of b.slots) {
          if (sl.label) out.push(...words(sl.label));
          for (const st of sl.steps) {
            if (st.title) out.push(...words(st.title));
            st.blocks.forEach(blk);
          }
        }
        break;
      default: out.push("<<unknown-block>>");
    }
  };
  for (const s of guide.sections) {
    if (s.heading) out.push(...words(s.heading));
    s.blocks.forEach(blk);
  }
  return out;
}

/**
 * Aligned word diff (LCS). Returns hunks { a0, a1, b0, b1 }: a[a0..a1) is missing from b, b[b0..b1) is extra.
 * Common prefix/suffix are trimmed first; an oversized middle degrades to one hunk at the first divergence.
 */
export function diffWords(a, b) {
  let lo = 0;
  while (lo < a.length && lo < b.length && a[lo] === b[lo]) lo++;
  let ea = a.length, eb = b.length;
  while (ea > lo && eb > lo && a[ea - 1] === b[eb - 1]) { ea--; eb--; }
  const n = ea - lo, m = eb - lo;
  if (n === 0 && m === 0) return [];
  if (n * m > 40e6) return [{ a0: lo, a1: lo + 1, b0: lo, b1: lo + 1 }];
  const W = m + 1;
  const dp = new (Math.min(n, m) < 65535 ? Uint16Array : Uint32Array)((n + 1) * W);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * W + j] = a[lo + i] === b[lo + j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
    }
  }
  const hunks = [];
  let i = 0, j = 0, cur = null;
  const flush = () => { if (cur) { hunks.push(cur); cur = null; } };
  while (i < n || j < m) {
    if (i < n && j < m && a[lo + i] === b[lo + j]) { flush(); i++; j++; continue; }
    cur ??= { a0: lo + i, a1: lo + i, b0: lo + j, b1: lo + j };
    if (j >= m || (i < n && dp[(i + 1) * W + j] >= dp[i * W + j + 1])) { i++; cur.a1 = lo + i; }
    else { j++; cur.b1 = lo + j; }
  }
  flush();
  return hunks;
}

export function verifyPage(canonical, structured) {
  const src = canonicalWords(canonical.blocks);
  const gen = structuredWords(structured.guide);
  const findings = [];
  const MAX_LISTED = 25;
  const hunks = diffWords(src, gen);
  const ctx = (a, i) => a.slice(Math.max(0, i - 4), i + 6).join(" ");
  for (const h of hunks.slice(0, MAX_LISTED)) {
    const gone = src.slice(h.a0, h.a1).join(" ");
    const added = gen.slice(h.b0, h.b1).join(" ");
    const what = [gone && `missing from structured: "${gone}"`, added && `added in structured: "${added}"`].filter(Boolean).join("; ");
    findings.push({ severity: "high", category: "fidelity", location: `canonical word ${h.a0}`,
      source: { text: ctx(src, h.a0) }, generated: { text: ctx(gen, h.b0) }, description: what });
  }
  if (hunks.length > MAX_LISTED) {
    findings.push({ severity: "high", category: "fidelity", location: "further", source: { text: "" }, generated: { text: "" },
      description: `${hunks.length - MAX_LISTED} more divergence(s) not listed; fix these and re-run` });
  }
  const g = structured.guide;
  if (g.id !== canonical.id) findings.push({ severity: "critical", category: "identity", location: "id", source: { text: canonical.id }, generated: { text: g.id }, description: "id differs" });
  if (g.title !== canonical.title) findings.push({ severity: "high", category: "identity", location: "title", source: { text: canonical.title }, generated: { text: g.title }, description: "title differs" });
  if (g.type !== canonical.type) findings.push({ severity: "high", category: "identity", location: "type", source: { text: canonical.type }, generated: { text: g.type }, description: "type differs" });
  findings.forEach((f, k) => { f.id = `QA-${String(k + 1).padStart(3, "0")}`; f.recommended_owner = "Guide Transformer"; });
  const summary = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) summary[f.severity]++;
  return { qa: { section_id: canonical.id, section_title: canonical.title, status: findings.length ? "FAIL" : "PASS", summary, findings }, words: { source: src.length, generated: gen.length } };
}

/** Formats a QA verification result as GitHub-flavored Markdown. */
export function formatMarkdownReport(report) {
  const qa = report.qa;
  const statusIcon = qa.status === "PASS" ? "[PASS]" : (qa.status === "PASS WITH WARNINGS" ? "[PASS WITH WARNINGS]" : "[FAIL]");
  const lines = [
    `# QA Verification Report: ${qa.section_id ?? "Unknown"} - ${qa.section_title ?? ""}`,
    `\n**Status:** ${statusIcon}\n`,
    "## Summary",
    `- **Critical:** ${qa.summary.critical}`,
    `- **High:** ${qa.summary.high}`,
    `- **Medium:** ${qa.summary.medium}`,
    `- **Low:** ${qa.summary.low}\n`,
  ];

  if (qa.findings.length) {
    lines.push("## Findings\n");
    lines.push("| ID | Severity | Category | Location | Description | Owner |");
    lines.push("|:---|:---|:---|:---|:---|:---|");
    for (const f of qa.findings) {
      lines.push(`| ${f.id} | **${f.severity.toUpperCase()}** | ${f.category} | \`${f.location}\` | ${f.description} | ${f.recommended_owner} |`);
    }
    lines.push("\n### Detailed Discrepancies\n");
    for (const f of qa.findings) {
      lines.push(`#### ${f.id} [${f.severity.toUpperCase()}] - ${f.category}`);
      lines.push(`- **Location:** \`${f.location}\``);
      lines.push(`- **Source:** \`${f.source.text}\``);
      lines.push(`- **Generated:** \`${f.generated.text}\``);
      lines.push(`- **Description:** ${f.description}`);
      lines.push(`- **Recommended Owner:** \`${f.recommended_owner}\`\n`);
    }
  } else {
    lines.push("**No discrepancies found! 100% source fidelity verified.**");
  }
  return lines.join("\n");
}
