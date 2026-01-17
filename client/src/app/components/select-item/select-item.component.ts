import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Subscription, debounceTime } from 'rxjs';
import { Item } from '@app/models/shop.model';
import { StoreService } from '@app/services/store.service';
import { UtilityHelper } from '@app/helpers/utility.helper';

@Component({
  selector: 'app-select-item',
  templateUrl: './select-item.component.html',
  styleUrls: ['./select-item.component.scss']
})
export class SelectItemComponent implements OnInit, OnDestroy {
  @Input() width = 600;
  @Input() height = 48;
  @Input() offsetY = 0;

  @Output() selectItem = new EventEmitter<Item>();

  public searchControl: UntypedFormControl = new UntypedFormControl('');
  public searchedItems: Array<Item> = [];
  public searchOpen = false;
  public manualTarget = 0;

  private itemChange: Subscription;
  private inputChange: Subscription;

  @ViewChild('search') private searchRef: ElementRef<HTMLInputElement>;

  constructor(
    private storeService: StoreService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.itemChange = this.storeService.getSearchItems().subscribe((items: Array<Item>) => {
      this.searchedItems = items;
      const toMatch = this.searchControl.value.toLowerCase();
      this.searchedItems.forEach(item => {
        item.match = item.name.toLowerCase().indexOf(toMatch) + toMatch.length;
      });
      this.cdr.detectChanges();
    });

    this.inputChange = this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe((value: string) => {
      if (value.length > 2) {
        this.searchOpen = true;
        this.manualTarget = 0;
        this.storeService.requestSocket('searchItems', value);
      } else {
        this.searchOpen = false;
        this.searchedItems = [];
      }
    });

    // Auto-focus search on load
    setTimeout(() => {
      this.searchRef?.nativeElement?.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    this.itemChange?.unsubscribe();
    this.inputChange?.unsubscribe();
  }

  manualTargeting(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      this.manualTarget++;
      if (this.manualTarget > this.searchedItems.length) {
        this.manualTarget = 0;
      }
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      this.manualTarget--;
      if (this.manualTarget < 0) {
        this.manualTarget = this.searchedItems.length;
      }
      event.preventDefault();
    } else if (event.key === 'Enter') {
      if (this.searchedItems[this.manualTarget - 1]) {
        this.onClick(this.searchedItems[this.manualTarget - 1]);
      } else if (this.searchedItems[0]) {
        this.onClick(this.searchedItems[0]);
      }
      event.preventDefault();
    } else if (event.key === 'Escape') {
      this.close();
      event.preventDefault();
    }
  }

  inputClick(): void {
    if (this.searchedItems.length > 0) {
      this.searchOpen = true;
    }
  }

  onClick(item: Item): void {
    this.searchControl.setValue(item.name, { emitEvent: false });
    this.selectItem.emit(item);
    this.close();
  }

  getImageSource(item: Item): string {
    return UtilityHelper.getImage(item);
  }

  close(): void {
    this.searchOpen = false;
  }
}
