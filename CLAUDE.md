# Persona 4 Golden Guide — Agent Instructions

Re-presents a GameFAQs guide (Persona 4 Golden) as a static, easier-to-read Astro site on GitHub Pages. **Only the presentation changes. The author's words, numbers, order and markup are carried over untouched.**

```text
raw-sources/*.html → scripts/extract.mjs → src/data/pages/*.html + manifest.json → scripts/verify.mjs → Astro build
```

## 1. Core rule
The source is the sole authority. No LLM rewrites, summaries, regrouping, bolding of terms, or "fixes". Allowed: CSS, layout, sidebar, prev/next, progress tracking, fonts, link retargeting to local pages. Anything that adds, removes or moves guide text needs the user's explicit order.

Priority: source fidelity > user requirements > usability > visual polish.

## 2. Pipeline (Node only, no Python)
- The user saves the GameFAQs HTML into `raw-sources/` (exactly one `.html`). Never search for or pick sources. Raw sources are gitignored.
- `npm run sync` = `extract` + `verify`. Run it whenever the source or `project.config.json` `extract` block changes.
  - `extract`: finds the guide body (`extract.bodyId`), drops the site TOC, splits at `chapterTag`/`sectionTag` into one verbatim HTML file per page, retargets GameFAQs section links to local pages, writes `docs/extract-report.md`.
  - The saved GameFAQs page repeats each chapter (full-chapter copy, then one block per section). `extract` keeps one copy and **refuses to continue unless the dropped copy matches the kept one word for word**.
  - `verify`: re-reads the raw source and the generated pages independently; fails on any word difference, any gap in the ledger, or a duplicate that does not match. Prints the word accounting.
    - Checks: (1) the ledger in `src/data/manifest.json` covers every top-level body node once, in order; (2) each page's words equal the source words of its range; (3) each dropped duplicate's words equal the kept copy's; (4) kept + duplicate + dropped words = total body words.
- Pages: one per `sectionTag` (h3) section, grouped under its `chapterTag` (h2) chapter; chapter text before its first h3 becomes an "Overview" page when it has words. Ids are the slug of chapter + section title. Page markup is the source markup, except tables get `div.table-wrap` and GameFAQs section links point to local pages. Everything outside the body (site header/footer, ads) is dropped and listed in `docs/extract-report.md`.
- New game: save the HTML, adjust `project.config.json` (`game`, `slug`, `site`, `base`, `extract`), run `npm run sync`.
- Generated `src/data/` is committed (CI has no raw source). Never hand-edit it.
- Build: `cmd /c npm run build` (avoids PowerShell ExecutionPolicy errors). Ad-hoc JavaScript: temp `.mjs` file, not long `node -e`.

## 3. Presentation (look decisions live in `DESIGN.md`)
- Pages render the stored HTML with `set:html` inside `.guide-body`; restyle only via `src/styles/global.css`. The only markup added is a `div.table-wrap` around tables.
- Enhancements are added only when the user orders them. Current: sidebar nav + prev/next, reading progress (localStorage), theme/typography, background, logo, favicon. No search yet.
- No monospace anywhere. Never copy design elements from other game projects; ask before new ornaments.
- Images: the current source has none. If a source has images, keep their URLs; download locally only the ones that are blocked, after testing.
- Lucide icons only in the sidebar (`src/lib/nav-icon-rules.mjs`).

## 4. Workflow rules
- Commit directly on `main`. Never drive a browser against the user's pages without being asked to verify visuals; the user checks the look.
- Ask before adding a new component or feature beyond section 3.
- Dropped content is always listed in `docs/extract-report.md` so the user can approve it.

## 5. Out of scope
Crawling, backends, RAG, knowledge graphs, per-game bespoke converters. The extractor is config-driven: a new GameFAQs guide should need only a new `extract` config block.
