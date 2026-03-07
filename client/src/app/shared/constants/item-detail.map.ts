/**
 * Shared mapping of item property keys to display labels.
 * Used for displaying item details in shop and item pages.
 */
export const ItemDetailMap: Record<string, string> = {
  family: 'Family',
  'duration_(mins)': 'Duration (mins)',
  'applies_to...': 'Applies to',
  region: 'Usable in',
  stats: 'Stats',
  effect: 'Effect',
  description: 'Description',
  summoned_ally: 'Invocation',
  'OS only': 'OS only',
  craftable: 'Craftable',
  collector: 'Collector only',
  quest: 'Quest only',
  boss: 'Boss drop',
  chest: 'Chest drop',
  box: 'Box drop',
  endgame: 'Endgame reward',
  special: 'Special location',
  lowlevel: 'Non-max item'
};

/**
 * Basic subset of item details for shop view.
 * Contains only the most essential fields.
 */
export const ItemDetailMapBasic: Record<string, string> = {
  family: 'Family',
  'duration_(mins)': 'Duration (mins)',
  'applies_to...': 'Applies to',
  summoned_ally: 'Invocation'
};
