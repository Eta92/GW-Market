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
  // leaderboardAffiliation: Array<LeaderboardShop>;
  customerHistory: Array<OverviewData>;
  shopHistory: Array<OverviewData>;
  mergedHistory: Array<OverviewData>;
  reputationHistory: Array<OverviewData>;
  connectionsAllHistory: Array<OverviewData>;
  connectionsUniqueHistory: Array<OverviewData>;
  refreshesAllHistory: Array<OverviewData>;
  refreshesUniqueHistory: Array<OverviewData>;
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
