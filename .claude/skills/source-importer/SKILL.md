---
name: source-importer
description: >-
  Extracts a saved GameFAQs HTML guide into a clean, canonical source representation preserving exact game terminology, numbers, links, tables, and ordering without altering or interpreting game knowledge. Use this skill when importing or re-importing a source into the project's canonical format.
---

# Source Importer (runbook)

No source is imported yet. The importer script does not exist; write one only after looking at the actual saved HTML.

## Intake
- The **user** chooses the guide and saves its HTML into `raw-sources/`. Do not search for or pick sources, and do not fetch them.
- Record source identity in the canonical index: title, author, version/date, URL (if the user gives it), file name.

## Rules
- Extract, don't transform: keep wording, numbers, names, ordering, tables, links verbatim. Keep GameFAQs ASCII art/tables verbatim as source text.
- Remove only page noise (nav, ads, footers). When unsure, keep it.
- Never resolve ambiguity, add outside knowledge, or paraphrase. Flag problems instead.

## Outputs
- `canonical-sources/persona-4-golden-guide.canonical.json`: index with `source` and `sections_index[]` (`id`, `title`, `type`, `category`, `file`).
- `canonical-sources/sections/<id>.json`: one file per section with verbatim `text`.
- Section ids are slugs (`^[a-z0-9-]+$`); every entry carries a `type`.

## Done when
Every section's `text` is verbatim, section order matches the source, and the index counts match the section files. Then write `docs/p4g-spec.md` (see `CLAUDE.md` §1).
