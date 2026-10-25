// Minimal text rendering for the placeholder shell: escape HTML, **bold** -> <strong>.
// Rich blocks: { text } paragraphs and { list, items } (nested, as in docs/structured-schema.md).

export type RichList = { list: 'bullet' | 'numbered'; items: RichListItem[] };
export type RichListItem = { text: string; children?: RichList[] };
export type RichBlock = { text: string } | RichList;
export type RichText = string | RichBlock[];

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** **bold** -> <strong> (game terms), then *italic* -> <em> (spoken dialogue); bold may sit inside italic. */
export function inline(text: string | null | undefined): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return escapeHtml(text ?? '')
    .replace(/\[([^\]]+)\]\(guide:([a-z0-9-]+)\)/g, `<a href="${base}/guide/$2">$1</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

type PageListItem = string | { text: string; children: { ordered: boolean; items: PageListItem[] } };

/** Page list (items are strings or { text, children } for sub-points) -> nested <ol>/<ul>. */
export function pageList(l: { ordered: boolean; items: PageListItem[] }): string {
  const tag = l.ordered ? 'ol' : 'ul';
  const items = l.items
    .map((it) =>
      typeof it === 'string' ? `<li>${inline(it)}</li>` : `<li>${inline(it.text)}${pageList(it.children)}</li>`,
    )
    .join('');
  return `<${tag}>${items}</${tag}>`;
}

function renderList(l: RichList): string {
  const tag = l.list === 'numbered' ? 'ol' : 'ul';
  const items = l.items
    .map((it) => `<li>${inline(it.text)}${(it.children ?? []).map(renderList).join('')}</li>`)
    .join('');
  return `<${tag}>${items}</${tag}>`;
}

export function renderRich(text: RichText | null | undefined): string {
  if (!text) return '';
  if (typeof text === 'string') {
    return text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${inline(p)}</p>`)
      .join('');
  }
  return text.map((b) => ('list' in b ? renderList(b) : `<p>${inline(b.text)}</p>`)).join('');
}
