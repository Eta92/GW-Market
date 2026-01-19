import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { ItemService } from './item.service';
import { OrderType, Price, Shop } from '../models/shop.model';
import { SearchFilter } from '../models/search.model';
import { ShopService } from './shop.service';

export class SocketService {
  public static io: SocketServer;
  public static password = process.env.dataPassword;

  public static init(server: HttpServer): void {
    this.io = new SocketServer(server);
    ShopService.Init(this.io);
    ItemService.init();

    this.io.sockets.on('connection', (socket: Socket) => {
      // ================================
      // ==== CLIENT-SERVER EXCHANGE ====
      // ================================
      socket.data.ip = ((socket.handshake.headers['x-forwarded-for'] as string)?.split(',')[0] || socket.handshake.address)?.replace(
        '::ffff:',
        ''
      );
      console.log('═╦═ IP ' + socket.data.ip + ' has connected to the server');

      socket.on('SocketStarted', () => {
        socket.emit('ClientInit');
        socket.emit('ClientLog', 'Real-Time connection established with the GW Market tool');
      });

      socket.on('ping', () => {
        console.log('ping requested');
        socket.emit('pong');
      });

      socket.on('getAvailableOrders', () => {
        const orders = ShopService.getAvailableOrders();
        socket.emit('GetAvailableOrders', orders);
      });

      socket.on('searchItems', (search: string) => {
        const results = ItemService.searchItems(search);
        socket.emit('GetItemSearch', results);
      });

      socket.on('getItemOrders', (search: string) => {
        const details = ItemService.getItem(search);
        socket.emit('GetItemDetails', details);
        const results = ShopService.getItemOrders(search);
        socket.emit('GetItemOrders', results);
      });

      socket.on('getItemDetails', (itemName: string) => {
        const itemDetails = ItemService.getItem(itemName);
        socket.emit('GetItemDetails', itemDetails);
      });

      socket.on('getItemsDetails', (itemNames: string) => {
        const itemsDetails = ItemService.getItems(itemNames.split(','));
        socket.emit('GetItemsDetails', itemsDetails);
      });

      socket.on('refreshShop', (shop: Shop) => {
        ShopService.refreshShop(shop, socket);
      });

      socket.on('closeShop', (uuid: string) => {
        ShopService.closeShop(uuid);
      });

      socket.on('getLastItemsByFamily', (family: string) => {
        const items = ShopService.getLastItemsByFamily(family);
        socket.emit('GetLastItems', items);
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
          oldschool: typeof filter?.oldschool === 'boolean' ? filter.oldschool : undefined,
          core: typeof filter?.core === 'string' ? filter.core : undefined,
          prefix: typeof filter?.prefix === 'string' ? filter.prefix : undefined,
          suffix: typeof filter?.suffix === 'string' ? filter.suffix : undefined,
          preSearing: typeof filter?.preSearing === 'boolean' ? filter.preSearing : undefined,
          miniDedicated: typeof filter?.miniDedicated === 'boolean' ? filter.miniDedicated : undefined,
          currency: [Price.PLAT, Price.ECTO, Price.ZKEY, Price.ARM].includes(filter?.currency) ? filter.currency : undefined,
          priceMin: typeof filter?.priceMin === 'number' ? Math.max(0, filter.priceMin) : undefined,
          priceMax: typeof filter?.priceMax === 'number' ? Math.max(0, filter.priceMax) : undefined,
          priceEachMin: typeof filter?.priceEachMin === 'number' ? Math.max(0, filter.priceEachMin) : undefined,
          priceEachMax: typeof filter?.priceEachMax === 'number' ? Math.max(0, filter.priceEachMax) : undefined,
          timeRange: ['online', 'today', 'week', 'all'].includes(filter?.timeRange) ? filter.timeRange : undefined,
          onlineOnly: typeof filter?.onlineOnly === 'boolean' ? filter.onlineOnly : undefined,
          certifiedOnly: typeof filter?.certifiedOnly === 'boolean' ? filter.certifiedOnly : undefined,
          limit: typeof filter?.limit === 'number' ? Math.min(100, Math.max(1, filter.limit)) : 50,
          offset: typeof filter?.offset === 'number' ? Math.max(0, filter.offset) : 0,
          sortBy: ['price', 'priceEach', 'time', 'name', 'quantity'].includes(filter?.sortBy) ? filter.sortBy : 'time',
          sortOrder: ['asc', 'desc'].includes(filter?.sortOrder) ? filter.sortOrder : 'desc',
        };

        const results = ShopService.searchOrders(sanitizedFilter);
        socket.emit('SearchOrdersResult', results);
      });
    });
  }
}
