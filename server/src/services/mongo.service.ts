import { Collection, Db, MongoClient } from 'mongodb';
import { SyncHelper } from '../helpers/sync.helper';
import { Auction } from '../models/auction.model';
import { BanEntry } from '../models/ban.model';
import { Message } from '../models/message.model';
import { Purchase, PurchaseOrigin } from '../models/purchase.model';
import { Shop } from '../models/shop.model';

export class MongoService {
  private static mongodburl = 'mongodb://localhost:27017';
  public static mongoInit = false;
  public static mongoClient: MongoClient;
  private static mongoDB: Db;
  private static shopCollection: Collection<Shop>;
  private static backupCollection: Collection<Shop>;
  private static purchaseCollection: Collection<Purchase>;
  private static auctionCollection: Collection<Auction>;
  private static messageCollection: Collection<Message>;
  private static banCollection: Collection<BanEntry>;

  public static init(): void {
    this.mongoClient = new MongoClient(this.mongodburl);
    this.mongoClient
      .connect()
      .then(() => {
        this.mongoDB = this.mongoClient.db('GWTrade');
        this.shopCollection = this.mongoDB.collection('shops');
        this.backupCollection = this.mongoDB.collection('backup');
        this.purchaseCollection = this.mongoDB.collection('purchases');
        this.auctionCollection = this.mongoDB.collection('auctions');
        this.messageCollection = this.mongoDB.collection('messages');
        this.banCollection = this.mongoDB.collection('bans');

        this.mongoInit = true;
        SyncHelper.initShops();
        SyncHelper.initAuctions();
        SyncHelper.initMessages();
        SyncHelper.initBans();
        console.log('Mongo database is ready');
      })
      .catch((err) => {
        console.log('MongoDB connection failed:', err);
      });
  }

  public static async upsertShop(shopData: Shop): Promise<void> {
    if (!this.mongoInit) {
      console.log('MongoDB not initialized');
      return;
    }
    try {
      await this.shopCollection.updateOne(
        { uuid: shopData.uuid },
        {
          $set: {
            uuid: shopData.uuid,
            publicId: shopData.publicId,
            player: shopData.player,
            lastIP: shopData.lastIP,
            lastRefresh: shopData.lastRefresh,
            items: shopData.items,
            certified: shopData.certified,
            reputation: shopData.reputation,
            auctions: shopData.auctions,
            recruiter: shopData.recruiter,
          },
        },
        { upsert: true }
      );
    } catch (err) {
      console.log('Error upserting shop items:', err);
    }
  }

  public static async insertAuction(shopData: Shop, auctionData: Auction): Promise<void> {
    if (!this.mongoInit) {
      console.log('MongoDB not initialized');
      return;
    }

    try {
      await this.shopCollection.updateOne(
        { uuid: shopData.uuid },
        {
          $set: {
            auctions: shopData.auctions,
          },
        },
        { upsert: true }
      );
      await this.auctionCollection.insertOne(auctionData);
    } catch (err) {
      console.log('Error upserting shop items:', err);
    }
  }

  public static async upsertAuction(auctionData: Auction): Promise<void> {
    if (!this.mongoInit) {
      console.log('MongoDB not initialized');
      return;
    }
    try {
      await this.auctionCollection.updateOne(
        { uuid: auctionData.uuid },
        {
          $set: {
            endTime: auctionData.endTime,
            active: auctionData.active,
            cloturate: auctionData.cloturate,
            history: auctionData.history,
          },
        },
        { upsert: true }
      );
    } catch (err) {
      console.log('Error upserting auction:', err);
    }
  }

  public static async upsertBackupShop(shopData: Shop): Promise<void> {
    if (!this.mongoInit) {
      console.log('MongoDB not initialized');
      return;
    }
    try {
      if (shopData._id) {
        await this.backupCollection.updateOne({ _id: shopData._id }, { $set: shopData }, { upsert: true });
      } else {
        await this.backupCollection.insertOne(shopData);
      }
    } catch (err) {
      console.log('Error upserting backup shop:', err);
    }
  }

  public static async deleteShop(shopData: Shop): Promise<void> {
    if (!this.mongoInit) {
      console.log('MongoDB not initialized');
      return;
    }
    await this.upsertBackupShop(shopData);
    try {
      await this.shopCollection.deleteOne({ uuid: shopData.uuid });
    } catch (err) {
      console.log('Error deleting shop:', err);
    }
  }

  public static async insertMessage(messageData: Message): Promise<void> {
    if (!this.mongoInit) {
      console.log('MongoDB not initialized');
      return;
    }
    try {
      await this.messageCollection.insertOne(messageData);
    } catch (err) {
      console.log('Error inserting message:', err);
    }
  }

  public static async upsertMessage(messageData: Message): Promise<void> {
    if (!this.mongoInit) {
      console.log('MongoDB not initialized');
      return;
    }
    try {
      await this.messageCollection.updateOne(
        { uuid: messageData.uuid },
        {
          $set: {
            read: messageData.read,
            deleted: messageData.deleted,
          },
        },
        { upsert: true }
      );
    } catch (err) {
      console.log('Error upserting message:', err);
    }
  }

  public static async getAllShops(): Promise<Array<Shop>> {
    if (!this.mongoInit) {
      console.log('MongoDB not initialized');
      return [];
    }
    const shops = await this.shopCollection.find({}).toArray();
    return shops;
  }

  public static async getAllAuctions(): Promise<Array<Auction>> {
    if (!this.mongoInit) {
      console.log('MongoDB not initialized');
      return [];
    }
    // not equal for backward compatibility
    const auctions = await this.auctionCollection.find({ cloturate: { $ne: true } }).toArray();
    return auctions;
  }

  public static async getAllMessages(): Promise<Array<Message>> {
    if (!this.mongoInit) {
      console.log('MongoDB not initialized');
      return [];
    }
    // not equal for archiving
    const messages = await this.messageCollection.find({ deleted: { $ne: true } }).toArray();
    return messages;
  }

  public static async insertPurchase(purchaseData: Purchase): Promise<void> {
    if (!this.mongoInit) {
      console.log('MongoDB not initialized');
      return;
    }
    try {
      await this.purchaseCollection.insertOne(purchaseData);
    } catch (err) {
      console.log('Error inserting purchase:', err);
    }
  }

  public static async getAllPurchasesLight(): Promise<Array<{ date: number; origin: PurchaseOrigin }>> {
    if (!this.mongoInit) {
      console.log('MongoDB not initialized');
      return [];
    }
    const purchases = await this.purchaseCollection.find({}, { projection: { _id: 0, date: 1, origin: 1 } }).toArray();
    return purchases as Array<{ date: number; origin: PurchaseOrigin }>;
  }

  public static async getItemPurchases(itemName: string): Promise<Array<Purchase>> {
    if (!this.mongoInit) {
      console.log('MongoDB not initialized');
      return [];
    }
    const purchases = await this.purchaseCollection.find({ name: itemName }).toArray();
    return purchases;
  }

  public static async getShopPurchases(shopId: string): Promise<Array<Purchase>> {
    if (!this.mongoInit) {
      console.log('MongoDB not initialized');
      return [];
    }
    const purchases = await this.purchaseCollection.find({ shop: shopId }).toArray();
    return purchases;
  }

  public static async getAllBans(): Promise<Array<BanEntry>> {
    if (!this.mongoInit) {
      console.log('MongoDB not initialized');
      return [];
    }
    const bans = await this.banCollection.find({}).toArray();
    return bans;
  }

  public static async insertBan(banData: BanEntry): Promise<void> {
    if (!this.mongoInit) {
      console.log('MongoDB not initialized');
      return;
    }
    try {
      await this.banCollection.insertOne(banData);
    } catch (err) {
      console.log('Error inserting ban:', err);
    }
  }
}
