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
  'Wind Prayers'
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
  'Command',
  'Motivation'
] as const;

export type VariableAttribute = (typeof VARIABLE_ATTRIBUTE)[number];

export const LOCKED_WEAPON = [
  'Rare Axes',
  'Rare Daggers',
  'Rare Hammers',
  'Rare Scythes',
  'Rare Spears',
  'Rare Swords',
  'Rare Bows'
];
