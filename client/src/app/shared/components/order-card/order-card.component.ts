import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OrderType, ShopItem } from '@app/models/shop.model';

@Component({
  selector: 'app-order-card',
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.scss']
})
export class OrderCardComponent {
  @Input() locked = false;
  @Input() order: ShopItem;
  @Input() priceLabel: 'ASKING' | 'PAYING' = 'ASKING';
  @Input() imageSource = '';

  get isSelling(): boolean {
    return this.order?.orderType === OrderType.SELL;
  }

  @Output() itemClick = new EventEmitter<string>();
  @Output() editClick = new EventEmitter<ShopItem>();
  @Output() hideClick = new EventEmitter<ShopItem>();
  @Output() completeClick = new EventEmitter<ShopItem>();
  @Output() completeLeave = new EventEmitter<ShopItem>();
  @Output() removeClick = new EventEmitter<ShopItem>();

  get completeTitle(): string {
    return this.priceLabel === 'ASKING' ? 'Mark as Sold' : 'Mark as Bought';
  }

  onItemClick(): void {
    this.itemClick.emit(this.order.name);
  }

  onEditClick(): void {
    this.editClick.emit(this.order);
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
}
