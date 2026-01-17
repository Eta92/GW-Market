import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Item } from '@app/models/shop.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() showSearch = true;
  @Input() showFeatures = false;
  @Input() compact = false;
  @Input() hero = false;

  @Output() placeOrder = new EventEmitter<void>();
  @Output() selectItem = new EventEmitter<Item>();

  constructor(private router: Router) {}

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToShop(): void {
    this.router.navigate(['/shop']);
  }

  onSelectItem(item: Item): void {
    this.selectItem.emit(item);
    this.router.navigate(['/item', item.name]);
  }

  onPlaceOrder(): void {
    this.placeOrder.emit();
  }
}
