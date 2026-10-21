// Minimal text rendering for the placeholder shell: escape HTML, **bold** -> <strong>.
// Rich blocks: { text } paragraphs and { list, items } (nested, as in docs/structured-schema.md).

export type RichList = { list: 'bullet' | 'numbered'; items: RichListItem[] };
export type RichListItem = { text: string; children?: RichList[] };
export type RichBlock = { text: string } | RichList;
export type RichText = string | RichBlock[];

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function inline(text: string | null | undefined): string {
  return escapeHtml(text ?? '').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
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
