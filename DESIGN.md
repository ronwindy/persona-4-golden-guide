# Persona 4 Golden Guide — Design (`DESIGN.md`)

Visual decisions for the guide site. Agent behaviour rules (no monospace, don't copy Shadow Hearts/Limbo, ask before new ornaments, `GuideImage` for images) live in [`CLAUDE.md`](CLAUDE.md) §3. Record new design decisions here, not in CLAUDE.md. Decisions are recorded only after the user makes them.

## Decided
- **Theme:** P4 yellow & TV-world. Dark only.
- **Palette:** dark warm base `#0d0d0d`, P4 yellow `#FFE600` accent, off-white text. Red = warnings, cyan = links/info.
- **Fonts:** Jost (body), Archivo Black (headers), from Google Fonts.
- **Headers:** h1/h2 are black text on a skewed yellow slab with a hard offset shadow. h3 is plain yellow.
- **Motifs (CSS only):** skewed/angled panels, fog/gradient backdrop, faint static scanlines.
- **Panels:** frosted dark glass on every panel (callouts, steps, tables, info lists, rank cards): `backdrop-filter` blur, ~55% dark tint, thin light edge with a top sheen, 10px radius. Tokens: `--glass-*`.
- **Callouts:** louder than other panels. Every kind (note, warning, discrepancy, any future one) shares one red alert look: red-tinted glass, 1.5px red border with outer glow, and a solid red label strip across the top. The kind is shown only by icon and label text, so a new kind needs no new color.
- **Icons and visuals:** Lucide icons where they fit. Flows, timelines and diagrams are Astro components in HTML/CSS, drawn only from source facts (no Mermaid, no bespoke SVG).
- **Tokens:** all values live in the `:root` tokens of `src/styles/global.css`. Tailwind utilities read them via `@theme inline`.
- **Stack:** Tailwind 4 (`@tailwindcss/vite`) and `@lucide/astro` icons.
- **Layout:** 3 parts on desktop (left sidebar, content, right "on this page"), drawer on mobile.
- **Step checklists** with progress saved in the browser (localStorage).

## Open (ask the user when the source needs them)
Logo/branding, home page, badge styles, dark-mode details beyond the base theme, gamepad support, boss/shop/game-specific blocks, and any ornament beyond the motifs above.
