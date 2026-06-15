import { Server as SocketServer } from 'socket.io';
import { SyncHelper } from '../helpers/sync.helper';
import { Auction } from '../models/auction.model';
import { MessageType } from '../models/message.model';
import { OrderType } from '../models/shop.model';
import { ItemService } from './item.service';
import { MessageService } from './message.service';
import { MongoService } from './mongo.service';
import { ShopService } from './shop.service';

export class AuctionService {
  public static auctionInit = false;
  public static allAuctionMap: { [key: string]: Auction } = {};
  public static activeAuctions: Array<Auction> = [];
  public static activeAuctionMap: { [key: string]: Auction } = {};
  public static activeItemMap: { [key: string]: Array<Auction> } = {};
  public static itemToRefresh: Set<string> = new Set<string>();
  public static lastAuctionMap: { [key: string]: Array<Auction> } = {};
  public static io: SocketServer;

  public static init(io: SocketServer): void {
    this.io = io;
    this.auctionInit = true;
    SyncHelper.initAuctions();
    setInterval(() => {
      this.refreshAuctions();
    }, 1000);
  }

  public static initAuctions(auctions: Array<Auction>): void {
    auctions.forEach((auction) => {
      if (auction && auction.uuid) {
        this.allAuctionMap[auction.uuid] = auction;
        if (auction.active) {
          this.activeAuctionMap[auction.uuid] = auction;
          this.itemToRefresh.add(auction.item.name);
        }
      }
    });
    this.refreshAuctions(true);
  }

  private static refreshAuctions(update = false): void {
    let applyUpdate = update;
    const now = Date.now();
    for (const uuid in this.activeAuctionMap) {
      const auction = this.activeAuctionMap[uuid];
      if (auction.endTime < now) {
        console.log('Auction is finished:', auction);
        auction.active = false;
        this.sendAuctionNotifications(auction);
        this.itemToRefresh.add(auction.item.name);
        MongoService.upsertAuction(auction);
        delete this.activeAuctionMap[auction.uuid];
        applyUpdate = true;
      }
    }
    if (applyUpdate) {
      this.activeAuctions = Object.values(this.activeAuctionMap);
      this.refreshItems();
    }
  }

  private static refreshItems(): void {
    this.activeItemMap = {};
    this.activeAuctions.forEach((auction) => {
      const shop = ShopService.allShopMap[ShopService.certifiedPlayers[auction.player]];
      if (shop) {
        // auction.daybreakOnline = shop.daybreakOnline;
        // auction.authCertified = shop.certified?.includes(item.player);
        // auction.positives = shop.reputation?.positive || 0;
        // auction.negatives = shop.reputation?.negative || 0;
        auction.shopId = shop.publicId;
      } else {
        console.log('Shop not found for auction:', auction.uuid);
      }
      if (!this.activeItemMap[auction.item.name]) {
        this.activeItemMap[auction.item.name] = [];
      }
      this.activeItemMap[auction.item.name].push(auction);
    });
    // update all socket threads
    if (this.io) {
      this.itemToRefresh.forEach((itemName) => {
        this.io.to(itemName).emit('GetItemAuctions', this.activeItemMap[itemName]);
      });
    }
    this.refreshLastAuctions();
    this.itemToRefresh.clear();
  }

  private static refreshLastAuctions(): void {
    this.lastAuctionMap = {};
    const orderAuctions = Object.values(this.activeAuctionMap).sort((a, b) => a.endTime - b.endTime);
    orderAuctions.forEach((auction) => {
      const item = ItemService.getItem(auction.item.name);
      if (item) {
        this.updateLastAuction(auction, item.category);
        this.updateLastAuction(auction, item.family);
        this.updateLastAuction(auction, 'all');
      }
    });
  }

  private static updateLastAuction(auction: Auction, family: string): void {
    if (!this.lastAuctionMap[family]) {
      this.lastAuctionMap[family] = [];
    }
    this.lastAuctionMap[family].push(auction);
  }

  public static bidAuction(auctionId: string, bidderId: string, amount: number): void {
    const auction = this.allAuctionMap[auctionId];
    const now = Date.now();
    if (auction && auction.active && auction.endTime > now) {
      const bidderShop = ShopService.allShopMap[bidderId];
      if (bidderShop && bidderShop.certified?.length > 0) {
        if (auction.shopId !== bidderShop.publicId) {
          const lastBid = auction.history.length > 0 ? auction.history[auction.history.length - 1] : null;
          // check if price is at least 1% higher than last bid or starting price if no bids
          if (lastBid ? amount >= Math.ceil(lastBid.bid * 1.01) : amount >= auction.startingPrice) {
            auction.history.push({
              bidder: bidderShop.player,
              shopId: bidderShop.publicId,
              bid: amount,
              time: now,
            });
            // extend auction time if less than 5 minutes remaining
            if (auction.endTime - now < 5 * 60 * 1000) {
              auction.endTime = now + 5 * 60 * 1000;
            }
            // notify previous bidder if outbid
            if (auction.history.length > 1) {
              const previousBid = auction.history[auction.history.length - 2];
              MessageService.insertMessage(MessageType.AUCTION_OUTBID, auction.shopId, previousBid.shopId, [
                auction.item.name,
                bidderShop.player,
                amount.toString(),
                auction.currency.toString(),
              ]);
            }
            MongoService.upsertAuction(auction);
            this.refreshLastAuctions();
            console.log('Auction updated:', auction);

            // update all socket threads
            if (this.io) {
              const itemName = auction.item.name;
              this.io.to(itemName).emit('GetItemAuctions', this.getItemAuctions(itemName));
            }
          }
        }
      }
    }
  }

  public static cloturateAuction(auctionId: string): void {
    const auction = this.allAuctionMap[auctionId];
    if (auction) {
      delete this.allAuctionMap[auction.uuid];
      delete this.activeAuctionMap[auction.uuid];
    }
  }

  public static getItemAuctions(itemName: string): Array<Auction> {
    return this.activeItemMap[itemName] || [];
  }

  public static getAuction(auctionId: string): Auction | null {
    return this.allAuctionMap[auctionId] || null;
  }

  public static insertAuction(auction: Auction): void {
    this.allAuctionMap[auction.uuid] = auction;
    this.activeAuctionMap[auction.uuid] = auction;
    this.refreshAuctions(true);
    console.log('New auction inserted:', auction);
  }

  public static getPersonalAuctions(auctionIds: Array<string>, socket: any): void {
    if (Array.isArray(auctionIds) && auctionIds.length > 0) {
      const personalAuctions = auctionIds.map((id) => this.allAuctionMap[id]);
      socket.emit('PersonalAuctions', personalAuctions);
    } else {
      socket.emit('PersonalAuctions', []);
    }
  }

  public static getLastAuctionsByFamily(family: string): Array<Auction> {
    return this.lastAuctionMap[family] || [];
  }

  public static getLastAuctionsByFavorites(favorites: Array<string>): Array<Auction> {
    let auctions: Array<Auction> = [];
    favorites.slice(0, 20).forEach((favorite) => {
      const item = ItemService.getItem(favorite);
      if (item) {
        auctions = auctions.concat(...(this.lastAuctionMap[item.category]?.filter((o) => o.item.name === item.name) || []));
      }
    });
    return auctions.sort((a, b) => a.endTime - b.endTime).slice(0, 20);
  }

  private static sendAuctionNotifications(auction: Auction): void {
    if (auction.history.length > 0) {
      const playersInvolved = new Set<string>();
      const history = [...auction.history].reverse();
      const winnerBid = history[0];
      history.forEach((bid, b) => {
        if (b === 0) {
          playersInvolved.add(bid.bidder);
          MessageService.insertMessage(MessageType.AUCTION_WON, auction.shopId, bid.shopId, [
            auction.item.name,
            bid.bid.toString(),
            auction.currency.toString(),
          ]);
        } else {
          if (!playersInvolved.has(bid.bidder)) {
            playersInvolved.add(bid.bidder);
            MessageService.insertMessage(MessageType.AUCTION_LOST, auction.shopId, bid.shopId, [
              auction.item.name,
              winnerBid.bid.toString(),
              auction.currency.toString(),
            ]);
          }
        }
      });
      MessageService.insertMessage(MessageType.AUCTION_END, winnerBid.shopId, auction.shopId, [
        auction.item.name,
        winnerBid.bid.toString(),
        auction.currency.toString(),
      ]);
      const purchase = {
        name: auction.item.name,
        shop: auction.shopId,
        prices: [
          {
            type: auction.currency,
            totalPrice: winnerBid.bid,
            quantity: auction.item.quantity,
            unitPrice: Math.ceil(winnerBid.bid / auction.item.quantity),
          },
        ],
        orderType: OrderType.AUCTION,
        date: Date.now(),
        listedTime: auction.startTime,
        origin: 1,
        weaponDetails: auction.item.weaponDetails,
        orderDetails: auction.item.orderDetails,
      };
      if (purchase.orderDetails) {
        purchase.orderDetails.note = 'sold to ' + winnerBid.bidder;
      }
      MongoService.insertPurchase(purchase);
    } else {
      MessageService.insertMessage(MessageType.AUCTION_FAIL, auction.shopId, auction.shopId, [auction.item.name]);
    }
  }
}
