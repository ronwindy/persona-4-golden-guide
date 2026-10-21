# Persona 4 Golden Guide — Agent Instructions

Converts a GameFAQs guide for **Persona 4 Golden (PC)** into a static guide site (Astro, GitHub Pages). The pipeline is inherited from the Limbo / Shadow Hearts projects; **the schema, components and skills are not yet adapted to P4G**. The one-page spec (§1) decides what changes.

```text
Source → Canonical Source → Structured Guide JSON → Static Page → QA → GitHub Pages
```

## 0. Project state
- Fresh start. No source imported, no sections converted, no real design.
- The user chooses and saves the source (GameFAQs HTML) into `raw-sources/`. Never search for or pick sources.
- Commit directly on `main`. Never drive a browser (no preview/automation tools); the user checks visuals.
- Next steps: user saves the source → import to `canonical-sources/` → write the spec (§1) → pilot 3 sections → review bottlenecks.

## 1. Spec first
Before converting anything, write `docs/p4g-spec.md`: source inventory, section ids/slugs, schema deltas for P4G (it is a calendar/social-link game, so the Shadow Hearts walkthrough/boss shapes may not fit), the authority rule, and which UI blocks the source actually needs. Ask the user before adding any new block type or component.

## 2. Core Rule: Transform Presentation, Not Knowledge
The source is the sole authority for game facts. Priority when rules conflict: **source fidelity > user requirements > architecture > usability > visual polish > convenience.**

Allowed: restructure, reorder for readability (never where order carries gameplay meaning), tighten wording, make steps/checklists/tables, highlight warnings, add cross-references backed by project data.

List rule: prose with 3+ sentences or ~40+ words becomes a bullet list (numbered only if order matters); one fact/action per item, no changes to names/numbers/conditions (details in `guide-transformer`).

Forbidden: inventing or guessing facts, adding outside/model knowledge, renaming items/characters/locations/enemies, changing numbers or requirements, silently resolving contradictions. If the source is ambiguous or contradictory, **preserve and flag it**. Extra research only if explicitly requested, and kept visibly separate.

## 3. Design: P4 yellow & TV-world (decided)
- Stack: Tailwind 4 (`@tailwindcss/vite`) + `@lucide/astro` icons. All values live in the `:root` tokens of `src/styles/global.css`; Tailwind utilities read the same tokens via `@theme inline`.
- Look: dark warm base (`#0d0d0d`), P4 yellow `#FFE600` accent, off-white text; red = warnings, cyan = links/info. Dark only.
- Fonts: **Jost** (body), **Archivo Black** (headers), Google Fonts. **No monospace anywhere.**
- Headers: h1/h2 are black text on a skewed yellow slab with a hard offset shadow; h3 is plain yellow.
- Motifs (CSS only): skewed/angled panels, fog/gradient backdrop, faint static scanlines.
- Icons and visuals: use Lucide icons wherever they fit. Turn content into flows/timelines/diagrams wherever the source supports it, as Astro components in HTML/CSS (no Mermaid, no bespoke SVG). Visuals must come from source facts only.
- Images: wherever an image suits, use `GuideImage` with a path under `public/images/...`; it renders a labelled placeholder until the user saves a file at that path. Never fetch or generate images.
- Do not copy design elements from Shadow Hearts or Limbo. Ask before adding ornaments or styles beyond the above.
- Fixed by the user: 3-part layout on desktop (sidebar | content | on-this-page), drawer on mobile, step checklists with saved progress. Other blocks (callouts, tables, badges, gamepad support, boss/shop blocks, hero, ...) are decided per guide, with the user, when the source needs them.

## 4. Orientation & Status (do this first)
- Read the first 45 lines of [`STATUS.md`](STATUS.md) (or run `node scripts/guide.mjs status`) before starting. Never scan directories to orient yourself.
- `node scripts/guide.mjs check <id>` already updates `STATUS.md`; run `node scripts/guide.mjs status --update` only after work that did not go through `check`.
- Next-section priority: fix sequence gaps → fix QA `[FAIL]`s → run pending QA → next chronological section.

## 5. Windows Runtime
- Pipeline: `node scripts/guide.mjs <command>` (Node only, no Python). Ad-hoc JavaScript: write a temp `.mjs` file rather than a long inline `node -e`.
- npm: `cmd /c npm run build` (avoids PowerShell ExecutionPolicy errors).

## 6. Roles (logical agents = skills in `.claude/skills/`)
| Role | Skill | Owns | Must not |
| :-- | :-- | :-- | :-- |
| Source Importer | `source-importer` | `canonical-sources/` | rewrite knowledge |
| Guide Transformer | `guide-transformer` | `structured-content/sections/*.json` | write Astro, add facts |
| Web Builder | `web-builder` | `src/`, CSS, UX | change game facts |
| QA | `qa` | verification + `qa-status.json` | silently fix content |

Make the smallest change that fulfils your role; hand other problems to the owning role.

## 7. Per-Section Workflow (inherited; confirm in the spec)
Behavior comes from the section `type` (canonical manifest entry), never from the id. Ids are human-readable slugs (`^[a-z0-9-]+$`).

```bash
node scripts/guide.mjs scaffold <id>
node scripts/guide.mjs check <id>      # bold + validate + lint + QA + build + status
```
- Walkthrough-type sections: scaffold → refine (patch) → `check` → independent QA subagent (`qa-prompt <id>`, then `verdict <id> <file.json>`) → `finalize <id>` (stages, no commit).
- Reference-type sections: deterministic scaffold only, no LLM prose; `check`.
- Edit structured files with `node scripts/guide.mjs patch <id> <patch.json>` (write the patch with the Write tool, not a shell heredoc). Schema reference: [`docs/structured-schema.md`](docs/structured-schema.md), inherited from earlier projects and to be revised in the spec.
- Choice outcomes: set `outcome` only when the source states it; otherwise omit.
- The `convert-section` skill was removed (it described Shadow Hearts specifics); write a P4G one after the pilot.

## 8. Page Metadata
Every guide page has `id`, `title`, `type`, `source` and `navigation` (`prev` / `next`). No `related_pages` / `prerequisites` / `unlocks` fields; relationships the source states live in step text and `navigation`. Never add them speculatively.

## 9. Out of Scope for MVP
Whole-site crawling, multi-page auto-ingestion, vector DBs/RAG, knowledge graphs, backends, complex multi-agent orchestration, a general wiki generator. Don't build infrastructure for hypothetical needs; after ~5–10 converted pages, review real bottlenecks first.

## 10. Verification & User Role
Check your output against your role before calling it done. Central QA question: *did the presentation change while the source meaning stayed intact?* The user selects sources, reviews, decides and publishes. Don't ask them to curate game knowledge.
