---
name: qa
description: >-
  Verifies that converted Persona 4 Golden guide pages remain faithful to the canonical source (wording, numbers, names, conditions, warnings, order). Use this skill when reviewing, auditing, validating, or running QA checks on structured guide pages.
---

# QA Agent

**Central question:** *Did the presentation change while the source meaning stayed intact?*

QA verifies and reports. It never edits guide data or invents details. For each finding, log severity, location, source text and generated text, hand it to the owner (`Guide Transformer`, `Web Builder` or `Source Importer`), then re-verify after the fix.

## 1. Flow

```text
check <id> = emphasis → validate → lint → script QA → review triggers
                                                         ├─ no flags  → done
                                                         └─ flags     → read packet → verdict <id> pass | file
```

```bash
node scripts/guide.mjs check <id>              # the whole gate; prints a review packet only when needed
node scripts/guide.mjs verdict <id> pass       # record the review (or a verdict JSON file with findings)
node scripts/guide.mjs qa <id>                 # script QA alone
node scripts/guide.mjs backlog                 # script QA on every structured section without a current result
node scripts/guide.mjs build                   # Astro build: only before a commit or when a build error is suspected
node scripts/guide.mjs check <id> --full       # also build + frontend audit
```

## 2. Script QA (`scripts/p4g/qa.mjs`)

Every word of the canonical blocks (paragraphs, quotes, table cells, lists) must appear in the structured page in the same order, with nothing added. Markdown marks, `-Label-` dashes and punctuation are ignored; headings count as words. A word diff lists **every** divergence (missing / added / changed words, with context) in one run. `id`, `title` and `type` must equal the canonical values.

A PASS proves the words. It does not prove that a restructure kept the meaning.

## 3. Meaning review (`scripts/p4g/review.mjs`, `scripts/review_gate.mjs`)

`check` flags only the restructures that can shift meaning while the words stay identical:

- **condition-split:** a canonical sentence with `if / unless / only / before / after / must / never / until / not / without` is no longer inside one structured text unit.
- **callout:** a warning or discrepancy callout; a note callout that is not exactly a canonical quote or boxed note; a canonical quote that is not a callout.
- **table:** a canonical table or a structured table whose rows differ from the other side.
- **grouping:** a slot label, step title, rank title, scene prompt, option or info line that is not a line the source carries itself.

No flags means script QA is sufficient. With flags, `check` prints a packet: each flag with the canonical text and the structured text side by side.

**Reviewing the packet** (in-session, no subagent):
1. Judge only meaning, from the packet and the canonical text. Words and order are already proven.
2. Per flag: is every condition still attached to its action? Is a warning still a warning, a note still a note? Is every group, row and option intact? Ambiguous source text is preserved and flagged (`discrepancy` callout), never "fixed".
3. Record: `verdict <id> pass`, or write a verdict JSON (`schemas/qa-verdict.schema.json`: `verdict` PASS / PASS_WITH_NOTES / FAIL, `findings[]` with severity, category, location, issue) and run `verdict <id> <file>`. FAIL when any finding is critical/high; the Guide Transformer fixes it and re-runs `check`.

The verdict is stored at `qa-reports/<id>.review.json`, hashed against the structured file and the flag set. Any later edit, or a change in the flags, makes it stale and `check` shows the packet again. Reference-type sections skip the review: the word check is the whole review.

## 4. Not findings

- Re-spacing a run-together source token (`TeaOfTheHealer` → `Tea of the Healer`).
- Inline emphasis added by `check`: `**bold**` game terms, `*"italic"*` quoted speech and editorial italics.
- Long prose turned into nested lists (required by the list rule), as long as no flag fires.
- A navigation link to a merged section that points at its merge target.

## 5. Build and frontend

The build is not part of `check`. Run `build` before a commit or when a build error is suspected; `frontend` (or `check --full`) audits `src/` and `dist/`: tables wrapped for mobile overflow, no micro-fonts, no internal pipeline codes in headings, Prev/Next footer wraps, viewport meta.

## 6. Severity

- **Critical:** invented game facts, wrong progression, build failure, identity mismatch.
- **High:** wrong name or number, lost warning/missable, missing content, word-order divergence.
- **Medium:** usability issues, terminology inconsistency, misleading restructure.
- **Low:** cosmetic.

## 7. Definition of done

- [ ] Schema validation: 0 errors.
- [ ] Script QA `PASS` in `qa-status.json` (re-run after any edit to the structured file).
- [ ] Meaning review: no flags, or a current verdict that is not `FAIL`.
- [ ] `STATUS.md` synced by `check`.
