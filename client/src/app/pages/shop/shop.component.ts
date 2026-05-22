import { Location } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilityHelper } from '@app/helpers/utility.helper';
import { WeaponHelper } from '@app/helpers/weapon.helper';
import { Auction, AuctionHistory } from '@app/models/auction.model';
import { OrderFilter, OrderSort } from '@app/models/order.model';
import { Purchase, PurchaseOrigin, PurchasePrice } from '@app/models/purchase.model';
import { BasicItem, DaybreakItem, OrderType, Shop, ShopItem } from '@app/models/shop.model';
import { ItemService } from '@app/services/item.service';
import { ShopService } from '@app/services/shop.service';
import { StoreService } from '@app/services/store.service';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public pro = false;
  public showcase = false;
  public shop: Shop;
  public personalHighlight = 15 * 60 * 1000;
  public sellOrders: Array<ShopItem> = [];
  public buyOrders: Array<ShopItem> = [];
  public itemAuctions: Array<Auction> = [];
  public tradeMessage = '';
  public details: Array<string> = [];
  public popup = false;
  public orderEdit: ShopItem = null;
  public orderEditAll = false;
  public auctionDisplay: Auction = null;
  public auctionPopup = false;
  public auctionMessage = '';
  public auctionHistoryVisible = false;
  public showCandle = false;
  public timeLeft = 0;
  public pendingChanges = 0;
  public daybreakEdit = false;
  public daybreakItems: Array<DaybreakItem> = [];
  public orderFilter: OrderFilter = {
    name: '',
    orderType: null,
    family: null,
    category: null,
    attribute: null,
    reqMin: 0,
    reqMax: 13,
    inscription: null,
    legacy: null,
    core: null,
    prefix: null,
    suffix: null
  };
  public sortOrder: OrderSort = {
    sortBy: 'time',
    sortOrder: 'desc'
  };
  public totalOrders = {
    sell: 0,
    buy: 0,
    auctions: 0
  };

  public playerControl: UntypedFormControl = new UntypedFormControl('');
  public playerEdit = false;
  public clearShop = false;

  public orderWarning = false;
  public playerWarning = false;

  public playerOpen = false;
  public orderOpen = false;
  public daybreakOpen = false;
  public dataOpen = false;

  // View options
  public compactView = false;
  public showDetails = true;
  public showViewOptionsHelp = false;

  // Image cache: item name => image path, populated in updateItemList
  public imageCache: Record<string, string> = {};

  // Desktop notifications
  public notifyOnOffline = false;

  public OrderType = OrderType;
  public Array = Array;

  @ViewChild('player') private playerRef: ElementRef<HTMLElement>;
  @ViewChild('candle') private candleRef: ElementRef<HTMLElement>;
  @ViewChild('timer') private timerRef: ElementRef<HTMLElement>;

  private cdPending = false;

  /** Coalesces multiple rapid detectChanges calls into one per microtask. */
  private scheduleDetect(): void {
    if (this.cdPending) return;
    this.cdPending = true;
    Promise.resolve().then(() => {
      this.cdPending = false;
      this.cdr.detectChanges();
    });
  }

  constructor(
    private router: Router,
    private location: Location,
    private activatedRoute: ActivatedRoute,
    private itemService: ItemService,
    private shopService: ShopService,
    private storeService: StoreService,
    private toastrService: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.timerActive = false;
  }

  ngOnInit(): void {
    this.shopService
      .getPendingChanges()
      .pipe(takeUntil(this.destroy$))
      .subscribe(pendingChanges => {
        this.pendingChanges = pendingChanges;
        this.scheduleDetect();
      });
    this.activatedRoute.url.pipe(takeUntil(this.destroy$)).subscribe(urlSegments => {
      this.showcase = urlSegments.some(segment => segment.path.toLowerCase() === 'showcase');
      if (this.showcase) {
        // load showcase shop
        this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
          const publicId = params['public'];
          this.storeService.requestSocket('getPublicShop', publicId);
          this.shopService
            .getPublicShop()
            .pipe(takeUntil(this.destroy$))
            .subscribe((shop: Shop) => {
              this.shop = shop;
              this.shopUpdate();
            });
        });
      } else {
        // load personal shop
        this.shopService
          .getActiveShop()
          .pipe(takeUntil(this.destroy$))
          .subscribe((shop: Shop) => {
            this.shop = shop;
            this.storeService.requestSocket('getPersonalAuctions', shop.auctions);
            this.shopUpdate();
          });
        // auto switch to pro mode
        this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
          this.pro = params['pro'];
        });
      }
      // in both case listen to binded auctions
      this.shopService
        .getPersonalAuctions()
        .pipe(takeUntil(this.destroy$))
        .subscribe(auctions => {
          this.itemAuctions = auctions;
          this.scheduleDetect();
        });
      if (this.showcase) {
        this.notifyOnOffline = false;
      } else {
        this.notifyOnOffline = localStorage.getItem('notifyOnOffline') === 'true';
      }
      // listen for purchases history
      this.shopService
        .getPurchases()
        .pipe(takeUntil(this.destroy$))
        .subscribe(purchases => {
          this.exportPurchasesCsv(purchases);
        });
    });
    if (localStorage.getItem('sortOrder')) {
      this.sortOrder = JSON.parse(localStorage.getItem('sortOrder'));
    }
  }

  // Populate item details for filtering
  private shopUpdate(): void {
    const bonus = this.shop.reputation ? this.shop.reputation.positive - this.shop.reputation.negative : 0;
    this.personalHighlight = (15 + bonus) * 60 * 1000;
    if (this.shop?.items) {
      this.updateItemList();
      if (!this.showcase) {
        this.refreshCandle();
      }
      this.scheduleDetect();
    }
  }

  getImageSource(itemName: string): string {
    return this.itemService?.getItemImage(itemName) || '';
  }

  stopClick(event): void {
    event.stopPropagation();
  }

  onEditOrders(orders: Array<ShopItem>): void {
    this.shopService.updateAllShopItems(orders);
    this.orderEditAll = false;
  }

  async loadDaybreakItems(mode: 'stash' | 'inventory'): Promise<void> {
    this.daybreakOpen = false;
    const items = await this.shopService.fetchDaybreakItems(mode);
    this.daybreakItems = items;
    this.daybreakEdit = true;
    this.scheduleDetect();
  }

  onImportDaybreaks(orders: Array<ShopItem>): void {
    this.shopService.addDaybreakShopItems(orders);
    this.daybreakEdit = false;
  }

  editOrder(order: ShopItem): void {
    this.orderEdit = order;
  }

  onEditOrder(order: ShopItem): void {
    order.item = this.itemService.getItemBase(order.name);
    const editIndex = this.shop.items.indexOf(this.orderEdit);
    this.shopService.updateShopItem(editIndex, order);
    this.orderEdit = null;
  }

  onHideOrder(order: ShopItem): void {
    order.hidden = !order.hidden;
    this.shopService.updateShopItem(this.shop.items.indexOf(order), order);
  }

  onCompleteOrder(order: ShopItem): void {
    if (order.completed) {
      this.shopService.removeShopItem(this.shop.items.indexOf(order));
      this.storeService.requestSocket('logPurchase', {
        name: order.name,
        shop: this.shop.uuid,
        prices: order.prices.map(
          p =>
            ({
              type: p.type,
              quantity: order.quantity,
              totalPrice: p.price,
              unitPrice: Math.round(p.price / (order.quantity || 1))
            }) as PurchasePrice
        ),
        orderType: order.orderType,
        listedTime: order.listedTime,
        origin: PurchaseOrigin.SHOP,
        weaponDetails: order.weaponDetails,
        orderDetails: order.orderDetails
      } as Purchase);
    } else {
      this.toastrService.warning('Confirm completion by clicking the check button again', 'Order validation initiated', { timeOut: 10000 });
      order.completed = true;
    }
  }

  onRemoveOrder(order: ShopItem): void {
    if (order.removed) {
      this.shopService.removeShopItem(this.shop.items.indexOf(order));
    } else {
      this.toastrService.warning('Confirm deletion by clicking the trash button again', 'Order removal initiated', {
        timeOut: 10000
      });
      order.removed = true;
    }
  }

  onSingleOrder(order: ShopItem): void {
    if (order.single) {
      this.shopService.singleShopItem(this.shop.items.indexOf(order));
      this.storeService.requestSocket('logPurchase', {
        name: order.name,
        shop: this.shop.uuid,
        prices: order.prices.map(
          p =>
            ({
              type: p.type,
              quantity: 1,
              totalPrice: Math.round(p.price / (order.quantity || 1)),
              unitPrice: Math.round(p.price / (order.quantity || 1))
            }) as PurchasePrice
        ),
        orderType: order.orderType,
        listedTime: order.listedTime,
        origin: PurchaseOrigin.SHOP,
        weaponDetails: order.weaponDetails,
        orderDetails: order.orderDetails
      } as Purchase);
    } else {
      this.toastrService.warning('Confirm single completion by clicking the check button again', 'Single validation initiated', {
        timeOut: 10000
      });
      order.single = true;
    }
  }

  onCloturateAuction(auction: Auction): void {
    if (auction.cloturate) {
      this.shopService.cloturateAuction(this.itemAuctions.indexOf(auction));
    } else {
      this.toastrService.warning(
        'Confirm auction completion by clicking the trash button again. Ensure the client has received the item before confirming.',
        'Auction completion initiated',
        {
          timeOut: 10000
        }
      );
      auction.cloturate = true;
    }
  }

  onCompleteLeave(order: ShopItem): void {
    order.completed = false;
  }

  onRemoveLeave(order: ShopItem): void {
    order.removed = false;
  }

  onSingleLeave(order: ShopItem): void {
    order.single = false;
  }

  onCloturateLeave(auction: Auction): void {
    auction.cloturate = false;
  }

  onAuctionClick(auction: Auction): void {
    this.auctionDisplay = auction;
    this.auctionHistoryVisible = false;
  }

  homeBaseUrl(): string {
    return this.router.createUrlTree(['']).toString();
  }

  onHome(): void {
    this.router.navigate(['']);
  }

  openPlayer(): void {
    this.playerOpen = true;
    // this.playerEdit = true;
    // this.playerControl.setValue(this.shop.player);
    // setTimeout(() => {
    //   this.playerRef.nativeElement.focus();
    // }, 1);
  }

  // playerInput(event: KeyboardEvent): void {
  //   if (event.key === 'Enter') {
  //     this.playerConfirm();
  //     event.preventDefault();
  //   }
  //   if (event.key === 'Escape') {
  //     this.playerEdit = false;
  //     event.preventDefault();
  //   }
  // }

  // playerConfirm(): void {
  //   const playerName = this.playerControl.value.trim();
  //   if (playerName.length === 0) {
  //     return;
  //   }
  //   this.playerWarning = false;
  //   this.shopService.updateShopName(playerName);
  //   this.playerEdit = false;
  // }

  onConfirmPlayer(playerName: string): void {
    this.playerOpen = false;
    if (playerName && playerName.trim().length > 0) {
      this.playerWarning = false;
      this.shopService.updateShopName(playerName.trim());
    }
  }

  onDaybreakOpen(): void {
    this.daybreakOpen = true;
    this.scheduleDetect();
  }

  exportShop(): void {
    this.shopService.exportShop();
  }

  requestPurchasesExport(): void {
    if (!this.shop?.uuid) {
      this.toastrService.warning('Your shop must be online at least once to have purchase history.', 'No history available');
      return;
    }
    this.storeService.requestSocket('getShopHistory', this.shop.uuid);
  }

  exportPurchasesCsv(purchases: Array<Purchase>): void {
    if (!purchases?.length) {
      this.toastrService.warning('No purchase history found for this shop.', 'Nothing to export');
      return;
    }
    const orderTypeLabels = ['Sell', 'Buy', 'Auction'];
    const originLabels = ['Customer', 'Validation'];
    const now = new Date().toISOString().slice(0, 10);
    const priceLabels = ['Platinum', 'Ecto', 'Zkey', 'Armbraces', 'Black Dye'];
    const rows: string[] = [
      'Date,Name,Quantity,Order Type,Origin,Price,Listed Time,Attribute,Requirement,Inscribable,Core,Prefix,Suffix,Dedicated,Pre-Ascalon,Legacy,Gold value,Note'
    ];
    for (const p of purchases) {
      const priceStr = p.prices?.map(p => `${priceLabels[p.type] ?? p.type}: ${p.totalPrice}`).join(' | ') ?? '';
      const row = [
        p.date ? new Date(p.date).toISOString() : '',
        `"${(p.name ?? '').replace(/"/g, '""')}"`,
        p.prices[0]?.quantity ?? 1,
        orderTypeLabels[p.orderType] ?? p.orderType,
        originLabels[p.origin] ?? p.origin,
        priceStr,
        p.listedTime ? new Date(p.listedTime).toISOString() : '',
        p.weaponDetails?.attribute ?? '',
        p.weaponDetails?.requirement ?? '',
        p.weaponDetails?.inscription ?? '',
        p.weaponDetails?.core ?? '',
        p.weaponDetails?.prefix ?? '',
        p.weaponDetails?.suffix ?? '',
        p.orderDetails?.dedicated ?? '',
        p.orderDetails?.pre ?? '',
        p.orderDetails?.legacy ?? '',
        p.orderDetails?.goldPrice ?? '',
        p.orderDetails?.note ?? ''
      ].join(',');
      rows.push(row);
    }
    this.downloadCsv(rows.join('\n'), `GWMarket-Purchases-${this.shop.player}-${now}.csv`);
  }

  exportItemsCsv(): void {
    if (!this.shop?.items?.length) return;
    const priceLabels = ['Platinum', 'Ecto', 'Zkey', 'Armbraces', 'Black Dye'];
    const orderTypeLabels = ['Sell', 'Buy', 'Auction'];
    const now = new Date().toISOString().slice(0, 10);
    const rows: string[] = ['Name,Order Type,Quantity,Price,Description,Listed Time'];
    for (const item of this.shop.items) {
      const priceStr = item.prices?.map(p => `${priceLabels[p.type] ?? p.type}: ${p.price}`).join(' | ') ?? '';
      const row = [
        `"${(item.name ?? '').replace(/"/g, '""')}"`,
        orderTypeLabels[item.orderType] ?? item.orderType,
        item.quantity ?? 1,
        `"${priceStr}"`,
        `"${(item.description ?? '').replace(/"/g, '""')}"`,
        item.listedTime ? new Date(item.listedTime).toISOString() : ''
      ].join(',');
      rows.push(row);
    }
    this.downloadCsv(rows.join('\n'), `GWMarket-Items-${this.shop.player}-${now}.csv`);
  }

  private downloadCsv(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  onImport(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files === undefined || files.length === 0) {
      return;
    }
    const file: File = files[0];
    const reader: FileReader = new FileReader();
    reader.onload = (e): void => {
      const content = reader.result as string;
      const importedShop = JSON.parse(content) as Shop;
      this.shopService.importShop(importedShop);
      this.playerControl.setValue(importedShop.player);
      this.dataOpen = false;
    };
    reader.readAsText(file);
  }

  onClearShop(): void {
    this.shopService.clearShop();
    this.clearShop = false;
  }

  refreshShop(): void {
    if (this.shop.player === 'GWTrader') {
      this.toastrService.warning('Please first set a valid player name for your shop', 'Player invalid');
      this.playerWarning = true;
    } else if (this.shop.items.length === 0 && !this.shop.uuid) {
      this.toastrService.warning('Please place at least one order before onlining your shop', 'No items');
      this.orderWarning = true;
    } else if (Date.now() - this.shop.lastRefresh < 60 * 1000) {
      this.toastrService.warning('Refreshing more than once a minute is a bit rude', 'Please be gentle with the server');
    } else {
      this.shopService.enableShop();
    }
  }

  stopShop(): void {
    this.shopService.disableShop();
  }

  async toggleNotifyOnOffline(): Promise<void> {
    if (this.notifyOnOffline) {
      // Disable
      this.notifyOnOffline = false;
      localStorage.setItem('notifyOnOffline', 'false');
      return;
    }
    if (!('Notification' in window)) {
      this.toastrService.warning('Desktop notifications are not supported by your browser', 'Notifications unavailable');
      return;
    }
    let permission = Notification.permission;
    if (permission === 'denied') {
      this.toastrService.warning('Notifications are blocked. Please allow them in your browser settings.', 'Permission denied');
      return;
    }
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission === 'granted') {
      this.notifyOnOffline = true;
      localStorage.setItem('notifyOnOffline', 'true');
      new Notification('GW Market – Notifications enabled', {
        body: 'You will receive a notification when your shop goes offline.',
        icon: '/assets/icons/manifest/icon-192x192.png'
      });
    } else {
      this.toastrService.warning('Notifications are blocked. Please allow them in your browser settings.', 'Permission denied');
    }
  }

  private sendOfflineNotification(): void {
    if (this.notifyOnOffline && Notification.permission === 'granted') {
      new Notification('GW Market – Shop offline', {
        body: `Your shop (${this.shop?.player || 'Unknown'}) is no longer highlighted.`,
        icon: '/assets/icons/manifest/icon-192x192.png'
      });
    }
  }

  refreshCandle(): void {
    if (this.shop.lastRefresh + this.personalHighlight > Date.now()) {
      this.showCandle = true;
      this.timeLeft = this.shop.lastRefresh + this.personalHighlight - Date.now();
      const percentLeft = this.timeLeft / this.personalHighlight;
      if (this.candleRef && this.candleRef.nativeElement) {
        this.candleRef.nativeElement.style.animation = 'none';
        setTimeout(() => {
          this.candleRef.nativeElement.style.animation = `melt ${this.timeLeft}ms linear forwards`;
        }, 10);
      }
      if (!this.timerActive) {
        this.refreshTimer();
      }
    } else {
      this.showCandle = false;
      this.timeLeft = 0;
      this.timerActive = false;
      this.scheduleDetect();
    }
  }

  private timerActive = false;
  private timerLoop = 0;
  refreshTimer(): void {
    if (this.showCandle && this.timeLeft > 0) {
      this.timerActive = true;
      this.timeLeft = this.shop.lastRefresh + this.personalHighlight - Date.now();
      if (this.timeLeft < 0) {
        this.showCandle = false;
        this.timerActive = false;
        this.timeLeft = 0;
        this.sendOfflineNotification();
        this.scheduleDetect();
        return;
      }
      if (this.timerLoop === 0) {
        this.timerLoop = 1;
        setTimeout(() => {
          this.timerLoop = 0;
          this.refreshTimer();
        }, 1000);
      }
      this.scheduleDetect();
    }
  }

  formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  goToItem(itemName: string): void {
    this.router.navigate(['/item', itemName]);
  }

  isWeapon(item: BasicItem): boolean {
    return WeaponHelper.isWeapon(item);
  }

  isMiniature(item: BasicItem): boolean {
    return WeaponHelper.isMiniature(item);
  }

  togglePro(): void {
    this.pro = !this.pro;
    const url = this.router
      .createUrlTree([], {
        relativeTo: this.activatedRoute,
        queryParams: { pro: this.pro ? 'true' : null },
        queryParamsHandling: 'merge'
      })
      .toString();
    this.location.go(url);
  }

  copyLink(): void {
    if (this.shop?.publicId) {
      navigator.clipboard.writeText(`https://gwmarket.net/shop/showcase?public=${this.shop.publicId}`);
      this.toastrService.success('Public link has been copied to your clipboard, ready to paste it!');
    } else {
      this.toastrService.error('Public link is not ready, refresh your shop first.');
    }
  }

  onFilterChange(orderFilter: OrderFilter): void {
    this.orderFilter = orderFilter;
    this.updateItemList();
  }

  onSortChange(sortOrder: OrderSort): void {
    this.sortOrder = sortOrder;
    this.updateItemList();
    localStorage.setItem('sortOrder', JSON.stringify(sortOrder));
  }

  hasItemDetails(auction: Auction): boolean {
    return WeaponHelper.hasItemDetails(auction.item.item, auction.item);
  }

  toggleAuctionHistory(): void {
    this.auctionHistoryVisible = !this.auctionHistoryVisible;
  }

  goToShop(order: Auction | AuctionHistory): void {
    if (order.shopId) {
      window.open(`https://gwmarket.net/shop/showcase?public=${order.shopId}`, '_blank');
    }
  }

  contactWinner(auction: Auction): void {
    const winnerBid = auction.history?.[auction.history.length - 1];
    this.auctionMessage = `/w ${winnerBid?.bidder}, Hi, You have won the auction of ${auction?.item.name} with a bid at ${winnerBid?.bid} ${UtilityHelper.priceToString(auction.currency)}. Are you available to trade?`;
    this.auctionPopup = true;
  }

  copyMessage(): void {
    if (this.auctionMessage) {
      navigator.clipboard.writeText(this.auctionMessage).then(() => {
        this.toastrService.success('Auction message copied to clipboard', '', {
          timeOut: 5000
        });
      });
    }
  }

  private relativePrice = UtilityHelper.relativePrice;

  updateItemList(): void {
    if (!this.shop?.items) return;
    const filteredItem = this.shop.items.filter(item => {
      if (this.orderFilter.name && !item.name.toLowerCase().includes(this.orderFilter.name.toLowerCase())) {
        return false;
      }
      if (this.orderFilter.family && item.item?.family !== this.orderFilter.family) {
        return false;
      }
      if (this.orderFilter.category && item.item?.category !== this.orderFilter.category) {
        return false;
      }
      if (this.orderFilter.attribute) {
        if (!item.weaponDetails || item.weaponDetails.attribute !== this.orderFilter.attribute) {
          return false;
        }
      }
      if (this.orderFilter.reqMin && item.weaponDetails && item.weaponDetails.requirement) {
        if (item.weaponDetails.requirement < this.orderFilter.reqMin) {
          return false;
        }
      }
      if (this.orderFilter.reqMax && item.weaponDetails && item.weaponDetails.requirement) {
        if (item.weaponDetails.requirement > this.orderFilter.reqMax) {
          return false;
        }
      }
      if (this.orderFilter.inscription) {
        if (!item.weaponDetails || item.weaponDetails.inscription.toString() !== this.orderFilter.inscription) {
          return false;
        }
      }
      if (this.orderFilter.legacy) {
        if (!item.orderDetails || item.orderDetails.legacy.toString() !== this.orderFilter.legacy) {
          return false;
        }
      }
      if (this.orderFilter.core) {
        if (!item.weaponDetails || item.weaponDetails.core !== this.orderFilter.core) {
          return false;
        }
      }
      if (this.orderFilter.prefix) {
        if (!item.weaponDetails || item.weaponDetails.prefix !== this.orderFilter.prefix) {
          return false;
        }
      }
      if (this.orderFilter.suffix) {
        if (!item.weaponDetails || item.weaponDetails.suffix !== this.orderFilter.suffix) {
          return false;
        }
      }

      // Filter by order type (sell/buy)
      if (this.orderFilter.orderType === 'sell' && item.orderType !== OrderType.SELL) {
        return false;
      }
      if (this.orderFilter.orderType === 'buy' && item.orderType !== OrderType.BUY) {
        return false;
      }

      return true;
    });

    let sortedOrders = [...filteredItem];
    if (this.sortOrder.sortBy === 'time' && this.sortOrder.sortOrder === 'asc') {
      sortedOrders = [...filteredItem].reverse();
    } else {
      const multiplier = this.sortOrder.sortOrder === 'asc' ? -1 : 1;
      sortedOrders.sort((a, b) => {
        switch (this.sortOrder.sortBy) {
          case 'name':
            return multiplier * a.name.localeCompare(b.name);
          case 'quantity':
            return multiplier * (a.quantity - b.quantity);
          case 'price': {
            return multiplier * ((this.relativePrice(a.prices[0]) || 0) - (this.relativePrice(b.prices[0]) || 0));
          }
          case 'priceEach': {
            const priceA = this.relativePrice(a.prices[0]) || 0;
            const priceB = this.relativePrice(b.prices[0]) || 0;
            const eachA = priceA / (a.quantity || 1);
            const eachB = priceB / (b.quantity || 1);
            return multiplier * (eachA - eachB);
          }
          default:
            return 0;
        }
      });
    }
    // Count unfiltered totals in a single pass
    let totalSell = 0;
    let totalBuy = 0;
    for (const si of this.shop.items) {
      if (si.orderType === OrderType.SELL) totalSell++;
      else if (si.orderType === OrderType.BUY) totalBuy++;
    }
    this.totalOrders = {
      sell: totalSell,
      buy: totalBuy,
      auctions: this.shop.auctions ? this.shop.auctions.length : 0
    };

    // Split into sell/buy and build image cache in a single pass
    const sellOrders: ShopItem[] = [];
    const buyOrders: ShopItem[] = [];
    const cache: Record<string, string> = {};
    for (const order of sortedOrders) {
      if (order.orderType === OrderType.SELL) sellOrders.push(order);
      else if (order.orderType === OrderType.BUY) buyOrders.push(order);
      if (!(order.name in cache)) {
        cache[order.name] = this.itemService.getItemImage(order.name) || '';
      }
    }
    this.sellOrders = sellOrders;
    this.buyOrders = buyOrders;
    this.imageCache = cache;

    this.scheduleDetect();
  }

  reputationVote(vote: 'positive' | 'negative'): void {
    this.shopService.submitReputationVote(this.shop.player, vote);
  }

  trackByOrder(_index: number, order: ShopItem): number | string {
    return order.listedTime ?? _index;
  }

  trackByAuction(_index: number, auction: Auction): string | number {
    return auction.uuid ?? _index;
  }
}
