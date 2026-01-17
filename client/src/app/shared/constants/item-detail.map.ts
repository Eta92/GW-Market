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
  summoned_ally: 'Invocation'
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
