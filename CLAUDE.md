# Persona 4 Golden Guide — Agent Instructions

A personal, easier-to-read static Astro site on GitHub Pages, started from a GameFAQs guide (Persona 4 Golden). The guide pages are now **hand-owned**: the user edits them to their own taste.

```text
src/data/pages/*.html + src/data/manifest.json → Astro build
```

## 1. Core rule
`src/data/pages/*.html` is the source of truth. The original extract/verify pipeline was a one-time split of the saved GameFAQs HTML and has been deleted (see git history). There is no word-for-word fidelity check any more; the user accepts drift from the original text.

- Edit page text and markup only when the user asks. Do not "improve" wording, facts or structure on your own initiative.
- Edits may add, remove, rewrite or reorder words and markup, as the user orders.
- `src/data/manifest.json` (page list, order, categories, ToC entries) is also hand-owned: keep it consistent when pages or h4 headings are added, renamed or removed.
- Credit: the guide is by Hurricanehaon (GameFAQs). Keep that attribution wherever the guide shows it.

## 2. Build
- Build: `cmd /c npm run build` (avoids PowerShell ExecutionPolicy errors). Ad-hoc JavaScript: temp `.mjs` file, not long `node -e`.
- Site settings (title, base, site URL) live in `project.config.json`.
- `raw-sources/` may still hold the user's saved GameFAQs HTML locally. It is gitignored and no longer used by anything.

## 3. Presentation (look decisions live in `DESIGN.md`)
- Pages render the stored HTML with `set:html` inside `.guide-body`; restyle via `src/styles/global.css` and the other files in `src/styles/`.
- Current features: sidebar nav + prev/next, reading progress (localStorage), on-page ToC (h4 headings), theme/typography, background, logo, favicon. No search yet.
- No monospace anywhere. Never copy design elements from other game projects; ask before new ornaments.
- Header icons: headings carry `data-icon`; `src/styles/header-icons.css` holds one mask per icon.
- Lucide icons in the sidebar (`src/lib/nav-icon-rules.mjs`).

## 4. Workflow rules
- Commit directly on `main`. Never drive a browser against the user's pages without being asked to verify visuals; the user checks the look.
- Ask before adding a new component or feature beyond section 3.

## 5. Out of scope
Crawling, backends, RAG, knowledge graphs, bulk converters.
