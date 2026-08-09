import { Server as SocketServer } from 'socket.io';
import { Overview } from '../models/overview.model';
import { PurchaseOrigin } from '../models/purchase.model';
import { OrderType, Price, Shop } from '../models/shop.model';
import { RawStatEntry, StatEntry, StatType } from '../models/stat.model';
import { AuctionService } from './auction.service';
import { KamadanService } from './kamadan.service';
import { MongoService } from './mongo.service';
import { ShopService } from './shop.service';

export class OverviewService {
  public static overviewInit = false;
  public static overviewData: Overview;
  public static io: SocketServer;

  public static lastHourConnectionMap: Map<string, number> = new Map();
  public static lastHourRefreshMap: Map<string, number> = new Map();
  public static lastHourCertificationMap: Map<string, number> = new Map();
  public static connectionsAllByHour: Array<RawStatEntry> = [];
  public static connectionsUniqueByHour: Array<RawStatEntry> = [];
  public static refreshesAllByHour: Array<RawStatEntry> = [];
  public static refreshesUniqueByHour: Array<RawStatEntry> = [];
  public static certificationsAllByHour: Array<RawStatEntry> = [];
  public static certificationsUniqueByHour: Array<RawStatEntry> = [];

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
    const activeAuctions = AuctionService.activeAuctions;
    const kamadanItems = KamadanService.kamadanItems;
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
      certificationAllHistory: [],
      certificationUniqueHistory: [],
      connectionsAllHistory: [],
      connectionsUniqueHistory: [],
      refreshesAllHistory: [],
      refreshesUniqueHistory: [],
      repartitionTypeBuy: 0,
      repartitionTypeSell: 0,
      repartitionTypeAuction: 0,
      repartitionOriginMarket: 0,
      repartitionOriginToolBox: 0,
      repartitionOriginKamdan: 0,
      repartitionRecentFree: 0,
      repartitionRecentCertified: 0,
      repartitionRecentOnline: 0,
      repartitionRecentKamdan: 0,
      repartitionCurrencyPlatinium: 0,
      repartitionCurrencyEcto: 0,
      repartitionCurrencyArmbrace: 0,
      repartitionCurrencyBlackDye: 0,
    };
    const allStats = await MongoService.getAllStats();
    this.connectionsAllByHour = allStats.filter((s) => s.type === StatType.ConnexionTotal).map((s) => ({ date: s.date, value: s.value }));
    this.connectionsUniqueByHour = allStats
      .filter((s) => s.type === StatType.ConnexionUnique)
      .map((s) => ({ date: s.date, value: s.value }));
    this.refreshesAllByHour = allStats.filter((s) => s.type === StatType.ShopRefreshTotal).map((s) => ({ date: s.date, value: s.value }));
    this.refreshesUniqueByHour = allStats
      .filter((s) => s.type === StatType.ShopRefreshUnique)
      .map((s) => ({ date: s.date, value: s.value }));
    this.certificationsAllByHour = allStats
      .filter((s) => s.type === StatType.CertificationTotal)
      .map((s) => ({ date: s.date, value: s.value }));
    this.certificationsUniqueByHour = allStats
      .filter((s) => s.type === StatType.CertificationUnique)
      .map((s) => ({ date: s.date, value: s.value }));

    // trigger recruit update reflexion to prepare stats
    ShopService.updateShopRecruits();

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
    const active = now - 0.25 * 3_600_000;
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
    this.connectionsAllByHour.push(
      await this.saveStat(
        {
          date: hourTimestamp,
          value: Array.from(this.lastHourConnectionMap.values()).reduce((a, b) => a + b, 0),
        },
        StatType.ConnexionTotal
      )
    );
    this.connectionsUniqueByHour.push(
      await this.saveStat(
        {
          date: hourTimestamp,
          value: this.lastHourConnectionMap.size,
        },
        StatType.ConnexionUnique
      )
    );
    this.refreshesAllByHour.push(
      await this.saveStat(
        {
          date: hourTimestamp,
          value: Array.from(this.lastHourRefreshMap.values()).reduce((a, b) => a + b, 0),
        },
        StatType.ShopRefreshTotal
      )
    );
    this.refreshesUniqueByHour.push(
      await this.saveStat(
        {
          date: hourTimestamp,
          value: this.lastHourRefreshMap.size,
        },
        StatType.ShopRefreshUnique
      )
    );
    this.certificationsAllByHour.push(
      await this.saveStat(
        {
          date: hourTimestamp,
          value: Array.from(this.lastHourCertificationMap.values()).reduce((a, b) => a + b, 0),
        },
        StatType.CertificationTotal
      )
    );
    this.certificationsUniqueByHour.push(
      await this.saveStat(
        {
          date: hourTimestamp,
          value: this.lastHourCertificationMap.size,
        },
        StatType.CertificationUnique
      )
    );
    overview.connectionsAllHistory = this.connectionsAllByHour;
    overview.connectionsUniqueHistory = this.connectionsUniqueByHour;
    overview.refreshesAllHistory = this.refreshesAllByHour;
    overview.refreshesUniqueHistory = this.refreshesUniqueByHour;
    overview.certificationAllHistory = this.certificationsAllByHour;
    overview.certificationUniqueHistory = this.certificationsUniqueByHour;
    this.lastHourConnectionMap.clear();
    this.lastHourRefreshMap.clear();
    this.lastHourCertificationMap.clear();

    console.log('weekly items : ' + overview.totalItemWeek);
    console.log('alltime data points : ' + overview.mergedHistory.length);

    // pie charts
    activeShops.forEach((shop: Shop) => {
      overview.repartitionTypeBuy += shop.items.filter((i) => i.orderType === OrderType.BUY).length;
      overview.repartitionTypeSell += shop.items.filter((i) => i.orderType === OrderType.SELL).length;
      if (shop.lastRefresh && shop.lastRefresh >= active) {
        if (shop.certified) {
          overview.repartitionRecentCertified += shop.items.length;
        }
        if (shop.daybreakOnline) {
          overview.repartitionRecentOnline += shop.items.length;
        }
        if (!shop.certified && !shop.daybreakOnline) {
          overview.repartitionRecentFree += shop.items.length;
        }
      }
      overview.repartitionCurrencyPlatinium += shop.items.filter((i) => i.prices.some((p) => p.type === Price.PLAT)).length;
      overview.repartitionCurrencyEcto += shop.items.filter((i) => i.prices.some((p) => p.type === Price.ECTO)).length;
      overview.repartitionCurrencyArmbrace += shop.items.filter((i) => i.prices.some((p) => p.type === Price.ARM)).length;
      overview.repartitionCurrencyBlackDye += shop.items.filter((i) => i.prices.some((p) => p.type === Price.BD)).length;
    });
    activeAuctions.forEach((auction) => {
      overview.repartitionTypeAuction++;
      overview.repartitionCurrencyPlatinium += auction.item.prices?.some((p) => p.type === Price.PLAT) ? 1 : 0;
      overview.repartitionCurrencyEcto += auction.item.prices?.some((p) => p.type === Price.ECTO) ? 1 : 0;
      overview.repartitionCurrencyArmbrace += auction.item.prices?.some((p) => p.type === Price.ARM) ? 1 : 0;
      overview.repartitionCurrencyBlackDye += auction.item.prices?.some((p) => p.type === Price.BD) ? 1 : 0;
    });
    allPurchases.forEach((purchase) => {
      if (purchase.date >= weekAgo) {
        if (purchase.origin === PurchaseOrigin.KAMADAN) {
          overview.repartitionOriginKamdan++;
        } else if (purchase.origin === PurchaseOrigin.TOOLBOX) {
          overview.repartitionOriginToolBox++;
        } else {
          overview.repartitionOriginMarket++;
        }
      }
    });
    kamadanItems.forEach((item) => {
      overview.repartitionTypeBuy += item.orderType === OrderType.BUY ? 1 : 0;
      overview.repartitionTypeSell += item.orderType === OrderType.SELL ? 1 : 0;
      overview.repartitionRecentKamdan++;
      overview.repartitionCurrencyPlatinium += item.prices?.some((p) => p.type === Price.PLAT) ? 1 : 0;
      overview.repartitionCurrencyEcto += item.prices?.some((p) => p.type === Price.ECTO) ? 1 : 0;
      overview.repartitionCurrencyArmbrace += item.prices?.some((p) => p.type === Price.ARM) ? 1 : 0;
      overview.repartitionCurrencyBlackDye += item.prices?.some((p) => p.type === Price.BD) ? 1 : 0;
    });

    this.overviewData = overview;

    // auto loop every hour, targeting the next hour mark
    const msToNextHour = 3_600_000 - (Date.now() % 3_600_000);
    setTimeout(() => this.buildOverview(), msToNextHour + 10000);
  }

  private static async saveStat(stat: RawStatEntry, type: StatType): Promise<RawStatEntry> {
    const statEntry: StatEntry = {
      type,
      value: stat.value,
      date: stat.date,
    };
    await MongoService.insertStat(statEntry);
    return stat;
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

  public static logCertification(publicId: string): void {
    this.lastHourCertificationMap.set(publicId, (this.lastHourCertificationMap.get(publicId) ?? 0) + 1);
  }
}
