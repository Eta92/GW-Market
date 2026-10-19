import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ItemOrder } from '@app/models/order.model';
import { TrackingService } from '@app/services/tracking.service';

@Component({
  selector: 'app-order-row',
  templateUrl: './order-row.component.html',
  styleUrls: ['./order-row.component.scss']
})
export class OrderRowComponent implements OnInit {
  @Input() order: ItemOrder;
  @Input() type: 'sell' | 'buy' | 'auction' = 'sell';
  @Input() hasNote = false;
  @Input() clickable = true;
  @Input() compact = false;
  @Input() focusBundle = false;
  @Input() showWeaponDetails = false;
  @Input() vote: null | 'positive' | 'negative' = null;
  @Input() voteWarning = false;

  @Output() rowClick = new EventEmitter<ItemOrder>();
  @Output() submitVote = new EventEmitter<{ order: ItemOrder; vote: 'positive' | 'negative' }>();
  @Output() leaveVote = new EventEmitter<void>();
  @Output() whisperClick = new EventEmitter<ItemOrder>();
  @Output() messageClick = new EventEmitter<ItemOrder>();

  public details = false;
  public isActive = false;

  constructor(private trackingService: TrackingService) {}

  ngOnInit(): void {
    this.isActive = !this.order.lastRefresh || Date.now() - this.order.lastRefresh < 1000 * 60 * 15;
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

  onMessage(event: Event): void {
    event.stopPropagation();
    this.messageClick.emit(this.order);
  }

  isTracked(): boolean {
    return this.trackingService.isTracked(this.order.shopId, this.order.item.name);
  }

  onTrack(event: Event): void {
    event.stopPropagation();
    this.trackingService.toggleTracking({
      senderName: this.order.player,
      senderShop: this.order.shopId,
      itemName: this.order.item.name
    });
  }

  onSubmitVote(event: Event, vote: 'positive' | 'negative'): void {
    event.stopPropagation();
    this.submitVote.emit({ order: this.order, vote });
  }
}
