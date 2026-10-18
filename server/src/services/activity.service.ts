import { UtilityHelper } from '../helpers/utility.helper';
import { ActivityPrediction, PredictionHour } from '../models/activity.model';
import { Shop } from '../models/shop.model';
import { MongoService } from './mongo.service';

const TIME_ONLINE = 1000 * 60 * 15; // 15 minutes
const TIME_HOUR = 1000 * 60 * 60;
const HOURS_IN_WEEK = 24 * 7;
const WEEK_WEIGHTS = [0.5, 0.4, 0.3, 0.2]; // most recent week first

export class ActivityService {
  // predictions only use data before the current hour, so they stay valid until the next hour starts
  private static predictionCache: Map<string, ActivityPrediction> = new Map();
  private static predictionCacheHour = 0;

  public static async logRefresh(shop: Shop): Promise<void> {
    const now = Date.now();
    const endTime = now + TIME_ONLINE + UtilityHelper.bonusFromShop(shop) * 60 * 1000;
    const current = await MongoService.getCurrentActivity(shop.publicId);
    if (current) {
      await MongoService.updateActivityEndTime(current._id, endTime);
    } else {
      await MongoService.insertActivity({ shopId: shop.publicId, startTime: now, endTime });
    }
  }

  public static async logClose(shopId: string): Promise<void> {
    const current = await MongoService.getCurrentActivity(shopId);
    if (current) {
      await MongoService.updateActivityEndTime(current._id, Date.now());
    }
  }

  public static async getPrediction(shopId: string): Promise<ActivityPrediction> {
    const currentHour = Math.floor(Date.now() / TIME_HOUR) * TIME_HOUR;
    if (this.predictionCacheHour !== currentHour) {
      this.predictionCache.clear();
      this.predictionCacheHour = currentHour;
    }
    const cached = this.predictionCache.get(shopId);
    if (cached) {
      return cached;
    }
    const weekCount = WEEK_WEIGHTS.length;
    const windowStart = currentHour - weekCount * HOURS_IN_WEEK * TIME_HOUR;
    const activities = await MongoService.getActivities(shopId, windowStart, currentHour);
    let oldestActivity = 0;
    // 1 if the shop was online at any moment of the hour, oldest hour first
    const activeHours: Array<number> = new Array(weekCount * HOURS_IN_WEEK).fill(0);
    activities.forEach((activity) => {
      const start = Math.max(activity.startTime, windowStart);
      const end = Math.min(activity.endTime, currentHour);
      if (end <= start) {
        return;
      }
      if (!oldestActivity || activity.startTime < oldestActivity) {
        oldestActivity = activity.startTime;
      }
      const firstHour = Math.floor((start - windowStart) / TIME_HOUR);
      const lastHour = Math.ceil((end - windowStart) / TIME_HOUR) - 1;
      for (let i = firstHour; i <= lastHour; i++) {
        activeHours[i] = 1;
      }
    });
    // same hour of the week, one to four weeks ago, weighted by age
    const hours: Array<PredictionHour> = [];
    for (let h = 0; h < HOURS_IN_WEEK; h++) {
      let prediction = 0;
      WEEK_WEIGHTS.forEach((weight, weeksAgo) => {
        prediction += weight * activeHours[(weekCount - 1 - weeksAgo) * HOURS_IN_WEEK + h];
      });
      hours.push({ time: currentHour + h * TIME_HOUR, prediction: Math.round(prediction * 100) / 100 });
    }
    const prediction: ActivityPrediction = { shopId, oldestActivity, hours };
    this.predictionCache.set(shopId, prediction);
    return prediction;
  }
}
