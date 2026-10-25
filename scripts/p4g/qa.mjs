// qa.mjs - Script QA for P4G pages: ordered word-for-word fidelity of the structured page against canonical.
//
// Every word of the canonical page (paragraphs, quotes, table cells, lists) must appear in the structured
// page in the same order, and nothing may be added. Markdown marks, "-Label-" dashes and punctuation are
// ignored; headings are compared as words too.

const words = (s) =>
  String(s ?? "").toLowerCase().replace(/\*\*/g, "").replace(/[^a-z0-9+?]+/g, " ").split(" ").filter(Boolean);

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
      default: out.push("<<unknown-block>>");
    }
  };
  for (const s of guide.sections) {
    if (s.heading) out.push(...words(s.heading));
    s.blocks.forEach(blk);
  }
  return out;
}

export function verifyPage(canonical, structured) {
  const src = canonicalWords(canonical.blocks);
  const gen = structuredWords(structured.guide);
  const findings = [];
  const n = Math.max(src.length, gen.length);
  for (let i = 0; i < n; i++) {
    if (src[i] === gen[i]) continue;
    const ctx = (a) => a.slice(Math.max(0, i - 4), i + 6).join(" ");
    findings.push({ severity: "high", category: "fidelity", location: `word ${i}`, source: { text: ctx(src) }, generated: { text: ctx(gen) },
      description: "First divergence between canonical and structured word order" });
    break; // later words would all shift
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
