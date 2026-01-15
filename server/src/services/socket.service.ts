import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { ItemService } from './item.service';
import { Shop } from '../models/shop.model';
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
        ShopService.closeShop(uuid, socket);
      });

      socket.on('getLastItemsByFamily', (family: string) => {
        const items = ShopService.getLastItemsByFamily(family);
        socket.emit('GetLastItems', items);
      });
    });
  }
}
