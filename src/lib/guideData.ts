import fs from 'node:fs';
import path from 'node:path';
import project from '../../project.config.json';
import type { RichText } from './text';

export interface NavRef {
  id: string;
  title?: string;
}

export interface Step {
  id: number | string;
  step_number?: number | string;
  title?: string;
  description?: RichText;
  instruction?: string;
}

export interface Guide {
  id?: string;
  title?: string;
  category?: string;
  navigation?: { prev?: NavRef; next?: NavRef };
  steps?: Step[];
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

/** Follows navigation.next from the section that has no prev; off-chain sections keep filename order. */
function orderByNavigation<T extends { id: string; data: { guide: Guide } }>(items: T[]): T[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const hasPrev = (i: T) => {
    const p = i.data.guide.navigation?.prev?.id;
    return !!p && byId.has(p);
  };
  const ordered: T[] = [];
  const seen = new Set<string>();
  for (const start of items.filter((i) => !hasPrev(i))) {
    let cur: T | undefined = start;
    while (cur && !seen.has(cur.id)) {
      ordered.push(cur);
      seen.add(cur.id);
      const nextId: string | undefined = cur.data.guide.navigation?.next?.id;
      cur = nextId ? byId.get(nextId) : undefined;
    }
  }
  for (const i of items) if (!seen.has(i.id)) ordered.push(i);
  return ordered;
}

/** Sidebar / index data: the canonical index gives the full order, structured files fill in the rest. */
export function getToc(): TocCategory[] {
  const structured = new Map(getAllStructuredSections().map((s) => [s.id, s]));
  const entries: Array<{ id: string; title: string; category?: string }> = fs.existsSync(CANONICAL_INDEX)
    ? JSON.parse(fs.readFileSync(CANONICAL_INDEX, 'utf-8')).sections_index ?? []
    : [];
  const indexed = new Set(entries.map((e) => e.id));
  for (const sec of orderByNavigation([...structured.values()])) {
    if (indexed.has(sec.id)) continue;
    const g = sec.data.guide;
    entries.push({ id: sec.id, title: g.title ?? sec.id, category: g.category });
  }

  const categories: TocCategory[] = [];
  for (const e of entries) {
    const g = structured.get(e.id)?.data.guide;
    const category = g?.category || e.category || 'Guide';
    let cat = categories[categories.length - 1];
    if (!cat || cat.category !== category) {
      cat = { category, entries: [] };
      categories.push(cat);
    }
    cat.entries.push({ id: e.id, title: g?.title || e.title || e.id, has_structured: structured.has(e.id) });
  }
  return categories;
}

/** Jump links for the right-hand "On this page" column and the mobile drawer. */
export function buildPageToc(guide: Guide): PageTocItem[] {
  const items: PageTocItem[] = [];
  if (guide.steps?.length) items.push({ id: 'steps', label: 'Steps', count: guide.steps.length });
  return items;
}
