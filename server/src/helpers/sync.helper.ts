import { AuctionService } from '../services/auction.service';
// import { BanService } from '../services/ban.service';
import { MessageService } from '../services/message.service';
import { MongoService } from '../services/mongo.service';
import { ShopService } from '../services/shop.service';

export class SyncHelper {
  public static async initShops(): Promise<void> {
    if (MongoService.mongoInit && ShopService.shopInit) {
      const shops = await MongoService.getAllShops();
      ShopService.initShops(shops);
    }
  }
  public static async initAuctions(): Promise<void> {
    if (MongoService.mongoInit && AuctionService.auctionInit) {
      const auctions = await MongoService.getAllAuctions();
      AuctionService.initAuctions(auctions);
    }
  }
  public static async initMessages(): Promise<void> {
    if (MongoService.mongoInit && MessageService.messageInit) {
      const messages = await MongoService.getAllMessages();
      MessageService.initMessages(messages);
    }
  }
  // public static async initBans(): Promise<void> {
  //   if (MongoService.mongoInit && BanService.banInit) {
  //     const bans = await MongoService.getAllBans();
  //     BanService.initBans(bans);
  //   }
  // }
}
