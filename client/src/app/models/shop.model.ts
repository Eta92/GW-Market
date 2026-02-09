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
  hidden: boolean;
  prices: Array<ShopPrice>;
  description: string;
  quantity: number;
  orderDetails?: OrderDetails;
  weaponDetails?: WeaponDetails;
  // front only
  item?: Item;
  completed?: boolean;
  removed?: boolean;
  single?: boolean;
  import?: boolean;
  // copy from shop
  daybreakOnline: boolean;
  authCertified: boolean;
  positives?: number;
  negatives?: number;
  lastRefresh?: number;
  shopId?: string;
}

export interface WeaponDetails {
  attribute: string;
  requirement: number;
  inscription: boolean;
  oldschool: boolean;
  core: string;
  prefix: string;
  suffix: string;
}

export interface OrderDetails {
  dedicated: boolean;
  pre: boolean;
  legacy: boolean;
}

export interface ShopPrice {
  type: Price;
  price: number;
  // copy from shopitem
  quantity?: number;
  unit?: number;
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
  BUY
}

export interface Item {
  name: string;
  img: string;
  family: string;
  category: string;
  // front only
  match?: number;
  orderDetails?: OrderDetails;
  weaponDetails?: WeaponDetails;
}

export interface BasicItem {
  name: string;
  img: string;
  family: string;
  category: string;
}
