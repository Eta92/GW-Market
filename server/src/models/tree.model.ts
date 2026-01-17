import { Item } from './shop.model';

export interface TimeOrderCounts {
  sellOrders: number;
  buyOrders: number;
  sellOrdersOnline: number;  // < 15 min
  buyOrdersOnline: number;
  sellOrdersToday: number;   // < 12 hrs
  buyOrdersToday: number;
  sellOrdersWeek: number;    // >= 12 hrs
  buyOrdersWeek: number;
}

export interface AvailableTree extends TimeOrderCounts {
  families: Array<AvailableFamily>;
}

export interface AvailableFamily extends TimeOrderCounts {
  name: string;
  categories: Array<AvailableCategory>;
}

export interface AvailableCategory extends TimeOrderCounts {
  name: string;
  items: Array<AvailableItem>;
}

export interface AvailableItem extends TimeOrderCounts {
  name: string;
  item?: Item;
}
