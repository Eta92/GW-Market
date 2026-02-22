import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Item, OrderType, Shop } from '@app/models/shop.model';
import { ShopService } from '@app/services/shop.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Input() showSearch = true;
  @Input() showFeatures = false;
  @Input() compact = false;
  @Input() hero = false;

  @Output() homeClick = new EventEmitter<void>();
  @Output() placeOrder = new EventEmitter<void>();
  @Output() selectItem = new EventEmitter<Item>();

  public shop: Shop;
  public orderOpen = false;

  constructor(
    private router: Router,
    private shopService: ShopService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.shopService.getActiveShop().subscribe(shop => {
      this.shop = shop;
      if (this.shop && this.shop.lastRefresh && !this.timerActive) {
        this.timeLeft = this.shop.lastRefresh + 15 * 60 * 1000 - Date.now();
        this.refreshTimer();
      }
    });
  }

  goToHome(): void {
    this.router.navigate(['/']);
    this.homeClick.emit();
  }

  goToShop(): void {
    this.router.navigate(['/shop']);
  }

  goToSearch(): void {
    this.router.navigate(['/search']);
  }

  onSelectItem(item: Item): void {
    this.selectItem.emit(item);
    this.router.navigate(['/item', item.name]);
  }

  onPlaceOrder(): void {
    if (this.router.url.includes('/item/')) {
      this.placeOrder.emit();
    } else {
      this.orderOpen = true;
    }
  }

  onCreateOrder(order): void {
    if (order.orderType !== OrderType.AUCTION) {
      this.shopService.addShopItem(order);
    } else {
      this.shopService.addAuctionItem(order);
    }
    this.router.navigate(['shop']);
  }

  refreshShop(): void {
    this.shopService.enableShop();
  }

  private timerActive = false;
  public timeLeft = 0;
  refreshTimer(): void {
    if (this.timeLeft > 0) {
      this.timerActive = true;
      this.timeLeft = this.shop.lastRefresh + 15 * 60 * 1000 - Date.now();
      if (this.timeLeft < 0) {
        this.timeLeft = 0;
        return;
      }
      setTimeout(() => {
        this.refreshTimer();
      }, 1000);
      this.cdr.detectChanges();
    }
  }
}
