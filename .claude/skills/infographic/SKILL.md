---
name: infographic
description: Convert a plain guide page in this site (src/data/pages/*.html) into a visual infographic with icons, stat tiles, cards and richer styling. Use when the user asks to "make this page an infographic", "visualize", "restyle with icons", or invokes /infographic <page>. Covers one page or a family of sibling pages.
---

# Infographic conversion

Turns a raw guide page into an infographic. The finished reference is `src/data/pages/dungeons-yukiko-s-castle.html` (kit: `src/styles/infographic.css`, icons: `src/components/IconSheet.astro`).

## Fixed rules (never bend)
- **Content contract:** every fact, number, item, name and condition on the page survives. Wording may be shortened into labels, chips and cells; prose may become tables or cards; order may change if it reads better. Never invent or drop information. Keep the Hurricanehaon credit wherever the page shows it.
- Project rules from CLAUDE.md apply: no monospace, ask before new ornaments or components beyond this skill's scope, edit only what the user asked, keep `src/data/manifest.json` consistent (h4 headings power the on-page ToC; keep their ids/text unless the user agrees).
- Do not copy design elements from other game projects.

## Workflow (do the steps in order)
1. **Read** the page HTML, `manifest.json` entry, `src/styles/infographic.css` (the kit) and `IconSheet.astro` (available icons). Look at one finished infographic page for the visual language.
2. **Ask, don't assume.** If anything is unclear (which page(s), what to emphasise, which data is a stat vs. a list, tone, anything that would change the design), ask via AskUserQuestion, one question at a time, until nothing is ambiguous.
3. **Classify the content**: stats/facts, comparisons (tables), sequences (floors, steps, timeline), lists of items, warnings/tips, quotes/dialogue. Pick a visual for each (see Vocabulary).
4. **Draft with Claude design.** Make a draft design of the page using the Design artifact flow (quickstart with intent `design`). Write the canvas files under `D:\GAMES\GameGuides\persona-4-golden-guide\design-scratch\<name>\` (forward-slash absolute paths; never commit design-scratch/). Use real content from the page and the site's tokens (dark glass, P4 yellow `#FFE600`, Jost/Dela Gothic/Kanit; no monospace). Show it and **wait for explicit approval**. Revise until approved. Do not touch the real page before approval.
5. **Build** after approval:
   - Rewrite the page HTML inside a root `<div class="ig">…</div>` (keep the leading `<h2>`/`<h3>` headings and any h4 ids).
   - Use the shared kit first. Icons are `<svg class="ig-i"><use href="#ig-name"/></svg>`; add missing symbols to `IconSheet.astro` (Lucide style, viewBox 0 0 24 24, stroke `currentColor`, ids `ig-<name>`).
   - If the content needs a shape the kit lacks, add a small page-specific block named `ig-<page>-*` at the end of `infographic.css` (or reuse a proven pattern). If a block would obviously serve other pages, put it in the kit proper.
6. **Verify**
   - `cmd /c npm run build` passes (it can exceed 2 min: run it in the background).
   - Start `astro-dev` with `preview_start`, open `/persona-4-golden-guide/guide/<id>/`, check desktop and mobile (375px), light and dark where relevant, console errors, and that every `<use>` target exists.
   - **Content check:** compare visible text before vs. after (e.g. `git show HEAD:<page>` stripped of tags vs. the new one). List anything missing and fix it, or report it to the user.
   - **Always `preview_stop` the dev server before ending the turn.**
7. **Commit** on `main`: `feat: infographic layout for <page>` with the Co-Authored-By trailer from the session.

## Several pages at once
Draft once, for the first (or most representative) page. After approval, build it, then apply the same look to the sibling pages with only the extra blocks each one needs. Still run the verify step per page (content check + a quick render check) and commit per family.

## Vocabulary (kit, `ig-*`)
Check `infographic.css` for the exact current set. Typical pieces:
- `ig-stats` / `ig-stat` (tint modifiers `ig-st-y/r/o/m/c`): label + big value tiles for key facts.
- `ig-floors` / `ig-fl`: sequence map (floors, stages), with boss/loot variants.
- `ig-card`, `ig-chips` / `ig-chip` (`ig-new`, `ig-key`): item and tag lists.
- `ig-r` rows (`ig-wk` weak, `ig-st` strong, `ig-nu` null, `ig-dr` drain, `ig-rp` repel): resistance tables.
- `ig-say`: tip / speech bubble; `ig-hint` / `ig-dim`: secondary text; `ig-leg`: legend.
Cards take a tint via `--t` ("r g b"). Prefer these before inventing; invent when the content calls for it.

## Design guidance
Lead with the most useful facts (what the player needs at a glance). Use icons to carry meaning, not decoration. Keep dense data scannable: tiles for single values, grids for sequences, chips for lists, tables only when comparing columns. Respect existing tokens in `global.css`; avoid new fonts and monospace.
