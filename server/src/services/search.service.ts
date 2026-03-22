import { SearchAggregations, SearchFilter, SearchResult, SearchResultOrder } from '../models/search.model';
import { Item, OrderType, Price, ShopItem, ShopPrice } from '../models/shop.model';
import { ItemService } from './item.service';
import { ShopService } from './shop.service';

// Time thresholds in milliseconds
const TIME_ONLINE = 1000 * 60 * 15; // 15 minutes
const TIME_TODAY = 1000 * 60 * 60 * 12; // 12 hours
const TIME_WEEK = 1000 * 60 * 60 * 24 * 7; // 7 days

export class SearchService {
  private static getDedicatedStatus(order: ShopItem): boolean | undefined {
    let isDedicated = order.orderDetails?.dedicated;
    if (isDedicated === undefined) {
      const desc = order.description?.toLowerCase() || '';
      if (desc.includes('unded') || desc.includes('undedicated')) {
        isDedicated = false;
      } else if (desc.includes('ded') || desc.includes('dedicated')) {
        isDedicated = true;
      }
    }
    return isDedicated;
  }

  public static searchOrders(filter: SearchFilter): SearchResult {
    const now = Date.now();

    // Collect all matching orders
    const matchingOrders: SearchResultOrder[] = [];
    const aggregations: SearchAggregations = {
      byFamily: {},
      byCurrency: {},
      byOrderType: { sell: 0, buy: 0 },
      priceRange: null,
      totalSellers: 0,
    };
    const uniqueSellers = new Set<string>();

    // Get item names to search through
    let itemNames: string[];

    if (filter.query && filter.query.trim()) {
      // Use Flexsearch for text search, get more results for filtering
      const searchResults = ItemService.searchItemsWithLimit(filter.query, 200);
      itemNames = searchResults.map((item) => item.name);
    } else {
      // Search all items
      itemNames = Object.keys(ShopService.activeItemMap);
    }

    // Filter by family/category at item level first (optimization)
    if (filter.family || filter.category) {
      itemNames = itemNames.filter((name) => {
        const item = ItemService.getItem(name);
        if (!item) return false;
        if (filter.family && item.family !== filter.family) return false;
        if (filter.category && item.category !== filter.category) return false;
        return true;
      });
    }

    // Process each item's orders
    for (const itemName of itemNames) {
      const orders = ShopService.activeItemMap[itemName] || [];
      const itemMeta = ItemService.getItem(itemName);
      if (!itemMeta) continue;

      for (const order of orders) {
        // Apply filters
        if (!this.matchesSearchFilter(order, itemMeta, filter, now)) continue;

        // Determine special flags
        const isPreSearing = order.orderDetails?.pre === true || itemMeta.category === 'Pre-Searing';
        const isDedicated = itemMeta.family === 'miniature' ? this.getDedicatedStatus(order) : undefined;
        const isLegacy = order.orderDetails?.legacy === true;

        // Build enriched result
        const resultOrder: SearchResultOrder = {
          name: order.name,
          orderType: order.orderType,
          prices: order.prices,
          quantity: order.quantity,
          description: order.description,
          player: order.player,
          daybreakOnline: order.daybreakOnline,
          authCertified: order.authCertified,
          lastRefresh: order.lastRefresh,
          weaponDetails: order.weaponDetails,
          family: itemMeta.family,
          category: itemMeta.category,
          preSearing: isPreSearing || undefined,
          legacy: isLegacy || undefined,
          dedicated: isDedicated,
        };

        matchingOrders.push(resultOrder);

        // Update aggregations
        aggregations.byFamily[itemMeta.family] = (aggregations.byFamily[itemMeta.family] || 0) + 1;
        if (order.orderType === OrderType.SELL) aggregations.byOrderType.sell++;
        else aggregations.byOrderType.buy++;

        order.prices.forEach((p) => {
          const currKey = Price[p.type];
          aggregations.byCurrency[currKey] = (aggregations.byCurrency[currKey] || 0) + 1;
        });

        uniqueSellers.add(order.player);
      }
    }

    aggregations.totalSellers = uniqueSellers.size;

    // Sort results
    this.sortSearchOrders(matchingOrders, filter);

    // Calculate price range for filtered results
    if (filter.currency !== undefined && matchingOrders.length > 0) {
      const prices = matchingOrders.flatMap((o) => o.prices.filter((p) => p.type === filter.currency)).map((p) => p.price);
      if (prices.length > 0) {
        aggregations.priceRange = {
          min: Math.min(...prices),
          max: Math.max(...prices),
          currency: filter.currency,
        };
      }
    }

    // Pagination
    const total = matchingOrders.length;
    const offset = filter.offset || 0;
    const limit = filter.limit || 50;
    const paginatedOrders = matchingOrders.slice(offset, offset + limit);

    return {
      orders: paginatedOrders,
      total,
      aggregations,
    };
  }

  private static matchesSearchFilter(order: ShopItem, item: Item, filter: SearchFilter, now: number): boolean {
    // Order type filter
    if (filter.orderType !== undefined && order.orderType !== filter.orderType) {
      return false;
    }

    // Time range filter
    if (filter.timeRange && filter.timeRange !== 'all') {
      const age = now - (order.lastRefresh || 0);
      switch (filter.timeRange) {
        case 'online':
          if (age >= TIME_ONLINE) return false;
          break;
        case 'today':
          if (age >= TIME_TODAY) return false;
          break;
        case 'week':
          // Include all (week is the maximum window)
          break;
      }
    }

    // Online/certified status
    if (filter.onlineOnly && !order.daybreakOnline) return false;
    if (filter.certifiedOnly && !order.authCertified) return false;

    // Weapon details filters
    const wd = order.weaponDetails;
    if (filter.attribute && (!wd || wd.attribute !== filter.attribute)) return false;
    if (filter.reqMin !== undefined && (!wd || wd.requirement < filter.reqMin)) return false;
    if (filter.reqMax !== undefined && (!wd || wd.requirement > filter.reqMax)) return false;
    if (filter.inscription !== undefined && (!wd || wd.inscription !== filter.inscription)) return false;
    if (filter.core && (!wd || wd.core !== filter.core)) return false;
    if (filter.prefix && (!wd || wd.prefix !== filter.prefix)) return false;
    if (filter.suffix && (!wd || wd.suffix !== filter.suffix)) return false;

    // Pre-Searing filter (check orderDetails.pre or item category)
    if (filter.preSearing !== undefined) {
      // First check orderDetails.pre if available
      const isPreSearing = order.orderDetails?.pre === true || item.category === 'Pre-Searing';
      if (filter.preSearing && !isPreSearing) return false;
      if (!filter.preSearing && isPreSearing) return false;
    }

    // Pre-Nerf filter (check orderDetails.legacy or item category)
    if (filter.legacy !== undefined) {
      // First check orderDetails.legacy if available
      const isLegacy = order.orderDetails?.legacy === true;
      if (filter.legacy && !isLegacy) return false;
      if (!filter.legacy && isLegacy) return false;
    }

    // Miniature dedicated filter
    if (filter.miniDedicated !== undefined && item.family === 'miniature') {
      const isDedicated = this.getDedicatedStatus(order);
      if (isDedicated !== undefined) {
        if (filter.miniDedicated && !isDedicated) return false;
        if (!filter.miniDedicated && isDedicated) return false;
      }
    }

    // Price filters (check if ANY price matches criteria)
    const hasPriceFilter =
      filter.currency !== undefined ||
      filter.priceMin !== undefined ||
      filter.priceMax !== undefined ||
      filter.priceEachMin !== undefined ||
      filter.priceEachMax !== undefined;

    if (hasPriceFilter) {
      const qty = order.quantity || 1;
      const matchingPrice = order.prices.find((p) => {
        if (filter.currency !== undefined && p.type !== filter.currency) return false;
        // Total price filters
        if (filter.priceMin !== undefined && p.price < filter.priceMin) return false;
        if (filter.priceMax !== undefined && p.price > filter.priceMax) return false;
        // Per-unit price filters
        const priceEach = p.price / qty;
        if (filter.priceEachMin !== undefined && priceEach < filter.priceEachMin) return false;
        if (filter.priceEachMax !== undefined && priceEach > filter.priceEachMax) return false;
        return true;
      });
      if (!matchingPrice) return false;
    }
    if (filter.goldMin !== undefined || filter.goldMax !== undefined) {
      if (order.orderDetails?.goldPrice === undefined) return false;
      if (filter.goldMin !== undefined && order.orderDetails.goldPrice < filter.goldMin) return false;
      if (filter.goldMax !== undefined && order.orderDetails.goldPrice > filter.goldMax) return false;
    }

    return true;
  }

  private static relativePrice(price: ShopPrice): number {
    switch (price.type) {
      case Price.PLAT:
      case Price.BD:
        return price.price;
      case Price.ECTO:
      case Price.ZKEY:
        return price.price * 10;
      case Price.ARM:
        return price.price * 100;
    }
  }

  private static sortSearchOrders(orders: SearchResultOrder[], filter: SearchFilter): void {
    const sortBy = filter.sortBy || 'time';
    const sortOrder = filter.sortOrder || 'desc';
    const multiplier = sortOrder === 'asc' ? -1 : 1;

    orders.sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return multiplier * ((b.lastRefresh || 0) - (a.lastRefresh || 0));
        case 'name':
          return multiplier * a.name.localeCompare(b.name);
        case 'quantity':
          return multiplier * (a.quantity - b.quantity);
        case 'price': {
          const priceA =
            filter.currency !== undefined
              ? a.prices.find((p) => p.type === filter.currency)?.price || 0
              : this.relativePrice(a.prices[0]) || 0;
          const priceB =
            filter.currency !== undefined
              ? b.prices.find((p) => p.type === filter.currency)?.price || 0
              : this.relativePrice(b.prices[0]) || 0;
          return multiplier * (priceA - priceB);
        }
        case 'priceEach': {
          const priceA =
            filter.currency !== undefined
              ? a.prices.find((p) => p.type === filter.currency)?.price || 0
              : this.relativePrice(a.prices[0]) || 0;
          const priceB =
            filter.currency !== undefined
              ? b.prices.find((p) => p.type === filter.currency)?.price || 0
              : this.relativePrice(b.prices[0]) || 0;
          const eachA = priceA / (a.quantity || 1);
          const eachB = priceB / (b.quantity || 1);
          return multiplier * (eachA - eachB);
        }
        default:
          return 0;
      }
    });
  }
}
