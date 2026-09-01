import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { ATTRIBUTE_COLOR_MAP } from '@shared/constants/weapon-attributes';

@Component({
  selector: 'app-attribute-dropdown',
  templateUrl: './attribute-dropdown.component.html',
  styleUrls: ['./attribute-dropdown.component.scss'],
})
export class AttributeDropdownComponent {
  @Input() options: ReadonlyArray<string> = [];
  @Input() selectedValue: string | null = null;
  @Input() placeholder = 'Select...';

  @Output() valueChange = new EventEmitter<string | null>();

  isOpen = false;
  filterValue = '';

  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef<HTMLInputElement>;

  get filteredOptions(): ReadonlyArray<string> {
    const query = this.filterValue.toLowerCase().trim();
    if (!query) return this.options;
    return this.options.filter((opt) => opt.toLowerCase().includes(query));
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isOpen = false;
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    if (!this.isOpen) {
      this.filterValue = '';
    }
    this.isOpen = !this.isOpen;
    // Auto-focus search input when opening
    if (this.isOpen) {
      setTimeout(() => this.searchInput?.nativeElement?.focus(), 0);
    }
  }

  selectOption(value: string | null, event: Event): void {
    event.stopPropagation();
    this.selectedValue = value;
    this.valueChange.emit(value);
    this.isOpen = false;
  }

  optionColorFor(value: string): string | null {
    return ATTRIBUTE_COLOR_MAP[value] || '#FFFFFF';
  }

  selectedColor(): string | null {
    return this.selectedValue ? this.optionColorFor(this.selectedValue) : null;
  }

  clearFilter(event: Event): void {
    event.stopPropagation();
    this.filterValue = '';
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 0);
  }
}
