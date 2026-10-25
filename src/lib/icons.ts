import * as lucide from '@lucide/astro';
import { iconNameFor, FALLBACK_ICON } from './icon-rules.mjs';
import { navCategoryIconName, navEntryIconName, NAV_FALLBACK_ICON } from './nav-icon-rules.mjs';

/** Lucide icon component for a slot label or step title (generic fallback when unmapped). */
export function iconFor(text: string | null | undefined) {
  const icons = lucide as unknown as Record<string, any>;
  return icons[iconNameFor(text) ?? FALLBACK_ICON] ?? icons[FALLBACK_ICON];
}

/** Sidebar icon for a category heading. */
export function navCategoryIcon(category: string) {
  const icons = lucide as unknown as Record<string, any>;
  return icons[navCategoryIconName(category)] ?? icons[NAV_FALLBACK_ICON];
}

/** Sidebar icon for a page entry (inherits the category icon when unmapped). */
export function navEntryIcon(category: string, title: string) {
  const icons = lucide as unknown as Record<string, any>;
  return icons[navEntryIconName(category, title)] ?? icons[NAV_FALLBACK_ICON];
}
