import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Message, MessageType } from '@app/models/message.model';
import { Item, OrderType, Shop } from '@app/models/shop.model';
import { MessageService } from '@app/services/message.service';
import { ShopService } from '@app/services/shop.service';
import { ToggleOption } from '@shared/components/toggle-group/toggle-group.component';

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
  public messageOpen = false;
  public messages: Array<Message>;
  public filteredMessages: Array<Message>;
  public unreadMessages = 0;

  public readOption: 'all' | 'unread' = 'all';
  public readOptions: ToggleOption[] = [
    { value: 'all', label: 'All', icon: 'fa-envelope', styleClass: '' },
    { value: 'unread', label: 'Unread', icon: 'fa-circle-exclamation', styleClass: '' }
  ];

  public messageOption: 'all' | 'message' | 'reputation' | 'auction' = 'all';
  public messageOptions: ToggleOption[] = [
    { value: 'all', label: 'All', icon: 'fa-envelope', styleClass: '' },
    { value: 'message', label: 'DM', icon: 'fa-user', styleClass: '' },
    { value: 'reputation', label: 'Reputation', icon: 'fa-thumbs-up', styleClass: '' },
    { value: 'auction', label: 'Auction', icon: 'fa-gavel', styleClass: '' }
  ];

  constructor(
    private router: Router,
    private shopService: ShopService,
    private messageService: MessageService,
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
    this.messageService.getMessages().subscribe(messages => {
      this.messages = messages;
      this.unreadMessages = messages.filter(message => !message.read).length;
      this.filterMessages();
      this.cdr.detectChanges();
    });
  }

  // navigation

  goToHome(): void {
    this.router.navigate(['/']);
    this.homeClick.emit();
  }

  openToHome(): void {
    const url = this.router.serializeUrl(this.router.createUrlTree(['/']));
    window.open(url, '_blank');
  }

  goToShop(): void {
    this.router.navigate(['/shop']);
  }

  openToShop(): void {
    const url = this.router.serializeUrl(this.router.createUrlTree(['/shop']));
    window.open(url, '_blank');
  }

  goToSearch(): void {
    this.router.navigate(['/search']);
  }

  onSelectItem(item: Item): void {
    this.selectItem.emit(item);
    this.router.navigate(['/item', item.name]);
  }

  onSelectShop(shop: string): void {
    this.router.navigate(['/shop/showcase'], { queryParams: { public: shop } });
  }

  // order

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

  // shop widget

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

  // message widget

  public openMessages(): void {
    this.messageOpen = !this.messageOpen;
  }

  public setReadOption(option: 'all' | 'unread'): void {
    this.readOption = option;
    this.filterMessages();
  }

  public setMessageOption(option: 'all' | 'message' | 'reputation' | 'auction'): void {
    this.messageOption = option;
    this.filterMessages();
  }

  private filterMessages(): void {
    this.filteredMessages = this.messages
      .sort((a, b) => b.time - a.time)
      .filter(message => {
        if (this.readOption === 'unread' && message.read) {
          return false;
        }
        if (
          this.messageOption === 'message' &&
          ![MessageType.MEETUP_AT, MessageType.MEETUP_OVER, MessageType.NEGOCIATE].includes(message.type)
        ) {
          return false;
        }
        if (this.messageOption === 'reputation' && ![MessageType.REPUTATION_UP, MessageType.REPUTATION_DOWN].includes(message.type)) {
          return false;
        }
        if (
          this.messageOption === 'auction' &&
          ![
            MessageType.AUCTION_WON,
            MessageType.AUCTION_LOST,
            MessageType.AUCTION_OUTBID,
            MessageType.AUCTION_END,
            MessageType.AUCTION_FAIL
          ].includes(message.type)
        ) {
          return false;
        }
        return true;
      });
  }

  public onReadMessage(message: Message): void {
    if (!message.read) {
      this.messageService.readMessage(this.shop, message);
    }
  }

  public onDeleteMessage(message: Message): void {
    this.messageService.deleteMessage(this.shop, message);
    this.filterMessages();
  }
}
