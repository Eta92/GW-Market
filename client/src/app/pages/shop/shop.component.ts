import { Location } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WeaponHelper } from '@app/helpers/weapon.helper';
import { OrderFilter } from '@app/models/order.model';
import { Item, OrderType, Shop, ShopItem } from '@app/models/shop.model';
import { ItemService } from '@app/services/item.service';
import { ShopService } from '@app/services/shop.service';
import { StoreService } from '@app/services/store.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit {
  public pro = false;
  public shop: Shop;
  public sellOrders: Array<ShopItem> = [];
  public buyOrders: Array<ShopItem> = [];
  public tradeMessage = '';
  public details: Array<string> = [];
  public popup = false;
  public orderEdit: ShopItem = null;
  public showCandle = false;
  public timeLeft = 0;
  public orderFilter: OrderFilter = {
    name: '',
    orderType: null,
    family: null,
    category: null,
    attribute: null,
    reqMin: 0,
    reqMax: 13,
    inscription: null,
    oldschool: null,
    core: null,
    prefix: null,
    suffix: null
  };

  public playerControl: UntypedFormControl = new UntypedFormControl('');
  public playerEdit = false;
  public clearShop = false;

  public orderWarning = false;
  public playerWarning = false;

  public playerOpen = false;
  public orderOpen = false;

  public OrderType = OrderType;

  @ViewChild('player') private playerRef: ElementRef<HTMLElement>;
  @ViewChild('candle') private candleRef: ElementRef<HTMLElement>;
  @ViewChild('timer') private timerRef: ElementRef<HTMLElement>;

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

  ngOnInit(): void {
    // split order in the two lists
    this.shopService.getActiveShop().subscribe((shop: Shop) => {
      this.shop = shop;
      this.populateItemDetails();
      this.updateItemList();
      this.refreshCandle();
      this.cdr.detectChanges();
    });
    // auto switch to pro mode
    this.activatedRoute.queryParams.subscribe(params => {
      this.pro = params['pro'];
    });
    // refresh image once the item service is ready
    this.itemService.getReady().subscribe(ready => {
      if (ready) {
        this.populateItemDetails();
        this.updateItemList();
        this.cdr.detectChanges();
      }
    });
  }

  // Populate item details for filtering
  private populateItemDetails(): void {
    if (!this.shop?.items) return;
    this.shop.items.forEach(shopItem => {
      if (!shopItem.item) {
        const basicItem = this.itemService.getItemBase(shopItem.name);
        if (basicItem) {
          shopItem.item = {
            name: basicItem.name,
            img: basicItem.img,
            family: basicItem.family,
            category: basicItem.category
          };
        }
      }
    });
  }

  getImageSource(itemName: string): string {
    return this.itemService?.getItemImage(itemName) || '';
  }

  stopClick(event): void {
    event.stopPropagation();
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
      // TODO register order completion
      this.shopService.removeShopItem(this.shop.items.indexOf(order));
    } else {
      order.completed = true;
    }
  }

  onRemoveOrder(order: ShopItem): void {
    if (order.removed) {
      this.shopService.removeShopItem(this.shop.items.indexOf(order));
    } else {
      order.removed = true;
    }
  }

  onCompleteLeave(order: ShopItem): void {
    order.completed = false;
  }

  onRemoveLeave(order: ShopItem): void {
    order.removed = false;
  }

  homeBaseUrl(): string {
    return this.router.createUrlTree(['']).toString();
  }

  onHome(): void {
    this.router.navigate(['']);
  }

  onCreateOrder(order): void {
    this.orderWarning = false;
    this.shopService.addShopItem(order);
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

  exportShop(): void {
    this.shopService.exportShop();
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
    } else if (this.shop.items.length === 0) {
      this.toastrService.warning('Please place at least one order before onlining your shop', 'No items');
      this.orderWarning = true;
    } else {
      this.shopService.enableShop();
    }
  }

  stopShop(): void {
    this.shopService.disableShop();
  }

  refreshCandle(): void {
    if (this.shop.lastRefresh + 15 * 60 * 1000 > Date.now()) {
      this.showCandle = true;
      this.timeLeft = this.shop.lastRefresh + 15 * 60 * 1000 - Date.now();
      const percentLeft = this.timeLeft / (15 * 60 * 1000);
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
      this.cdr.detectChanges();
    }
  }

  private timerActive = false;
  refreshTimer(): void {
    if (this.showCandle && this.timeLeft > 0) {
      this.timerActive = true;
      this.timeLeft = this.shop.lastRefresh + 15 * 60 * 1000 - Date.now();
      if (this.timeLeft < 0) {
        this.showCandle = false;
        this.timeLeft = 0;
        return;
      }
      if (this.timeLeft < 60 * 1000 * 5 && this.shopService.getdaybreakOnline()) {
        this.refreshShop();
      }
      setTimeout(() => {
        this.refreshTimer();
      }, 1000);
      this.cdr.detectChanges();
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

  isWeapon(item: Item): boolean {
    return WeaponHelper.isWeapon(item);
  }

  isMiniature(item: Item): boolean {
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

  onFilterChange(orderFilter: OrderFilter): void {
    this.orderFilter = orderFilter;
    this.updateItemList();
  }

  updateItemList(): void {
    if (!this.shop?.items) return;
    this.populateItemDetails();
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
      if (this.orderFilter.oldschool) {
        if (!item.weaponDetails || item.weaponDetails.oldschool.toString() !== this.orderFilter.oldschool) {
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

    this.sellOrders = filteredItem.filter(si => si.orderType === OrderType.SELL);
    this.buyOrders = filteredItem.filter(si => si.orderType === OrderType.BUY);
  }
}
