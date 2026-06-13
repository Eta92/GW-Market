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
  @Input() favorites: string[];

  @Output() cardClick = new EventEmitter<void>();
  @Output() cardOpen = new EventEmitter<void>();
  @Output() toggleFavorite = new EventEmitter<void>();

  get displayPreviews(): string[] {
    return this.previews?.slice(0, 4).map(preview => preview.replace(/ /g, '_')) || [];
  }

  onClick(): void {
    this.cardClick.emit();
  }

  onMiddle(): void {
    this.cardOpen.emit();
  }

  onFavoriteToggle(evt: MouseEvent): void {
    this.toggleFavorite.emit();
    evt.stopPropagation();
  }

  isFavorite(): boolean {
    return this.favorites?.includes(this.label);
  }
}
