import { OrderType, Price, ShopPrice, WeaponDetails } from './shop.model';

export interface SearchFilter {
  // Text search
  query?: string; // Search item names (uses Flexsearch)

  // Item classification
  family?: string; // weapon, consumable, upgrade, etc.
  category?: string; // Rare Swords, Materials, etc.

  // Order filters
  orderType?: OrderType; // SELL (0) or BUY (1), undefined = both

  // Weapon-specific filters
  attribute?: string; // Fire, Marksmanship, etc.
  reqMin?: number; // Minimum requirement (0-13)
  reqMax?: number; // Maximum requirement (0-13)
  inscription?: boolean; // undefined = any, true = inscr, false = OS
  oldschool?: boolean; // true = OS only
  core?: string; // Specific inscription name
  prefix?: string; // Specific prefix mod
  suffix?: string; // Specific suffix mod

  // Pre-Searing filter
  preSearing?: boolean; // true = pre-searing only, false = post-searing only

  // Pre-Nerf filter
  preNerf?: boolean; // true = legacy only, false = normal only

  // Miniature-specific filters
  miniDedicated?: boolean; // true = dedicated, false = undedicated

  // Price filters
  currency?: Price; // Filter by currency type
  priceMin?: number; // Minimum total price
  priceMax?: number; // Maximum total price
  priceEachMin?: number; // Minimum price per unit
  priceEachMax?: number; // Maximum price per unit

  // Time/status filters
  timeRange?: 'online' | 'today' | 'week' | 'all';
  onlineOnly?: boolean; // Only daybreakOnline = true
  certifiedOnly?: boolean; // Only authCertified = true

  // Pagination
  limit?: number; // Max results (default 50)
  offset?: number; // Skip N results

  // Sorting
  sortBy?: 'price' | 'priceEach' | 'time' | 'name' | 'quantity';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  orders: Array<SearchResultOrder>;
  total: number; // Total matching (before pagination)
  aggregations: SearchAggregations;
}

export interface SearchResultOrder {
  // From ShopItem
  name: string;
  orderType: OrderType;
  prices: Array<ShopPrice>;
  quantity: number;
  description?: string;
  player: string;
  daybreakOnline: boolean;
  authCertified: boolean;
  lastRefresh: number;
  weaponDetails?: WeaponDetails;

  // Enriched with Item metadata
  family: string;
  category: string;

  // Special flags
  preSearing?: boolean;
  dedicated?: boolean;
  preNerf?: boolean;
}

// Re-export WeaponDetails for convenience
export { WeaponDetails };

export interface SearchAggregations {
  byFamily: { [family: string]: number };
  byCurrency: { [currency: string]: number };
  byOrderType: { sell: number; buy: number };
  priceRange: { min: number; max: number; currency: Price } | null;
  totalSellers: number;
}
