import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Price, Upgrade } from '@app/models/shop.model';

export interface CurrencyOption {
  value: Price;
  name: string;
}

@Component({
  selector: 'app-upgrade-dropdown',
  templateUrl: './upgrade-dropdown.component.html',
  styleUrls: ['./upgrade-dropdown.component.scss']
})
export class UpgradeDropdownComponent {
  @Input() selectedUpgrade: string = '';
  @Input() upgradeOptions: Array<Upgrade> = [];
  @Output() upgradeChange = new EventEmitter<string>();

  isOpen = false;
  Price = Price;

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isOpen = false;
  }

  fullUpgrade(): Upgrade {
    return this.upgradeOptions.find(upg => upg.value === this.selectedUpgrade);
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  selectUpgrade(upgrade: Upgrade, event: Event): void {
    event.stopPropagation();
    this.selectedUpgrade = upgrade?.value || '';
    this.upgradeChange.emit(upgrade?.value || '');
    this.isOpen = false;
  }
}
