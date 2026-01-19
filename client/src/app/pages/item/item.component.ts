import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilityHelper } from '@app/helpers/utility.helper';
import { WeaponHelper } from '@app/helpers/weapon.helper';
import {
  CurrencyGroup,
  CurrencyOrders,
  ItemOrder,
  ItemOrders,
  ItemPriceList,
  Time,
  TimeBucket
} from '@app/models/order.model';
import { Item, OrderType, Price, ShopItem } from '@app/models/shop.model';
import { ShopService } from '@app/services/shop.service';
import { StoreService } from '@app/services/store.service';
import { ItemDetailMap } from '@app/shared/constants/item-detail.map';
import { ToggleOption } from '@app/shared/components/toggle-group/toggle-group.component';

// Filter types
export type OrderTypeFilter = 'all' | 'sell' | 'buy';
export type CurrencyFilter = 'all' | number[]; // 'all' or array of Price enum values
export type ViewMode = 'combined' | 'separate';

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss']
})
export class ItemComponent implements OnInit {
  public item: Item;
  public allOrders: ItemOrders = { sellOrders: [], buyOrders: [] };
  public currencyOrders: CurrencyOrders = { currencies: [] };
  public name = '';
  public tradeMessage = '';
  public details: Array<string> = [];
  public popup = false;
  public orderOpen = false;
  public selectedOrder: ItemOrder | null = null;

  // Filters
  public orderTypeFilter: OrderTypeFilter = 'all';
  public currencyFilter: CurrencyFilter = 'all';
  public viewMode: ViewMode = 'separate'; // 'separate' shows Sell/Buy columns, 'combined' shows by currency
  public availableCurrencies: Array<{ value: Price; name: string }> = [];
  public currencyOptions: ToggleOption[] = [];

  public timeToString = UtilityHelper.timeToString;

  // Toggle options for filter buttons
  public orderTypeOptions: ToggleOption[] = [
    { value: 'all', label: 'All' },
    { value: 'sell', label: 'Sell', icon: 'fa-arrow-up', styleClass: 'sell' },
    { value: 'buy', label: 'Buy', icon: 'fa-arrow-down', styleClass: 'buy' }
  ];

  public viewModeOptions: ToggleOption[] = [
    { value: 'separate', label: 'Separate', icon: 'fa-columns' },
    { value: 'combined', label: 'Combined', icon: 'fa-list' }
  ];

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
        // Parse into new currency-based structure
        this.currencyOrders = this.parseOrdersByCurrency(items);
        // Extract available currencies for filter
        this.availableCurrencies = this.currencyOrders.currencies.map(c => ({
          value: c.currency,
          name: c.currencyName
        }));
        // Build currency toggle options
        this.currencyOptions = [
          { value: 'all', label: 'All' },
          ...this.currencyOrders.currencies.map(c => ({
            value: c.currency,
            label: c.currencyName,
            imgSrc: UtilityHelper.getCurrencySource(c.currency)
          }))
        ];
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

  goTo(url: string): void {
    this.router.navigate(['public', url]);
  }

  getOrderTime(item: ItemOrder | ShopItem): Time {
    return UtilityHelper.getTimeCategory(item.lastRefresh);
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
          details: this.item,
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

  parseOrdersByCurrency(items: Array<ShopItem>): CurrencyOrders {
    const currencyMap = new Map<Price, CurrencyGroup>();

    items.forEach(item => {
      item.prices.forEach(price => {
        // Get or create currency group
        if (!currencyMap.has(price.type)) {
          currencyMap.set(price.type, {
            currency: price.type,
            currencyName: UtilityHelper.priceToString(price.type),
            timeBuckets: [
              { time: Time.ONLINE, sellOrders: [], buyOrders: [] },
              { time: Time.TODAY, sellOrders: [], buyOrders: [] },
              { time: Time.WEEK, sellOrders: [], buyOrders: [] }
            ],
            totalOrders: 0
          });
        }

        const currencyGroup = currencyMap.get(price.type)!;
        const time = this.getOrderTime(item);
        const timeBucket = currencyGroup.timeBuckets.find(tb => tb.time === time)!;

        const pgcd = UtilityHelper.egcd(price.price, item.quantity);
        const order: ItemOrder = {
          player: item.player,
          daybreakOnline: item.daybreakOnline,
          authCertified: item.authCertified,
          lastRefresh: item.lastRefresh,
          item: item as any,
          details: this.item,
          orderType: item.orderType,
          price: price,
          description: item.description,
          quantity: item.quantity,
          div_price: Math.round(price.price / pgcd),
          div_quantity: Math.round(item.quantity / pgcd)
        };

        if (item.orderType === OrderType.SELL) {
          timeBucket.sellOrders.push(order);
        } else {
          timeBucket.buyOrders.push(order);
        }
        currencyGroup.totalOrders++;
      });
    });

    // Sort orders within each time bucket
    currencyMap.forEach(currencyGroup => {
      currencyGroup.timeBuckets.forEach(timeBucket => {
        // Sell orders: lowest price first (best deal for buyer)
        timeBucket.sellOrders.sort(
          (a, b) => a.price.price / a.quantity - b.price.price / b.quantity || b.lastRefresh - a.lastRefresh
        );
        // Buy orders: highest price first (best deal for seller)
        timeBucket.buyOrders.sort(
          (a, b) => b.price.price / b.quantity - a.price.price / a.quantity || b.lastRefresh - a.lastRefresh
        );
      });
    });

    // Convert map to array and sort by currency type (Gold first, then Ecto)
    const currencies = Array.from(currencyMap.values()).sort((a, b) => a.currency - b.currency);

    return { currencies };
  }

  hasOrdersInTimeBucket(bucket: TimeBucket): boolean {
    const showSell = this.orderTypeFilter === 'all' || this.orderTypeFilter === 'sell';
    const showBuy = this.orderTypeFilter === 'all' || this.orderTypeFilter === 'buy';
    return (showSell && bucket.sellOrders.length > 0) || (showBuy && bucket.buyOrders.length > 0);
  }

  countCurrencyOrders(currency: CurrencyGroup): number {
    return currency.timeBuckets.reduce((sum, bucket) => sum + bucket.sellOrders.length + bucket.buyOrders.length, 0);
  }

  // Filter methods
  setOrderTypeFilter(filter: OrderTypeFilter): void {
    this.orderTypeFilter = filter;
  }

  setCurrencyFilter(filter: CurrencyFilter): void {
    this.currencyFilter = filter;
  }

  // Getter for toggle-group value
  get currencyFilterValue(): any {
    if (this.currencyFilter === 'all') {
      return 'all';
    }
    // If single currency selected, return that currency
    const selected = this.currencyFilter as number[];
    if (selected.length === 1) {
      return selected[0];
    }
    // If multiple currencies, return 'all' for toggle display
    return 'all';
  }

  // Handler for toggle-group change
  onCurrencyFilterChange(value: any): void {
    if (value === 'all') {
      this.currencyFilter = 'all';
      // Keep viewMode as is - user can toggle between Combined/Separate
    } else {
      this.currencyFilter = [value];
      // Keep viewMode as is - user can toggle between Combined/Separate
    }
  }

  toggleCurrency(currency: number): void {
    // If currently 'all', switch to single currency selection
    if (this.currencyFilter === 'all') {
      this.currencyFilter = [currency];
      return;
    }

    // Toggle currency in array
    const selected = this.currencyFilter as number[];
    const index = selected.indexOf(currency);
    if (index === -1) {
      // Add currency
      this.currencyFilter = [...selected, currency];
    } else {
      // Remove currency (but keep at least one, or switch to 'all' if removing last)
      if (selected.length === 1) {
        this.currencyFilter = 'all';
      } else {
        this.currencyFilter = selected.filter(c => c !== currency);
      }
    }
  }

  isCurrencySelected(currency: number): boolean {
    if (this.currencyFilter === 'all') {
      return false;
    }
    return (this.currencyFilter as number[]).includes(currency);
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
  }

  get filteredCurrencies(): CurrencyGroup[] {
    if (this.currencyFilter === 'all') {
      return this.currencyOrders.currencies;
    }
    const selectedCurrencies = this.currencyFilter as number[];
    return this.currencyOrders.currencies.filter(c => selectedCurrencies.includes(c.currency));
  }

  showSellOrders(): boolean {
    return this.orderTypeFilter === 'all' || this.orderTypeFilter === 'sell';
  }

  showBuyOrders(): boolean {
    return this.orderTypeFilter === 'all' || this.orderTypeFilter === 'buy';
  }

  getFilteredOrderCount(): number {
    let count = 0;
    this.filteredCurrencies.forEach(currency => {
      currency.timeBuckets.forEach(bucket => {
        if (this.showSellOrders()) count += bucket.sellOrders.length;
        if (this.showBuyOrders()) count += bucket.buyOrders.length;
      });
    });
    return count;
  }

  // Show split Sell/Buy columns based on view mode (only when viewing all order types)
  get showSplitColumns(): boolean {
    return this.orderTypeFilter === 'all' && this.viewMode === 'separate';
  }

  get singleCurrency(): CurrencyGroup | null {
    return this.filteredCurrencies.length === 1 ? this.filteredCurrencies[0] : null;
  }

  getSellOrdersForCurrency(currency: CurrencyGroup): ItemOrder[] {
    const orders: ItemOrder[] = [];
    currency.timeBuckets.forEach(bucket => {
      bucket.sellOrders.forEach(order => orders.push({ ...order, _timeBucket: bucket.time } as any));
    });
    return orders;
  }

  getBuyOrdersForCurrency(currency: CurrencyGroup): ItemOrder[] {
    const orders: ItemOrder[] = [];
    currency.timeBuckets.forEach(bucket => {
      bucket.buyOrders.forEach(order => orders.push({ ...order, _timeBucket: bucket.time } as any));
    });
    return orders;
  }

  // Get all sell orders across all filtered currencies, grouped by time
  getAllSellOrdersByTime(): { time: Time; orders: ItemOrder[] }[] {
    const timeMap = new Map<Time, ItemOrder[]>();
    [Time.ONLINE, Time.TODAY, Time.WEEK].forEach(t => timeMap.set(t, []));

    this.filteredCurrencies.forEach(currency => {
      currency.timeBuckets.forEach(bucket => {
        bucket.sellOrders.forEach(order => {
          timeMap.get(bucket.time)?.push(order);
        });
      });
    });

    // Sort orders within each time bucket by unit price (lowest first for sell)
    timeMap.forEach(orders => {
      orders.sort((a, b) => a.price.price / a.quantity - b.price.price / b.quantity || b.lastRefresh - a.lastRefresh);
    });

    return [Time.ONLINE, Time.TODAY, Time.WEEK]
      .map(time => ({ time, orders: timeMap.get(time) || [] }))
      .filter(bucket => bucket.orders.length > 0);
  }

  // Get all buy orders across all filtered currencies, grouped by time
  getAllBuyOrdersByTime(): { time: Time; orders: ItemOrder[] }[] {
    const timeMap = new Map<Time, ItemOrder[]>();
    [Time.ONLINE, Time.TODAY, Time.WEEK].forEach(t => timeMap.set(t, []));

    this.filteredCurrencies.forEach(currency => {
      currency.timeBuckets.forEach(bucket => {
        bucket.buyOrders.forEach(order => {
          timeMap.get(bucket.time)?.push(order);
        });
      });
    });

    // Sort orders within each time bucket by unit price (highest first for buy)
    timeMap.forEach(orders => {
      orders.sort((a, b) => b.price.price / b.quantity - a.price.price / a.quantity || b.lastRefresh - a.lastRefresh);
    });

    return [Time.ONLINE, Time.TODAY, Time.WEEK]
      .map(time => ({ time, orders: timeMap.get(time) || [] }))
      .filter(bucket => bucket.orders.length > 0);
  }

  getTotalSellOrders(): number {
    return this.filteredCurrencies.reduce(
      (sum, c) => sum + c.timeBuckets.reduce((s, b) => s + b.sellOrders.length, 0),
      0
    );
  }

  getTotalBuyOrders(): number {
    return this.filteredCurrencies.reduce(
      (sum, c) => sum + c.timeBuckets.reduce((s, b) => s + b.buyOrders.length, 0),
      0
    );
  }

  openOrderDetail(order: ItemOrder): void {
    this.selectedOrder = order;
  }

  closeOrderDetail(): void {
    this.selectedOrder = null;
  }

  whisper(item: ItemOrder): void {
    if (item.orderType === OrderType.SELL) {
      this.tradeMessage = `/w ${item.player}, Hi, I would like to buy your ${item.quantity} ${this.item.name} listed for ${item.price.price} ${UtilityHelper.priceToString(item.price.type)}. ${item.quantity > 1 ? 'Are they' : 'Is it'} still available?`;
    } else {
      this.tradeMessage = `/w ${item.player}, Hi, I would like to sell you my ${item.quantity} ${this.item.name} for ${item.price.price} ${UtilityHelper.priceToString(item.price.type)}. Are you still interested?`;
    }
    this.popup = true;
  }

  whisperFromDetail(): void {
    if (this.selectedOrder) {
      this.whisper(this.selectedOrder);
      this.selectedOrder = null;
    }
  }

  addDetails(item: Item): void {
    this.details = [];
    for (const key in ItemDetailMap) {
      if (item[key as keyof Item]) {
        this.details.push(`${ItemDetailMap[key]}: ${item[key as keyof Item]}`);
      }
    }
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

  hasItemDetails(order: ItemOrder): boolean {
    return WeaponHelper.hasItemDetails(this.item, order.item);
  }

  getOrderNote(order: ItemOrder): string {
    const parts: string[] = [];
    if (order.description) {
      parts.push(order.description);
    }
    if (WeaponHelper.isWeapon(this.item) && order.item?.weaponDetails) {
      parts.push(WeaponHelper.formatWeaponDetails(order.item.weaponDetails));
    }
    return parts.join(' | ');
  }

  countOrders(priceLists: ItemPriceList[]): number {
    let count = 0;
    priceLists.forEach(pl => {
      pl.orders.forEach(tl => {
        count += tl.orders.length;
      });
    });
    return count;
  }
}
