import { Item, OrderType, Price, ShopItem, ShopPrice } from './shop.model';

export interface ItemOrders {
  sellOrders: Array<ItemPriceList>;
  buyOrders: Array<ItemPriceList>;
}

export interface ItemPriceList {
  price: Price;
  orders: Array<ItemTimeList>;
}

// New structures for currency-based grouping
export interface CurrencyOrders {
  currencies: Array<CurrencyGroup>;
}

export interface CurrencyGroup {
  currency: Price;
  currencyName: string;
  timeBuckets: Array<TimeBucket>;
  totalOrders: number;
}

export interface TimeBucket {
  time: Time;
  sellOrders: Array<ItemOrder>;
  buyOrders: Array<ItemOrder>;
}

export interface ItemTimeList {
  time: Time;
  orders: Array<ItemOrder>;
}

export interface ItemOrder {
  player: string;
  daybreakOnline: boolean;
  authCertified: boolean;
  item: ShopItem;
  details: Item;
  orderType: OrderType;
  price: ShopPrice;
  description: string;
  quantity: number;
  // front only
  div_price?: number;
  div_quantity?: number;
  // copy from shop
  lastRefresh?: number;
}

export enum Time {
  ONLINE,
  TODAY,
  WEEK
}

export interface OrderFilter {
  name: string;
  orderType: string;
  family: string;
  category: string;
  attribute: string;
  reqMin: number;
  reqMax: number;
  inscription: string;
  oldschool: string;
  core: string;
  prefix: string;
  suffix: string;
}
