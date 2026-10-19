export interface Message {
  uuid: string;
  senderName: string;
  senderShop: string;
  receiverName: string;
  receiverShop: string;
  time: number;
  type: MessageType;
  data: Array<string>;
  read: boolean;
  deleted: boolean;
}

export enum MessageType {
  MEETUP_AT,
  MEETUP_OVER,
  NEGOTIATE,
  REPUTATION_UP,
  REPUTATION_DOWN,
  AUCTION_WON,
  AUCTION_LOST,
  AUCTION_OUTBID,
  AUCTION_END,
  AUCTION_FAIL,
  MEETUP_ACCEPT,
  MEETUP_REFUSE,
  MEETUP_COUNTER_AT,
  MEETUP_COUNTER_OVER,
  NEGOTIATE_ACCEPT,
  NEGOTIATE_REFUSE,
  NEGOTIATE_COUNTER,
  REPUTATION_REVERT,
  ONLINE_ITEM,
  ONLINE_SHOP
}

export interface Tracking {
  senderName: string;
  senderShop: string;
  itemName?: string;
}
