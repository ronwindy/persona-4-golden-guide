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
