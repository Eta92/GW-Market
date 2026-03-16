import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Auction } from '@app/models/auction.model';
import { OrderType, ShopItem } from '@app/models/shop.model';

@Component({
  selector: 'app-order-card',
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.scss']
})
export class OrderCardComponent {
  @Input() locked = false;
  @Input() compact = false;
  @Input() showDetails = true;
  @Input() order: ShopItem;
  @Input() auction?: Auction;
  @Input() priceLabel: 'ASKING' | 'PAYING' = 'ASKING';
  @Input() imageSource = '';

  menuOpen = false;

  constructor(private elementRef: ElementRef) {}

  get isSelling(): boolean {
    return this.order?.orderType === OrderType.SELL;
  }

  get isSingleRemoval(): boolean {
    return this.order?.quantity > 1 && this.order?.prices.every(price => price.unit % 1 === 0);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Only close if click is outside this component
    if (this.menuOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.menuOpen = false;
    }
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  @Output() itemClick = new EventEmitter<string>();
  @Output() editClick = new EventEmitter<ShopItem>();
  @Output() auctionClick = new EventEmitter<Auction>();
  @Output() hideClick = new EventEmitter<ShopItem>();
  @Output() singleClick = new EventEmitter<ShopItem>();
  @Output() singleLeave = new EventEmitter<ShopItem>();
  @Output() completeClick = new EventEmitter<ShopItem>();
  @Output() completeLeave = new EventEmitter<ShopItem>();
  @Output() removeClick = new EventEmitter<ShopItem>();
  @Output() removeLeave = new EventEmitter<ShopItem>();
  @Output() cloturateClick = new EventEmitter<Auction>();
  @Output() cloturateLeave = new EventEmitter<Auction>();

  get completeTitle(): string {
    return this.priceLabel === 'ASKING' ? 'Mark as Sold' : 'Mark as Bought';
  }

  onItemClick(): void {
    this.itemClick.emit(this.order.name);
  }

  onEditClick(): void {
    this.editClick.emit(this.order);
  }

  onAuctionClick(): void {
    this.auctionClick.emit(this.auction);
  }

  onHideClick(): void {
    this.hideClick.emit(this.order);
  }

  onCompleteClick(): void {
    this.completeClick.emit(this.order);
  }

  onCompleteLeave(): void {
    this.completeLeave.emit(this.order);
  }

  onRemoveClick(): void {
    this.removeClick.emit(this.order);
  }

  onRemoveLeave(): void {
    this.removeLeave.emit(this.order);
  }

  onSingleClick(): void {
    this.singleClick.emit(this.order);
  }

  onSingleLeave(): void {
    this.singleLeave.emit(this.order);
  }

  onCloturateClick(): void {
    this.cloturateClick.emit(this.auction);
  }

  onCloturateLeave(): void {
    this.cloturateLeave.emit(this.auction);
  }
}
