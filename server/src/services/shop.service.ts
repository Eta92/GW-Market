import { OrderType, Price, Shop, ShopItem } from '../models/shop.model';
import { AvailableFamily, AvailableTree } from '../models/tree.model';
import { ItemService } from './item.service';
import { Server as SocketServer } from 'socket.io';
import { nanoid } from 'nanoid';
import { Console } from 'console';

export class ShopService {
  public static shopInit = false;
  public static allShops: Array<Shop> = [];
  public static allShopMap: { [key: string]: Shop } = {};
  public static allItemMap: { [key: string]: Array<ShopItem> } = {};
  public static activeShops: Array<Shop> = [];
  public static activeShopMap: { [key: string]: Shop } = {};
  public static activeItemMap: { [key: string]: Array<ShopItem> } = {};
  public static activeOrderMap: { [key: string]: { name: string; sellOrders: number; buyOrders: number } } = {};
  public static lastItemMap: { [key: string]: Array<ShopItem> } = {};
  //   public static activeItemTree: AvailableTree;
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
      // update and save data in ram and in database
      shop.lastRefresh = Date.now();
      const shopToSave = this.allShopMap[shop.uuid] ? { ...this.allShopMap[shop.uuid], ...shop } : shop;
      this.allShopMap[shop.uuid] = shopToSave;
      this.activeShopMap[shop.uuid] = shopToSave;
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
    Object.keys(this.activeItemMap).forEach((itemName) => {
      const shopItems = this.activeItemMap[itemName];
      const sellOrders = shopItems.filter((i) => i.orderType === OrderType.SELL).length;
      const buyOrders = shopItems.filter((i) => i.orderType === OrderType.BUY).length;
      this.activeOrderMap[itemName] = {
        name: itemName,
        sellOrders: sellOrders,
        buyOrders: buyOrders,
      };
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
}
