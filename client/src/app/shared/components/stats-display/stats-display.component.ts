import { Component, Input } from '@angular/core';

export interface StatsData {
  sellCount?: number;
  buyCount?: number;
  auctionCount?: number;
  sellNow?: number;
  buyNow?: number;
  auctionNow?: number;
  sellDay?: number;
  buyDay?: number;
  auctionDay?: number;
  sellWeek?: number;
  buyWeek?: number;
  auctionWeek?: number;
}

@Component({
  selector: 'app-stats-display',
  templateUrl: './stats-display.component.html',
  styleUrls: ['./stats-display.component.scss']
})
export class StatsDisplayComponent {
  @Input() mode: 'basic' | 'combined' = 'basic';
  @Input() stats: StatsData = {};
  @Input() containerClass = 'card-stats';
}
