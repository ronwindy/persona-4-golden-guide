// In-page header icons: heading text -> Lucide icon (kebab-case file name in @lucide/astro/src/icons).
// Used at extract time (scripts/lib/transforms.mjs) for part and label headings; `npm run extract`
// regenerates src/styles/header-icons.css for exactly the icons named here.
// First matching rule wins.

export const HEADER_FALLBACK_ICON = 'chevron-right';

export const HEADER_ICON_RULES = [
  // Parts of the day
  [/^early morning$/i, 'sunrise'],
  [/^morning$/i, 'sun'],
  [/^(daytime|midday)$/i, 'sun-medium'],
  [/^lunch(time)?$/i, 'utensils'],
  [/^afternoon$/i, 'sun-dim'],
  [/^after school$/i, 'backpack'],
  [/^evening$/i, 'sunset'],
  [/^(night|late night)$/i, 'moon'],
  [/^(midterms?|finals?|exams?)$/i, 'pencil-line'],
  // Notes and warnings
  [/^note!?$|^known problems|^tips/i, 'triangle-alert'],
  // Story and flags
  [/ending/i, 'flag'],
  [/\bflag\b/i, 'flag'],
  [/^quests?\b|^quest \d|prerequ?isite/i, 'scroll-text'],
  [/^rescue request/i, 'life-buoy'],
  // Social links
  [/spend time|social link|^rank \d+|rank \d+( \(auto\))?$|^invite$|date invite|christmas date|^date\b|^call$|phone call/i, 'heart'],
  [/^(fortune|relationship fortunes)$/i, 'sparkles'],
  // Daily activities
  [/^read$|^books?$|^lesson|^study|group study|homework|tutoring|understanding|translat/i, 'book-open'],
  [/^sleep$|futon/i, 'bed'],
  [/^(response|responses)$|^advice$|^info$/i, 'message-circle'],
  [/trophy|trophies|^exam (reward|results)|prize|reward/i, 'trophy'],
  [/tv shopping|^shopping|vending|junes|shelf|store/i, 'shopping-cart'],
  [/fridge|refrigerator|^lunch$|mega beef bowl|^cooking/i, 'utensils'],
  [/tv (world|classroom|channel)|^tv\b/i, 'tv'],
  [/^model/i, 'box'],
  [/costume/i, 'shirt'],
  [/free time|^home$|day care/i, 'house'],
  [/fishing/i, 'fish'],
  [/gardening/i, 'sprout'],
  [/bug catching/i, 'bug'],
  [/crane game|free money|envelopes|mailbox/i, 'gift'],
  [/scooter/i, 'bike'],
  [/hospital|job|working|hobby shop|metalworks|daidara/i, 'briefcase'],
  [/movies?|poems/i, 'clapperboard'],
  [/pub$|bar$/i, 'beer'],
  // Combat and dungeons
  [/mini ?boss|side ?boss|the reaper|lady in white|boss/i, 'skull'],
  [/investigation|exploration|objective|castle|beach/i, 'search'],
  [/personas? needed|required personas|^persona$|special fusions/i, 'sparkles'],
  [/skills?$/i, 'zap'],
  [/weapons?$|weapon materials/i, 'sword'],
  [/armor|accessories/i, 'shield'],
  [/strengths?|weaknesses|max stats|^stats?|stat list|status/i, 'chart-column'],
  [/^save\b|save abuse/i, 'save'],
  [/fast travel/i, 'map-pin'],
  [/preparations?|new game plus/i, 'list-checks'],
  [/difficulty|money needed|^legend|^version|^introduction|^supporters/i, 'info'],
  [/^items$|gardening items|fishing rod|envelope/i, 'package'],
];

/** Lucide icon (kebab-case) for a header's text. */
export function headerIconName(text) {
  const t = text.replace(/\s+/g, ' ').trim();
  const rule = HEADER_ICON_RULES.find(([re]) => re.test(t));
  return rule ? rule[1] : HEADER_FALLBACK_ICON;
}

/** Every icon name this file can return, for CSS generation. */
export const HEADER_ICON_NAMES = [...new Set([HEADER_FALLBACK_ICON, ...HEADER_ICON_RULES.map((r) => r[1])])];
