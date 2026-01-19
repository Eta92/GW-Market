/**
 * Socket.IO Random Order Emitter
 * Continuously generates and sends random orders via Socket.IO
 *
 * Usage: npx ts-node scripts/socket-order-emitter.ts [options]
 *   --url=URL           Server URL (default: http://localhost:3026)
 *   --interval=MS       Interval between orders in ms (default: 1000)
 *   --shops=N           Number of concurrent shops to simulate (default: 5)
 *   --items-per-shop=N  Items per shop (default: 10-30 random)
 *   --refresh=MS        Shop refresh interval in ms (default: 30000)
 */

import { io, Socket } from 'socket.io-client';
import * as fs from 'fs';
import * as path from 'path';
import { nanoid } from 'nanoid';

// Types
interface ShopItem {
  name: string;
  orderType: number;
  prices: Array<{ type: number; price: number }>;
  description?: string;
  quantity: number;
  hidden?: boolean;
  weaponDetails?: WeaponDetails;
}

interface WeaponDetails {
  attribute: string;
  requirement: number;
  inscription: boolean;
  oldschool: boolean;
  core: string;
  prefix: string | null;
  suffix: string | null;
}

interface Shop {
  uuid?: string;
  player: string;
  lastRefresh?: number;
  daybreakOnline?: boolean;
  items: ShopItem[];
}

interface Item {
  name: string;
  family: string;
  category: string;
}

interface GeneratorConfig {
  weaponAttributes: string[];
  professions: string[];
  weaponPrefixes: (string | null)[];
  weaponSuffixes: (string | null)[];
  inscriptions: string[];
  damageTypes: string[];
  playerPrefixes: string[];
  playerSuffixes: string[];
  descriptions: string[];
  priceTypes: { [key: string]: number };
  priceRanges: { [key: string]: { min: number; max: number } };
  quantityRanges: { [key: string]: { min: number; max: number } };
  requirementRange: { min: number; max: number; default: number };
}

// Configuration
const CONFIG = {
  SERVER_URL: 'http://localhost:3026',
  ORDER_INTERVAL: 1000,
  SHOP_COUNT: 5,
  ITEMS_PER_SHOP_MIN: 10,
  ITEMS_PER_SHOP_MAX: 30,
  SHOP_REFRESH_INTERVAL: 30000,
};

// Load generator config from JSON
function loadGeneratorConfig(): GeneratorConfig {
  const configPath = path.join(__dirname, '..', 'data', 'generator-config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

// Utilities
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePlayerName(config: GeneratorConfig): string {
  return `${randomChoice(config.playerPrefixes)} ${randomChoice(config.playerSuffixes)}`;
}

// Load items from data files
function loadAllItems(): Item[] {
  const dataPath = path.join(__dirname, '..', 'data');
  const itemFiles = [
    'weapon.json', 'unique.json', 'upgrade.json', 'consumable.json',
    'rune.json', 'material.json', 'tome.json', 'special.json',
    'miniature.json', 'service.json',
  ];

  const allItems: Item[] = [];

  for (const file of itemFiles) {
    const filePath = path.join(dataPath, file);
    if (!fs.existsSync(filePath)) continue;

    const family = file.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const category of data) {
      for (const item of category.items) {
        allItems.push({ name: item.name, family, category: category.type });
      }
    }
  }

  return allItems;
}

// Generate prices using config ranges
function generatePrice(family: string, config: GeneratorConfig): Array<{ type: number; price: number }> {
  const prices: Array<{ type: number; price: number }> = [];
  const { PLAT, ECTO, ZKEY, ARM } = config.priceTypes;
  const ranges = config.priceRanges;

  const primaryType = (() => {
    switch (family) {
      case 'weapon':
      case 'unique':
        return Math.random() < 0.7 ? ECTO : PLAT;
      case 'material':
      case 'consumable':
        return Math.random() < 0.8 ? PLAT : ECTO;
      case 'miniature':
        return randomChoice([ECTO, ARM, ZKEY]);
      case 'special':
        return Math.random() < 0.6 ? ECTO : randomChoice([ZKEY, ARM]);
      default:
        return Math.random() < 0.5 ? PLAT : ECTO;
    }
  })();

  const getRange = (type: number) => {
    switch (type) {
      case PLAT: return ranges.PLAT;
      case ECTO: return ranges.ECTO;
      case ZKEY: return ranges.ZKEY;
      case ARM: return ranges.ARM;
      default: return { min: 1, max: 100 };
    }
  };

  const primaryRange = getRange(primaryType);
  prices.push({ type: primaryType, price: randomInt(primaryRange.min, primaryRange.max) });

  if (Math.random() < 0.3) {
    const allTypes = Object.values(config.priceTypes);
    const secondaryTypes = allTypes.filter(t => t !== primaryType);
    const secondaryType = randomChoice(secondaryTypes);
    const secondaryRange = getRange(secondaryType);
    prices.push({ type: secondaryType, price: randomInt(secondaryRange.min, secondaryRange.max) });
  }

  return prices;
}

// Generate quantity using config ranges
function generateQuantity(family: string, config: GeneratorConfig): number {
  const ranges = config.quantityRanges;
  const range = ranges[family] || ranges.default;
  return randomInt(range.min, range.max);
}

// Generate weapon details using config
function generateWeaponDetails(config: GeneratorConfig): WeaponDetails {
  const reqRange = config.requirementRange;
  return {
    attribute: randomChoice(config.weaponAttributes),
    requirement: randomInt(reqRange.min, reqRange.max),
    inscription: Math.random() < 0.7,
    oldschool: Math.random() < 0.1,
    core: randomChoice(config.inscriptions),
    prefix: randomChoice(config.weaponPrefixes),
    suffix: randomChoice(config.weaponSuffixes),
  };
}

// Generate order
function generateOrder(item: Item, config: GeneratorConfig): ShopItem {
  const order: ShopItem = {
    name: item.name,
    orderType: Math.random() < 0.6 ? 0 : 1,
    prices: generatePrice(item.family, config),
    quantity: generateQuantity(item.family, config),
    hidden: false,
    description: Math.random() < 0.15 ? randomChoice(config.descriptions) : '',
  };

  if ((item.family === 'weapon' || item.family === 'unique') && Math.random() < 0.8) {
    order.weaponDetails = generateWeaponDetails(config);
  }

  return order;
}

// Generate shop
function generateShop(items: Item[], itemCount: number, config: GeneratorConfig): Shop {
  const shopItems: ShopItem[] = [];
  for (let i = 0; i < itemCount; i++) {
    shopItems.push(generateOrder(randomChoice(items), config));
  }

  return {
    player: generatePlayerName(config),
    daybreakOnline: Math.random() < 0.3,
    items: shopItems,
  };
}

// Statistics tracker
class Statistics {
  ordersSent = 0;
  shopsCreated = 0;
  shopsRefreshed = 0;
  shopsClosed = 0;
  errors = 0;
  startTime = Date.now();
  familyStats = new Map<string, number>();

  trackFamily(family: string): void {
    this.familyStats.set(family, (this.familyStats.get(family) || 0) + 1);
  }

  log(): void {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const ordersPerSecond = (this.ordersSent / elapsed).toFixed(2);
    console.log('');
    console.log('='.repeat(60));
    console.log('Statistics');
    console.log('='.repeat(60));
    console.log(`Running: ${elapsed.toFixed(0)}s | Orders: ${this.ordersSent.toLocaleString()} | Rate: ${ordersPerSecond}/s`);
    console.log(`Shops: ${this.shopsCreated} created, ${this.shopsRefreshed} refreshed, ${this.shopsClosed} closed`);
    console.log(`Errors: ${this.errors}`);
    if (this.familyStats.size > 0) {
      console.log('Family distribution:');
      for (const [family, count] of Array.from(this.familyStats.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
        console.log(`  ${family}: ${count}`);
      }
    }
    console.log('='.repeat(60));
  }
}

// Shop emitter class
class ShopEmitter {
  private socket: Socket;
  private items: Item[];
  private config: GeneratorConfig;
  private shops: Map<string, Shop> = new Map();
  private stats: Statistics;
  private running = false;
  private refreshIntervals: Map<string, NodeJS.Timeout> = new Map();
  private orderInterval: NodeJS.Timeout | null = null;

  constructor(serverUrl: string, items: Item[], config: GeneratorConfig, stats: Statistics) {
    this.socket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    this.items = items;
    this.config = config;
    this.stats = stats;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.socket.on('connect', () => {
      console.log(`[Socket] Connected (id: ${this.socket.id})`);
      this.socket.emit('SocketStarted');
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
    });

    this.socket.on('ClientInit', () => {
      console.log('[Socket] Server initialized');
    });

    this.socket.on('ClientLog', (msg: string) => {
      console.log(`[Server] ${msg}`);
    });

    this.socket.on('RefreshShop', (shop: Shop) => {
      if (shop.uuid) {
        this.shops.set(shop.uuid, shop);
        console.log(`[Shop] Refreshed: ${shop.player} (${shop.uuid}) - ${shop.items.length} items`);
      }
    });

    this.socket.on('ToasterError', (msg: string) => {
      console.error(`[Error] ${msg}`);
      this.stats.errors++;
    });

    this.socket.on('connect_error', (err) => {
      console.error(`[Socket] Connection error: ${err.message}`);
      this.stats.errors++;
    });
  }

  async start(shopCount: number): Promise<void> {
    this.running = true;

    if (!this.socket.connected) {
      console.log('Waiting for connection...');
      await new Promise<void>((resolve) => {
        this.socket.once('connect', resolve);
        setTimeout(resolve, 5000);
      });
    }

    console.log(`Creating ${shopCount} initial shops...`);
    for (let i = 0; i < shopCount; i++) {
      await this.createShop();
      await sleep(500);
    }

    this.startOrderLoop();
    console.log('Emitter started. Press Ctrl+C to stop.');
  }

  private async createShop(): Promise<void> {
    const itemCount = randomInt(CONFIG.ITEMS_PER_SHOP_MIN, CONFIG.ITEMS_PER_SHOP_MAX);
    const shop = generateShop(this.items, itemCount, this.config);

    // Track family stats
    for (const item of shop.items) {
      const foundItem = this.items.find(i => i.name === item.name);
      if (foundItem) {
        this.stats.trackFamily(foundItem.family);
      }
    }

    this.socket.emit('refreshShop', shop);
    this.stats.shopsCreated++;
    this.stats.ordersSent += shop.items.length;

    const tempId = nanoid(10);
    const interval = setInterval(() => {
      this.refreshRandomShop();
    }, CONFIG.SHOP_REFRESH_INTERVAL + randomInt(-5000, 5000));

    this.refreshIntervals.set(tempId, interval);
  }

  private refreshRandomShop(): void {
    if (!this.running || this.shops.size === 0) return;

    const shopIds = Array.from(this.shops.keys());
    const shopId = randomChoice(shopIds);
    const shop = this.shops.get(shopId);
    if (!shop) return;

    const action = Math.random();
    if (action < 0.3) {
      // Add new items
      const newItemCount = randomInt(1, 5);
      for (let i = 0; i < newItemCount; i++) {
        const newOrder = generateOrder(randomChoice(this.items), this.config);
        shop.items.push(newOrder);
        const foundItem = this.items.find(item => item.name === newOrder.name);
        if (foundItem) this.stats.trackFamily(foundItem.family);
      }
    } else if (action < 0.5 && shop.items.length > 5) {
      // Remove some items
      const removeCount = randomInt(1, Math.min(3, shop.items.length - 3));
      for (let i = 0; i < removeCount; i++) {
        shop.items.splice(randomInt(0, shop.items.length - 1), 1);
      }
    } else {
      // Update prices
      const updateCount = randomInt(1, Math.min(5, shop.items.length));
      for (let i = 0; i < updateCount; i++) {
        const idx = randomInt(0, shop.items.length - 1);
        const foundItem = this.items.find(item => item.name === shop.items[idx].name);
        shop.items[idx].prices = generatePrice(foundItem?.family || 'material', this.config);
      }
    }

    this.socket.emit('refreshShop', shop);
    this.stats.shopsRefreshed++;
    this.stats.ordersSent += shop.items.length;
  }

  private startOrderLoop(): void {
    this.orderInterval = setInterval(() => {
      if (!this.running) return;

      const action = Math.random();
      if (action < 0.1 && this.shops.size < CONFIG.SHOP_COUNT * 2) {
        this.createShop();
      } else if (action < 0.15 && this.shops.size > 3) {
        const shopIds = Array.from(this.shops.keys());
        const shopId = randomChoice(shopIds);
        this.socket.emit('closeShop', shopId);
        this.shops.delete(shopId);
        this.stats.shopsClosed++;
        console.log(`[Shop] Closed: ${shopId}`);
      } else {
        this.refreshRandomShop();
      }
    }, CONFIG.ORDER_INTERVAL);
  }

  stop(): void {
    this.running = false;
    if (this.orderInterval) clearInterval(this.orderInterval);
    for (const interval of this.refreshIntervals.values()) clearInterval(interval);
    this.refreshIntervals.clear();
    for (const shopId of this.shops.keys()) this.socket.emit('closeShop', shopId);
    this.socket.disconnect();
    console.log('Emitter stopped.');
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  for (const arg of args) {
    if (arg.startsWith('--url=')) CONFIG.SERVER_URL = arg.split('=')[1];
    else if (arg.startsWith('--interval=')) CONFIG.ORDER_INTERVAL = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--shops=')) CONFIG.SHOP_COUNT = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--items-per-shop=')) {
      const val = arg.split('=')[1];
      if (val.includes('-')) {
        const [min, max] = val.split('-').map(v => parseInt(v, 10));
        CONFIG.ITEMS_PER_SHOP_MIN = min;
        CONFIG.ITEMS_PER_SHOP_MAX = max;
      } else {
        CONFIG.ITEMS_PER_SHOP_MIN = CONFIG.ITEMS_PER_SHOP_MAX = parseInt(val, 10);
      }
    } else if (arg.startsWith('--refresh=')) {
      CONFIG.SHOP_REFRESH_INTERVAL = parseInt(arg.split('=')[1], 10);
    }
  }

  console.log('='.repeat(60));
  console.log('GW-Market Socket.IO Order Emitter');
  console.log('='.repeat(60));
  console.log(`Server: ${CONFIG.SERVER_URL}`);
  console.log(`Interval: ${CONFIG.ORDER_INTERVAL}ms | Shops: ${CONFIG.SHOP_COUNT}`);
  console.log(`Items per shop: ${CONFIG.ITEMS_PER_SHOP_MIN}-${CONFIG.ITEMS_PER_SHOP_MAX}`);
  console.log('='.repeat(60));

  const config = loadGeneratorConfig();
  console.log('Loaded generator config from data/generator-config.json');
  console.log(`  - ${config.weaponAttributes.length} weapon attributes`);
  console.log(`  - ${config.inscriptions.length} inscriptions`);
  console.log(`  - ${config.playerPrefixes.length}x${config.playerSuffixes.length} player names`);

  const items = loadAllItems();
  console.log(`Loaded ${items.length} items from data files`);

  if (items.length === 0) {
    console.error('No items loaded.');
    process.exit(1);
  }

  const stats = new Statistics();
  const emitter = new ShopEmitter(CONFIG.SERVER_URL, items, config, stats);

  let isShuttingDown = false;
  const shutdown = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log('\nShutting down...');
    emitter.stop();
    stats.log();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  setInterval(() => stats.log(), 60000);

  await emitter.start(CONFIG.SHOP_COUNT);
}

main().catch(console.error);
