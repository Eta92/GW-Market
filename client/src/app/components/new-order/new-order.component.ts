import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Item, ShopItem } from '@app/models/shop.model';

@Component({
  selector: 'app-new-order',
  templateUrl: './new-order.component.html',
  styleUrls: ['./new-order.component.scss']
})
export class NewOrderComponent {
  @Input() preselect?: Item;
  @Input() warning? = false;
  @Input() orderOpen = false;
  @Output() createOrder = new EventEmitter<ShopItem>();
  @Output() closeOrder = new EventEmitter<void>();

  constructor() {}

  onCreateOrder(order: ShopItem): void {
    this.createOrder.emit(order);
    this.orderOpen = false;
    this.closeOrder.emit();
  }

  onClose(): void {
    this.orderOpen = false;
    this.closeOrder.emit();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key.toLowerCase() === 'm') {
      event.preventDefault(); // stops browser behavior
      this.orderOpen = true;
    }
  }
}
