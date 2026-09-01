// ============================================
// GW MARKET - WEAPON ATTRIBUTES CONSTANTS
// Guild Wars Primary/Secondary Profession Attributes
// ============================================

export const WEAPON_ATTRIBUTES = [
  // Warrior
  'Strength',
  'Axe Mastery',
  'Hammer Mastery',
  'Swordsmanship',
  'Tactics',
  // Ranger
  'Expertise',
  'Beast Mastery',
  'Marksmanship',
  'Wilderness Survival',
  // Monk
  'Divine Favor',
  'Healing Prayers',
  'Protection Prayers',
  'Smiting Prayers',
  // Necromancer
  'Soul Reaping',
  'Blood Magic',
  'Curses',
  'Death Magic',
  // Mesmer
  'Fast Casting',
  'Domination Magic',
  'Illusion Magic',
  'Inspiration Magic',
  // Elementalist
  'Energy Storage',
  'Air Magic',
  'Earth Magic',
  'Fire Magic',
  'Water Magic',
  // Assassin
  'Critical Strikes',
  'Dagger Mastery',
  'Deadly Arts',
  'Shadow Arts',
  // Ritualist
  'Spawning power',
  'Channeling Magic',
  'Communing',
  'Restoration Magic',
  // Paragon
  'Leadership',
  'Command',
  'Motivation',
  'Spear Mastery',
  // Dervish
  'Mysticism',
  'Earth Prayers',
  'Scythe Mastery',
  'Wind Prayers',
] as const;

export type WeaponAttribute = (typeof WEAPON_ATTRIBUTES)[number];

export const VARIABLE_ATTRIBUTE = [
  // Warrior
  'Strength',
  'Tactics',
  // Monk
  'Divine Favor',
  'Healing Prayers',
  'Protection Prayers',
  'Smiting Prayers',
  // Necromancer
  'Soul Reaping',
  'Blood Magic',
  'Curses',
  'Death Magic',
  // Mesmer
  'Fast Casting',
  'Domination Magic',
  'Illusion Magic',
  'Inspiration Magic',
  // Elementalist
  'Energy Storage',
  'Air Magic',
  'Earth Magic',
  'Fire Magic',
  'Water Magic',
  // Ritualist
  'Spawning power',
  'Channeling Magic',
  'Communing',
  'Restoration Magic',
  // Paragon
  'Leadership',
  'Command',
  'Motivation',
] as const;

export type VariableAttribute = (typeof VARIABLE_ATTRIBUTE)[number];

export const LOCKED_WEAPON = ['Rare Axes', 'Rare Daggers', 'Rare Hammers', 'Rare Scythes', 'Rare Spears', 'Rare Swords', 'Rare Bows'];

export const WEAPON_ATTRIBUTE_MAP: Record<string, WeaponAttribute> = {
  'Rare Axes': 'Axe Mastery',
  'Rare Daggers': 'Dagger Mastery',
  'Rare Hammers': 'Hammer Mastery',
  'Rare Scythes': 'Scythe Mastery',
  'Rare Spears': 'Spear Mastery',
  'Rare Swords': 'Swordsmanship',
  'Rare Bows': 'Marksmanship',
};

export const ATTRIBUTE_COLOR_MAP: Record<WeaponAttribute, string> = {
  Strength: '#EEAA33',
  'Axe Mastery': '#EEAA33',
  'Hammer Mastery': '#EEAA33',
  Swordsmanship: '#EEAA33',
  Tactics: '#EEAA33',
  Expertise: '#55AA00',
  'Beast Mastery': '#55AA00',
  Marksmanship: '#55AA00',
  'Wilderness Survival': '#55AA00',
  'Divine Favor': '#4444BB',
  'Healing Prayers': '#4444BB',
  'Protection Prayers': '#4444BB',
  'Smiting Prayers': '#4444BB',
  'Soul Reaping': '#008822',
  'Blood Magic': '#008822',
  Curses: '#008822',
  'Death Magic': '#008822',
  'Fast Casting': '#9922CC',
  'Domination Magic': '#9922CC',
  'Illusion Magic': '#9922CC',
  'Inspiration Magic': '#9922CC',
  'Energy Storage': '#EE3333',
  'Air Magic': '#EE3333',
  'Earth Magic': '#EE3333',
  'Fire Magic': '#EE3333',
  'Water Magic': '#EE3333',
  'Critical Strikes': '#EE4488',
  'Dagger Mastery': '#EE4488',
  'Deadly Arts': '#EE4488',
  'Shadow Arts': '#EE4488',
  'Spawning power': '#00AAAA',
  'Channeling Magic': '#00AAAA',
  Communing: '#00AAAA',
  'Restoration Magic': '#00AAAA',
  Leadership: '#996600',
  Command: '#996600',
  Motivation: '#996600',
  'Spear Mastery': '#996600',
  Mysticism: '#CCBBAA',
  'Earth Prayers': '#CCBBAA',
  'Scythe Mastery': '#CCBBAA',
  'Wind Prayers': '#CCBBAA',
};

export const PROFESSION_COLOR_MAP: Record<string, string> = {
  Warrior: '#EEAA33',
  Ranger: '#55AA00',
  Monk: '#4444BB',
  Necromancer: '#008822',
  Mesmer: '#9922CC',
  Elementalist: '#EE3333',
  Assassin: '#EE4488',
  Ritualist: '#00AAAA',
  Paragon: '#996600',
  Dervish: '#CCBBAA',
};
