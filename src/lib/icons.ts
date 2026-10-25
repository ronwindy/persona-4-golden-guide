import * as lucide from '@lucide/astro';
import { iconNameFor, FALLBACK_ICON } from './icon-rules.mjs';

/** Lucide icon component for a slot label or step title (generic fallback when unmapped). */
export function iconFor(text: string | null | undefined) {
  const icons = lucide as unknown as Record<string, any>;
  return icons[iconNameFor(text) ?? FALLBACK_ICON] ?? icons[FALLBACK_ICON];
}
