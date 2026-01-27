import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Price } from '@app/models/shop.model';

export interface CurrencyOption {
  value: Price;
  name: string;
}

@Component({
  selector: 'app-currency-dropdown',
  templateUrl: './currency-dropdown.component.html',
  styleUrls: ['./currency-dropdown.component.scss']
})
export class CurrencyDropdownComponent {
  @Input() selectedCurrency: Price = Price.PLAT;
  @Output() currencyChange = new EventEmitter<Price>();

  isOpen = false;
  Price = Price;

  currencies: CurrencyOption[] = [
    { value: Price.PLAT, name: 'Platinum' },
    { value: Price.ECTO, name: 'Ectoplasm' },
    { value: Price.ZKEY, name: 'Zaishen Key' },
    { value: Price.ARM, name: 'Armbraces' },
    { value: Price.BD, name: 'Black Dye' }
  ];

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isOpen = false;
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  selectCurrency(currency: Price, event: Event): void {
    event.stopPropagation();
    this.selectedCurrency = currency;
    this.currencyChange.emit(currency);
    this.isOpen = false;
  }
}
