import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { Item, ShopItem } from '@app/models/shop.model';

@Component({
  selector: 'app-new-order',
  templateUrl: './new-order.component.html',
  styleUrls: ['./new-order.component.scss']
})
export class NewOrderComponent {
  @Input() preselect?: Item;
  @Input() warning? = false;
  @Output() createOrder = new EventEmitter<ShopItem>();

  public orderOpen = false;

  constructor(private fb: UntypedFormBuilder) {}

  onCreateOrder(order: ShopItem): void {
    this.createOrder.emit(order);
    this.orderOpen = false;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key.toLowerCase() === 'm') {
      event.preventDefault(); // stops browser behavior
      this.orderOpen = true;
    }
  }
}
