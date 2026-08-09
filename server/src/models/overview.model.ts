export interface Overview {
  totalShopActive: number;
  totalShopDay: number;
  totalShopWeek: number;
  totalItemActive: number;
  totalItemDay: number;
  totalItemWeek: number;
  leaderboardItem: Array<LeaderboardShop>;
  leaderboardReputation: Array<LeaderboardShop>;
  leaderboardRecruit: Array<LeaderboardShop>;
  customerHistory: Array<OverviewData>;
  shopHistory: Array<OverviewData>;
  mergedHistory: Array<OverviewData>;
  reputationHistory: Array<OverviewData>;
  certificationAllHistory: Array<OverviewData>;
  certificationUniqueHistory: Array<OverviewData>;
  connectionsAllHistory: Array<OverviewData>;
  connectionsUniqueHistory: Array<OverviewData>;
  refreshesAllHistory: Array<OverviewData>;
  refreshesUniqueHistory: Array<OverviewData>;
  // pie charts
  repartitionTypeBuy: number;
  repartitionTypeSell: number;
  repartitionTypeAuction: number;
  repartitionOriginMarket: number;
  repartitionOriginToolBox: number;
  repartitionOriginKamdan: number;
  repartitionRecentFree: number;
  repartitionRecentCertified: number;
  repartitionRecentOnline: number;
  repartitionRecentKamdan: number;
  repartitionCurrencyPlatinium: number;
  repartitionCurrencyEcto: number;
  repartitionCurrencyArmbrace: number;
  repartitionCurrencyBlackDye: number;
}

export interface LeaderboardShop {
  shopName: string;
  publicId: string;
  value: number;
}

export interface OverviewData {
  date: number;
  value: number;
}
