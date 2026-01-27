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
}

export interface ShopItem {
  player: string;
  daybreakOnline: boolean;
  authCertified: boolean;
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
  // copy from shop
  lastRefresh?: number;
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
