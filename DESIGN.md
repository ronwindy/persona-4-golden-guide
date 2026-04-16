# Persona 4 Golden - Walkthrough Design System

## 1. Art Direction & Vibe
The visual identity of *Persona 4 Golden* is iconic, energetic, and highly stylized. The core motifs revolve around **Pop-Art, Retro Television sets (CRT monitors, color bars, static), and Murder Mystery (fog, caution tape, silhouettes).** Because this guide will be a highly stylized custom website, we need to ensure these visuals translate well into modular web components without overwhelming the readability of the walkthrough text.

## 2. Core Color Palette
The colors need to be high-contrast and punchy.
* **Midnight Channel Yellow (Primary):** `#FCE300` - The dominant color. Used for primary backgrounds, active states, and heavy accents.
* **Inaba Black (Secondary):** `#1A1A1A` - Used for thick borders, text on yellow backgrounds, and dramatic contrast.
* **Static White (Background/Text):** `#FAFAFA` - Used for body text areas to maintain readability, or text on black backgrounds.
* **Junes Orange (Accent 1):** `#FF6B00` - Used sparingly for warnings, important alerts, or call-to-action buttons.
* **Velvet Blue (Accent 2):** `#0C1431` - Used for special secret sections, optimal dialogue choices, or meta-game information.

## 3. Typography
The typography is heavily stylized, relying on varying font weights and dynamic angles.
* **Headings (The "Pop" Font):** A heavy, condensed, sans-serif font. Ensure you use consistent web fonts rather than system fonts to avoid rendering issues. *Suggestions: 'Anton' or 'Teko' (via Google Fonts).*
    * *Styling rules:* Uppercase, often italicized (slanted), with a slight text-shadow to mimic color bleeding or print misalignment.
* **Body (The "Reading" Font):** A clean, legible geometric sans-serif to balance the chaotic headers. *Suggestions: 'Montserrat', 'Inter', or 'Noto Sans'.*
    * *Styling rules:* Normal weight, high contrast against the background. Keep line-height generous for long walkthrough paragraphs.

## 4. UI Motifs & Components
To achieve the P4G feel in our layout, apply these CSS/Styling techniques to standard components:

### 4.1. The "Cutout" Style (Cards & Containers)
Avoid standard rounded corners (`border-radius`). Instead, use CSS `clip-path` to create sharp, angled edges (parallelograms) or asymmetrical boxes.
* **Thick Borders:** Apply `border: 4px solid #1A1A1A` to containers to give them a comic-book/pop-art definition.
* **Offset Shadows:** Use hard, solid offset drop shadows (e.g., `box-shadow: 6px 6px 0px #1A1A1A`) rather than soft, blurred shadows.

### 4.2. Background Textures
* **Halftone Patterns:** Use a subtle CSS radial-gradient to create a dotted halftone pattern in the background of yellow hero sections.
* **TV Scanlines:** Apply a repeating linear-gradient overlay with low opacity on header banners to simulate an old CRT television screen.
* **Stripes:** Diagonal black and yellow "caution tape" stripes can be used as dividers between sections or as border patterns.

### 4.3. Navigation & States
* **Hover States:** When hovering over a link or button, invert the colors instantly (no smooth transition) or slightly rotate the element (e.g., `transform: rotate(-2deg)`) to make it feel frantic and dynamic.
* **Active States:** Highlight active navigation items with a thick underline or by wrapping them in a black pill with yellow text.

### 4.4. Animations & Transitions
The P4G aesthetic is inherently restless. Implement movement thoughtfully without overwhelming the user:
* **Staggered Entrances:** Lists (like the ToC or guide steps) should slide in from the side sequentially rather than appearing all at once.
* **Restless UI:** Backgrounds or decorative elements can slowly pulse or scroll perpetually (like TV scanlines or geometric stripes).
* **Page Transitions:** Consider "TV changing channels" static bursts or sweeping wipes when navigating between major guide sections.

### 4.5. Iconography
Ensure visual consistency with game motifs across the site:
* **Silhouettes:** Use stark black/white silhouettes for icons (e.g., the protagonist's glasses, a retro TV, bear outlines).
* **Arcana Cards:** Utilize Tarot/Arcana card imagery or iconography for Social Link guides.
* **Pixel Art:** Sprinkle in 8-bit aesthetic mini-sprites or pixelated text for specific gaming references or minor UI elements.

### 4.6. Accessibility (A11y) & Motion Settings
Because this design relies heavily on stark contrasts and potentially frantic animations, it must not cause eye strain or motion sickness:
* **Respect User Preferences:** All frantic hover states, jitter effects, or scrolling backgrounds MUST be disabled or severely toned down when the `prefers-reduced-motion` CSS media query is active.
* **Contrast Checks:** Ensure the Junes Orange and Velvet Blue retain sufficient contrast against both Inaba Black and Midnight Channel Yellow backgrounds.

## 5. Layout Strategy for Walkthroughs
* **Main Content Column:** Keep the actual guide text contained in a clean, white-ish column with dark text. The crazy P4G styling should frame the content, not obscure it.
* **Callout Boxes:** For things like "Exam Answers" or "Boss Weaknesses", use the Junes Orange or Midnight Channel Yellow background and apply the **Cutout Style** (parallelograms, thick black borders) to draw the eye immediately.
* **Specific Guide Components:** Establish clear visual patterns for recurring game elements:
    * *Dialogue Choices:* Replicate the game's staggered speech-bubble UI to indicate the "best" dialogue options.
    * *Social Link Ranks:* Use bold, angled badges or upward arrows for rank-up notifications.
    * *Stat/Persona Tables:* Use black and yellow "caution tape" stripes for table headers to break up data grids.
* **Date & Weather Trackers:** P4G is heavily calendar-based. Design a persistent, sticky widget in the corner or top bar that mimics the game's in-game calendar (showing the current Date, Day of the Week, and Weather icon) as the user scrolls through a specific day's guide.

## 6. Mobile-First Responsiveness
The "Neo-Brutalist" P4G aesthetic must remain functional and readable on all screens. To prevent future layout breakages, follow these rules:

* **Fluid Containers:** NEVER use fixed pixel widths (e.g., `width: 360px`) for major layout components without a matching mobile-first override. Use `width: 100%` as the default and apply desktop constraints within `(min-width: 1024px)` media queries.
* **Tiered Typography:** Headlines must scale down aggressively for mobile. Use `clamp()` for fluid scaling or tiered media queries (at `768px`, `480px`, and `380px`) to ensure massive "pop" fonts fit within narrow viewports.
* **Sticky Element Docking:** On mobile, persistent widgets (trackers, menus) must be moved to non-obscuring positions (e.g., `position: absolute` or docked to the header) to avoid overlapping content.
* **Balanced Shadows:** Reduce `box-shadow` offsets on mobile (e.g., from `8px` to `4px`) to prevent UI elements from feeling overly cramped or causing horizontal scrollbars.
* **Touch-Safe Hitboxes:** Ensure all interactive elements (ToC links, buttons) have a minimum tap target size of `44px` while maintaining their sharp geometric styling.
