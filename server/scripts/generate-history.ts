/**
 * Historical Order Generator Script
 * Generates 1M+ orders covering all item combinations over the last year
 *
 * Usage: npx ts-node scripts/generate-history.ts [options]
 *   --count=N       Total orders to generate (default: 1000000)
 *   --output=FILE   Output file path (default: data/history/orders.json)
 *   --format=FORMAT Output format: json, jsonl, mongo (default: json)
 */

import * as fs from 'fs';
import * as path from 'path';
import { nanoid } from 'nanoid';

// Types
interface ShopItem {
  name: string;
  orderType: number;
  prices: Array<{ type: number; price: number; quantity?: number }>;
  description?: string;
  quantity: number;
  player?: string;
  daybreakOnline?: boolean;
  lastRefresh?: number;
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
  uuid: string;
  player: string;
  lastRefresh: number;
  daybreakOnline: boolean;
  items: ShopItem[];
  certified?: string[];
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
  runeGrades: string[];
  insignias: string[];
  commonMaterials: string[];
  rareMaterials: string[];
  currencies: string[];
  consumableTypes: string[];
  summoningStones: string[];
  alcoholItems: string[];
  sweetItems: string[];
  festiveTonics: string[];
  everlastingTonics: string[];
  heroArmors: string[];
  endgameTrophies: string[];
  keys: string[];
  presents: string[];
  serviceTypes: string[];
  campaigns: string[];
  regions: string[];
  playerPrefixes: string[];
  playerSuffixes: string[];
  descriptions: string[];
  priceTypes: { [key: string]: number };
  itemFamilies: string[];
  weaponCategories: string[];
  rarities: string[];
  priceRanges: { [key: string]: { min: number; max: number } };
  quantityRanges: { [key: string]: { min: number; max: number } };
  requirementRange: { min: number; max: number; default: number };
  weaponDamageRanges: { [key: string]: string };
}

// Configuration
const CONFIG = {
  ORDER_COUNT: 1_000_000,
  OUTPUT_PATH: 'data/history/orders.json',
  OUTPUT_FORMAT: 'json' as 'json' | 'jsonl' | 'mongo',
  BATCH_SIZE: 10_000,
  ONE_YEAR_MS: 365 * 24 * 60 * 60 * 1000,
};

// Load generator config from JSON
function loadGeneratorConfig(): GeneratorConfig {
  const configPath = path.join(__dirname, '..', 'data', 'generator-config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

// Load all items from JSON files
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
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: ${file} not found`);
      continue;
    }

    const family = file.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const category of data) {
      for (const item of category.items) {
        allItems.push({
          name: item.name,
          family,
          category: category.type,
        });
      }
    }
  }

  console.log(`Loaded ${allItems.length} unique items`);
  return allItems;
}

// Random utilities
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePlayerName(config: GeneratorConfig): string {
  return `${randomChoice(config.playerPrefixes)} ${randomChoice(config.playerSuffixes)}`;
}

// Generate a random timestamp within the last year
function randomTimestamp(): number {
  const now = Date.now();
  const oneYearAgo = now - CONFIG.ONE_YEAR_MS;
  return randomInt(oneYearAgo, now);
}

// Generate price based on item family using config ranges
function generatePrice(family: string, config: GeneratorConfig): Array<{ type: number; price: number }> {
  const prices: Array<{ type: number; price: number }> = [];
  const { PLAT, ECTO, ZKEY, ARM } = config.priceTypes;
  const ranges = config.priceRanges;

  // Primary price type probabilities based on item family
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
      case 'service':
        return Math.random() < 0.5 ? PLAT : ECTO;
      default:
        return Math.random() < 0.5 ? PLAT : ECTO;
    }
  })();

  // Get price range for the type
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

  // 30% chance of secondary price
  if (Math.random() < 0.3) {
    const allTypes = Object.values(config.priceTypes);
    const secondaryTypes = allTypes.filter(t => t !== primaryType);
    const secondaryType = randomChoice(secondaryTypes);
    const secondaryRange = getRange(secondaryType);
    prices.push({ type: secondaryType, price: randomInt(secondaryRange.min, secondaryRange.max) });
  }

  return prices;
}

// Generate quantity based on item family using config ranges
function generateQuantity(family: string, config: GeneratorConfig): number {
  const ranges = config.quantityRanges;
  const range = ranges[family] || ranges.default;
  return randomInt(range.min, range.max);
}

// Generate weapon details using all config data
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

// Generate a single order
function generateOrder(item: Item, timestamp: number, config: GeneratorConfig): ShopItem {
  const order: ShopItem = {
    name: item.name,
    orderType: Math.random() < 0.6 ? 0 : 1, // 60% sell, 40% buy
    prices: generatePrice(item.family, config),
    quantity: generateQuantity(item.family, config),
    player: generatePlayerName(config),
    daybreakOnline: Math.random() < 0.3,
    lastRefresh: timestamp,
    description: Math.random() < 0.15 ? randomChoice(config.descriptions) : '',
  };

  // Add weapon details for weapon/unique items
  if ((item.family === 'weapon' || item.family === 'unique') && Math.random() < 0.8) {
    order.weaponDetails = generateWeaponDetails(config);
  }

  return order;
}

// Generate a shop with multiple items
function generateShop(items: Item[], timestamp: number, itemCount: number, config: GeneratorConfig): Shop {
  const selectedItems: Item[] = [];
  for (let i = 0; i < itemCount; i++) {
    selectedItems.push(randomChoice(items));
  }

  return {
    uuid: nanoid(10),
    player: generatePlayerName(config),
    lastRefresh: timestamp,
    daybreakOnline: Math.random() < 0.3,
    items: selectedItems.map(item => generateOrder(item, timestamp, config)),
  };
}

// Main generation function
async function generateHistory(): Promise<void> {
  // Parse command line arguments
  const args = process.argv.slice(2);
  for (const arg of args) {
    if (arg.startsWith('--count=')) {
      CONFIG.ORDER_COUNT = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--output=')) {
      CONFIG.OUTPUT_PATH = arg.split('=')[1];
    } else if (arg.startsWith('--format=')) {
      CONFIG.OUTPUT_FORMAT = arg.split('=')[1] as typeof CONFIG.OUTPUT_FORMAT;
    }
  }

  console.log('='.repeat(60));
  console.log('GW-Market Historical Order Generator');
  console.log('='.repeat(60));
  console.log(`Target orders: ${CONFIG.ORDER_COUNT.toLocaleString()}`);
  console.log(`Output file: ${CONFIG.OUTPUT_PATH}`);
  console.log(`Output format: ${CONFIG.OUTPUT_FORMAT}`);
  console.log('='.repeat(60));

  // Load config and items
  const config = loadGeneratorConfig();
  console.log('Loaded generator config from data/generator-config.json');
  console.log(`  - ${config.weaponAttributes.length} weapon attributes`);
  console.log(`  - ${config.inscriptions.length} inscriptions`);
  console.log(`  - ${config.weaponPrefixes.length} prefixes, ${config.weaponSuffixes.length} suffixes`);
  console.log(`  - ${config.playerPrefixes.length}x${config.playerSuffixes.length} = ${config.playerPrefixes.length * config.playerSuffixes.length} player name combinations`);

  const allItems = loadAllItems();
  if (allItems.length === 0) {
    console.error('No items loaded. Make sure data JSON files exist.');
    process.exit(1);
  }

  // Ensure output directory exists
  const outputDir = path.dirname(path.join(__dirname, '..', CONFIG.OUTPUT_PATH));
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Track coverage
  const itemCoverage = new Map<string, number>();
  const familyCoverage = new Map<string, number>();
  const orderTypeCoverage = { sell: 0, buy: 0 };
  const priceTypeCoverage = new Map<number, number>();
  const prefixCoverage = new Map<string, number>();
  const suffixCoverage = new Map<string, number>();

  const startTime = Date.now();
  let generatedCount = 0;
  const shops: Shop[] = [];

  console.log('\nGenerating orders...');

  // Phase 1: Full item coverage
  console.log('Phase 1: Ensuring full item coverage...');
  for (const item of allItems) {
    const timestamp = randomTimestamp();
    const shop = generateShop([item], timestamp, 1, config);
    shops.push(shop);

    // Track coverage
    itemCoverage.set(item.name, (itemCoverage.get(item.name) || 0) + 1);
    familyCoverage.set(item.family, (familyCoverage.get(item.family) || 0) + 1);
    generatedCount++;
  }
  console.log(`Covered ${allItems.length} unique items`);

  // Phase 2: Random orders to reach target
  console.log('Phase 2: Generating random orders...');
  while (generatedCount < CONFIG.ORDER_COUNT) {
    const itemsPerShop = randomInt(1, 50);
    const timestamp = randomTimestamp();
    const shop = generateShop(allItems, timestamp, Math.min(itemsPerShop, CONFIG.ORDER_COUNT - generatedCount), config);
    shops.push(shop);

    // Track coverage
    for (const order of shop.items) {
      itemCoverage.set(order.name, (itemCoverage.get(order.name) || 0) + 1);
      const item = allItems.find(i => i.name === order.name);
      if (item) {
        familyCoverage.set(item.family, (familyCoverage.get(item.family) || 0) + 1);
      }

      if (order.orderType === 0) orderTypeCoverage.sell++;
      else orderTypeCoverage.buy++;

      for (const price of order.prices) {
        priceTypeCoverage.set(price.type, (priceTypeCoverage.get(price.type) || 0) + 1);
      }

      if (order.weaponDetails) {
        if (order.weaponDetails.prefix) {
          prefixCoverage.set(order.weaponDetails.prefix, (prefixCoverage.get(order.weaponDetails.prefix) || 0) + 1);
        }
        if (order.weaponDetails.suffix) {
          suffixCoverage.set(order.weaponDetails.suffix, (suffixCoverage.get(order.weaponDetails.suffix) || 0) + 1);
        }
      }

      generatedCount++;
    }

    // Progress update
    if (generatedCount % CONFIG.BATCH_SIZE === 0) {
      const progress = (generatedCount / CONFIG.ORDER_COUNT * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stdout.write(`\rProgress: ${progress}% (${generatedCount.toLocaleString()} orders, ${elapsed}s)`);
    }
  }
  console.log('');

  // Write output
  console.log('\nWriting output file...');
  const outputPath = path.join(__dirname, '..', CONFIG.OUTPUT_PATH);

  if (CONFIG.OUTPUT_FORMAT === 'json') {
    const allOrders = shops.flatMap(shop =>
      shop.items.map(item => ({
        ...item,
        shopUuid: shop.uuid,
        shopPlayer: shop.player,
      }))
    );
    fs.writeFileSync(outputPath, JSON.stringify({ orders: allOrders, shops }, null, 2));
  } else if (CONFIG.OUTPUT_FORMAT === 'jsonl') {
    const stream = fs.createWriteStream(outputPath);
    for (const shop of shops) {
      stream.write(JSON.stringify(shop) + '\n');
    }
    stream.end();
  } else if (CONFIG.OUTPUT_FORMAT === 'mongo') {
    const allOrders = shops.flatMap(shop =>
      shop.items.map(item => ({
        ...item,
        shopUuid: shop.uuid,
        shopPlayer: shop.player,
        _id: nanoid(24),
      }))
    );
    fs.writeFileSync(outputPath, allOrders.map(o => JSON.stringify(o)).join('\n'));
  }

  // Print statistics
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  const priceNames = ['PLAT', 'ECTO', 'ZKEY', 'ARM'];

  console.log('');
  console.log('='.repeat(60));
  console.log('Generation Complete!');
  console.log('='.repeat(60));
  console.log(`Total orders generated: ${generatedCount.toLocaleString()}`);
  console.log(`Total shops created: ${shops.length.toLocaleString()}`);
  console.log(`Time elapsed: ${duration}s`);
  console.log(`Orders per second: ${(generatedCount / parseFloat(duration)).toFixed(0)}`);
  console.log('');
  console.log('Coverage Statistics:');
  console.log(`- Unique items covered: ${itemCoverage.size} / ${allItems.length}`);
  console.log(`- Sell orders: ${orderTypeCoverage.sell.toLocaleString()} (${(orderTypeCoverage.sell / generatedCount * 100).toFixed(1)}%)`);
  console.log(`- Buy orders: ${orderTypeCoverage.buy.toLocaleString()} (${(orderTypeCoverage.buy / generatedCount * 100).toFixed(1)}%)`);
  console.log('');
  console.log('Family Distribution:');
  for (const [family, count] of Array.from(familyCoverage.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${family}: ${count.toLocaleString()} (${(count / generatedCount * 100).toFixed(1)}%)`);
  }
  console.log('');
  console.log('Price Type Distribution:');
  for (const [type, count] of priceTypeCoverage.entries()) {
    console.log(`  ${priceNames[type]}: ${count.toLocaleString()}`);
  }
  console.log('');
  console.log('Weapon Mod Coverage:');
  console.log(`  Prefixes used: ${prefixCoverage.size} unique`);
  console.log(`  Suffixes used: ${suffixCoverage.size} unique`);
  console.log('');
  console.log(`Output saved to: ${outputPath}`);
}

// Run
generateHistory().catch(console.error);
