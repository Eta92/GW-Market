import { Price, ShopItem } from './shop.model';

export interface Auction {
  uuid: string;
  player: string;
  shopId: string;
  item: ShopItem;
  currency: Price;
  startingPrice: number;
  buyoutPrice: number | null;
  active: boolean;
  cloturate: boolean;
  startTime: number;
  endTime: number;
  history: Array<AuctionHistory>;
}

export interface AuctionHistory {
  bidder: string;
  shopId: string;
  bid: number;
  time: number;
}
