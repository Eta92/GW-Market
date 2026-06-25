import { ReputationReason } from './reputation.model';

export interface Account {
  nickname: string;
  lastOnline: number;
  shops: Array<Shop>;
  email: string;
  password: string;
  reputations: number;
  signalments: number;
  votes: number;
}

export interface Shop {
  uuid?: string;
  publicId?: string;
  player: string;
  lastIP?: string;
  lastRefresh?: number;
  daybreakOnline?: boolean;
  items: Array<ShopItem>;
  auctions?: Array<string>;
  certified?: Array<string>;
  reputation?: ShopReputation;
  notations?: { [key: string]: 'positive' | 'negative' };
  recruiter?: Recruit;
  recruits?: Array<Recruit>;
  // back only
  _id?: string;
}

export interface Recruit {
  name?: string;
  shopId: string;
  points?: number;
  lastRefresh?: number;
}

export interface ShopReputation {
  positive: number;
  negative: number;
  usedPoints: number;
  history: Array<ShopHistory>;
  lastReset: number;
}

export interface ShopHistory {
  date: number;
  from: string; // must be player name to avoid sending uuids
  name: string; // must be player name to avoid sending uuids
  type: 'positive' | 'negative';
  reason: ReputationReason;
}

export interface ShopItem {
  id?: string;
  name: string;
  orderType: OrderType;
  prices: Array<ShopPrice>;
  description?: string;
  quantity: number;
  weaponDetails?: WeaponDetails;
  orderDetails?: OrderDetails;
  hidden?: boolean;
  listedTime?: number;
  // copy from shop
  player?: string;
  daybreakOnline?: boolean;
  authCertified?: boolean;
  kamadanChat?: boolean;
  positives?: number;
  negatives?: number;
  shopId?: string;
  lastRefresh?: number;
}

export interface OrderDetails {
  dedicated?: boolean;
  pre?: boolean;
  note?: string;
  goldPrice?: number;
}

export interface WeaponDetails {
  attribute: string;
  requirement: number;
  inscription: boolean;
  core: string | null;
  prefix: string | null;
  suffix: string | null;
  extraMods?: Array<string>;
}

export interface ShopPrice {
  type: Price;
  price: number;
  // copy from shopitem
  quantity?: number;
}

export enum Price {
  PLAT,
  ECTO,
  ZKEY,
  ARM,
  BD,
}

export enum OrderType {
  SELL,
  BUY,
  AUCTION,
}

export interface Item {
  name: string;
  family: string;
  category: string;
  type: string;
  rarity: string;
  level: number;
  hidden?: boolean;
}
