// Keyword -> Lucide icon name, shared by the page renderer (icons.ts) and the `check` warning.
// First matching rule wins; extend this list when `check` reports an unmapped title.

export const FALLBACK_ICON = 'Dot';

export const ICON_RULES = [
  // Page and section headings
  [/^(january|february|march|april|may|june|july|august|september|october|november|december)$/i, 'Calendar'],
  [/^(january|february|march|april|may|june|july|august|september|october|november|december) \d/i, 'CalendarDays'],
  [/^introduction/i, 'BookOpen'],
  [/difficulty/i, 'Gauge'],
  [/monthly progress/i, 'ChartColumn'],
  // Time-of-day slot labels
  [/early morning/i, 'Sunrise'],
  [/\bmorning\b/i, 'Sunrise'],
  [/lunchtime/i, 'Utensils'],
  [/after ?school/i, 'School'],
  [/afternoon|daytime/i, 'Sun'],
  [/evening/i, 'Moon'],
  // Step titles
  [/sleep|futon/i, 'Bed'],
  [/lesson/i, 'GraduationCap'],
  [/study/i, 'Pencil'],
  [/\bbooks?\b|\bread\b/i, 'BookOpen'],
  [/trophy|trophies/i, 'Trophy'],
  [/fridge/i, 'Refrigerator'],
  [/vending/i, 'Candy'],
  [/advice/i, 'Lightbulb'],
  [/respon/i, 'MessageSquare'],
  [/phone/i, 'Phone'],
  [/fishing/i, 'Fish'],
  [/bug catching/i, 'Bug'],
  [/gardening/i, 'Sprout'],
  [/day care/i, 'Baby'],
  [/costume/i, 'Shirt'],
  [/metalworks/i, 'Hammer'],
  [/exploration/i, 'Compass'],
  [/fast travel/i, 'MapPin'],
  [/tv world/i, 'Tv'],
  [/shuffle/i, 'Dices'],
  [/shopping/i, 'ShoppingBag'],
  [/part-time|job/i, 'Briefcase'],
  [/money/i, 'Wallet'],
  [/persona/i, 'Sparkles'],
  [/social link|rank \d/i, 'Heart'],
  [/quest/i, 'ScrollText'],
  [/objective/i, 'Target'],
  [/story event/i, 'Star'],
  [/items?\b/i, 'Gift'],
  [/challenge|reaper/i, 'Swords'],
  [/entering your name/i, 'Pencil'],
  [/info/i, 'Info'],
];

/** Icon name for a slot label or step title, or null when no rule matches. */
export function iconNameFor(text) {
  const t = String(text ?? '').replace(/[*_]/g, '');
  const hit = ICON_RULES.find(([re]) => re.test(t));
  return hit ? hit[1] : null;
}
