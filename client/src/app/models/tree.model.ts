import { Item } from './shop.model';

export interface TimeOrderCounts {
  sellNow: number; // < 15 min
  buyNow: number;
  sellDay: number; // < 12 hrs
  buyDay: number;
  sellWeek: number; // >= 12 hrs
  buyWeek: number;
}

export interface AvailableTree extends TimeOrderCounts {
  families: Array<AvailableFamily>;
}

export interface AvailableFamily extends TimeOrderCounts {
  name: string;
  previews: Array<string>;
  categories: Array<AvailableCategory>;
}

export interface AvailableCategory extends TimeOrderCounts {
  name: string;
  previews: Array<string>;
  items: Array<AvailableItem>;
}

export interface AvailableItem extends Item, TimeOrderCounts {}
