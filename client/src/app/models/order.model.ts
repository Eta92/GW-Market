import { Item, OrderType, Price, ShopItem, ShopPrice } from './shop.model';

export interface ItemOrders {
  sellOrders: Array<ItemPriceList>;
  buyOrders: Array<ItemPriceList>;
}

export interface ItemPriceList {
  price: Price;
  orders: Array<ItemTimeList>;
}

// New structures for currency-based grouping
export interface CurrencyOrders {
  currencies: Array<CurrencyGroup>;
}

export interface CurrencyGroup {
  currency: Price;
  currencyName: string;
  timeBuckets: Array<TimeBucket>;
  totalOrders: number;
}

export interface TimeBucket {
  time: Time;
  sellOrders: Array<ItemOrder>;
  buyOrders: Array<ItemOrder>;
}

export interface ItemTimeList {
  time: Time;
  orders: Array<ItemOrder>;
}

export interface ItemOrder {
  player: string;
  daybreakOnline: boolean;
  authCertified: boolean;
  item: ShopItem;
  details: Item;
  orderType: OrderType;
  price: ShopPrice;
  description: string;
  quantity: number;
  // front only
  div_price?: number;
  div_quantity?: number;
  // copy from shop
  lastRefresh?: number;
  positives?: number;
  negatives?: number;
  shopId?: string;
}

export enum Time {
  ONLINE,
  TODAY,
  WEEK
}

export interface OrderFilter {
  name: string;
  orderType: string;
  family: string;
  category: string;
  attribute: string;
  reqMin: number;
  reqMax: number;
  inscription: string;
  oldschool: string;
  core: string;
  prefix: string;
  suffix: string;
}

// ================================
// GLOBAL SEARCH TYPES
// ================================

export interface SearchFilter {
  // Text search
  query?: string;

  // Item classification
  family?: string;
  category?: string;

  // Order filters
  orderType?: OrderType;

  // Weapon-specific filters
  attribute?: string;
  reqMin?: number;
  reqMax?: number;
  inscription?: boolean;
  oldschool?: boolean;
  core?: string;
  prefix?: string;
  suffix?: string;

  // Pre-searing filter
  preSearing?: boolean;

  // Pre-nerf filter
  preNerf?: boolean;

  // Miniature-specific filters
  miniDedicated?: boolean;

  // Price filters
  currency?: Price;
  priceMin?: number;
  priceMax?: number;
  priceEachMin?: number;
  priceEachMax?: number;

  // Time/status filters
  timeRange?: 'online' | 'today' | 'week' | 'all';
  onlineOnly?: boolean;
  certifiedOnly?: boolean;

  // Pagination
  limit?: number;
  offset?: number;

  // Sorting
  sortBy?: 'price' | 'priceEach' | 'time' | 'name' | 'quantity';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  orders: Array<SearchResultOrder>;
  total: number;
  aggregations: SearchAggregations;
}

export interface SearchResultOrder {
  name: string;
  orderType: OrderType;
  prices: Array<ShopPrice>;
  quantity: number;
  description?: string;
  player: string;
  daybreakOnline: boolean;
  authCertified: boolean;
  lastRefresh: number;
  weaponDetails?: {
    attribute: string;
    requirement: number;
    inscription: boolean;
    core: string | null;
    prefix: string | null;
    suffix: string | null;
  };
  family: string;
  category: string;
  preSearing?: boolean;
  preNerf?: boolean;
  dedicated?: boolean;
}

export interface SearchAggregations {
  byFamily: { [family: string]: number };
  byCurrency: { [currency: string]: number };
  byOrderType: { sell: number; buy: number };
  priceRange: { min: number; max: number; currency: Price } | null;
  totalSellers: number;
}
