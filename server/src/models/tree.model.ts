import { Item } from './shop.model';

export interface AvailableTree {
  families: Array<AvailableFamily>;
  sellOrders: number;
  buyOrders: number;
}

export interface AvailableFamily {
  name: string;
  categories: Array<AvailableCategory>;
  sellOrders: number;
  buyOrders: number;
}

export interface AvailableCategory {
  name: string;
  items: Array<AvailableItem>;
  sellOrders: number;
  buyOrders: number;
}

export interface AvailableItem {
  name: string;
  sellOrders: number;
  buyOrders: number;
  item?: Item;
}
