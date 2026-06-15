import { OrderDetails, OrderType, Price, ShopPrice, WeaponDetails } from './shop.model';

export interface Purchase {
  name: string; // item name
  shop?: string; // shop uuid
  prices: Array<PurchasePrice>;
  orderType: OrderType;
  date: number;
  origin: PurchaseOrigin;
  listedTime?: number;
  weaponDetails?: WeaponDetails;
  orderDetails?: OrderDetails;
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
  TOOLBOX,
  MERCHANT,
  KAMADAN,
}

export interface TBPurchase {
  name: string;
  price: ShopPrice;
  orderType: OrderType;
}
