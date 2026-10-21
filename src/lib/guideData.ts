import fs from 'node:fs';
import path from 'node:path';
import project from '../../project.config.json';

export interface NavRef {
  id: string;
  title?: string;
}

export type Block =
  | { type: 'p'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'callout'; kind: 'note' | 'warning' | 'discrepancy'; blocks: Block[] }
  | { type: 'table'; headers: string[] | null; rows: string[][] }
  | { type: 'info'; items: { label: string; value: string }[] }
  | { type: 'ranks'; ranks: { title: string; scenes: { prompt?: string; options: { label: string; text: string }[] }[] }[] };

export interface GuideSection {
  id: string;
  heading: string | null;
  blocks: Block[];
}

export interface Guide {
  id?: string;
  title?: string;
  type?: string;
  category?: string;
  navigation?: { prev?: NavRef; next?: NavRef };
  sections?: GuideSection[];
}

export interface TocEntry {
  id: string;
  title: string;
  has_structured: boolean;
}

export interface TocCategory {
  category: string;
  entries: TocEntry[];
}

export interface PageTocItem {
  id: string;
  label: string;
  count?: number;
}

const SECTIONS_DIR = path.resolve(process.cwd(), 'structured-content/sections');
const CANONICAL_INDEX = path.resolve(process.cwd(), 'canonical-sources', project.canonicalIndexFile);

export function getAllStructuredSections(): Array<{ id: string; data: { guide: Guide } }> {
  if (!fs.existsSync(SECTIONS_DIR)) return [];
  return fs
    .readdirSync(SECTIONS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((filename) => {
      const data = JSON.parse(fs.readFileSync(path.join(SECTIONS_DIR, filename), 'utf-8'));
      return { id: data.guide?.id || filename.replace('.json', ''), data };
    });
}

function orderedBuilt(): Array<{ id: string; title: string; category: string }> {
  const structured = new Map(getAllStructuredSections().map((s) => [s.id, s]));
  const index: Array<{ id: string; title: string; category?: string }> = fs.existsSync(CANONICAL_INDEX)
    ? JSON.parse(fs.readFileSync(CANONICAL_INDEX, 'utf-8')).sections_index ?? []
    : [];
  return index
    .filter((e) => structured.has(e.id))
    .map((e) => {
      const g = structured.get(e.id)!.data.guide;
      return { id: e.id, title: g.title ?? e.title, category: g.category ?? e.category ?? 'Guide' };
    });
}

/** Sidebar data: built pages only, in source order, grouped by chapter. */
export function getToc(): TocCategory[] {
  const categories: TocCategory[] = [];
  for (const e of orderedBuilt()) {
    let cat = categories[categories.length - 1];
    if (!cat || cat.category !== e.category) {
      cat = { category: e.category, entries: [] };
      categories.push(cat);
    }
    cat.entries.push({ id: e.id, title: e.title, has_structured: true });
  }
  return categories;
}

/** Prev/next among built pages in source order (unbuilt pages are skipped). */
export function getNeighbours(id: string): { prev?: NavRef; next?: NavRef } {
  const built = orderedBuilt();
  const at = built.findIndex((e) => e.id === id);
  if (at < 0) return {};
  const ref = (e?: { id: string; title: string }) => (e ? { id: e.id, title: e.title } : undefined);
  return { prev: ref(built[at - 1]), next: ref(built[at + 1]) };
}

/** Jump links for the right-hand "On this page" column and the mobile drawer. */
export function buildPageToc(guide: Guide): PageTocItem[] {
  return (guide.sections ?? []).filter((s) => s.heading).map((s) => ({ id: s.id, label: s.heading! }));
}
