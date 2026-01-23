import { Item, OrderType, Price, Shop, ShopItem } from '../models/shop.model';
import { SearchAggregations, SearchFilter, SearchResult, SearchResultOrder } from '../models/search.model';
import { TimeOrderCounts } from '../models/tree.model';
import { ItemService } from './item.service';
import { Server as SocketServer } from 'socket.io';
import { nanoid } from 'nanoid';

// Time thresholds in milliseconds
const TIME_ONLINE = 1000 * 60 * 15; // 15 minutes
const TIME_TODAY = 1000 * 60 * 60 * 12; // 12 hours

export class ShopService {
  public static shopInit = false;
  public static allShops: Array<Shop> = [];
  public static allShopMap: { [key: string]: Shop } = {};
  public static allItemMap: { [key: string]: Array<ShopItem> } = {};
  public static activeShops: Array<Shop> = [];
  public static activeShopMap: { [key: string]: Shop } = {};
  public static activeItemMap: { [key: string]: Array<ShopItem> } = {};
  public static activeOrderMap: { [key: string]: TimeOrderCounts } = {};
  public static lastItemMap: { [key: string]: Array<ShopItem> } = {};
  public static publicShopMap: { [key: string]: string } = {};
  public static itemToRefresh: Set<string> = new Set<string>();
  public static shopCertificationPending: { [key: string]: { uuid: string; player: string; socket: any; secret: string } } = {};
  public static certifiedPlayers: { [key: string]: string } = {};
  public static io: SocketServer;

  public static Init(io: SocketServer): void {
    this.io = io;
    this.shopInit = true;
    setInterval(() => {
      this.refreshShops();
    }, 1000);
  }

  public static getItemOrders(itemName: string): Array<ShopItem> {
    return this.allItemMap[itemName] || [];
  }

  public static initShops(shops: Array<Shop>): void {
    shops.forEach((shop) => {
      if (shop && shop.uuid) {
        this.allShopMap[shop.uuid] = shop;
        this.publicShopMap[shop.publicId || ''] = shop.uuid;
        if (Date.now() - shop.lastRefresh < 1000 * 60 * 15) {
          this.activeShopMap[shop.uuid] = shop;
        }
        shop.items.forEach((item) => this.itemToRefresh.add(item.name));
        shop.certified?.forEach((player) => {
          this.certifiedPlayers[player] = shop.uuid;
        });
      }
    });
    this.refreshShops(true);
  }

  public static isShopUpToDate(uuid: string, lastRefresh: number, socket: any): void {
    const shop = this.allShopMap[uuid];
    if (shop && shop.lastRefresh > lastRefresh) {
      socket.emit('RefreshShop', { ...shop, _id: undefined, lastIP: undefined });
    }
  }

  public static refreshShop(rawShop: Shop, socket: any): void {
    const ip = socket.data.ip;
    if (rawShop) {
      // control shop validity
      if (
        !Array.isArray(rawShop.items) ||
        rawShop.items.some((item) => typeof item === 'string') ||
        typeof rawShop.player !== 'string' ||
        (rawShop.uuid && typeof rawShop.uuid !== 'string')
      ) {
        console.log('Invalid shop data received from IP ' + ip);
        socket.emit('ToasterError', 'Invalid shop data format. Please repair it via import/export, or contact the support.');
        return;
      }
      if (this.certifiedPlayers[rawShop.player] && this.certifiedPlayers[rawShop.player] !== rawShop.uuid) {
        console.log('Player ' + rawShop.player + ' is already certified for another shop. Rejecting shop from IP ' + ip);
        socket.emit('ToasterError', 'This player name is certified in another shop. Please use your own character or contact the support.');
        return;
      }
      // build a shop myself to prevent fields injection
      const shop: Shop = {
        uuid: rawShop.uuid,
        player: rawShop.player,
        items: rawShop.items,
        daybreakOnline: rawShop.daybreakOnline,
      };
      // if a shop is new, assign a uuid and clear potential old IP based shops
      if (!shop.uuid) {
        shop.uuid = nanoid(10);
      }
      // (prepare public shop ids)
      if (!shop.publicId) {
        shop.publicId = nanoid(10);
      }
      this.publicShopMap[shop.publicId] = shop.uuid;
      // update and save data in ram and in database
      shop.lastRefresh = Date.now();
      const shopToSave = this.allShopMap[shop.uuid] ? { ...this.allShopMap[shop.uuid], ...shop } : shop;
      this.allShopMap[shop.uuid] = shopToSave;
      this.activeShopMap[shop.uuid] = shopToSave;
      this.allShopMap[shop.uuid] = shopToSave;
      shop.items.forEach((item) => this.itemToRefresh.add(item.name));
      this.refreshShops(true);
      socket.emit('RefreshShop', shopToSave);
    }
  }

  public static closeShop(uuid: string): void {
    if (this.allShopMap[uuid]) {
      this.allShopMap[uuid].lastRefresh = Date.now() - 1000 * 60 * 15;
    }
    if (this.activeShopMap[uuid]) {
      this.activeShopMap[uuid].items.forEach((item) => this.itemToRefresh.add(item.name));
      delete this.activeShopMap[uuid];
      this.refreshShops(true);
    }
  }

  private static refreshShops(update = false): void {
    let applyUpdate = update;
    const now = Date.now();
    for (const ip in this.activeShopMap) {
      const shop = this.activeShopMap[ip];
      if (now - shop.lastRefresh >= 1000 * 60 * 15) {
        applyUpdate = true;
        shop.items.forEach((item) => this.itemToRefresh.add(item.name));
        delete this.activeShopMap[ip];
      }
    }
    if (applyUpdate) {
      this.allShops = Object.values(this.allShopMap);
      this.activeShops = Object.values(this.activeShopMap);
      console.log('Active shops: ');
      this.activeShops.forEach((s) => console.log(' - ' + s.player + ' = ' + s.items.length));
      this.refreshItems();
      this.refreshLastItems();
    }
  }

  public static getPublicShop(publicId: string): Shop | null {
    const uuid = this.publicShopMap[publicId];
    const shop = this.allShopMap[uuid] || null;
    if (shop) {
      const limitedShop: Shop = {
        publicId: shop.publicId,
        player: shop.player,
        lastRefresh: shop.lastRefresh,
        daybreakOnline: shop.daybreakOnline,
        items: shop.items,
        certified: shop.certified,
      };
      return limitedShop;
    }
    return null;
  }

  private static refreshItems(): void {
    this.allItemMap = {};
    this.allShops.forEach((shop) => {
      shop.items.forEach((item) => {
        item.player = shop.player;
        item.daybreakOnline = shop.daybreakOnline;
        item.authCertified = shop.certified?.includes(item.player);
        item.lastRefresh = shop.lastRefresh;
        if (!this.allItemMap[item.name]) {
          this.allItemMap[item.name] = [];
        }
        this.allItemMap[item.name].push(item);
      });
    });
    this.activeItemMap = {};
    this.activeShops.forEach((shop) => {
      shop.items.forEach((item) => {
        item.player = shop.player;
        item.daybreakOnline = shop.daybreakOnline;
        item.authCertified = shop.certified?.includes(item.player);
        item.lastRefresh = shop.lastRefresh;
        if (!this.activeItemMap[item.name]) {
          this.activeItemMap[item.name] = [];
        }
        this.activeItemMap[item.name].push(item);
      });
    });
    // TODO update all socket threads
    this.refreshAvailableOrders();
    this.itemToRefresh.clear();
  }

  private static refreshAvailableOrders(): void {
    this.activeOrderMap = {};
    const now = Date.now();

    Object.keys(this.allItemMap).forEach((itemName) => {
      const shopItems = this.allItemMap[itemName];
      const counts: TimeOrderCounts = {
        sellNow: 0,
        buyNow: 0,
        sellDay: 0,
        buyDay: 0,
        sellWeek: 0,
        buyWeek: 0,
      };

      shopItems.forEach((item) => {
        const age = now - (item.lastRefresh || 0);
        const isSell = item.orderType === OrderType.SELL;

        // Time-bucketed counts
        if (age < 1000 * 60 * 60 * 24 * 7) {
          if (isSell) counts.sellWeek++;
          else counts.buyWeek++;
          if (age < 1000 * 60 * 60 * 12) {
            if (isSell) counts.sellDay++;
            else counts.buyDay++;
            if (age < 1000 * 60 * 15) {
              if (isSell) counts.sellNow++;
              else counts.buyNow++;
            }
          }
        }
      });
      this.activeOrderMap[itemName] = counts;
    });

    if (this.io) {
      this.io.emit('GetAvailableOrders', this.activeOrderMap);
    }
  }

  private static refreshLastItems(): void {
    this.lastItemMap = {};
    const orderShops = this.allShops.sort((a, b) => b.lastRefresh - a.lastRefresh);
    orderShops.forEach((shop) => {
      shop.items.forEach((order) => {
        const item = ItemService.getItem(order.name);
        if (item) {
          this.upsertLastItem(order, item.category);
          this.upsertLastItem(order, item.family);
          this.upsertLastItem(order, 'all');
        }
      });
    });
  }

  private static upsertLastItem(order: ShopItem, family: string): void {
    const list = this.lastItemMap[family];
    const existing = list?.find((o) => o.name === order.name && o.orderType === order.orderType);
    if (existing) {
      existing.quantity += order.quantity;
      order.prices.forEach((price) => {
        const existingPrice = existing.prices.find((p) => p.type === price.type);
        if (existingPrice) {
          if (price.price / price.quantity < existingPrice.price) {
            existingPrice.price = price.price / order.quantity;
            existingPrice.quantity = order.quantity;
          }
        } else {
          existing.prices.push({ type: price.type, price: price.price / order.quantity, quantity: order.quantity });
        }
      });
    } else if ((this.lastItemMap[family]?.length || 0) < 100) {
      const newOrder: ShopItem = {
        name: order.name,
        orderType: order.orderType,
        prices: order.prices.map((p) => ({ type: p.type, price: p.price / order.quantity, quantity: order.quantity })),
        quantity: order.quantity,
        lastRefresh: order.lastRefresh,
      };
      if (!this.lastItemMap[family]) {
        this.lastItemMap[family] = [];
      }
      this.lastItemMap[family].push(newOrder);
    }
  }

  public static getLastItemsByFamily(family: string): Array<ShopItem> {
    return this.lastItemMap[family] || [];
  }

  public static getAvailableOrders(): any {
    return this.activeOrderMap;
  }

  // ================================
  // ==== GLOBAL SEARCH ====
  // ================================

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
      itemNames = Object.keys(this.allItemMap);
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
      const orders = this.allItemMap[itemName] || [];
      const itemMeta = ItemService.getItem(itemName);
      if (!itemMeta) continue;

      for (const order of orders) {
        // Apply filters
        if (!this.matchesSearchFilter(order, itemMeta, filter, now)) continue;

        // Determine special flags
        const isPreSearing = order.orderDetails?.pre === true || itemMeta.category === 'Pre-Searing';
        const isDedicated = itemMeta.family === 'miniature' ? this.getDedicatedStatus(order) : undefined;

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
    if (filter.oldschool === true && (!wd || !wd.oldschool)) return false;
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

    return true;
  }

  private static sortSearchOrders(orders: SearchResultOrder[], filter: SearchFilter): void {
    const sortBy = filter.sortBy || 'time';
    const sortOrder = filter.sortOrder || 'desc';
    const multiplier = sortOrder === 'asc' ? 1 : -1;

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
            filter.currency !== undefined ? a.prices.find((p) => p.type === filter.currency)?.price || 0 : a.prices[0]?.price || 0;
          const priceB =
            filter.currency !== undefined ? b.prices.find((p) => p.type === filter.currency)?.price || 0 : b.prices[0]?.price || 0;
          return multiplier * (priceA - priceB);
        }
        case 'priceEach': {
          const priceA =
            filter.currency !== undefined ? a.prices.find((p) => p.type === filter.currency)?.price || 0 : a.prices[0]?.price || 0;
          const priceB =
            filter.currency !== undefined ? b.prices.find((p) => p.type === filter.currency)?.price || 0 : b.prices[0]?.price || 0;
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
