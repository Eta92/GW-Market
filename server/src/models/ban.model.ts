export interface BanEntry {
  uuid: string;
  type: BanType;
  time: number;
  value: string;
  link?: string;
}

export enum BanType {
  IP,
  SHOP,
  CHARACTER,
}
