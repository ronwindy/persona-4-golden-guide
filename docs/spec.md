# Spec: faithful re-presentation

**Goal:** read the GameFAQs guide in a nicer layout with every word of the author's text unchanged and in order.

## Source
- One saved GameFAQs HTML in `raw-sources/` (gitignored). The guide body is `#faqwrap` (`extract.bodyId`).
- The saved page contains each chapter twice: a full-chapter copy, then one block per section. The first copy is dropped only when its words equal the later blocks exactly.
- The GameFAQs table of contents (`.ftoc`) is dropped; the sidebar replaces it.
- Everything outside the body (site header/footer, ads, listing details) is not carried over; its visible text is listed in `docs/extract-report.md`.

## Pages
- One page per `h3` section (`extract.sectionTag`), grouped under its `h2` chapter (`extract.chapterTag`). A chapter's text before its first `h3` becomes an "Overview" page when it has any words.
- Page markup is the source markup, unchanged except: tables are wrapped in `div.table-wrap`, and GameFAQs section links point to local pages.
- Ids: slug of chapter + section title.

## Fidelity rule
`npm run verify` re-reads the raw source and the generated files and fails unless:
1. the ledger in `src/data/manifest.json` covers every top-level body node once, in order;
2. each page's words equal the source words of its range, in order;
3. each dropped duplicate's words equal the kept copy's words, in order;
4. kept + duplicate + dropped words = total body words.

## Presentation
See `DESIGN.md`. v1: sidebar + prev/next, reading progress (localStorage), theme/typography, background, logo, favicon. Further enhancements only on order.

## New game
Save the HTML, adjust the `extract` block in `project.config.json` (and `game`, `slug`, `site`, `base`), run `npm run sync`.
