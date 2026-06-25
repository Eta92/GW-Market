import { OrderType, Price, ShopPrice } from './shop.model';

export interface KamadanData {
  t: number;
  s: string;
  m: string;
  r: string;
}

export interface KamadanChunk {
  type: OrderType;
  text: string;
  prices?: Array<KamadanPrice>;
  splits?: Array<KamadanSplit>;
}

export interface KamadanPosition {
  start: number;
  end: number;
  content: string;
}

export interface KamadanSplit extends KamadanPosition {
  requirement?: number;
  attribute?: string;
  inscription?: boolean;
  dedicated?: boolean;
}

export interface KamadanPrice extends KamadanPosition {
  value?: number;
  type?: Price;
  quantity?: number;
}

export interface KamadanFailOrder {
  type: OrderType;
  item: string;
  price: ShopPrice;
  raw: string;
  confidence: number;
}
