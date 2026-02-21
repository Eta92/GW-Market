import { Price, ShopItem } from './shop.model';

export interface Auction {
  uuid?: string;
  player: string;
  shopId: string;
  item: ShopItem;
  currency: Price;
  startingPrice: number;
  buyoutPrice: number | null;
  active?: boolean;
  startTime?: number;
  endTime: number;
  history?: Array<{
    bidder: string;
    public: string;
    bid: number;
    time: number;
  }>;
  // front only
  cloturate?: boolean;
}
