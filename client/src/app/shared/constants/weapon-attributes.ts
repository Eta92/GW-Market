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

export type WeaponAttribute = typeof WEAPON_ATTRIBUTES[number];
