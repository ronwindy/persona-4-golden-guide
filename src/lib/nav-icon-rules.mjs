// Sidebar icons: category heading -> Lucide icon, plus keyword rules for entry titles.
// An entry with no matching rule inherits its category's icon.

export const NAV_FALLBACK_ICON = 'Dot';

export const NAV_CATEGORY_ICONS = {
  '100% Guide': 'ListChecks',
  Introduction: 'BookOpen',
  'About Persona 4 Golden': 'Info',
  'Gameplay Mechanics': 'Gamepad2',
  Walkthrough: 'Map',
  Dungeons: 'Skull',
  'Persona Compendium': 'Sparkles',
  'Social Links': 'Heart',
  Activities: 'Activity',
  'Skill List': 'Zap',
  'Item List': 'Package',
  'Tips And Tricks': 'Lightbulb',
  Conclusion: 'Flag',
};

// First matching rule wins.
export const NAV_ENTRY_RULES = [
  [/^guide checklist/i, 'ListChecks'],
  [/^copyright/i, 'Copyright'],
  [/faq|frequently/i, 'CircleHelp'],
  [/about this guide/i, 'Info'],
  [/what is persona/i, 'Sparkles'],
  [/ vs\.? /i, 'GitCompareArrows'],
  [/^controls/i, 'Gamepad2'],
  [/field mechanics/i, 'Footprints'],
  [/calendar system/i, 'CalendarDays'],
  [/^social link$/i, 'Heart'],
  [/status parameters/i, 'ChartColumn'],
  [/velvet room/i, 'DoorClosed'],
  [/battle mechanics/i, 'Swords'],
  [/shuffle/i, 'Dices'],
  [/status ailments/i, 'Biohazard'],
  [/new game plus/i, 'RefreshCw'],
  [/tv shopping/i, 'ShoppingCart'],
  [/tv channels/i, 'Tv'],
  [/objectives/i, 'Target'],
  [/important notes/i, 'TriangleAlert'],
  [/current problems/i, 'Bug'],
  [/^(january|february|march|april|may|june|july|august|september|october|november|december)$/i, 'Calendar'],
  [/extra bosses/i, 'Crown'],
  [/^formula/i, 'FlaskConical'],
  [/fusion forecast/i, 'CloudSun'],
  [/^quests$/i, 'ScrollText'],
  [/bug (catching|list)/i, 'Bug'],
  [/fish(ing| list)/i, 'Fish'],
  [/gardening/i, 'Sprout'],
  [/cooking/i, 'CookingPot'],
  [/^books?$|book list/i, 'BookOpen'],
  [/beach|hot springs/i, 'Waves'],
  [/costume/i, 'Shirt'],
  [/daidara|artisan/i, 'Hammer'],
  [/shiroku store/i, 'Store'],
  [/pub$/i, 'Beer'],
  [/part time/i, 'Briefcase'],
  [/lady in white/i, 'Ghost'],
  [/movie/i, 'Clapperboard'],
  [/cafe/i, 'Coffee'],
  [/crane machine/i, 'Gift'],
  [/refrigerator/i, 'Refrigerator'],
  [/models/i, 'Box'],
  [/quiz/i, 'CircleHelp'],
  [/trophies/i, 'Trophy'],
  [/all skills/i, 'Zap'],
  [/skill cards/i, 'Layers'],
  [/party members/i, 'Users'],
  [/weapons/i, 'Sword'],
  [/armor/i, 'Shield'],
  [/accessories/i, 'Watch'],
  [/consumable/i, 'Pill'],
  [/materials/i, 'Boxes'],
  [/gem list/i, 'Gem'],
  [/key items/i, 'KeyRound'],
  [/golden shadow/i, 'Coins'],
  [/best personas/i, 'Star'],
  [/risette/i, 'Mic'],
  [/victory cry/i, 'Megaphone'],
  [/^resources/i, 'Link'],
  [/special thanks/i, 'HeartHandshake'],
  [/final remarks/i, 'MessageSquare'],
  [/version history/i, 'History'],
  [/contact/i, 'Mail'],
  [/update|schedule/i, 'RefreshCw'],
];

export function navCategoryIconName(category) {
  return NAV_CATEGORY_ICONS[category] ?? NAV_FALLBACK_ICON;
}

/** Icon name for a sidebar entry; inherits the category icon when no rule matches. */
export function navEntryIconName(category, title) {
  const t = String(title ?? '');
  const hit = NAV_ENTRY_RULES.find(([re]) => re.test(t));
  return hit ? hit[1] : navCategoryIconName(category);
}
