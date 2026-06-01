import { BasicItem } from './shop.model';

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
  legacyUpgrades?: Array<BasicItem>;
}

export interface AvailableFamily extends TimeOrderCounts {
  name: string;
  previews: Array<string>;
  categories: Array<AvailableCategory>;
}

export interface AvailableCategory extends TimeOrderCounts {
  name: string;
  inherit?: string;
  previews: Array<string>;
  inheritedItems?: Array<AvailableItem>;
  items: Array<AvailableItem>;
}

export interface AvailableItem extends BasicItem, TimeOrderCounts {
  description?: string;
  enhancement?: string;
  condition?: string;
  hidden?: boolean;
}
