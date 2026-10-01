import { nanoid } from 'nanoid';
import WebSocket from 'ws';
import { KamadanChunk, KamadanData, KamadanPosition, KamadanPrice, KamadanSplit } from '../models/kamadan.model';
import { Item, OrderType, Price, ShopItem } from '../models/shop.model';

const fs = require('fs');

export class KamadanService {
  public static kamadanItems: Array<ShopItem> = [];

  private static kamadanurl = 'wss://kamadan.gwtoolbox.com/';
  private static ws: WebSocket;
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
    this.acronymMap = Object.create(null);
    for (const key in acronyms.items) {
      for (const pattern of acronyms.items[key]) {
        this.acronymMap[pattern.toLowerCase()] = key;
      }
    }
    if (itemMap) {
      this.itemMap = Object.create(null);
      for (const key in itemMap) {
        this.itemMap[key.toLowerCase()] = key;
      }
    }
    this.buildPhraseIndex();
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
  private static delimiters = ['||', '|', '//', '::', '...', '\n', '\\', '~', 'and', ',', '-', ';', '/'];
  // characters people type instead of a space - "Gifts_of_the_Traveler", "Flare*50",
  // "hale&hearty". Splitting on them would shred the name, so they become spaces first.
  private static spacers = /[_*&]/g;
  private static quantityRegex = new RegExp(
    `x\\s*(\\d+)|\\(\\s*x?\\s*(\\d+)\\s*\\)|(\\d+)\\s*(?:${this.groupAcro})|(\\d+)\\s*x|(?<!\\d)(?<!q|r|\\+)(\\d+\\b)(?!%)`,
    'g'
  );
  // /x\s*(\d+)|\(\s*x?\s*(\d+)\s*\)|(\d+)\s*stacks?|(\d+)\s*sets?|(\d+)\s*x|(?<!\d)(?<!q|r|\+)(\d+\b)(?!%)/gi;
  // a stack is 250 items; the mention applies to the whole chunk, as in
  // "WTS stacks x2 Chitin Fragments, x4 Bolt of cloth" where only the first part says it
  private static stackSize = 250;
  private static stackRegex = /\b(?:stacks?|stks?)\b/i;
  // a chunk that opens on the word applies it to every item that follows, as in
  // "WTS stacks x2 Chitin Fragments, x4 Bolt of cloth"; anywhere else it only
  // concerns the item it sits next to, as in "Lockpick Stks 1a :: Silv ZCoin 1e"
  private static stackHeaderRegex = /^\s*(?:stacks?|stks?)\b/i;
  // "25e/ea" and "35a/stack" price one unit of a group, not the whole lot
  private static groupRegex = new RegExp(`\\b(?:${this.groupAcro})\\b`, 'i');
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
    'stk of',
    'stks of',
    'stk',
    'stks',
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
  // Object.create(null), not {}: these are looked up with text straight out of chat, and a
  // plain object answers "constructor", "__proto__" or "toString" with something inherited.
  // "WTS constructor 5e" then built an item whose name was a function, which JSON.stringify
  // drops, so clients received a nameless item.
  public static acronymMap: { [key: string]: string } = Object.create(null);
  public static itemMap: { [key: string]: string } = Object.create(null);

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

  /** Every catalog name and acronym, grouped by how many words it has, so a fragment can be
   *  scanned for the longest name it contains without walking the catalog. Built once, at init. */
  private static phraseIndex: Array<Map<string, string>> = [];

  private static normalize(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  private static buildPhraseIndex(): void {
    this.phraseIndex = [];
    const add = (key: string, value: string) => {
      const phrase = this.normalize(key);
      // one to three letter acronyms ("e", "a", "gc") turn up inside ordinary words far
      // too often to be worth hunting for in the middle of a sentence
      if (phrase.length < 4) return;
      const size = phrase.split(' ').length;
      const bucket = this.phraseIndex[size] || (this.phraseIndex[size] = new Map<string, string>());
      if (!bucket.has(phrase)) {
        bucket.set(phrase, value);
      }
    };
    for (const key in this.itemMap) add(key, this.itemMap[key]);
    for (const key in this.acronymMap) add(key, this.acronymMap[key]);
  }

  /** The longest catalog name contained in the fragment, for when the fragment carries
   *  leftovers the cleanup did not remove - "elit monk tome," or "froggy (pm offer)".
   *  The exact lookups run first, so this only costs anything on a fragment that would
   *  otherwise be thrown away. */
  private static findContainedItem(content: string): string | null {
    const words = this.normalize(content).split(' ').filter(Boolean);
    if (!words.length) {
      return null;
    }
    for (let size = Math.min(words.length, this.phraseIndex.length - 1); size > 0; size--) {
      const bucket = this.phraseIndex[size];
      if (!bucket) {
        continue;
      }
      for (let i = 0; i + size <= words.length; i++) {
        const phrase = words.slice(i, i + size).join(' ');
        const hit = bucket.get(phrase) ?? (phrase.endsWith('s') ? bucket.get(phrase.slice(0, -1)) : undefined);
        if (hit) {
          return hit;
        }
      }
    }
    return null;
  }

  /** Two listings are the same offer when they share the player, the order type, the item
   *  and - for weapons - the requirement and attribute that tell one apart from another.
   *  Fields the message never stated collapse to an empty string, so a consumable keeps
   *  the plain player + item identity it had before. */
  private static identity(item: ShopItem): string {
    const details = item.weaponDetails;
    return [item.player, item.orderType, item.name, details?.requirement ?? '', details?.attribute ?? ''].join('|');
  }

  private static handleMessage(data: KamadanData) {
    const results: Array<ShopItem> = [];
    if (!data.m || data.m.trim() === '') {
      console.log('Kamadan message is empty, skipping processing.');
      return;
    }
    // 1. Normalize
    const normalized = data.m.toLowerCase().replace(this.spacers, ' ').replace(/[^\S\n]+/g, ' ').trim();

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
      // before clearText, which strips the "/" these lists are built on
      this.expandVariants(chunk);
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
          match = this.findContainedItem(split.content);
        }
        if (!match) {
          this.logToFile(` ✘ No match found for item: ${split.content}\n`);
          continue;
        }
        this.logToFile(` ✔ Match found for item: ${split.content} -> ${match}\n`);
        const item = {
          id: nanoid(10),
          name: match,
          orderType: chunk.type,
          prices: chunk.prices[s]
            ? [
                {
                  price: this.totalPrice(chunk.prices[s]),
                  // ?? not ||: Price.PLAT is 0, which || would silently turn into ECTO
                  type: chunk.prices[s]?.type ?? Price.ECTO,
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
                inscription: split.inscription ?? false,
                oldSchool: split.oldSchool ?? false,
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
        // a repost replaces the player's previous listing of the same offer
        const index = this.kamadanItems.findIndex((existing) => this.identity(existing) === this.identity(item));
        if (index !== -1) {
          this.kamadanItems.splice(index, 1);
          //console.log(`Removed existing item for player ${data.s} and item ${match}`);
        }
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

  // the currency is the token right after the number: scanning the whole string for
  // substrings reads "35a/stack" as plat, because "stack" contains the plat keyword "k"
  private static currencyRegex = /\d+(?:\.\d+)?\s*(platinum|plat|ecto|arm|black|bd|e|a|k)/i;

  private static getCurrencyType(content: string): Price {
    switch (this.currencyRegex.exec(content)?.[1]?.toLowerCase()) {
      case 'a':
      case 'arm':
        return Price.ARM;
      case 'bd':
      case 'black':
        return Price.BD;
      case 'k':
      case 'plat':
      case 'platinum':
        return Price.PLAT;
      default:
        return Price.ECTO;
    }
  }

  private static splitBetweenPrices(chunk: KamadanChunk): Array<KamadanSplit> {
    const splits: Array<KamadanSplit> = [];
    // a price only earns a slot here if it got a split of its own; handleMessage pairs
    // prices[s] with splits[s], so one that did not must not shift all the others along
    const aligned: Array<KamadanPrice> = [];
    const prices = chunk.prices || [];
    let remainingTextIndex = 0;
    for (let i = 0; i < prices.length - 1; i++) {
      const start = prices[i].end;
      const end = prices[i + 1].start;
      // deliberately not trimmed: indexOf has to line up with chunk.text. Trimming it
      // shifted every index by the leading space, which is what the old "+1" patched up,
      // at the cost of eating the first character of the next item.
      const between = chunk.text.slice(start, end);
      if (!between.trim()) {
        continue;
      }
      for (let d = 0; d < this.delimiters.length; d++) {
        const delimiter = this.delimiters[d];
        const at = between.indexOf(delimiter);
        if (at === -1) {
          continue;
        }
        const cut = start + at;
        splits.push({
          start: remainingTextIndex,
          end: cut,
          content: (
            chunk.text.slice(remainingTextIndex, prices[i].start).trim() +
            ' ' +
            chunk.text.slice(prices[i].end, cut).trim()
          ).trim(),
        });
        aligned.push(prices[i]);
        remainingTextIndex = cut + delimiter.length;
        break;
      }
    }
    const last = prices[prices.length - 1];
    splits.push({
      start: remainingTextIndex,
      end: chunk.text.length,
      content: (
        chunk.text.slice(remainingTextIndex, last.start).trim() +
        ' ' +
        chunk.text.slice(last.end).trim()
      ).trim(),
    });
    aligned.push(last);
    chunk.prices = aligned;
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
    const chunkStacks = this.stackHeaderRegex.test(chunk.text);
    for (let s = 0; s < chunk.splits.length; s++) {
      const split = chunk.splits[s];
      // the word can sit on the item ("Lockpick stk") or on the price ("35a/stack")
      const perStack = chunkStacks || this.stackRegex.test(split.content) || this.stackRegex.test(chunk.prices?.[s]?.content ?? '');
      let found = false;
      const matches = [...split.content.matchAll(this.quantityRegex)];
      for (const match of matches) {
        const quantity = parseInt(match[1] || match[2] || match[3] || match[4] || match[5] || match[6]);
        if (!isNaN(quantity)) {
          found = true;
          this.setQuantity(chunk, s, perStack ? quantity * this.stackSize : quantity);
          split.content = split.content.replace(match[0], '').trim();
          break; // Assuming only one quantity per split, exit after finding the first
        }
      }
      // "Lockpick stk" carries no number: the word alone means a single stack
      if (!found && perStack) {
        this.setQuantity(chunk, s, this.stackSize);
      }
    }
  }

  /** prices.price holds the total for the whole quantity - shop.service derives the unit
   *  from it - so a figure quoted per each or per stack has to be scaled up first.
   *  "25e/ea" with 93 armbraces is 2325; "2e/stack" with 4250 sweet points is 34. */
  private static totalPrice(price: KamadanPrice): number {
    const value = price.value || 0;
    const quantity = price.quantity || 1;
    if (this.stackRegex.test(price.content)) {
      return quantity >= this.stackSize ? value * (quantity / this.stackSize) : value;
    }
    return this.groupRegex.test(price.content) ? value * quantity : value;
  }

  private static setQuantity(chunk: KamadanChunk, s: number, quantity: number): void {
    if (!chunk.prices) {
      chunk.prices = [];
    }
    if (!chunk.prices[s]) {
      chunk.prices[s] = { ...this.defaultPrice };
    }
    chunk.prices[s].quantity = quantity;
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
      // left undefined when the message says nothing, so hasWeaponDetails can tell
      // "not inscribable" apart from "never mentioned"
      for (let t = 0; t < this.inscriptionTags['true'].length; t++) {
        const tag = this.inscriptionTags['true'][t];
        if (tag.test(split.content)) {
          split.inscription = true;
          split.content = split.content.replace(tag, '').trim();
          break; // Assuming only one requirement per split, exit after finding the first
        }
      }
      for (let t = 0; t < this.inscriptionTags['false'].length; t++) {
        const tag = this.inscriptionTags['false'][t];
        if (tag.test(split.content)) {
          split.oldSchool = true;
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
        // a space, not nothing: most filler words are punctuation sitting between two
        // words, and deleting them welds "marksmanship/warding" into one dead token
        split.content = split.content.replace(regex, ' ');
      }
      split.content = split.content.replace(/\s+/g, ' ').trim();
    }
  }

  /** The exact lookups the item match uses, for testing a candidate fragment. */
  private static resolveName(content: string): string | null {
    const text = (content || '').trim();
    if (!text) {
      return null;
    }
    if (this.itemMap[text] || this.acronymMap[text]) {
      return this.itemMap[text] || this.acronymMap[text];
    }
    const singular = /s$/.test(text) ? text.slice(0, -1) : null;
    return singular ? this.itemMap[singular] || this.acronymMap[singular] || null : null;
  }

  /** "shocking/barbed/poisonous axe haft" is three hafts sharing a tail, and
   *  "bow grip of marksmanship/warding" is two grips sharing a head. Each part gets
   *  back the words it was leaning on, and inherits the weapon details of the whole. */
  private static expandVariants(chunk: KamadanChunk): void {
    for (let s = chunk.splits.length - 1; s >= 0; s--) {
      const split = chunk.splits[s];
      const parts = split.content
        .split('/')
        .map((part) => part.trim())
        .filter(Boolean);
      if (parts.length < 2 || this.resolveName(split.content)) {
        continue;
      }
      const head = parts[0].split(/\s+/);
      const tail = parts[parts.length - 1].split(/\s+/);
      const variants = parts.map((part) => {
        if (this.resolveName(part)) {
          return part;
        }
        for (let take = tail.length - 1; take > 0; take--) {
          const candidate = `${part} ${tail.slice(tail.length - take).join(' ')}`;
          if (this.resolveName(candidate)) {
            return candidate;
          }
        }
        for (let take = head.length - 1; take > 0; take--) {
          const candidate = `${head.slice(0, take).join(' ')} ${part}`;
          if (this.resolveName(candidate)) {
            return candidate;
          }
        }
        return part;
      });
      const rebuilt = variants.map((content) => ({ ...split, content }));
      chunk.splits.splice(s, 1, ...rebuilt);
      // prices are paired with splits by index, so they have to grow in step
      if (chunk.prices && chunk.prices.length > s) {
        const price = chunk.prices[s];
        chunk.prices.splice(s, 1, ...rebuilt.map(() => (price ? { ...price } : price)));
      }
    }
  }
}
