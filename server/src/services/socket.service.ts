import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { ItemService } from './item.service';
import { Shop } from '../models/shop.model';
import { ShopService } from './shop.service';

// Socket rate limiting configuration
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const socketRateLimits = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 events per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = socketRateLimits.get(ip);

  if (!entry || now >= entry.resetTime) {
    socketRateLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of socketRateLimits) {
    if (now >= entry.resetTime) {
      socketRateLimits.delete(ip);
    }
  }
}, 60 * 1000);

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

      // Rate limiting middleware for socket events
      socket.use((event, next) => {
        if (!checkRateLimit(socket.data.ip)) {
          console.log('Rate limit exceeded for IP ' + socket.data.ip);
          socket.emit('ToasterError', 'Too many requests. Please slow down.');
          return next(new Error('Rate limit exceeded'));
        }
        next();
      });

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
    });
  }
}
