import { ItemOrder, Time } from '@app/models/order.model';
import { Item, Price, ShopItem } from '@app/models/shop.model';

export class UtilityHelper {
  static copy(item): any {
    return JSON.parse(JSON.stringify(item));
  }

  static hash(array): { [key: string]: any } {
    const object = {};
    array.forEach((item, i) => {
      object[item.id] = item;
    });
    return object;
  }

  static populate(items, data): any {
    const hash = this.hash(data);
    for (let i = 0; i < items.length; i++) {
      if (!isNaN(items[i])) {
        if (items[i] > 0) {
          items[i] = hash[items[i]];
        }
      } else if (!isNaN(items[i].id)) {
        if (items[i].id > 0) {
          items[i] = {
            ...items[i],
            ...hash[items[i].id]
          };
        }
      }
    }
  }

  static normalize = (text: string | null): string => {
    if (text) {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    } else {
      return '';
    }
  };

  static unique<T>(array: T[]): T[] {
    return array.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }

  static createOrAdd(currentArray, reference, key: string = 'id'): void {
    const existing = currentArray.find(elem => elem[key] === reference[key]);
    if (existing) {
      existing.count++;
    } else {
      currentArray.push({
        ...reference,
        count: 1
      });
    }
  }

  public static getZ = (xDif: number, yDif: number): number => {
    if (!xDif && !yDif) {
      //console.log('crahs averted');
      return Math.random() * Math.PI * 2;
    }
    let z = Math.atan(-xDif / yDif);
    if (yDif >= 0) {
      z += Math.PI;
    }
    if (z < 0) {
      z += Math.PI * 2;
    }
    return z;
  };

  public static egcd(a: number, b: number): number {
    if (a === 0) return b;

    let antiloop = 0;
    while (b !== 0 && antiloop < 1000) {
      if (a > b) a = a - b;
      else b = b - a;
      antiloop++;
    }

    return a;
  }

  public static getImage(item: Item): string {
    if (!item) return '';
    if (item['img']) {
      return '../../../assets/items/' + item.family + '/' + item.img.replace(/ /g, '_') + '.png';
    } else {
      return '../../../assets/items/' + item.family + '/' + item.name.replace(/ /g, '_') + '.png';
    }
  }

  public static priceToString(price: Price): string {
    switch (price) {
      case Price.PLAT:
        return 'Plat';
      case Price.ECTO:
        return 'Ecto';
      case Price.ARM:
        return 'Ambrace';
      case Price.ZKEY:
        return 'Zkey';
      case Price.BD:
        return 'BlackDye';
    }
  }

  public static getCurrencySource(price: Price): string {
    return '../../../assets/items/currency/' + price.toString() + '.png';
  }

  public static getCurrencyName(price: Price): string {
    switch (price) {
      case Price.PLAT:
        return 'Platinum';
      case Price.ECTO:
        return 'Ectoplasm';
      case Price.ZKEY:
        return 'Zaishen Key';
      case Price.ARM:
        return 'Armbraces';
      case Price.BD:
        return 'Black Dye';
      default:
        return 'Currency';
    }
  }

  public static timeToString(time: Time): string {
    switch (time) {
      case Time.ONLINE:
        return 'online';
      case Time.TODAY:
        return 'today';
      case Time.WEEK:
        return 'this week';
    }
  }

  public static getOldOpacity(item: ShopItem | ItemOrder): string {
    if (!item.lastRefresh || Date.now() - item.lastRefresh < 1000 * 60 * 15) {
      return 'opacity-100';
    } else if (Date.now() - item.lastRefresh < 1000 * 60 * 60 * 12) {
      return 'opacity-75';
    } else {
      return 'opacity-50';
    }
  }

  public static formatLastUpdate(timestamp: number): string {
    const diff = Date.now() - timestamp;
    if (diff < 1000 * 60) {
      return 'now';
    } else if (diff < 1000 * 60 * 60) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} min${minutes > 1 ? 's' : ''}`;
    } else if (diff < 1000 * 60 * 60 * 24) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      return `${days} day${days > 1 ? 's' : ''}`;
    }
  }

  /**
   * Calculate unit price with proper decimal formatting.
   * Shows up to 3 decimal places, trimming trailing zeros.
   */
  public static getDecimalUnitPrice(price: number, quantity: number): string {
    if (!quantity) return '0';
    const unitPrice = price / quantity;
    if (unitPrice === Math.floor(unitPrice)) {
      return unitPrice.toString();
    }
    const rounded = Math.round(unitPrice * 1000) / 1000;
    return rounded.toString();
  }

  /**
   * Get time category based on lastRefresh timestamp.
   * - ONLINE: < 15 minutes ago
   * - TODAY: < 12 hours ago
   * - WEEK: older than 12 hours or no timestamp
   */
  public static getTimeCategory(lastRefresh: number | undefined): Time {
    if (!lastRefresh) {
      return Time.WEEK;
    }
    const diff = Date.now() - lastRefresh;
    if (diff < 1000 * 60 * 15) {
      return Time.ONLINE;
    } else if (diff < 1000 * 60 * 60 * 12) {
      return Time.TODAY;
    } else {
      return Time.WEEK;
    }
  }
}
