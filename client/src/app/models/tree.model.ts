import { Item } from './shop.model';

export interface AvailableTree {
  families: Array<AvailableFamily>;
  sellOrders: number;
  buyOrders: number;
}

export interface AvailableFamily {
  name: string;
  previews: Array<string>;
  categories: Array<AvailableCategory>;
  sellOrders: number;
  buyOrders: number;
}

export interface AvailableCategory {
  name: string;
  previews: Array<string>;
  items: Array<AvailableItem>;
  sellOrders: number;
  buyOrders: number;
}

export interface AvailableItem extends Item {
  sellOrders: number;
  buyOrders: number;
}
