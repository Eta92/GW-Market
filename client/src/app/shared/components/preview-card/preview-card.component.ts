import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StatsData } from '../stats-display/stats-display.component';

@Component({
  selector: 'app-preview-card',
  templateUrl: './preview-card.component.html',
  styleUrls: ['./preview-card.component.scss']
})
export class PreviewCardComponent {
  @Input() previews: string[] = [];
  @Input() label = '';
  @Input() stats: StatsData = {};
  @Input() statsMode: 'basic' | 'combined' = 'basic';
  @Input() isSingleImage = false;
  @Input() smallLabel = false;

  @Output() cardClick = new EventEmitter<void>();

  get displayPreviews(): string[] {
    return this.previews?.slice(0, 4) || [];
  }

  onClick(): void {
    this.cardClick.emit();
  }
}
