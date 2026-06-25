import { Server as HttpServer } from 'http';
import { Socket, Server as SocketServer } from 'socket.io';
import { Auction } from '../models/auction.model';
import { MessageType } from '../models/message.model';
import { Purchase } from '../models/purchase.model';
import { ReputationReason } from '../models/reputation.model';
import { SearchFilter, SearchResult } from '../models/search.model';
import { OrderType, Price, Shop, ShopItem } from '../models/shop.model';
import { AuctionService } from './auction.service';
//import { BanService } from './ban.service';
import { ItemService } from './item.service';
import { MessageService } from './message.service';
import { MongoService } from './mongo.service';
import { OverviewService } from './overview.service';
import { SearchService } from './search.service';
import { ShopService } from './shop.service';

export class SocketService {
  public static io: SocketServer;
  public static password = process.env.dataPassword;

  public static init(server: HttpServer): void {
    this.io = new SocketServer(server);
    ShopService.init(this.io);
    AuctionService.init(this.io);
    MessageService.init(this.io);
    //BanService.init(this.io);

    this.io.sockets.on('connection', (socket: Socket) => {
      // ================================
      // ==== CLIENT-SERVER EXCHANGE ====
      // ================================
      socket.data.ip = ((socket.handshake.headers['x-forwarded-for'] as string)?.split(',')[0] || socket.handshake.address)?.replace(
        '::ffff:',
        ''
      );
      console.log('═╦═ IP ' + socket.data.ip + ' has connected to the server');
      OverviewService.logConnection(socket.data.ip);

      socket.on('SocketStarted', () => {
        socket.emit('ClientInit');
        socket.emit('ClientLog', 'Real-Time connection established with the GW Market tool');
      });

      socket.on('ping', () => {
        console.log('ping requested');
        socket.emit('pong');
      });

      socket.on('trackItem', (itemName: string) => {
        socket.join(itemName);
      });

      socket.on('untrackItem', (itemName: string) => {
        socket.leave(itemName);
      });

      socket.on('getAvailableOrders', () => {
        const orders = ShopService.getAvailableOrders();
        socket.emit('GetAvailableOrders', orders);
      });

      socket.on('searchItems', (search: string) => {
        const results = ItemService.searchItems(search);
        socket.emit('GetItemSearch', results);
      });

      socket.on('searchShops', (search: string) => {
        const results = ShopService.searchShops(search);
        socket.emit('GetShopSearch', results);
      });

      socket.on('getItemOrders', (search: string) => {
        const results = ShopService.getItemOrders(search);
        socket.emit('GetItemOrders', results, search);
        const auctions = AuctionService.getItemAuctions(search);
        socket.emit('GetItemAuctions', auctions);
      });

      socket.on('checkShopUpToDate', (uuid: string, lastRefresh: number) => {
        // trigerred once after client init
        ShopService.isShopUpToDate(uuid, lastRefresh, socket);
      });

      socket.on('refreshShop', (shop: Shop) => {
        ShopService.refreshShop(shop, socket);
      });

      socket.on('closeShop', (uuid: string) => {
        ShopService.closeShop(uuid);
      });

      socket.on('getShopHistory', async (uuid: string) => {
        const history = await MongoService.getShopPurchases(uuid);
        socket.emit('GetShopHistory', history);
      });

      socket.on('addShopItem', (uuid: string, item: ShopItem) => {
        ShopService.addShopItem(uuid, item, socket);
      });

      socket.on('updateShopItem', (uuid: string, item: ShopItem) => {
        ShopService.updateShopItem(uuid, item, socket);
      });

      socket.on('removeShopItem', (uuid: string, item: ShopItem) => {
        ShopService.removeShopItem(uuid, item, socket);
      });

      socket.on('getPublicShop', (publicId: string) => {
        const shop = ShopService.getPublicShop(publicId);
        socket.emit('GetPublicShop', shop);
      });

      socket.on('askPlayerCertification', (uuid: string) => {
        ShopService.askPlayerCertification(uuid, socket);
      });

      socket.on('getLastItemsByFamily', (family: string) => {
        const items = ShopService.getLastItemsByFamily(family);
        socket.emit('GetLastItems', items);
        const auctions = AuctionService.getLastAuctionsByFamily(family);
        socket.emit('GetLastAuctions', auctions);
      });

      socket.on('getLastItemsByFavorite', (favorites: Array<string>) => {
        const items = ShopService.getLastItemsByFavorites(favorites);
        socket.emit('GetLastItems', items);
        const auctions = AuctionService.getLastAuctionsByFavorites(favorites);
        socket.emit('GetLastAuctions', auctions);
      });

      // socket.on('getLastAuctions', () => {
      //   const auctions = AuctionService.getLastAuctions();
      //   socket.emit('GetLastAuctions', auctions);
      // });

      socket.on(
        'submitReputationVote',
        (vote: { shop: string; target: string; type: 'positive' | 'negative'; reason: ReputationReason }) => {
          // if (!BanService.isBanned(vote.shop, socket)) {
          ShopService.submitReputationVote(vote.shop, vote.target, vote.type, vote.reason, socket);
          // }
        }
      );

      socket.on('logPurchase', (purchase: Purchase) => {
        purchase.date = Date.now();
        console.log('Logging purchase data:', purchase);
        MongoService.insertPurchase(purchase);
      });

      socket.on('getPriceInspection', (itemName: string, orderType: OrderType) => {
        const inspection = ShopService.getItemPrices(itemName, orderType);
        socket.emit('GetPriceInspection', inspection);
      });

      socket.on('getPriceHistory', async (itemName: string) => {
        const history = await MongoService.getItemPurchases(itemName);
        socket.emit('GetPriceHistory', history);
      });

      socket.on('getOverview', () => {
        const overview = OverviewService.getOverview();
        socket.emit('GetOverview', overview);
      });

      // auction section

      socket.on('getPersonalAuctions', (auctions: Array<string>) => {
        AuctionService.getPersonalAuctions(auctions, socket);
      });

      socket.on('createAuction', (shopId: string, auction: Auction) => {
        // if (!BanService.isBanned(shopId, socket)) {
        ShopService.createAuction(shopId, auction, socket);
        // }
      });

      socket.on('bidAuction', (data: { bidder: string; auctionId: string; amount: number }) => {
        // if (!BanService.isBanned(data.bidder, socket)) {
        AuctionService.bidAuction(data.auctionId, data.bidder, data.amount);
        // }
      });

      socket.on('cloturateAuction', (shopId: string, auctionId: string) => {
        ShopService.cloturateAuction(shopId, auctionId, socket);
      });

      // message section

      socket.on('getMessages', (shopId: string) => {
        const messages = MessageService.getMessages(shopId);
        socket.emit('GetMessages', messages);
      });

      socket.on('readMessage', (shopId: string, messageId: string) => {
        MessageService.readMessage(shopId, messageId);
      });

      socket.on('deleteMessage', (shopId: string, messageId: string) => {
        MessageService.deleteMessage(shopId, messageId);
      });

      socket.on('sendMessage', (data: { type: MessageType; uuid: string; receiverShopId: string; messageData?: Array<string> }) => {
        MessageService.requestInsertMessage(data.type, data.uuid, data.receiverShopId, data.messageData);
      });

      // ================================
      // ==== GLOBAL SEARCH ====
      // ================================
      socket.on('searchOrders', (filter: SearchFilter) => {
        console.log('searchOrders requested with filter:', JSON.stringify(filter));

        // Validate and sanitize filter
        const sanitizedFilter: SearchFilter = {
          query: typeof filter?.query === 'string' ? filter.query.slice(0, 100) : undefined,
          family: typeof filter?.family === 'string' ? filter.family : undefined,
          category: typeof filter?.category === 'string' ? filter.category : undefined,
          orderType: filter?.orderType === OrderType.SELL || filter?.orderType === OrderType.BUY ? filter.orderType : undefined,
          attribute: typeof filter?.attribute === 'string' ? filter.attribute : undefined,
          reqMin: typeof filter?.reqMin === 'number' ? Math.max(0, Math.min(13, filter.reqMin)) : undefined,
          reqMax: typeof filter?.reqMax === 'number' ? Math.max(0, Math.min(13, filter.reqMax)) : undefined,
          inscription: typeof filter?.inscription === 'boolean' ? filter.inscription : undefined,
          core: typeof filter?.core === 'string' ? filter.core : undefined,
          exotic: typeof filter?.exotic === 'string' ? filter.exotic : undefined,
          prefix: typeof filter?.prefix === 'string' ? filter.prefix : undefined,
          suffix: typeof filter?.suffix === 'string' ? filter.suffix : undefined,
          preSearing: typeof filter?.preSearing === 'boolean' ? filter.preSearing : undefined,
          miniDedicated: typeof filter?.miniDedicated === 'boolean' ? filter.miniDedicated : undefined,
          currency: [Price.PLAT, Price.ECTO, Price.ZKEY, Price.ARM, Price.BD].includes(filter?.currency) ? filter.currency : undefined,
          priceMin: typeof filter?.priceMin === 'number' ? Math.max(0, Math.min(999, filter.priceMin)) : undefined,
          priceMax: typeof filter?.priceMax === 'number' ? Math.max(0, Math.min(999, filter.priceMax)) : undefined,
          priceEachMin: typeof filter?.priceEachMin === 'number' ? Math.max(0, Math.min(999, filter.priceEachMin)) : undefined,
          priceEachMax: typeof filter?.priceEachMax === 'number' ? Math.max(0, Math.min(999, filter.priceEachMax)) : undefined,
          goldMin: typeof filter?.goldMin === 'number' ? Math.max(0, Math.min(999, filter.goldMin)) : undefined,
          goldMax: typeof filter?.goldMax === 'number' ? Math.max(0, Math.min(999, filter.goldMax)) : undefined,
          timeRange: ['online', 'today', 'week', 'all'].includes(filter?.timeRange) ? filter.timeRange : undefined,
          onlineOnly: typeof filter?.onlineOnly === 'boolean' ? filter.onlineOnly : undefined,
          certifiedOnly: typeof filter?.certifiedOnly === 'boolean' ? filter.certifiedOnly : undefined,
          limit: typeof filter?.limit === 'number' ? Math.min(100, Math.max(1, filter.limit)) : 50,
          offset: typeof filter?.offset === 'number' ? Math.max(0, filter.offset) : 0,
          sortBy: ['price', 'priceEach', 'time', 'name', 'quantity'].includes(filter?.sortBy) ? filter.sortBy : 'time',
          sortOrder: ['asc', 'desc'].includes(filter?.sortOrder) ? filter.sortOrder : 'desc',
        };

        const results = SearchService.searchOrders(sanitizedFilter);
        socket.emit('SearchOrdersResult', results);
      });

      socket.on('loadMoreResults', (previousResult: SearchResult) => {
        const results = SearchService.loadMoreResults(previousResult);
        socket.emit('LoadMoreResults', results);
      });
    });
  }
}
