import { nanoid } from 'nanoid';
import WebSocket from 'ws';
import { KamadanChunk, KamadanData, KamadanPosition, KamadanPrice, KamadanSplit } from '../models/kamadan.model';
import { Item, OrderType, Price, ShopItem } from '../models/shop.model';

const fs = require('fs');

export class KamadanService {
  private static kamadanurl = 'wss://kamadan.gwtoolbox.com/';
  private static ws: WebSocket;
  private static kamadanItems: Array<ShopItem> = [];
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 10;
  private static baseReconnectDelay = 1000; // 1 second
  private static reconnectTimeout: NodeJS.Timeout | null = null;

  public static init(itemMap?: { [key: string]: Item }) {
    this.connect();

    const jsonData = fs.readFileSync('./data/acronym.json');
    const acronyms = JSON.parse(jsonData);
    this.attributeTags = {};
    for (const key in acronyms.attributes) {
      this.attributeTags[key] = acronyms.attributes[key].map((pattern: string) => new RegExp(`\\b${pattern}\\b`, 'gi'));
    }
    this.inscriptionTags = {};
    for (const key in acronyms.inscription) {
      this.inscriptionTags[key] = acronyms.inscription[key].map((pattern: string) => new RegExp(`\\b${pattern}\\b`, 'gi'));
    }
    this.acronymMap = {};
    for (const key in acronyms.items) {
      for (const pattern of acronyms.items[key]) {
        this.acronymMap[pattern.toLowerCase()] = key;
      }
    }
    if (itemMap) {
      this.itemMap = {};
      for (const key in itemMap) {
        this.itemMap[key.toLowerCase()] = key;
      }
    }
    console.log('KamadanService initialized');
  }

  private static connect(): void {
    try {
      this.ws = new WebSocket(KamadanService.kamadanurl);

      this.ws.on('open', () => {
        console.log('Kamadan WebSocket connection established');
        this.reconnectAttempts = 0; // Reset on successful connection
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          this.logToFile(`Kamadan input try: ${JSON.parse(data.toString()).m}\n`);
          this.handleMessage(JSON.parse(data.toString()) as KamadanData);
        } catch (error) {
          this.logToFile(`Kamadan parsing error: ${error}`);
        }
      });

      this.ws.on('error', (err) => {
        console.error('Kamadan WebSocket error:', err.message);
        this.logToFile(`Kamadan WebSocket error: ${err.message}\n`);
        // Don't reconnect here - let 'close' event handle it
      });

      this.ws.on('close', () => {
        console.log('Kamadan WebSocket connection closed');
        this.scheduleReconnect();
      });
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private static scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Failed to reconnect to Kamadan after ${this.maxReconnectAttempts} attempts. Giving up.`);
      this.logToFile(`✘ Kamadan reconnect failed after ${this.maxReconnectAttempts} attempts\n`);
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Cap at 30 seconds
    );

    console.log(`Attempting to reconnect to Kamadan (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
    this.logToFile(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms\n`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public static getKamadanOrders(): Array<ShopItem> {
    return [...this.kamadanItems];
  }

  // TODO change the split for more way to require things
  private static tradeTypeRegex = /\b(WTB|WTS|WTT)\b/gi;
  // TODO change de price acro with all price writings
  private static priceAcro = ['e', 'a', 'k', 'plat', 'bd', 'arm', 'ecto'].join('|');
  private static groupAcro = ['ea', 'each', 'stks?', 'stacks?', 'sets?'].join('|');
  private static priceRegex = new RegExp(
    `(?:\\d+\\s*(?:${this.priceAcro})?(=(\\s*\\d+)\\s*(?:${this.priceAcro})))|((?<!x|r|q)(\\d+(?:\\.\\d+)?)\\s*(?:${this.priceAcro})(?:(?:\\s*(?:\\/|:)\\s*|\\s+)(?:${this.groupAcro})\\b)?)`,
    'g'
  );
  // /(?:\d+\s*(?:e|a|k)?(=(\s*\d+)\s*(?:e|a|k)))|((?<!x)(\d+(?:\.\d+)?)\s*(?:e|a|k|plat)(?:(?:\s*(?:\/|:)\s*|\s+)(?:ea|each|stack)\b)?)/gi;
  private static delimiters = ['||', '|', '//', 'and', ',', '-', ';', '/'];
  private static quantityRegex = new RegExp(
    `x\\s*(\d+)|\\(\\s*x?\\s*(\d+)\\s*\\)|(\\d+)\\s*(?:${this.groupAcro})|(\\d+)\\s*x|(?<!\\d)(?<!q|r|\\+)(\\d+\\b)(?!%)`,
    'g'
  );
  // /x\s*(\d+)|\(\s*x?\s*(\d+)\s*\)|(\d+)\s*stacks?|(\d+)\s*sets?|(\d+)\s*x|(?<!\d)(?<!q|r|\+)(\d+\b)(?!%)/gi;
  private static requirementRegex = /(?:\breq|requirement|requires|reqs|r|q)\s*[:\-\=]?\s*(\d+)?/gi;
  private static fillerWords = [
    'for',
    'each',
    'ea',
    'each',
    'stack of',
    'stacks of',
    'stack',
    'stacks',
    'stk',
    'set of',
    'sets of',
    'set',
    'sets',
    'pm',
    // 'me',// fock forget me not
    // 'of',// fock of the profession
    'ins.',
    'ins',
    'inscription',
    'insc.',
    'mod',
    'dedicated',
    'ded',
    'undedicated',
    'unded',
    'regular',
    'reg',
    '~',
    '=',
    '-',
    '(',
    ')',
    '()',
    ',',
    '.',
    '!',
    '?',
    '|',
    '/',
  ];
  public static attributeTags: { [key: string]: RegExp[] } = {};
  public static inscriptionTags: { [key: string]: RegExp[] } = {};
  public static acronymMap: { [key: string]: string } = {};
  public static itemMap: { [key: string]: string } = {};

  private static defaultPrice: KamadanPrice = { value: 0, type: Price.ECTO, start: 0, end: 0, content: '' };

  private static logToFile(message: string): void {
    const logFile = './kamadan-log.txt';
    fs.stat(logFile, (err: any, stats: any) => {
      if (!err && stats.size >= 1024 * 1024) {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const archiveName = `./kamadan-log-${timestamp}.txt`;
        fs.rename(logFile, archiveName, (renameErr: any) => {
          if (renameErr) console.error('Failed to archive log:', renameErr);
          fs.appendFile(logFile, message, (appendErr: any) => {
            if (appendErr) console.error('Failed to write log:', appendErr);
          });
        });
      } else {
        fs.appendFile(logFile, message, (appendErr: any) => {
          if (appendErr) console.error('Failed to write log:', appendErr);
        });
      }
    });
  }

  private static handleMessage(data: KamadanData) {
    const results: Array<ShopItem> = [];
    if (!data.m || data.m.trim() === '') {
      console.log('Kamadan message is empty, skipping processing.');
      return;
    }
    // 1. Normalize
    const normalized = data.m.toLowerCase().trim();

    // 2. Split by WTB / WTS boundaries (keep markers)
    const chunks = this.splitByTradeTypes(normalized);

    for (const chunk of chunks) {
      const type = chunk.type;
      if (type === null) continue; // ignore WTT or unknown

      chunk.prices = this.getPricePositions(chunk.text);

      if (chunk.prices.length > 0) {
        chunk.splits = this.splitBetweenPrices(chunk);
      } else {
        chunk.splits = this.splittingAttempt(chunk);
      }

      this.findQuantity(chunk);
      this.findRequirement(chunk);
      this.findAttribute(chunk);
      this.findInscription(chunk);
      this.clearText(chunk);

      //console.log(`Processing ${chunk.splits.length} intents for type ${OrderType[type]}`);
      for (let s = 0; s < chunk.splits.length; s++) {
        const split = chunk.splits[s];
        const hasWeaponDetails = split.requirement !== undefined || split.attribute !== undefined || split.inscription !== undefined;
        let match = null;
        if (this.itemMap[split.content]) {
          match = this.itemMap[split.content];
        } else if (this.acronymMap[split.content]) {
          match = this.acronymMap[split.content];
        } else if (/s$/.test(split.content)) {
          split.content = split.content.slice(0, -1);
          if (this.itemMap[split.content]) {
            match = this.itemMap[split.content];
          } else if (this.acronymMap[split.content]) {
            match = this.acronymMap[split.content];
          }
        }
        if (!match) {
          this.logToFile(` ✘ No match found for item: ${split.content}\n`);
          continue;
        }
        const index = this.kamadanItems.findIndex((item) => item.name === match && item.player === data.s);
        if (index !== -1) {
          this.kamadanItems.splice(index, 1);
          //console.log(`Removed existing item for player ${data.s} and item ${match}`);
        }
        this.logToFile(` ✔ Match found for item: ${split.content} -> ${match}\n`);
        const item = {
          id: nanoid(10),
          name: match,
          orderType: chunk.type,
          prices: chunk.prices[s]
            ? [
                {
                  price: chunk.prices[s]?.value || 0,
                  type: chunk.prices[s]?.type || Price.ECTO,
                  quantity: chunk.prices[s]?.quantity || 1,
                },
              ]
            : [
                {
                  price: 0,
                  type: Price.ECTO,
                  quantity: 1,
                },
              ],
          quantity: chunk.prices?.[s]?.quantity || 1,
          weaponDetails: hasWeaponDetails
            ? {
                requirement: split.requirement,
                attribute: split.attribute,
                inscription: split.inscription,
                core: null,
                prefix: null,
                suffix: null,
              }
            : undefined,
          // TODO parse details
          //   orderDetails?: OrderDetails,
          description: data.m,
          listedTime: data.t,
          player: data.s,
          kamadanChat: true,
          lastRefresh: data.t,
        };
        // console.log(
        //   `Parsed item: \n   item = ${item.name}\n   prices = ${JSON.stringify(item.prices)}\n   quantity = ${item.quantity}\n   player = ${item.player} ${item.weaponDetails ? `\n   weaponDetails = ${JSON.stringify(item.weaponDetails)}` : ''} `
        // );
        results.push(item);
      }
    }
    this.kamadanItems.push(...results);
    while (this.kamadanItems.length > 0 && this.kamadanItems[0].listedTime < Date.now() - 1000 * 60 * 15) {
      this.kamadanItems.shift();
    }
    //console.log('Kamadan items updated:', this.kamadanItems.length);
  }

  private static splitByTradeTypes(text: string): Array<KamadanChunk> {
    const regex = this.tradeTypeRegex;

    const matches = [...text.matchAll(regex)];
    const chunks: KamadanChunk[] = [];

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const type = matches[i][1].toUpperCase();

      const end = i + 1 < matches.length ? matches[i + 1].index : text.length;

      chunks.push({
        type: type === 'WTS' ? OrderType.SELL : type === 'WTB' ? OrderType.BUY : null,
        text: text.slice(start + matches[i][0].length, end).trim(),
      });
    }

    return chunks;
  }

  private static getPricePositions(text: string): Array<KamadanPrice> {
    const positions: Array<KamadanPrice> = [];
    const matches = [...text.matchAll(this.priceRegex)];
    for (const match of matches) {
      // console.log(`complete match : ${JSON.stringify(match)}`);
      if (match[2] !== undefined) {
        const start = match.index + match[0].indexOf(match[1]);
        const end = start + match[1].length;
        const content = match[1];
        const value = parseFloat(match[2]);
        const type = this.getCurrencyType(content);
        positions.push({ start, end, content, value, type });
      }
      if (match[4] !== undefined) {
        const start = match.index + match[0].indexOf(match[3]);
        const end = start + match[3].length;
        const content = match[3];
        const value = parseFloat(match[4]);
        const type = this.getCurrencyType(content);
        positions.push({ start, end, content, value, type });
      }
    }
    return positions;
  }

  private static getCurrencyType(content: string): Price {
    const currencyMap: { [key in Price]: Array<string> } = {
      [Price.ARM]: ['a', 'arm'],
      [Price.BD]: ['bd', 'black'],
      [Price.ECTO]: ['e', 'ecto'],
      [Price.PLAT]: ['plat', 'platinum', 'k'],
      [Price.ZKEY]: [],
    };

    for (const [price, keywords] of Object.entries(currencyMap)) {
      if (keywords.some((keyword) => content.includes(keyword))) {
        return price as unknown as Price;
      }
    }
    return Price.ECTO;
  }

  private static splitBetweenPrices(chunk: KamadanChunk): Array<KamadanSplit> {
    const splits: Array<KamadanSplit> = [];
    const prices = chunk.prices || [];
    let remainingTextIndex = 0;
    for (let i = 0; i < prices.length - 1; i++) {
      const start = prices[i].end;
      const end = prices[i + 1].start;
      const target = chunk.text.slice(start, end).trim();
      if (target) {
        for (let d = 0; d < this.delimiters.length; d++) {
          const delimiter = this.delimiters[d];
          if (target.includes(delimiter)) {
            splits.push({
              start: remainingTextIndex,
              end: target.indexOf(delimiter) + start,
              content:
                chunk.text.slice(remainingTextIndex, prices[i].start).trim() +
                ' ' +
                chunk.text.slice(prices[i].end, target.indexOf(delimiter) + start).trim(),
            });
            // the +1 seems wrong but does work
            remainingTextIndex = target.indexOf(delimiter) + start + delimiter.length + 1;
            break;
          }
        }
      }
    }
    splits.push({
      start: remainingTextIndex,
      end: chunk.text.length,
      content:
        chunk.text.slice(remainingTextIndex, prices[prices.length - 1].start).trim() +
        ' ' +
        chunk.text.slice(prices[prices.length - 1].end).trim(),
    });
    return splits;
  }

  private static splittingAttempt(chunk: KamadanChunk): Array<KamadanPosition> {
    const splits: Array<KamadanPosition> = [];
    const text = chunk.text;
    for (let d = 0; d < this.delimiters.length; d++) {
      const delimiter = this.delimiters[d];
      if (text.includes(delimiter)) {
        const parts = text.split(delimiter);
        let currentIndex = 0;
        for (const part of parts) {
          const start = currentIndex;
          const end = start + part.length;
          splits.push({ start, end, content: part.trim() });
          currentIndex = end + delimiter.length;
        }
        break;
      }
    }
    if (splits.length === 0) {
      splits.push({ start: 0, end: text.length, content: text.trim() });
    }
    return splits;
  }

  private static findQuantity(chunk: KamadanChunk): void {
    for (let s = 0; s < chunk.splits.length; s++) {
      const split = chunk.splits[s];
      const matches = [...split.content.matchAll(this.quantityRegex)];
      for (const match of matches) {
        const quantity = parseInt(match[1] || match[2] || match[3] || match[4] || match[5] || match[6]);
        if (!isNaN(quantity)) {
          if (!chunk.prices) {
            chunk.prices = [];
          }
          if (!chunk.prices[s]) {
            chunk.prices[s] = { ...this.defaultPrice };
          }
          chunk.prices[s].quantity = quantity;
          split.content = split.content.replace(match[0], '').trim();
          break; // Assuming only one quantity per split, exit after finding the first
        }
      }
    }
  }

  private static findRequirement(chunk: KamadanChunk): void {
    for (let s = 0; s < chunk.splits.length; s++) {
      const split = chunk.splits[s];
      const matches = [...split.content.matchAll(this.requirementRegex)];
      for (const match of matches) {
        const requirement = parseInt(match[1]);
        if (!isNaN(requirement)) {
          if (!chunk.splits[s].requirement) {
            chunk.splits[s].requirement = requirement;
          }
          split.content = split.content.replace(match[0], '').trim();
          break; // Assuming only one requirement per split, exit after finding the first
        }
      }
    }
  }

  private static findAttribute(chunk: KamadanChunk): void {
    for (let s = 0; s < chunk.splits.length; s++) {
      const split = chunk.splits[s];
      for (const attr in this.attributeTags) {
        const tags = this.attributeTags[attr];
        for (let t = 0; t < tags.length; t++) {
          const tag = tags[t];
          if (tag.test(split.content)) {
            chunk.splits[s].attribute = attr;
            split.content = split.content.replace(tag, '').trim();
            break; // Assuming only one requirement per split, exit after finding the first
          }
        }
      }
    }
  }

  private static findInscription(chunk: KamadanChunk): void {
    for (let s = 0; s < chunk.splits.length; s++) {
      const split = chunk.splits[s];
      for (let t = 0; t < this.inscriptionTags['true'].length; t++) {
        const tag = this.inscriptionTags['true'][t];
        if (tag.test(split.content)) {
          chunk.splits[s].inscription = true;
          split.content = split.content.replace(tag, '').trim();
          break; // Assuming only one requirement per split, exit after finding the first
        }
      }
      for (let t = 0; t < this.inscriptionTags['false'].length; t++) {
        const tag = this.inscriptionTags['false'][t];
        if (tag.test(split.content)) {
          chunk.splits[s].inscription = false;
          split.content = split.content.replace(tag, '').trim();
          break; // Assuming only one requirement per split, exit after finding the first
        }
      }
    }
  }

  private static clearText(chunk: KamadanChunk): void {
    for (let s = 0; s < chunk.splits.length; s++) {
      let split = chunk.splits[s];
      for (let f = 0; f < this.fillerWords.length; f++) {
        const filler = this.fillerWords[f].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        split.content = split.content.replace(regex, '').trim();
      }
    }
  }
}
