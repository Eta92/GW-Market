export interface BasicItem {
  name: string;
  description?: string;
  enhancement?: string;
  condition?: string;
  img: string;
  family: string;
  category: string;
  wiki?: string;
  // for search only
  match?: number;
}

export interface Upgrade {
  value: string;
  description?: string;
  img: string;
}

export interface DaybreakItem {
  name: string;
  quantity: number;
  attribute?: string;
  requirement?: number;
  inscription?: boolean;
  goldPrice?: number;
}

export interface DetailItem {
  name: string;
  orderDetails?: OrderDetails;
  weaponDetails?: WeaponDetails;
  // front only
  item?: BasicItem;
}

export interface WeaponDetails {
  attribute: string;
  requirement: number;
  inscription: boolean;
  core: string;
  prefix: string;
  suffix: string;
  extraMods?: Array<string>;
}

export interface OrderDetails {
  dedicated: boolean;
  pre: boolean;
  note: string;
  goldPrice: number;
}
