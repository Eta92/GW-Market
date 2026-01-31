import { OrderType, Price } from './shop.model';

export interface Purchase {
  name: string; // item name
  shop: string; // shop uuid
  prices: Array<PurchasePrice>;
  orderType: OrderType;
  date: number;
  origin: PurchaseOrigin;
}

export interface PurchasePrice {
  type: Price;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export enum PurchaseOrigin {
  CLIENT,
  SHOP,
  MERCHANT,
  KAMADAN
}
