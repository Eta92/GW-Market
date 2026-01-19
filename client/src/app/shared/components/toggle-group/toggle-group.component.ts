import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface ToggleOption {
  value: any;
  label: string;
  icon?: string;
  activeIcon?: string;
  imgSrc?: string;
  styleClass?: string;
}

@Component({
  selector: 'app-toggle-group',
  templateUrl: './toggle-group.component.html',
  styleUrls: ['./toggle-group.component.scss']
})
export class ToggleGroupComponent {
  @Input() options: ToggleOption[] = [];
  @Input() value: any = null;
  @Input() styleClass = '';

  @Output() valueChange = new EventEmitter<any>();

  isSelected(optionValue: any): boolean {
    return this.value === optionValue;
  }

  select(optionValue: any): void {
    this.value = optionValue;
    this.valueChange.emit(optionValue);
  }

  getIcon(option: ToggleOption): string {
    if (this.isSelected(option.value) && option.activeIcon) {
      return option.activeIcon;
    }
    return option.icon || '';
  }
}
