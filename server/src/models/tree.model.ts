import { Item } from './shop.model';

export interface TimeOrderCounts {
  sellNow: number; // < 15 min
  buyNow: number;
  auctionNow: number;
  sellDay: number; // < 12 hrs
  buyDay: number;
  auctionDay: number;
  sellWeek: number; // >= 12 hrs
  buyWeek: number;
  auctionWeek: number;
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
  inheritedItems?: Array<AvailableItem>;
}

export interface AvailableItem extends TimeOrderCounts {
  name: string;
  item?: Item;
}
