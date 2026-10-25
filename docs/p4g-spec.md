# Persona 4 Golden Guide: Spec

Status: **draft, decided with the user (grill-me session, 2026-10-21); source imported (141 canonical sections)**. Items marked **OPEN** need a decision or the pilot's evidence.

## 1. Source inventory

| Field | Value |
| :-- | :-- |
| Title | Persona 4 Golden - 100% Guide - PlayStation Vita |
| Author | Hurricanehaon |
| URL | https://gamefaqs.gamespot.com/vita/641695-persona-4-golden/faqs/76145 |
| Saved file | `raw-sources/Persona 4 Golden - 100％ Guide - PlayStation Vita - By Hurricanehaon - GameFAQs (21_10_2026 21：13：27).html` (2.77 MB, saved by the user; GameFAQs returns HTTP 403 to fetch/curl) |
| Format | HTML-formatted guide, **not** ASCII text. 157 `<h2>`, 289 `<h3>` (145 distinct), 492 `<table class="ffaq">`, 0 `<img>` |
| Markup quirks | Unclosed `<p>`, `<tr>`, `<td>`, `<li>` tags; the importer must use a real HTML parser, not regex |
| Platform | Titled for PS Vita; Controls use Vita button names; the text says other platforms (incl. Steam) can remap |
| Images | None saved. Any image need uses `GuideImage` placeholders (never fetched) |

Layout of the saved page (`div#faqwrap`, flat children): every chapter appears **twice**, as a chapter view (`h2` + all its `h3` sections) and then as one `h2` + `h3` copy per section. The per-section copies are canonical; the importer compares each with its chapter-view copy (all 144 identical). The saved ToC lists only 20 sections for Persona Compendium, Social Links and Activities although the page has 27, 23 and 23; page headings are the authority and their anchors are derived from the heading.

Extraction rules used by `scripts/import_source.mjs`: `<h2>` = chapter, `<h3>` = section, `<h4>` only 5 (centered, likely cover/credit text), `<blockquote>` and one-cell `ffaq` tables = NOTE/warning boxes, `<strong>` lines = sub-headings or labels, `-Label-` lines = inline sub-headings, `~April 11th~` between dashed lines = day heading.

## 2. Scope and section ids

Decision: **whole guide, one section (one JSON, one page) per `<h3>`/ToC sub-heading.**

Id rule: `<chapter>-<anchor>` using the source's own anchors (`^[a-z0-9-]+$`), e.g. `walkthrough-april`, `social-links-yosuke-hanamura-magician`, `dungeons-yukikos-castle`. Where the anchor already starts with the chapter name it is not repeated. Page `type` comes from the table below, never from the id.

| # | Chapter (`h2`) | Sections (`h3`) | Page type | Notes |
| :-- | :-- | :-- | :-- | :-- |
| 1 | 100% Guide | Guide Checklist | `reference` | Keep. *Update/Current Schedule* is **dropped** (author admin) |
| 2 | Introduction | About This Guide, Frequently Asked Questions | `article` | Keep. *Version History* and *Contact Information* **dropped**. *Copyright* folds into a credit page (`credits`) |
| 3 | About Persona 4 Golden | What Is Persona?, Persona 3 vs. Persona 4, Persona 4 vs. Persona 4 Golden | `article` | 3 |
| 4 | Gameplay Mechanics | Controls, Field Mechanics, Calendar System, Social Link, Status Parameters, Velvet Room, Battle Mechanics, Shuffle Time, Status Ailments, New Game Plus, TV Channels | `article` | 11. Controls carries a "Vita source" flag |
| 5 | Walkthrough | Walkthrough Objectives, Walkthrough FAQ, Important Notes, Current Problems, then April to March (12) and New Game Plus Walkthrough | `article` x4, `calendar` x13 | 17. FAQ holds WAQ1 to WAQ14 as entries on one page |
| 6 | Dungeons | Twisted Shopping District, Yukiko's Castle, Steamy Bathhouse, Marukyu Striptease, Void Quest, Secret Laboratory, Heaven, Magatsu Inaba, Hollow Forest, Yomotsu Hirasaka, Extra Bosses | `dungeon` | 11 |
| 7 | Persona Compendium | Formula, Fusion Forecast, Special Fusions (`article`), then 24 arcana pages: Fool to Star, plus Moon, Sun, Judgement, Jester, Aeon, World (missing from the saved ToC) | `article` x3, `arcana` x24 | 27 |
| 8 | Social Links | 23 links, Investigation Team/Fool to Marie/Aeon (incl. Seekers of Truth/Judgement, Tohru Adachi/Jester, Marie/Aeon, which the saved ToC omits) | `social-link` | 23 |
| 9 | Activities | Quests, Bug Catching, Fishing, Gardening, Cooking, Books, Beach/Hot Springs, Costume Shop, TV Shopping, Daidara List, Shiroku Store, Shiroku Pub, Part Time Jobs, Artisan Apprentice, Lady in White, Okina Movie Theater, Chagall Cafe, Crane Machine, Refrigerator, Models, Miracle Quiz, Trophies, Other Activities | `article` (provisional) | 23 |
| 10 | Skill List | All Skills, Skill Cards, Party Members | `catalog` | 3 |
| 11 | Item List | Weapons, Armor, Accessories, Costume List, Consumable/Quest Items, Materials, Book List, Fish List, Gardening Items, Bug List, Gem List, Key Items | `catalog` | 12 |
| 12 | Tips And Tricks | Golden Shadow Grinding, Best Personas, Hardcore Risette Fan, Victory Cry Cheat, Resources | `article` | 5 |
| 13 | Conclusion | Special Thanks, Final Remarks | `article` | 2. **OPEN**: kept as content under "keep everything but author admin"; confirm |

**Imported total: 141 pages** (144 found, 3 dropped; recorded in the index `dropped[]`). By provisional type: `article` 54, `arcana` 24, `social-link` 23, `catalog` 15, `calendar` 13, `dungeon` 11, `reference` 1. The authoritative inventory is `canonical-sources/persona-4-golden-guide.canonical.json`, generated by the importer, not maintained by hand here. Ids follow `<chapter>-<anchor>` (the chapter prefix is dropped when the anchor already starts with it, e.g. `walkthrough-faq`).

Types are assigned by `sectionType()` in the importer and are provisional until the pilot. Copyright is imported as `introduction-copyright`; folding it into a credit page is a later web step.

**Chapter intro text (found):** six chapters have text before their first `<h3>`: 100% Guide (cover headings Persona 4 Golden 100% Guide / Version 1.00 / Created by Hurricanehaon / Warning!!!, plus a "Guide Format Changes" quote), Dungeons (intro and the bestiary legend Lv/Arcana/HP/SP/Phy/Fir/Ice/Elc/Wnd/Lgt/Drk...), Persona Compendium, Social Links, Activities, Item List. They are stored in the index under `chapters[].intro_blocks`. **OPEN**: where they are shown (a chapter landing page, or inline at the top of the chapter's first page). The Dungeons legend explains abbreviations used in every dungeon table, so it must be reachable from those pages.

## 3. Authority rule

- The source is the sole authority for game facts. Priority: source fidelity > user requirements > architecture > usability > visual polish.
- **Each page mirrors its own source text.** No page overrides another. If two passages contradict (for example a Walkthrough rank-up and its Social Link page), both are preserved and a visible `discrepancy` note is added. Never pick a winner.
- The guide's own claims about itself (version, "known problems") are kept only on the pages decided in section 2.

## 4. Platform handling

- Vita button names stay exactly as written. Controls gets a visible "Source is the PS Vita guide" note.
- **Deferred:** a Vita to Xbox controller-name layer (the user plays PC with an Xbox pad). Not built now; ask the user before adding it. Not source-derived, so it must be a visibly separate display layer.

## 5. Schema deltas vs the inherited schema

The inherited Shadow Hearts schema (since removed) assumed: `route`, `bosses`, `shops`, `items_summary`, `[W-x-xx]` codes, ASCII `preformatted` blocks. P4G changes:

| Concern | Decision |
| :-- | :-- |
| Page types | `article`, `calendar`, `dungeon`, `social-link`, `arcana`, `catalog` replace `walkthrough` / `reference` / `mechanics`. Final list confirmed after the pilot |
| Codes | Source has no `[W-1-06]`-style codes; `code` is dropped. Navigation uses ids |
| Tables | **One generic table block**: `headers[]` + `rows[][]` (cells may be empty strings, source empty cells kept). Rendered scrollable; cards on mobile. Specialised table blocks only after pilot evidence, and only with the user's OK |
| Walkthrough steps | The checklist unit is the **day** (`~April 11th~`) with `Afternoon` / `Evening` sub-steps. Progress shown per day and per month. Order is source order and carries meaning |
| Responses / choices | Walkthrough "Responses" and social-link `Option A: +3` lines are kept as source-stated lists. `outcome` only where the source states it |
| Notes | `<blockquote>` and one-cell tables become callouts (`note`, `warning`, `discrepancy`); the type is taken from the source's own wording (NOTE!, HIGHLY IMPORTANT!), nothing else |
| Social link page | Availability table, Information list (First Day, Last Day, Activation, Location, Ultimate Persona, Key Item, Notes), Points Needed table, Rank Up Scenes (per rank: dialogue + options) |
| Dungeon page | Information list (Available, Last Day, Floors, Fixed Floors, Boss Floors, Hidden Item, Notes), Treasure Chests, Shuffle Time Personas, Enemies table, bosses |
| Arcana page | Normal Spread, Triangle Spread (lists) and Personas table |
| Dropped fields | `route`, `shops`, `items_summary`, `traps`, `images` (until images exist), `save_points`, `reference_blocks.preformatted` unless the source has real ASCII art |
| Metadata | Per CLAUDE.md section 8: `id`, `title`, `type`, `source`, `navigation` only |
| Source object | `{game, author, version, url, source_file}`; version taken from the saved page, not guessed |

### Inline emphasis and lists (decided with the user, 2026-10-25)

Three text rules apply to every page. Markers in structured strings: `**bold**` and `*italic*`.

| Rule | Decision |
| :-- | :-- |
| Bold game terms | `scripts/bold_terms.mjs` bolds names of items, places, people, skills, personas, enemies. The dictionary is **mined from canonical**: first-column names of the catalog / arcana / dungeon tables (Accessory, Armor, Weapon, Item, Seed, Bug, Fish, Gem, Material, Book, Costume, Skill, Persona, Enemy, Boss), plus arcana, social-link and dungeon page titles. `scripts/term_extras.json` adds what the source tables miss (`characters`, `locations`), `deny` removes false hits, `ambiguous` (and every arcana name) is skipped at sentence start. Table cells, headings and labels are never bolded. Bold also applies inside dialogue |
| Italic dialogue | Every **straight-quoted span** (`"..."`) is spoken dialogue and is italic: `*"Sorry about that."*` (the quote marks are part of the italic run). The speaker label stays upright (bold if a known name). Unquoted narration and thoughts are not italic. Applies to prose and table cells (e.g. Costume Quote). Quotes that are not speech go in `italic_deny` in `term_extras.json` |
| Editorial italic | Taught by the user (2026-10-25): italicize the short phrase that carries the stakes, condition or warning (`*at any time*`, `*don't matter*`, `*certain responses*`, `*choosing a response to give*`), not the whole sentence. Meta asides by the author may be italic as a whole line (`*I will make sure to make note of them when they happen.*`). Plain instruction lines (e.g. "Feel free to change difficulty settings...") stay unmarked. Added by hand, never by script |
| Multi-level lists | Prose of 3+ sentences or ~40+ words becomes a bullet list (numbered only if order matters), one fact per item. Sub-points nest: a list item may be `{ "text", "children": { "ordered", "items" } }` to any depth. Dialogue spans do not count towards the limit, so a long spoken line stays one italic line |
| Enforcement | `check` first runs the italic and bold passes (`node scripts/guide.mjs emphasis <id>` alone), then lint **fails** on: dialogue left upright, unbalanced quotes, and prose over the list limit. Script QA compares words only, so markers and list nesting must never change wording or order |

## 6. UI blocks the source actually needs

Fixed by the user: 3-part layout (sidebar | content | on this page), mobile drawer, step checklists with saved progress.

Needed now (all CSS/Astro, Lucide icons, no Mermaid, no new ornaments):
- Callout (note / warning / discrepancy)
- Generic table
- Day checklist group (calendar pages)
- Info list (label/value pairs) for dungeon and social-link headers
- Rank-up scene list (social links)
- Chapter-grouped sidebar with search-friendly titles (about 142 pages)
- Prev/next navigation

Not needed yet (ask before adding): hero, boss/shop blocks, gamepad support block, timeline/flow diagrams beyond a month overview, `GuideImage` (no images in source).

## 7. Cross-links

Deterministic name index: a script builds an index from section titles (and arcana / social-link / dungeon names) and links exact matches in text. Added after the pilot once the pages exist; no guessing, no fuzzy matching. Plus any internal links the source itself carries.

## 8. Pilot

Proposed (user asked me to suggest; not yet confirmed): **Walkthrough April** (`calendar`), **Social Link Yosuke Hanamura/Magician** (`social-link`), **Dungeon Yukiko's Castle** (`dungeon`). Together they cover the calendar, choice-and-points and table-heavy shapes. Review bottlenecks before converting more; arcana, catalog and article shapes follow.

## 9. Next steps

1. User reviews this spec.
2. ~~Adapt `source-importer`, write the parser, import to `canonical-sources/`~~ **Done** (`node scripts/import_source.mjs`; 141 sections, word count check against the raw page matches).
3. ~~Revise the schema and `guide-transformer` for the page types above~~ **Done** (`scripts/p4g/schema.json`; dead Shadow Hearts files removed).
4. Pilot 3 sections: `scaffold`, `check`, QA.
5. Review bottlenecks, then write the P4G `convert-section` skill.
