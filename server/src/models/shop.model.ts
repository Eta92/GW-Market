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
  player: string;
  lastRefresh?: number;
  daybreakOnline?: boolean;
  items: Array<ShopItem>;
  certified?: Array<string>;
}

export interface ShopItem {
  name: string;
  orderType: OrderType;
  prices: Array<ShopPrice>;
  description?: string;
  quantity: number;
  weaponDetails?: WeaponDetails;
  orderDetails?: OrderDetails;
  // copy from shop
  player?: string;
  daybreakOnline?: boolean;
  authCertified?: boolean;
  lastRefresh?: number;
}

export interface OrderDetails {
  dedicated?: boolean;
  pre?: boolean;
}

export interface WeaponDetails {
  attribute: string;
  requirement: number;
  inscription: boolean;
  oldschool: boolean;
  core: string | null;
  prefix: string | null;
  suffix: string | null;
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
}

export enum OrderType {
  SELL,
  BUY,
}

export interface Item {
  name: string;
  family: string;
  category: string;
  type: string;
  rarity: string;
  level: number;
}
