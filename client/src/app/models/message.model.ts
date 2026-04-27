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
  NEGOCIATE,
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
  NEGOCIATE_ACCEPT,
  NEGOCIATE_REFUSE,
  NEGOCIATE_COUNTER
}
