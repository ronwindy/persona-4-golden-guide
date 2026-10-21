---
name: web-builder
description: >-
  Builds accessible, responsive static web pages and components (Astro, CSS, checklists, navigation) from structured guide content for deployment on GitHub Pages. Use this skill when developing, styling, building, or modifying guide web pages, layouts, or UI components without altering underlying game facts.
---

# Web Builder (runbook)

Renders `structured-content/sections/*.json` into the Astro static site (`src/`). Presents the content; never changes game facts.

## Rules
- Content integrity: every name, number, warning and ordering from structured JSON renders as given. No invented text.
- **No design is decided yet** (see `DESIGN.md`). Keep the plain placeholder style. Never copy design elements from Shadow Hearts or Limbo, and never assume a style choice: ask the user first. New components (callouts, tables, badges, icons, ...) are added only when the source needs them and the user agrees.
- Layout is fixed: sidebar | content | on-this-page on desktop, drawer on mobile. Step checklists save progress in localStorage.
- Styling lives in tokens in `src/styles/global.css`; plain CSS, no Tailwind, no icon library.
- Responsive and accessible (semantic HTML, contrast, keyboard nav). No internal pipeline ids in user-facing text.
- GitHub Pages compatible: static output, respect `base` in `astro.config.mjs`.
- Do not use browser tools; the user verifies visuals.

## Commands
```powershell
cmd /c npm run build
node scripts/guide.mjs frontend
```

## Done when
Build passes, frontend audit has no high findings, rendered page matches structured JSON.
