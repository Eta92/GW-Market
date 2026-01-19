import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UtilityHelper } from '@app/helpers/utility.helper';
import { ItemOrder } from '@app/models/order.model';

@Component({
  selector: 'app-order-row',
  templateUrl: './order-row.component.html',
  styleUrls: ['./order-row.component.scss']
})
export class OrderRowComponent {
  @Input() order: ItemOrder;
  @Input() type: 'sell' | 'buy' = 'sell';
  @Input() hasNote = false;
  @Input() clickable = true;
  @Input() compact = false;
  @Input() showWeaponDetails = false;

  @Output() rowClick = new EventEmitter<ItemOrder>();
  @Output() whisperClick = new EventEmitter<ItemOrder>();

  get fade(): string {
    return UtilityHelper.getOldOpacity(this.order);
  }

  onClick(): void {
    if (this.clickable) {
      this.rowClick.emit(this.order);
    }
  }

  onWhisper(event: Event): void {
    event.stopPropagation();
    this.whisperClick.emit(this.order);
  }
}
