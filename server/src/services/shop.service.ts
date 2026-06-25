import { nanoid } from 'nanoid';
import { Socket, Server as SocketServer } from 'socket.io';
import { SyncHelper } from '../helpers/sync.helper';
import { UtilityHelper } from '../helpers/utility.helper';
import { Auction } from '../models/auction.model';
import { PriceInspection } from '../models/inspection.model';
import { MessageType } from '../models/message.model';
import { ReputationReason } from '../models/reputation.model';
import { OrderType, Shop, ShopItem, ShopPrice } from '../models/shop.model';
import { TimeOrderCounts } from '../models/tree.model';
import { AuctionService } from './auction.service';
import { ItemService } from './item.service';
import { KamadanService } from './kamadan.service';
import { MessageService } from './message.service';
import { MongoService } from './mongo.service';
import { OverviewService } from './overview.service';

// Time thresholds in milliseconds
const TIME_ONLINE = 1000 * 60 * 15; // 15 minutes
const TIME_TODAY = 1000 * 60 * 60 * 12; // 12 hours
const TIME_WEEK = 1000 * 60 * 60 * 24 * 7; // 7 days

export class ShopService {
  public static shopInit = false;
  // public static searchIndex: Index;
  // public static searchToShop: { [key: string]: Shop } = {};
  public static nameToPublic: { [key: string]: string } = {};
  //public static allShops: Array<Shop> = [];
  public static allShopMap: { [key: string]: Shop } = {};
  //public static allItemMap: { [key: string]: Array<ShopItem> } = {};
  public static activeShops: Array<Shop> = [];
  public static activeShopMap: { [key: string]: Shop } = {};
  public static activeItemMap: { [key: string]: Array<ShopItem> } = {};
  public static activeOrderMap: { [key: string]: TimeOrderCounts } = {};
  public static onlineShops: Array<Shop> = [];
  public static onlineShopMap: { [key: string]: Shop } = {};
  public static lastItemMap: { [key: string]: Array<ShopItem> } = {};
  public static publicShopMap: { [key: string]: string } = {};
  public static itemToRefresh: Set<string> = new Set<string>();
  public static shopCertificationPending: { [key: string]: { uuid: string; player: string; socket: any; secret: string } } = {};
  public static certifiedPlayers: { [key: string]: string } = {};
  public static lastShopRefresh = 0;
  public static isShopRefreshing = false;
  public static io: SocketServer;

  // region INIT

  public static init(io: SocketServer): void {
    this.io = io;
    this.shopInit = true;
    SyncHelper.initShops();
    setInterval(() => {
      this.refreshShops();
    }, 1000);
  }

  public static getItemOrders(itemName: string): Array<ShopItem> {
    return this.activeItemMap[itemName] || [];
  }

  private static setPrice(prices: Array<ShopPrice>, order: ShopItem): void {
    order.prices.forEach((price) => {
      const unit = price.price / order.quantity;
      const minPrice = prices.find((p) => p.type === price.type);
      if (minPrice.quantity === 0) {
        minPrice.price = unit;
        minPrice.quantity = order.quantity;
      } else if (minPrice.price > unit) {
        minPrice.price = unit;
        minPrice.quantity = order.quantity;
      } else if (minPrice.price === unit) {
        minPrice.quantity += order.quantity;
      }
    });
  }

  public static getItemPrices(itemName: string, orderType: OrderType): PriceInspection {
    const orders = this.getItemOrders(itemName);
    const inspection: PriceInspection = {
      active: [],
      day: [],
      week: [],
    };
    // Initialize all categories with empty prices for each currency type
    for (let priceType = 0; priceType < 5; priceType++) {
      const emptyPrice: ShopPrice = {
        type: priceType,
        price: 0,
        quantity: 0,
      };
      inspection.active.push({ ...emptyPrice });
      inspection.day.push({ ...emptyPrice });
      inspection.week.push({ ...emptyPrice });
    }
    orders.forEach((order) => {
      if (order.orderType === orderType) {
        const age = Date.now() - order.lastRefresh;
        if (age < TIME_ONLINE) {
          this.setPrice(inspection.active, order);
        }
        if (age < TIME_TODAY) {
          this.setPrice(inspection.day, order);
        }
        this.setPrice(inspection.week, order);
      }
    });
    return inspection;
  }

  public static initShops(shops: Array<Shop>): void {
    // main shop init
    shops.forEach((shop) => {
      if (shop && shop.uuid) {
        this.allShopMap[shop.uuid] = shop;
        this.publicShopMap[shop.publicId || ''] = shop.uuid;
        if (Date.now() - shop.lastRefresh < TIME_ONLINE) {
          this.onlineShopMap[shop.uuid] = shop;
          this.activeShopMap[shop.uuid] = shop;
        } else if (Date.now() - shop.lastRefresh < TIME_WEEK) {
          this.activeShopMap[shop.uuid] = shop;
        }
        shop.items.forEach((item) => this.itemToRefresh.add(item.name));
        shop.certified?.forEach((player) => {
          this.certifiedPlayers[player] = shop.uuid;
        });
      }
    });
    // reputation reflection
    shops.forEach((shop) => {
      if (shop.reputation) {
        shop.reputation.history.forEach((vote) => {
          const otherShop = this.allShopMap[this.certifiedPlayers[vote.from]];
          if (otherShop) {
            if (!otherShop.notations) {
              otherShop.notations = {};
            }
            otherShop.notations[shop.publicId || ''] = vote.type;
          }
        });
      }
    });
    // recruit reflexion
    shops.forEach((shop) => {
      if (shop.recruiter) {
        const recruiterShop = this.allShopMap[this.publicShopMap[shop.recruiter.shopId]];
        if (recruiterShop) {
          if (!recruiterShop.recruits) {
            recruiterShop.recruits = [];
          }
          recruiterShop.recruits.push({
            shopId: shop.publicId || '',
            name: shop.player,
            points: Math.floor(Math.log2(shop.items.length + 1)),
            lastRefresh: shop.lastRefresh,
          });
        }
      }
    });
    this.refreshShops(true);
    // overview init
    if (!OverviewService.overviewInit) {
      OverviewService.init();
    }
  }

  // ====================
  // region REFRESH SHOPS
  // ====================

  private static findShopByIp(ip: string): Shop | null {
    for (const uuid in this.allShopMap) {
      const shop = this.allShopMap[uuid];
      if (shop.lastIP === ip) {
        return shop;
      }
    }
    return null;
  }

  public static isShopUpToDate(uuid: string, lastRefresh: number, socket: any): void {
    const shop = this.allShopMap[uuid];
    if (uuid && uuid !== '' && shop) {
      // bind socket personal channel to get updates
      socket.join(uuid);
      if (shop.lastRefresh > lastRefresh) {
        this.io.to(uuid).emit('RefreshShop', { ...shop, _id: undefined, lastIP: undefined });
      }
    }
  }

  public static async refreshShop(rawShop: Shop, socket: any): Promise<Shop | null> {
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
        socket.emit(
          'ToasterError',
          'This player name is certified in another shop. Please use your own character / use the certification again or contact the support.'
        );
        return;
      }
      // build a shop myself to prevent fields injection
      const shop: Shop = {
        uuid: rawShop.uuid,
        player: rawShop.player,
        items: rawShop.items.map((item) => ({
          ...item,
          id: item.id || nanoid(10),
          listedTime: item.listedTime || Date.now(),
          player: undefined,
          daybreakOnline: undefined,
          authCertified: undefined,
          positives: undefined,
          negatives: undefined,
          shopId: undefined,
          lastRefresh: undefined,
        })),
        daybreakOnline: rawShop.daybreakOnline,
      };
      if (rawShop.recruiter?.shopId && !rawShop.recruiter.name) {
        const recruiterShop = this.allShopMap[this.publicShopMap[rawShop.recruiter.shopId]];
        if (recruiterShop && recruiterShop.uuid !== shop.uuid) {
          shop.recruiter = {
            shopId: rawShop.recruiter.shopId,
            name: recruiterShop.player,
          };
          if (!recruiterShop.recruits) {
            recruiterShop.recruits = [];
          }
          recruiterShop.recruits.push({
            shopId: shop.publicId || '',
            name: shop.player,
            points: Math.floor(Math.log2(shop.items.length + 1)),
            lastRefresh: Date.now(),
          });
          recruiterShop.lastRefresh++;
        }
      }
      // if a shop is new, assign a uuid and clear potential old IP based shops
      if (!shop.uuid) {
        shop.uuid = nanoid(10);
      }
      // if another shop share the same IP and is not using the same uuid, force the update based on the IP
      const otherShop = this.findShopByIp(ip);
      if (otherShop && otherShop.uuid !== shop.uuid) {
        ///await MongoService.upsertBackupShop(otherShop);
        otherShop.lastRefresh = Date.now() - TIME_WEEK * 2; // remove any ability to use multiple shops on the same IP
        await MongoService.upsertShop(otherShop);
        delete this.onlineShopMap[otherShop.uuid];
        delete this.allShopMap[otherShop.uuid];
        delete this.activeShopMap[otherShop.uuid];
      }
      // merge local and received shop data
      shop.lastIP = ip;
      shop.lastRefresh = Date.now();
      const shopToSave = this.allShopMap[shop.uuid] ? { ...this.allShopMap[shop.uuid], ...shop } : shop;
      // (prepare public shop ids)
      if (!shopToSave.publicId) {
        shopToSave.publicId = nanoid(10);
        this.publicShopMap[shopToSave.publicId] = shopToSave.uuid;
      }
      OverviewService.logRefresh(shopToSave.publicId);
      shop.items.forEach((item) => this.itemToRefresh.add(item.name));
      return await this.completeShopSave(shopToSave, socket);
    }
  }

  private static async completeShopSave(shopToSave: Shop, socket: any): Promise<Shop> {
    // update shops in RAM
    this.onlineShopMap[shopToSave.uuid] = shopToSave;
    this.activeShopMap[shopToSave.uuid] = shopToSave;
    this.allShopMap[shopToSave.uuid] = shopToSave;
    // update shop in DB and user cache
    await MongoService.upsertShop(shopToSave);
    socket.join(shopToSave.uuid);
    const shopToSend = { ...shopToSave, _id: undefined, lastIP: undefined };
    this.io.to(shopToSave.uuid).emit('RefreshShop', shopToSend);
    // refresh at last to not enrich shop item for user and DB
    this.refreshShops(true);
    return shopToSend;
  }

  public static async addShopItem(uuid: string, item: ShopItem, socket: any): Promise<Shop | null> {
    const shop = this.allShopMap[uuid];
    if (shop) {
      item.id = nanoid(10);
      shop.items.push(item);
      shop.lastRefresh = Date.now();
      this.itemToRefresh.add(item.name);
      return await this.completeShopSave(shop, socket);
    }
    return null;
  }

  public static async updateShopItem(uuid: string, item: ShopItem, socket: any): Promise<Shop | null> {
    const shop = this.allShopMap[uuid];
    if (shop) {
      const replaced = shop.items.some((i) => i.id === item.id);
      if (replaced) {
        shop.items = shop.items.map((i) => (i.id === item.id ? item : i));
        shop.lastRefresh = Date.now();
        this.itemToRefresh.add(item.name);
        return await this.completeShopSave(shop, socket);
      }
    }
    return null;
  }

  public static async removeShopItem(uuid: string, item: ShopItem, socket: any): Promise<Shop | null> {
    const shop = this.allShopMap[uuid];
    if (shop) {
      const removed = shop.items.some((i) => i.id === item.id);
      if (removed) {
        shop.items = shop.items.filter((i) => i.id !== item.id);
        shop.lastRefresh = Date.now();
        this.itemToRefresh.add(item.name);
        console.log('item removed');
        return await this.completeShopSave(shop, socket);
      }
    }
    return null;
  }

  public static closeShop(uuid: string): void {
    const activeShop = this.activeShopMap[uuid];
    if (activeShop) {
      const bonus = (activeShop.reputation?.positive || 0) - (activeShop.reputation?.negative || 0);
      activeShop.lastRefresh = Date.now() - TIME_ONLINE - bonus * 60 * 1000;
    }
    if (this.onlineShopMap[uuid]) {
      this.onlineShopMap[uuid].items.forEach((item) => this.itemToRefresh.add(item.name));
      delete this.onlineShopMap[uuid];
      this.refreshShops(true);
    }
  }

  private static refreshShops(update = false): void {
    let applyUpdate = update;
    const now = Date.now();
    for (const uuid in this.onlineShopMap) {
      const shop = this.onlineShopMap[uuid];
      if (now - shop.lastRefresh >= TIME_ONLINE) {
        applyUpdate = true;
        shop.items.forEach((item) => this.itemToRefresh.add(item.name));
        delete this.onlineShopMap[uuid];
      }
    }
    for (const uuid in this.activeShopMap) {
      const shop = this.activeShopMap[uuid];
      if (now - shop.lastRefresh >= TIME_WEEK) {
        applyUpdate = true;
        shop.items.forEach((item) => this.itemToRefresh.add(item.name));
        delete this.activeShopMap[uuid];
      }
    }
    const timeSinceLastRefresh = Date.now() - this.lastShopRefresh;
    if (applyUpdate || timeSinceLastRefresh > 2 * 60 * 1000) {
      this.onlineShops = Object.values(this.onlineShopMap);
      this.activeShops = Object.values(this.activeShopMap);
      console.log('Active shops: ');
      this.onlineShops.forEach((s) => console.log(' - ' + s.player + ' = ' + s.items.length));
      this.prepareSearch();
      this.refreshItems();
    }
  }

  // ====================
  // region REFRESH ITEMS
  // ====================

  private static prepareSearch(): void {
    // this.searchIndex = new Index({
    //   tokenize: 'full',
    //   resolution: 100,
    // });
    // this.searchToShop = {};
    // let searchIndexing = 0;    this.nameToPublic = {};
    // Index both online shops and active (< 7 days) shops so no player is missed
    const allSearchableShops = [...this.onlineShops, ...this.activeShops];
    allSearchableShops.forEach((shop) => {
      if (shop.publicId) {
        shop.certified?.forEach((player) => {
          //     this.searchIndex.add(searchIndexing, player);
          //  this.searchToShop[searchIndexing] = shop;
          //     searchIndexing++;
          this.nameToPublic[player] = shop.publicId || '';
        });
        if (!shop.certified || !shop.certified.includes(shop.player)) {
          //     this.searchIndex.add(searchIndexing, shop.player);
          //     this.searchToShop[searchIndexing] = shop;
          //     searchIndexing++;
          this.nameToPublic[shop.player] = shop.publicId || '';
        }
      }
    });
  }

  public static getShop(uuid: string): Shop | null {
    const shop = this.allShopMap[uuid] || null;
    if (shop) {
      return { ...shop, _id: undefined, lastIP: undefined };
    }
    return null;
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
        auctions: shop.auctions,
        certified: shop.certified,
        reputation: shop.reputation,
      };
      return limitedShop;
    }
    return null;
  }

  private static refreshItems(): void {
    const timeSinceLastRefresh = Date.now() - this.lastShopRefresh;
    if (timeSinceLastRefresh < 30000) {
      if (!this.isShopRefreshing) {
        this.isShopRefreshing = true;
        setTimeout(() => {
          this.refreshItems();
          this.isShopRefreshing = false;
        }, 31000 - timeSinceLastRefresh);
      }
      return;
    }
    this.lastShopRefresh = Date.now();
    // this.allItemMap = {};
    // this.allShops.forEach((shop) => {
    //   shop.items.forEach((item) => {
    //     item.player = shop.player;
    //     item.daybreakOnline = shop.daybreakOnline;
    //     item.authCertified = shop.certified?.includes(item.player);
    //     item.lastRefresh = shop.lastRefresh;
    //     if (!this.allItemMap[item.name]) {
    //       this.allItemMap[item.name] = [];
    //     }
    //     this.allItemMap[item.name].push(item);
    //   });
    // });
    this.activeItemMap = {};
    this.activeShops.forEach((shop) => {
      const isCertified = shop.certified?.includes(shop.player);
      shop.items
        .filter((item) => !item.hidden)
        .forEach((item) => {
          item.player = shop.player;
          item.daybreakOnline = shop.daybreakOnline;
          item.authCertified = isCertified;
          item.positives = shop.reputation?.positive || 0;
          item.negatives = shop.reputation?.negative || 0;
          item.shopId = shop.publicId;
          item.lastRefresh = shop.lastRefresh;
          if (!this.activeItemMap[item.name]) {
            this.activeItemMap[item.name] = [];
          }
          this.activeItemMap[item.name].push(item);
        });
    });
    const kamadanOrders = KamadanService.getKamadanOrders();
    kamadanOrders.forEach((order) => {
      if (!this.activeItemMap[order.name]) {
        this.activeItemMap[order.name] = [];
      }
      this.activeItemMap[order.name].push({
        ...order,
      });
    });
    // update all socket threads
    if (this.io) {
      this.itemToRefresh.forEach((itemName) => {
        this.io.to(itemName).emit('GetItemOrders', this.activeItemMap[itemName], itemName);
      });
    }
    this.refreshAvailableOrders();
    this.refreshLastItems();
    this.itemToRefresh.clear();
  }

  private static refreshAvailableOrders(): void {
    this.activeOrderMap = {};
    const now = Date.now();

    Object.keys(this.activeItemMap).forEach((itemName) => {
      const shopItems = this.activeItemMap[itemName];
      const counts: TimeOrderCounts = {
        sellNow: 0,
        buyNow: 0,
        auctionNow: 0,
        sellDay: 0,
        buyDay: 0,
        auctionDay: 0,
        sellWeek: 0,
        buyWeek: 0,
        auctionWeek: 0,
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

    Object.keys(AuctionService.activeItemMap).forEach((itemName) => {
      const auctionItems = AuctionService.activeItemMap[itemName];

      let counts: TimeOrderCounts = {
        sellNow: 0,
        buyNow: 0,
        auctionNow: 0,
        sellDay: 0,
        buyDay: 0,
        auctionDay: 0,
        sellWeek: 0,
        buyWeek: 0,
        auctionWeek: 0,
      };
      if (this.activeOrderMap[itemName]) {
        counts = this.activeOrderMap[itemName];
      }

      auctionItems.forEach((auction) => {
        const age = (auction.endTime || 0) - now;

        // Time-bucketed counts
        if (age < 1000 * 60 * 60 * 24 * 7) {
          counts.auctionWeek++;
          if (age < 1000 * 60 * 60 * 24) {
            counts.auctionDay++;
            if (age < 1000 * 60 * 15) {
              counts.auctionNow++;
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

  private static applyRefreshOrder(order: ShopItem): void {
    const item = ItemService.getItem(order.name);
    if (item) {
      this.upsertLastItem(order, item.category);
      this.upsertLastItem(order, item.family);
      this.upsertLastItem(order, 'all');
    }
  }

  private static refreshLastItems(): void {
    this.lastItemMap = {};
    const orderShops = this.activeShops.sort((a, b) => b.lastRefresh - a.lastRefresh);
    const kamadanOrders = KamadanService.getKamadanOrders();
    orderShops.forEach((shop) => {
      // hijack shop loop to insert item between shop time
      while (kamadanOrders.length > 0 && kamadanOrders[kamadanOrders.length - 1].lastRefresh > shop.lastRefresh) {
        const kamadanOrder = kamadanOrders.pop();
        this.applyRefreshOrder(kamadanOrder);
      }
      //
      shop.items
        .filter((order) => !order.hidden)
        .forEach((order) => {
          this.applyRefreshOrder(order);
        });
    });
    // and insert the rest at the end
    while (kamadanOrders.length > 0) {
      const kamadanOrder = kamadanOrders.pop();
      this.applyRefreshOrder(kamadanOrder);
    }
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

  public static getLastItemsByFavorites(favorites: Array<string>): Array<ShopItem> {
    let items: Array<ShopItem> = [];
    if (!favorites || favorites.length === 0) {
      return items;
    }
    favorites.slice(0, 20).forEach((favorite) => {
      const item = ItemService.getItem(favorite);
      if (item) {
        items = items.concat(...(this.lastItemMap[item.category]?.filter((o) => o.name === item.name) || []));
      }
    });
    return items.sort((a, b) => b.lastRefresh - a.lastRefresh).slice(0, 20);
  }

  // ====================
  // region CERTIFICATION
  // ====================

  public static askPlayerCertification(uuid: string, socket: any): { uuid: string; secret: string } {
    let player = 'unknown';
    let reference = uuid;
    const shop = this.allShopMap[uuid];
    if (shop) {
      player = shop.player;
    } else {
      // if (this.allShopMap[this.certifiedPlayers[player]]) {
      //   socket.emit(
      //     'ToasterError',
      //     'This player name is already certified in another shop. Please use your own character or contact the support.'
      //   );
      //   return;
      // }
      reference = nanoid(10);
      this.allShopMap[reference] = {
        uuid: reference,
        player: player,
        items: [],
      };
      MongoService.upsertShop(this.allShopMap[reference]);
    }
    const pendingCertification = {
      uuid: reference,
      player: player,
      socket: socket,
      secret: nanoid(10),
    };
    this.shopCertificationPending[reference] = pendingCertification;
    const response = { uuid: reference, secret: pendingCertification.secret };
    socket.emit('ShopCertificationSecret', response);
    return response;
  }

  public static async confirmPlayerCertification(params: { [key: string]: string }): Promise<void> {
    const message = params['message'];
    const sender = params['sender'];
    const apiKey = params['apikey'];
    if (message && sender && apiKey === process.env.authApiKey) {
      const uuid = message.split('|')[0];
      const secret = message.split('|')[1];
      // const uuid = params['uuid'];
      // const secret = params['secret'];
      if (secret) {
        console.log('Certification request for shop ' + uuid + ' from ' + sender + ' with secret ' + secret);
      }
      const pendingCertification = this.shopCertificationPending[uuid];
      if (pendingCertification && pendingCertification.secret === secret) {
        let pendingShop = this.allShopMap[uuid];
        let updatingShop: Shop = { ...pendingShop };
        if (pendingShop) {
          if (!pendingShop.certified) {
            pendingShop.certified = [];
          }
          if (this.certifiedPlayers[sender] && this.certifiedPlayers[sender] !== pendingShop.uuid) {
            const olderShop = this.allShopMap[this.certifiedPlayers[sender]];
            if (olderShop) {
              if (!olderShop.certified) {
                olderShop.certified = [];
                console.log('======== Impossible situation =========');
                console.log('Older shop of player ' + sender + ' found with uuid ' + olderShop.uuid + ' but no certified list !');
              }
              const shopToDelete = pendingShop;
              updatingShop = { ...olderShop };
              if (shopToDelete.certified && updatingShop.certified) {
                updatingShop.certified = updatingShop.certified
                  .filter((p) => !shopToDelete.certified.includes(p))
                  .concat(shopToDelete.certified);
              }
              if (shopToDelete.items && updatingShop.items) {
                const updatingIds = updatingShop.items.map((i) => i.id);
                updatingShop.items = updatingShop.items.concat(shopToDelete.items.filter((i) => !updatingIds.includes(i.id)));
              }
              // clear pending shop to keep only the older one.
              await MongoService.deleteShop(shopToDelete);
              delete this.allShopMap[shopToDelete.uuid];
              delete this.activeShopMap[shopToDelete.uuid];
              delete this.onlineShopMap[shopToDelete.uuid];
            }
          }
          this.certifiedPlayers[sender] = updatingShop.uuid;
          if (!updatingShop.certified) {
            updatingShop.certified = [];
          }
          if (!updatingShop.certified.includes(sender)) {
            updatingShop.certified.push(sender);
          }
          console.log('Shop of player ' + updatingShop.player + ' from ' + sender + ' is now Certified!');
          updatingShop.player = sender;
          updatingShop.lastRefresh = Date.now();
          this.allShopMap[updatingShop.uuid] = updatingShop;
          await MongoService.upsertShop(updatingShop);
          pendingCertification.socket.join(updatingShop.uuid);
          this.io.to(updatingShop.uuid).emit('RefreshShop', { ...updatingShop, _id: undefined, lastIP: undefined });
          this.io.to(updatingShop.uuid).emit('RefreshPlayer', sender);
          delete this.shopCertificationPending[uuid];
        }
      }
    }
  }

  // =================
  // region REPUTATION
  // =================

  public static async submitReputationVote(
    shop: string,
    target: string,
    vote: 'positive' | 'negative',
    reason: ReputationReason,
    socket: any
  ): Promise<void> {
    if (vote !== 'positive' && vote !== 'negative') {
      socket.emit('ToasterError', 'Invalid vote type.');
      console.log('Invalid vote type received: ' + vote + ' from player ' + shop);
      return;
    }
    const shopData = this.allShopMap[shop];
    if (!shopData) {
      socket.emit('ToasterError', 'Shop not found.');
      return;
    }
    if (!shopData.reputation) {
      shopData.reputation = {
        positive: 0,
        negative: 0,
        usedPoints: 0,
        history: [],
        lastReset: Date.now(),
      };
    }
    if (Date.now() - shopData.reputation.lastReset > 1000 * 60 * 60 * 24) {
      shopData.reputation.usedPoints = 0;
      shopData.reputation.lastReset = Date.now();
    }

    const maxPoints = (shopData.certified?.length || 0) * 3;

    if (shopData.certified?.includes(target)) {
      socket.emit('ToasterError', 'You cannot vote for yourself');
      return;
    }
    const targetId = this.certifiedPlayers[target];
    if (!targetId) {
      socket.emit('ToasterError', 'The target player is not certified so cannot receive reputation votes.');
      return;
    }
    const targetShop = this.allShopMap[targetId];
    if (!targetShop) {
      socket.emit('ToasterError', 'Fatal error shop not found, please contact the support.');
      return;
    }
    if (!targetShop.reputation) {
      targetShop.reputation = {
        positive: 0,
        negative: 0,
        usedPoints: 0,
        history: [],
        lastReset: Date.now(),
      };
    }
    const existingVoteIndex = targetShop.reputation.history.findIndex((h) => this.certifiedPlayers[h.from] === shopData.uuid);
    const existingVote = existingVoteIndex !== -1 ? targetShop.reputation.history[existingVoteIndex] : null;
    let revert = false;
    if (existingVote) {
      if (existingVote.type === vote) {
        revert = true;
        socket.emit('ToasterSuccess', 'Your previous vote has been removed.');
      }
      // revert previous vote
      if (existingVote.type === 'positive') {
        shopData.reputation.usedPoints -= 1;
        targetShop.reputation.positive--;
      } else {
        shopData.reputation.usedPoints -= 3;
        targetShop.reputation.negative--;
      }
      shopData.reputation.usedPoints = Math.max(0, shopData.reputation.usedPoints);
    }

    if (
      (vote === 'positive' && shopData.reputation.usedPoints + 1 > maxPoints) ||
      (vote === 'negative' && shopData.reputation.usedPoints + 3 > maxPoints)
    ) {
      socket.emit(
        'ToasterWarning',
        'You have used all your reputation points for today. Please try again tomorrow or add more certified characters to your shop.'
      );
      return;
    }

    const newVote = {
      date: Date.now(),
      from: shopData.certified[0],
      name: target,
      type: vote,
      reason: reason,
    };
    if (existingVoteIndex !== -1) {
      if (revert) {
        targetShop.reputation.history.splice(existingVoteIndex, 1);
      } else {
        // replace the old entry in-place to avoid duplicate history entries
        targetShop.reputation.history[existingVoteIndex] = newVote;
      }
    } else {
      targetShop.reputation.history.push(newVote);
    }
    if (revert) {
      MessageService.insertMessage(MessageType.REPUTATION_REVERT, shopData.publicId, targetShop.publicId, [
        shopData.player,
        shopData.publicId,
      ]);
    } else if (vote === 'positive') {
      targetShop.reputation.positive++;
      shopData.reputation.usedPoints += 1;
      MessageService.insertMessage(MessageType.REPUTATION_UP, shopData.publicId, targetShop.publicId, [
        shopData.player,
        shopData.publicId,
        UtilityHelper.reasonToText(reason),
      ]);
    } else {
      targetShop.reputation.negative++;
      shopData.reputation.usedPoints += 3;
      MessageService.insertMessage(MessageType.REPUTATION_DOWN, shopData.publicId, targetShop.publicId, [
        shopData.player,
        shopData.publicId,
        UtilityHelper.reasonToText(reason),
      ]);
    }
    // upate reflexion
    if (!shopData.notations) {
      shopData.notations = {};
    }
    shopData.notations[targetShop.publicId || ''] = newVote.type;
    // store reputation update in DB
    console.log('Reputation vote submitted from shop ' + shopData.player + ' to ' + targetShop.player + ' as ' + vote);
    await MongoService.upsertShop(targetShop);
    await MongoService.upsertShop(shopData);
    this.io.to(shopData.uuid).emit('RefreshShop', { ...shopData, _id: undefined, lastIP: undefined });
    socket.emit('ToasterSuccess', 'Your reputation vote has been submitted successfully. Refresh the page to see the effect.');
    this.refreshShops(true);
  }

  // ==============
  // region AUCTION
  // ==============

  public static async createAuction(shopId: string, rawAuction: Auction, socket: Socket): Promise<void> {
    const shop = this.allShopMap[shopId];
    if (shop && shop.certified?.length > 0) {
      if (!rawAuction.endTime || rawAuction.endTime <= Date.now()) {
        socket.emit('ToasterError', 'Invalid auction end time.');
        return;
      }

      const uuid = nanoid(10);
      const auction = {
        uuid: uuid,
        player: shop.player,
        shopId: shop.publicId,
        currency: rawAuction.currency,
        item: rawAuction.item,
        startingPrice: rawAuction.startingPrice,
        buyoutPrice: rawAuction.buyoutPrice,
        active: true,
        cloturate: false,
        startTime: Date.now(),
        endTime: rawAuction.endTime,
        history: [],
      } as Auction;
      if (shop.auctions && shop.auctions.length > 0) {
        shop.auctions.push(uuid);
      } else {
        shop.auctions = [uuid];
      }
      await MongoService.insertAuction(shop, auction);
      AuctionService.insertAuction(auction);
      this.io.to(shop.uuid).emit('RefreshShop', { ...shop, _id: undefined, lastIP: undefined });
      AuctionService.getPersonalAuctions(shop.auctions, socket);
    } else {
      socket.emit('ToasterError', 'Auctions require to have at least a player certified.');
    }
  }

  public static async cloturateAuction(shopId: string, auctionId: string, socket: Socket): Promise<void> {
    const shop = this.allShopMap[shopId];
    if (shop) {
      const auction = AuctionService.getAuction(auctionId);
      if (auction) {
        auction.cloturate = true;
        await MongoService.upsertAuction(auction);
        AuctionService.cloturateAuction(auctionId);
        shop.auctions = shop.auctions?.filter((a) => a !== auctionId);
        await MongoService.upsertShop(shop);
        socket.emit('ToasterSuccess', 'Auction cloturated successfully.');
      } else {
        socket.emit('ToasterError', 'Auction not found.');
      }
    } else {
      socket.emit('ToasterError', 'Shop not found.');
    }
  }

  public static searchShops = (search: string): Array<{ name: string; publicId: string }> => {
    // Pass limit to Flexsearch to get enough results
    // const resultsIndex = this.searchIndex.search(search, { limit: 100 });
    // const results = resultsIndex.map((i) => this.searchToShop[i]);
    // const playerLinks = [];
    // const playerPresent = new Set<string>();
    // results.forEach((shop) => {
    //   shop.certified?.forEach((player) => {
    //     if (playerPresent.has(player)) {
    //       return;
    //     }
    //     playerLinks.push({ name: player, publicId: shop.publicId });
    //     playerPresent.add(player);
    //   });
    //   if (!shop.certified || !shop.certified.includes(shop.player)) {
    //     if (playerPresent.has(shop.player)) {
    //       return;
    //     }
    //     playerLinks.push({ name: shop.player, publicId: shop.publicId });
    //     playerPresent.add(shop.player);
    //   }
    // });
    // return playerLinks.filter((link) => link.name.toLowerCase().includes(search.toLowerCase())).slice(0, 10);

    // flewsearch result are trash, time to use slower search
    const playerLinks = [];
    const searchLower = search.toLowerCase();
    Object.keys(this.nameToPublic).forEach((name) => {
      if (name.toLowerCase().includes(searchLower)) {
        playerLinks.push({ name: name, publicId: this.nameToPublic[name] });
      }
    });
    return playerLinks.slice(0, 10);
  };
}
