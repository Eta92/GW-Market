import { Server as SocketServer } from 'socket.io';
import { Overview } from '../models/overview.model';
import { PurchaseOrigin } from '../models/purchase.model';
import { Shop } from '../models/shop.model';
import { MongoService } from './mongo.service';
import { ShopService } from './shop.service';

export class OverviewService {
  public static overviewInit = false;
  public static overviewData: Overview;
  public static io: SocketServer;

  public static lastHourConnectionMap: Map<string, number> = new Map();
  public static lastHourRefreshMap: Map<string, number> = new Map();
  public static connectionsAllByHour = new Map<number, number>();
  public static connectionsUniqueByHour = new Map<number, number>();
  public static refreshesAllByHour = new Map<number, number>();
  public static refreshesUniqueByHour = new Map<number, number>();

  constructor() {}

  public static init(): void {
    this.overviewInit = true;
    // wait 60sec to not overload the server
    setTimeout(() => {
      this.buildOverview();
    }, 60000);
  }

  public static async buildOverview(): Promise<void> {
    const activeShops = ShopService.activeShops;
    const allPurchases = await MongoService.getAllPurchasesLight();
    const overview: Overview = {
      totalShopActive: 0,
      totalShopDay: 0,
      totalShopWeek: 0,
      totalItemActive: 0,
      totalItemDay: 0,
      totalItemWeek: 0,
      leaderboardItem: [],
      leaderboardReputation: [],
      leaderboardRecruit: [],
      customerHistory: [],
      shopHistory: [],
      mergedHistory: [],
      reputationHistory: [],
      connectionsAllHistory: [],
      connectionsUniqueHistory: [],
      refreshesAllHistory: [],
      refreshesUniqueHistory: [],
    };

    // Group purchases by hour: floor each date to the start of its hour
    const customerByHour = new Map<number, number>();
    const shopByHour = new Map<number, number>();
    const mergedByHour = new Map<number, number>();
    const reputationByHour = new Map<number, number>();
    for (const purchase of allPurchases) {
      const hourTimestamp = Math.floor(purchase.date / 3_600_000) * 3_600_000;
      if (purchase.origin === PurchaseOrigin.CLIENT) {
        customerByHour.set(hourTimestamp, (customerByHour.get(hourTimestamp) ?? 0) + 1);
      } else if (purchase.origin === PurchaseOrigin.SHOP) {
        shopByHour.set(hourTimestamp, (shopByHour.get(hourTimestamp) ?? 0) + 1);
      }
      mergedByHour.set(hourTimestamp, (mergedByHour.get(hourTimestamp) ?? 0) + 1);
    }

    // Sort by date ascending and map to OverviewData
    // Sorting not required and may consume much ressources.
    overview.customerHistory = Array.from(customerByHour.entries())
      .sort(([a], [b]) => a - b)
      .map(([date, value]) => ({ date, value }));
    overview.shopHistory = Array.from(shopByHour.entries())
      .sort(([a], [b]) => a - b)
      .map(([date, value]) => ({ date, value }));
    overview.mergedHistory = Array.from(mergedByHour.entries())
      .sort(([a], [b]) => a - b)
      .map(([date, value]) => ({ date, value }));

    const now = Date.now();
    const dayAgo = now - 24 * 3_600_000;
    const weekAgo = now - 7 * 24 * 3_600_000;
    activeShops.forEach((shop: Shop) => {
      // total counts
      overview.totalShopWeek++;
      overview.totalItemWeek += shop.items.length;
      const repScore = shop.reputation ? shop.reputation.positive - shop.reputation.negative : 0;
      if (shop.lastRefresh && shop.lastRefresh >= dayAgo) {
        overview.totalShopDay++;
        overview.totalItemDay += shop.items.length;
        const activeLimit = now - (15 + repScore) * 60 * 1000;
        console.log('active limit for shop ' + shop.player + ' is ' + new Date(activeLimit).toISOString());
        if (shop.lastRefresh && shop.lastRefresh >= activeLimit) {
          overview.totalShopActive++;
          overview.totalItemActive += shop.items.length;
        }
      }
      // repuation history
      shop.reputation?.history.forEach((entry) => {
        const hourTimestamp = Math.floor(entry.date / 3_600_000) * 3_600_000;
        reputationByHour.set(hourTimestamp, (reputationByHour.get(hourTimestamp) ?? 0) + 1);
      });

      // leaderboard
      overview.leaderboardItem.push({ shopName: shop.player, publicId: shop.publicId ?? '', value: shop.items.length });
      overview.leaderboardReputation.push({ shopName: shop.player, publicId: shop.publicId ?? '', value: repScore });
      overview.leaderboardRecruit.push({
        shopName: shop.player,
        publicId: shop.publicId ?? '',
        value: shop.recruits?.filter((r) => r.lastRefresh > weekAgo).reduce((prev, curr) => prev + curr.points, 0) ?? 0,
      });
    });

    overview.reputationHistory = Array.from(reputationByHour.entries())
      .sort(([a], [b]) => a - b)
      .map(([date, value]) => ({ date, value }));

    // Keep only top 10 for each leaderboard
    overview.leaderboardItem = overview.leaderboardItem.sort((a, b) => b.value - a.value).slice(0, 10);
    overview.leaderboardReputation = overview.leaderboardReputation.sort((a, b) => b.value - a.value).slice(0, 10);
    overview.leaderboardRecruit = overview.leaderboardRecruit.sort((a, b) => b.value - a.value).slice(0, 10);
    // connection and refresh history compute
    const hourTimestamp = Math.floor(Date.now() / 3_600_000) * 3_600_000;
    this.connectionsAllByHour.set(
      hourTimestamp,
      Array.from(this.lastHourConnectionMap.values()).reduce((a, b) => a + b, 0)
    );
    this.connectionsUniqueByHour.set(hourTimestamp, this.lastHourConnectionMap.size);
    this.refreshesAllByHour.set(
      hourTimestamp,
      Array.from(this.lastHourRefreshMap.values()).reduce((a, b) => a + b, 0)
    );
    this.refreshesUniqueByHour.set(hourTimestamp, this.lastHourRefreshMap.size);
    overview.connectionsAllHistory = Array.from(this.connectionsAllByHour.entries())
      .sort(([a], [b]) => a - b)
      .map(([date, value]) => ({ date, value }));
    overview.connectionsUniqueHistory = Array.from(this.connectionsUniqueByHour.entries())
      .sort(([a], [b]) => a - b)
      .map(([date, value]) => ({ date, value }));
    overview.refreshesAllHistory = Array.from(this.refreshesAllByHour.entries())
      .sort(([a], [b]) => a - b)
      .map(([date, value]) => ({ date, value }));
    overview.refreshesUniqueHistory = Array.from(this.refreshesUniqueByHour.entries())
      .sort(([a], [b]) => a - b)
      .map(([date, value]) => ({ date, value }));
    this.lastHourConnectionMap.clear();
    this.lastHourRefreshMap.clear();

    console.log('weekly items : ' + overview.totalItemWeek);
    console.log('alltime data points : ' + overview.mergedHistory.length);

    this.overviewData = overview;

    // auto loop every hour, targeting the next hour mark
    const msToNextHour = 3_600_000 - (Date.now() % 3_600_000);
    setTimeout(() => this.buildOverview(), msToNextHour + 10000);
  }

  public static getOverview(): Overview {
    return this.overviewData;
  }

  public static logConnection(ip: string): void {
    this.lastHourConnectionMap.set(ip, (this.lastHourConnectionMap.get(ip) ?? 0) + 1);
  }

  public static logRefresh(publicId: string): void {
    this.lastHourRefreshMap.set(publicId, (this.lastHourRefreshMap.get(publicId) ?? 0) + 1);
  }
}
