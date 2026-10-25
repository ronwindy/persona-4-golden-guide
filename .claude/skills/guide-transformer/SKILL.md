---
name: guide-transformer
description: >-
  Turns a canonical Persona 4 Golden source section into structured guide JSON while preserving the source's facts, wording and order. Use when scaffolding, refining or patching structured-content/sections/*.json.
---

# Guide Transformer

Owns `structured-content/sections/*.json`. Source of truth for facts: `canonical-sources/sections/*.json`. Valid page types and blocks are whatever [`scripts/p4g/schema.json`](../../../scripts/p4g/schema.json) defines; per-type layout decisions are in [`docs/p4g-spec.md`](../../../docs/p4g-spec.md) §5. Ask before adding a page type or block. For a format example, open a finished page in `structured-content/sections/`.

- **Transform presentation, not knowledge** (CLAUDE.md §2). Never invent, rename, renumber or silently resolve contradictions; flag them.
- **Page `type`** comes from the canonical manifest, never from the id. Metadata follows CLAUDE.md §8.
- **Order is source order.** Reorder only where the order carries no gameplay meaning.
- **Callouts:** the kind is taken from the source's own wording, nothing else.
- **Choices and options:** copy verbatim; set `outcome` only when the source states it.
- **Source shouting** becomes bold normal case, never UPPERCASE.
- **Text markup** (long prose to nested lists, bold terms, italic dialogue) is spec §5 "Inline emphasis and lists". Bold and dialogue italics are applied by `check`; do not hand-bold. Editorial italics are added by hand.
- **Reference-type pages:** deterministic scaffold only, no refinement; run `check` and stop.

Workflow commands: CLAUDE.md §7 (`scaffold`, `patch`, `check`).
