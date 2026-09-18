# Persona 4 Golden Guide — Design Guidelines

## 1. Overview

This document defines the visual and UI guidelines for the **Persona 4 Golden Game Guide** website.

The goal is to create a guide that feels inspired by the visual identity of _Persona 4 Golden_ while remaining:

- Easy to read for long play sessions
- Fast and lightweight
- Simple to navigate
- Focused on practical game information
- Responsive across desktop and mobile
- Maintainable through the Astro framework

The design should feel like a **modern fan-made companion guide**, rather than attempting to reproduce the game's UI exactly.

---

# 2. Overall Aesthetic

## Design Direction

The visual language should take inspiration from Persona 4 Golden's distinctive:

- Golden/yellow color palette
- Warm, slightly retro atmosphere
- TV / CRT-inspired visual motifs
- Strong black and dark-gray contrast
- Clean geometric shapes
- Bold typography
- Occasional playful visual accents

However, the site should avoid becoming overly decorative.

**Readability takes priority over visual fidelity.**

### Keywords

> Golden · Retro · TV · Sunny · Nostalgic · Clean · Playful · Informative

---

## Color Palette

Use a restrained palette rather than applying yellow everywhere.

### Primary Colors

- **Golden Yellow** — primary accent and active navigation state
- **Dark Charcoal** — primary text / navigation background
- **Off White** — main page background
- **Warm Gray** — secondary text and borders

Example conceptual palette:

```text
Primary Yellow:   #F2C94C
Dark:             #202020
Background:       #F7F5EF
Surface:          #FFFFFF
Secondary Gray:   #777777
Border:           #D8D5CC
```

The exact values may be adjusted during implementation.

### Usage Rules

Yellow should primarily be used for:

- Active navigation items
- Section headings or markers
- Important links
- Interactive states
- Small decorative elements
- Important guide information

Avoid using yellow as the primary background for large amounts of text.

---

# 3. Typography

Typography should prioritize readability because users will frequently scan the guide while playing the game.

## Headings

Headings should be:

- Bold
- Distinctive
- Relatively compact
- Clearly hierarchical

Use a display/heading font with a slightly retro or geometric character if appropriate.

## Body Text

Body text should use a highly readable sans-serif font.

Recommended characteristics:

- Comfortable line height
- Medium character width
- Good readability at smaller sizes
- Strong contrast against the background

### Hierarchy

```text
H1 — Page / major guide title
H2 — Major section
H3 — Subsection
H4 — Individual topic / item
Body — Explanatory content
Small — Notes, metadata, secondary information
```

Do not use typography alone to create visual hierarchy. Spacing and layout should reinforce it.

---

# 4. Page Layout

The primary desktop layout uses a structured multi-column arrangement:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  ┌──────────────┐  ┌──────────────────────────────┐  ┌──────────────┐  │
│  │  GLOBAL NAV  │  │         MAIN CONTENT         │  │  LOCAL NAV   │  │
│  │              │  │                              │  │              │  │
│  │  Overview    │  │   Page Title                 │  │ On this page │  │
│  │  Walkthrough │  │                              │  │ ├ Section 1  │  │
│  │  Calendar    │  │   Section 1                  │  │ ├ Section 2  │  │
│  │  Social Links│  │   Content...                 │  │ └ Section 3  │  │
│  │  etc.        │  │                              │  │              │  │
│  └──────────────┘  └──────────────────────────────┘  └──────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

## Desktop

Use a three-column layout on wide screens:

```text
Global Sidebar | Main Content | Local Navigation ("On this page")
```

- **Global Sidebar**: Site-wide navigation across major guide categories and databases.
- **Main Content**: Central reading area with a constrained maximum width (~700–800px) for comfortable readability.
- **Local Navigation**: Right-hand sticky table of contents indexing headings within the active page.

### Recommended proportions

```text
Global Sidebar:    ~240–280px
Main Content:      flexible (~700–800px optimal reading width)
Local Navigation:  ~200–240px
Gap:               ~24–32px
Maximum container: ~1300–1440px
```

These values are guidelines rather than strict requirements. On screens where horizontal space is constrained, the local navigation gracefully collapses into an in-page outline.

---

# 5. Navigation

The left navigation is the primary method of moving through the guide.

## Navigation Principles

The navigation should be:

- Always easy to find
- Visually simple
- Hierarchical
- Compact
- Clearly indicate the current page

Example:

```text
PERSONA 4 GOLDEN

GUIDE
  ├─ Introduction
  ├─ Walkthrough
  ├─ Calendar
  ├─ Social Links
  └─ Endings

DATABASE
  ├─ Personas
  ├─ Skills
  ├─ Items
  └─ Quests

EXTRAS
  ├─ Achievements
  └─ Missables
```

## Active Item

The current page should have a strong visual indicator.

Possible treatment:

```text
▌ Walkthrough
```

or

```text
→ Walkthrough
```

The indicator should use the primary yellow accent.

Do not rely solely on color to indicate the active state.

---

## Local Navigation ("On This Page")

Each guide page includes local navigation to help players scan and jump directly to relevant sections within long documents (such as walkthrough chapters, dungeon floors, or calendar dates).

### Principles

- **Automatic Extraction**: Generated dynamically from the page's heading hierarchy (`H2`, `H3`).
- **Sticky & Unobtrusive**: Affixed to the right viewport edge on desktop so it remains accessible throughout scrolling without competing with the main content.
- **Scrollspy Feedback**: Dynamically highlights the section currently in the viewport.
- **Deep Linking**: Clicking an item smoothly scrolls to the anchor and updates the URL hash for easy sharing and bookmarking.

### Anatomy & Visual Presentation

```text
ON THIS PAGE
├─ Overview
├─ Prerequisites
├─ Step-by-Step Guide
│   ├─ Morning / After School
│   └─ Evening
├─ Missable Items
└─ Back to top ↑
```

Recommended styling:

- **Heading**: Small, uppercase label (e.g. `ON THIS PAGE`), styled in warm gray or muted dark charcoal with subtle letter-spacing.
- **Links**: Compact font size (13–14px) with comfortable line spacing.
- **Indentations**: Subsections (`H3`) visually indented under their parent (`H2`).
- **Active State**: Marked with the primary yellow indicator (e.g. a vertical `border-l-2` accent in `#F2C94C` or a subtle `▌` prefix) and bolded text.
- **Inactive State**: Muted warm gray text that brightens to charcoal on hover.
- **Container**: Minimalist border track (subtle left line `#D8D5CC`) to anchor the list without adding heavy box framing.
- **Utility Actions**: Optional "Back to top ↑" link at the bottom of the list for quick return to the page header.

---

# 6. Main Content

The main content area should feel like a clean reading surface.

A typical guide page should follow:

```text
Page Title
Short introduction

┌─────────────────────────────┐
│ Important information       │
└─────────────────────────────┘

Section
──────────────

Content

Section
──────────────

Content
```

## Content Width

Avoid extremely wide text blocks.

A comfortable reading width is more important than filling the entire screen.

## Scanning

Users should be able to quickly find information while playing.

Use:

- Headings
- Tables
- Bulleted lists
- Short paragraphs
- Highlighted notes
- Icons where useful
- Consistent spacing

Avoid large walls of text.

---

# 7. Guide-Specific Components

The design system should provide reusable components for common guide information.

## Important Note

For information that the player should not miss.

```text
┌──────────────────────────────────────┐
│ IMPORTANT                             │
│ Complete this before leaving town.   │
└──────────────────────────────────────┘
```

## Warning

For permanently missable or time-sensitive information.

```text
┌──────────────────────────────────────┐
│ MISSABLE                              │
│ This opportunity is only available   │
│ during this period.                  │
└──────────────────────────────────────┘
```

## Tip

For optional optimization or convenience.

```text
TIP
Save before entering the dungeon.
```

## Checklist

Useful for walkthrough progression.

```text
☐ Visit Dojima Residence
☐ Talk to Nanako
☐ Check the fridge
☐ Save the game
```

## Tables

Tables should be preferred for structured information.

Examples:

- Persona information
- Social Link requirements
- Calendar events
- Item locations
- Quest requirements
- Dungeon information

Tables should remain readable on small screens and support horizontal scrolling when necessary.

---

# 8. Persona 4 Visual References

The site can incorporate subtle references to Persona 4 Golden without directly reproducing game assets.

Potential motifs:

- Golden yellow accents
- TV-frame inspired borders
- Slightly offset geometric shapes
- Diagonal blocks
- Subtle CRT-inspired patterns
- Small static/noise textures
- Bold rectangular labels

These should remain **subtle and functional**.

Avoid:

- Excessive animations
- Constant screen distortion
- Heavy CRT filters
- Background videos
- Large decorative elements competing with guide content

The website is a guide first and a visual homage second.

---

# 9. Images and Game Assets

Images should support the guide rather than decorate every page.

Prefer:

- Screenshots
- Maps
- Item/location references
- Persona artwork where legally appropriate
- Small contextual illustrations

Images should have:

- Descriptive alt text
- Consistent sizing
- Responsive behavior
- Lazy loading when appropriate

Do not make the site dependent on large images for basic navigation or understanding.

---

# 10. Responsive Design

The desktop layout uses:

```text
[ Global Sidebar ] [ Main Content ] [ Local Nav ("On this page") ]
```

On medium screens / tablets (around 1024px–1279px):

```text
[ Global Sidebar ] [ Main Content (with in-page TOC dropdown) ]
```

The right local navigation hides to protect reading comfort, replaced by a compact, collapsible "On this page" trigger near the top of the content.

On mobile screens (< 1024px):

```text
[ Header with Menu Toggle ]
[ Collapsible "On this page" TOC ]
[ Guide Content ]
```

The global sidebar moves into an off-canvas drawer or slide-over menu, while the local navigation remains a collapsible accordion directly under the page title.

### Mobile priorities

1. Guide content
2. Navigation
3. Tables / structured information
4. Decorative elements

Decorative elements may be reduced or removed on small screens.

---

# 11. Interaction and Animation

Animations should be minimal.

Use animation primarily for:

- Opening/closing navigation
- Hover states
- Active navigation transitions
- Small UI feedback

Avoid animations that interfere with reading.

Recommended animation philosophy:

> Fast, subtle, functional.

The user should never have to wait for content to animate into view.

---

# 12. Astro Architecture

The frontend should be implemented using **Astro**.

The architecture should favor static generation and content-driven pages.

## Principles

- Prefer Astro components for static UI
- Keep client-side JavaScript minimal
- Use islands only when interactivity is actually required
- Generate guide pages statically where possible
- Keep content separate from presentation
- **Maximize component reusability** rather than duplicating markup or inline code
- **Proactive generic refactoring**: Whenever encountering a recurring UI pattern or primitive (e.g. an `Icon` component for all SVG icons, badges, tags, buttons), proactively refactor and extract it into a generic, reusable component

## Component Reusability & Refactoring

Because Astro renders components at build-time with zero client-side JavaScript overhead by default, component abstractions carry **zero runtime performance penalty**.

- **Proactive Extraction:** Every time repeated markup, inline SVGs, or recurring UI elements are identified, extract them into reusable generic Astro components rather than inlining or duplicating them across files.
- **Generic Primitives (e.g. `Icon.astro`):** Low-level primitives like icons, badges, and status chips should be encapsulated in centralized components with clean props (e.g., `<Icon name="tv" size="sm" />`), preventing SVG bloat and scattered markup.
- **Single Source of Truth:** Centralizing UI elements guarantees design consistency across all guide pages and simplifies future visual restyling.

Conceptual structure:

```text
src/
├── components/
│   ├── ui/
│   │   ├── Icon.astro
│   │   ├── Badge.astro
│   │   └── Tag.astro
│   ├── Navigation.astro
│   ├── LocalNav.astro
│   ├── Layout.astro
│   ├── GuideHeader.astro
│   ├── InfoBox.astro
│   ├── WarningBox.astro
│   ├── Checklist.astro
│   └── DataTable.astro
│
├── layouts/
│   └── GuideLayout.astro
│
├── pages/
│   ├── index.astro
│   ├── walkthrough/
│   ├── calendar/
│   ├── personas/
│   └── social-links/
│
├── content/
│   └── guide/
│
└── styles/
    └── global.css
```

---

# 13. Performance

The website should remain lightweight.

## Priorities

- Static HTML wherever possible
- Minimal JavaScript
- Optimized images
- Avoid unnecessary UI libraries
- Avoid large client-side frameworks
- Avoid loading fonts that are not actually used
- Lazy-load non-critical images

Astro's static-first architecture should be preserved rather than turning the site into a client-heavy application.

---

# 14. Accessibility

The guide should be usable without relying exclusively on visual styling.

Requirements:

- Semantic HTML
- Keyboard-accessible navigation
- Visible focus states
- Sufficient color contrast
- Alt text for meaningful images
- Proper heading hierarchy
- Do not communicate information through color alone
- Tables should have appropriate headers
- Collapsible navigation should be keyboard accessible
- Local navigation wrapped in `<nav aria-label="On this page">`
- Headings must have unique IDs and accessible anchor targets

---

# 15. Design Principles

When making future design decisions, follow these principles in order:

### 1. Readability

The guide must be comfortable to read for extended periods.

### 2. Navigation

Players should quickly find the information they need.

### 3. Clarity

Important information should stand out immediately.

### 4. Consistency

The same information should look the same throughout the site.

### 5. Persona 4 Identity

Use the game's visual language as inspiration without overwhelming the guide.

### 6. Performance

Do not sacrifice loading speed for decorative effects.

---

# 16. Design Rule of Thumb

When deciding whether to add a visual element, ask:

> "Does this help the player find or understand information?"

If the answer is no, it should probably be removed.

The final design should feel like:

**Persona 4 Golden-inspired + clean documentation + lightweight web experience.**
