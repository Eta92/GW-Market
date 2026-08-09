export interface StatEntry {
  type: StatType;
  value: number;
  date: number;
}

export enum StatType {
  ConnexionTotal,
  ConnexionUnique,
  ShopRefreshTotal,
  ShopRefreshUnique,
  CertificationTotal,
  CertificationUnique,
}

export interface RawStatEntry {
  value: number;
  date: number;
}
