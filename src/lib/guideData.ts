import fs from 'node:fs';
import path from 'node:path';

export interface PageEntry {
  id: string;
  title: string;
  category: string;
}

export interface TocCategory {
  category: string;
  entries: PageEntry[];
}

const DATA_DIR = path.resolve(process.cwd(), 'src/data');

/** Pages in source order, as written by scripts/extract.mjs. */
export function getPages(): PageEntry[] {
  const manifest = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'manifest.json'), 'utf-8'));
  return manifest.pages.map(({ id, title, category }: PageEntry) => ({ id, title, category }));
}

/** Verbatim page markup from the source. */
export function getPageHtml(id: string): string {
  return fs.readFileSync(path.join(DATA_DIR, 'pages', `${id}.html`), 'utf-8');
}

/** Adds a severity class to each callout blockquote, chosen from its bold heading. Text is untouched. */
export function tagCallouts(html: string): string {
  return html.replace(/<blockquote>(?=<p><strong>\s*([^<]*))/g, (_m, heading: string) => {
    const h = heading.trim().toUpperCase();
    const level = h.startsWith('HIGHLY IMPORTANT') ? 'high'
      : h.startsWith('IMPORTANT') || h.startsWith('WARNING') ? 'alert'
      : h.includes('SPOILERS') ? 'spoiler'
      : '';
    return level ? `<blockquote class="callout callout-${level}">` : '<blockquote>';
  });
}

/** Marks "----<br>~April 11th~<br>----" day dividers so CSS can style them as headings. Text is untouched. */
export function tagDateMarkers(html: string): string {
  return html.replace(
    /<p>(-{4,}<br>~)([^~<]+)(~<br>-{4,})<\/p>/g,
    '<p class="date-marker">$1<span class="date-marker-text">$2</span>$3</p>',
  );
}

/** Sidebar data: pages grouped by consecutive category. */
export function getToc(): TocCategory[] {
  const categories: TocCategory[] = [];
  for (const page of getPages()) {
    let cat = categories[categories.length - 1];
    if (!cat || cat.category !== page.category) {
      cat = { category: page.category, entries: [] };
      categories.push(cat);
    }
    cat.entries.push(page);
  }
  return categories;
}

export function getNeighbours(id: string): { prev?: PageEntry; next?: PageEntry } {
  const pages = getPages();
  const at = pages.findIndex((p) => p.id === id);
  return at < 0 ? {} : { prev: pages[at - 1], next: pages[at + 1] };
}
