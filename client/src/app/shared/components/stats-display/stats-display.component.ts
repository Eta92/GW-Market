import { Component, Input } from '@angular/core';

export interface StatsData {
  sellCount?: number;
  buyCount?: number;
  sellOnline?: number;
  buyOnline?: number;
  sellToday?: number;
  buyToday?: number;
  sellWeek?: number;
  buyWeek?: number;
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
