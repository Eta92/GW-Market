import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilityHelper } from '@app/helpers/utility.helper';
import { WeaponHelper } from '@app/helpers/weapon.helper';
import { ItemOrder, ItemOrders, ItemPriceList, Time } from '@app/models/order.model';
import { Item, OrderType, Price, ShopItem } from '@app/models/shop.model';
import { ShopService } from '@app/services/shop.service';
import { StoreService } from '@app/services/store.service';

const ItemDetailMap = {
  family: 'Family',
  'duration_(mins)': 'Duration (mins)',
  'applies_to...': 'Applies to',
  region: 'Usable in',
  stats: 'Stats',
  effect: 'Effect',
  description: 'Description',
  summoned_ally: 'Invocation'
};

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss']
})
export class ItemComponent implements OnInit {
  public item: Item;
  public allOrders: ItemOrders = { sellOrders: [], buyOrders: [] };
  public name = '';
  public tradeMessage = '';
  public details: Array<string> = [];
  public popup = false;

  public priceToString = UtilityHelper.priceToString;
  public timeToString = UtilityHelper.timeToString;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private shopService: ShopService,
    private storeService: StoreService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.name = params.name || '';
      //const name = this.router.url.split('/').pop() || '';
      const decodedName = decodeURIComponent(this.name);
      this.storeService.getItemOrders().subscribe((items: Array<ShopItem>) => {
        this.allOrders.sellOrders = this.parseOrders(
          items.filter(si => si.orderType === OrderType.SELL),
          true
        );
        this.allOrders.buyOrders = this.parseOrders(
          items.filter(si => si.orderType === OrderType.BUY),
          false
        );
        this.cdr.detectChanges();
      });
      this.storeService.getItemDetails().subscribe((item: Item) => {
        this.item = item;
        this.addDetails(item);
        this.cdr.detectChanges();
      });
      this.storeService.requestSocket('getItemOrders', decodedName);
    });
  }

  getImageSource(item: Item): string {
    return UtilityHelper.getImage(item);
  }

  getCurrencySource(price: Price): string {
    return '../../../assets/items/currency/' + price.toString() + '.png';
  }

  goTo(url: string): void {
    this.router.navigate(['public', url]);
  }

  getOrderTime(item: ItemOrder | ShopItem): Time {
    if (!item.lastRefresh) {
      return Time.WEEK;
    }
    const diff = Date.now() - item.lastRefresh;
    if (diff < 1000 * 60 * 15) {
      return Time.ONLINE;
    } else if (diff < 1000 * 60 * 60 * 12) {
      return Time.TODAY;
    } else {
      return Time.WEEK;
    }
  }

  parseOrders(items: Array<ShopItem>, sorting: boolean): Array<ItemPriceList> {
    const itemPriceLists: Array<ItemPriceList> = [];
    items.forEach(item => {
      item.prices.forEach(price => {
        if (!itemPriceLists.find(il => il.price === price.type)) {
          itemPriceLists.push({ price: price.type, orders: [] });
        }
        const itemPriceList = itemPriceLists.find(il => il.price === price.type);
        const time = this.getOrderTime(item);
        if (!itemPriceList?.orders.find(tl => tl.time === time)) {
          itemPriceList?.orders.push({ time: time, orders: [] });
        }
        const itemTimeList = itemPriceList?.orders.find(tl => tl.time === time);
        const pgcd = UtilityHelper.egcd(price.price, item.quantity);
        itemTimeList?.orders.push({
          player: item.player,
          daybreakOnline: item.daybreakOnline,
          authCertified: item.authCertified,
          lastRefresh: item.lastRefresh,
          item: item as any,
          orderType: item.orderType,
          price: price,
          description: item.description,
          quantity: item.quantity,
          div_price: Math.round(price.price / pgcd),
          div_quantity: Math.round(item.quantity / pgcd)
        });
      });
    });
    itemPriceLists.forEach(il => {
      il.orders.sort((a, b) => {
        return a.time - b.time;
      });
      il.orders.forEach(tl => {
        tl.orders.sort((a, b) => {
          return sorting
            ? a.price.price / a.quantity - b.price.price / b.quantity || b.lastRefresh - a.lastRefresh
            : b.price.price / b.quantity - a.price.price / a.quantity || b.lastRefresh - a.lastRefresh;
        });
      });
    });
    return itemPriceLists;
  }

  whisper(item: ItemOrder): void {
    if (item.orderType === OrderType.SELL) {
      this.tradeMessage = `/w ${item.player}, Hi, I would like to buy your ${item.quantity} ${this.item.name} listed for ${item.price.price} ${this.priceToString(item.price.type)}. ${item.quantity > 1 ? 'Are they' : 'Is it'} still available?`;
    } else {
      this.tradeMessage = `/w ${item.player}, Hi, I would like to sell you my ${item.quantity} ${this.item.name} for ${item.price.price} ${this.priceToString(item.price.type)}. Are you still interested?`;
    }
    this.popup = true;
  }

  addDetails(item: Item): void {
    this.details = [];
    for (const key in ItemDetailMap) {
      if (item[key as keyof Item]) {
        this.details.push(`${ItemDetailMap[key]}: ${item[key as keyof Item]}`);
      }
    }
  }

  getOldOpacity(item: ItemOrder): string {
    return UtilityHelper.getOldOpacity(item);
  }

  formatLastUpdate(timestamp: number): string {
    return UtilityHelper.formatLastUpdate(timestamp);
  }

  displayRawItem(): string {
    return JSON.stringify(this.item, null, 2);
  }

  stopClick(event): void {
    event.stopPropagation();
  }

  onSelectItem(item: Item): void {
    this.router.navigate(['item', item.name]);
  }

  homeBaseUrl(): string {
    return this.router.createUrlTree(['']).toString();
  }

  onHome(): void {
    this.router.navigate(['']);
  }

  onCreateOrder(order): void {
    this.shopService.addShopItem(order);
    this.router.navigate(['shop']);
  }

  isWeapon(item: Item, check?): boolean {
    return WeaponHelper.isWeapon(item);
  }
}
