import { BasicItem, OrderDetails, WeaponDetails } from './item.model';

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
  lastRefresh?: number;
  daybreakOnline?: boolean;
  authCertified?: boolean;
  items: Array<ShopItem>;
  certified?: Array<string>;
  reputation?: ShopReputation;
  notations?: { [key: string]: 'positive' | 'negative' };
  auctions?: Array<string>;
}

export interface ShopLink {
  name: string;
  publicId: string;
  match?: number;
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
  from: string;
  name: string;
  type: 'positive' | 'negative';
  comment?: string;
}

export interface ShopItem {
  player: string;
  name: string;
  orderType: OrderType;
  hidden?: boolean;
  prices: Array<ShopPrice>;
  description: string;
  quantity: number;
  orderDetails?: OrderDetails;
  weaponDetails?: WeaponDetails;
  listedTime?: number;
  // front only
  item?: BasicItem;
  completed?: boolean;
  removed?: boolean;
  single?: boolean;
  import?: boolean;
  // auction temp values
  acknowledge?: boolean;
  endTime?: number;
  // copy from shop
  daybreakOnline: boolean;
  authCertified: boolean;
  positives?: number;
  negatives?: number;
  lastRefresh?: number;
  shopId?: string;
}
export interface ShopPrice {
  type: Price;
  price: number;
  // copy from shopitem
  quantity?: number;
  unit?: number;
  // only for auction
  max?: number;
}

export enum Price {
  PLAT,
  ECTO,
  ZKEY,
  ARM,
  BD
}

export enum OrderType {
  SELL,
  BUY,
  AUCTION
}
