import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { UtilityHelper } from '@app/helpers/utility.helper';
import { BasicItem, ShopLink } from '@app/models/shop.model';
import { ItemService } from '@app/services/item.service';
import { StoreService } from '@app/services/store.service';
import { Subscription, debounceTime } from 'rxjs';

@Component({
  selector: 'app-select-item',
  templateUrl: './select-item.component.html',
  styleUrls: ['./select-item.component.scss']
})
export class SelectItemComponent implements OnInit, OnDestroy {
  @Input() width = 600;
  @Input() height = 48;
  @Input() offsetY = 0;
  @Input() includeShop = false;

  @Output() selectItem = new EventEmitter<BasicItem>();
  @Output() selectShop = new EventEmitter<string>();

  public searchControl: UntypedFormControl = new UntypedFormControl('');
  public searchedItems: Array<BasicItem> = [];
  public searchedShops: Array<ShopLink> = [];
  public searchOpen = false;
  public manualTarget = 0;

  private itemChange: Subscription;
  private shopChange: Subscription;
  private inputChange: Subscription;

  @ViewChild('search') private searchRef: ElementRef<HTMLInputElement>;
  @ViewChild('main') private mainRef: ElementRef<HTMLElement>;

  constructor(
    private itemService: ItemService,
    private storeService: StoreService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.itemChange = this.storeService.getSearchItems().subscribe((items: Array<BasicItem>) => {
      // merge server result with basic data
      this.searchedItems = items.map(item => this.itemService.getItemBase(item.name));
      const toMatch = this.searchControl.value.toLowerCase();
      if (toMatch.length > 0) {
        this.searchedItems.forEach(item => {
          item.match = item.name.toLowerCase().indexOf(toMatch) + toMatch.length;
        });
      }
      this.cdr.detectChanges();
    });
    this.shopChange = this.storeService.getSearchShops().subscribe((shops: Array<ShopLink>) => {
      this.searchedShops = [...shops];
      const toMatch = this.searchControl.value.toLowerCase();
      if (toMatch.length > 0) {
        this.searchedShops.forEach(shop => {
          shop.match = shop.name.toLowerCase().indexOf(toMatch) + toMatch.length;
        });
      }
      this.cdr.detectChanges();
    });

    this.inputChange = this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe((value: string) => {
      if (value.length > 2) {
        this.updatePanelState(true);
        this.manualTarget = 0;
        this.storeService.requestSocket('searchItems', value);
        if (this.includeShop) {
          this.storeService.requestSocket('searchShops', value);
        } else {
          this.searchedShops = [];
        }
      } else {
        this.updatePanelState(false);
        this.searchedItems = [];
      }
    });
    this.storeService.getOverlay().subscribe(show => {
      this.searchOpen = show;
      this.cdr.detectChanges();
    });

    // Auto-focus search on load
    setTimeout(() => {
      this.searchRef?.nativeElement?.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    this.itemChange?.unsubscribe();
    this.shopChange?.unsubscribe();
  }

  updatePanelState(show: boolean): void {
    this.searchOpen = show;
    this.storeService.setOverlay(show);
  }

  manualTargeting(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      this.manualTarget++;
      if (this.manualTarget > this.searchedItems.length + this.searchedShops.length) {
        this.manualTarget = 0;
      }
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      this.manualTarget--;
      if (this.manualTarget < 0) {
        this.manualTarget = this.searchedItems.length + this.searchedShops.length;
      }
      event.preventDefault();
    } else if (event.key === 'Enter') {
      if (this.searchedItems[this.manualTarget - 1]) {
        this.onClick(this.searchedItems[this.manualTarget - 1]);
      } else if (this.searchedShops[this.manualTarget - this.searchedItems.length - 1]) {
        this.onClickShop(this.searchedShops[this.manualTarget - this.searchedItems.length - 1]);
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
      this.updatePanelState(true);
    }
  }

  onClick(item: BasicItem): void {
    this.searchControl.setValue(item.name, { emitEvent: false });
    this.selectItem.emit(item);
    this.close();
  }

  onClickShop(shop: ShopLink): void {
    this.searchControl.setValue(shop.name, { emitEvent: false });
    this.selectShop.emit(shop.publicId);
    this.close();
  }

  getImageSource(item: BasicItem): string {
    return UtilityHelper.getImage(item);
  }

  close(): void {
    this.updatePanelState(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (this.searchOpen && this.mainRef && !this.mainRef.nativeElement.contains(target)) {
      this.close();
    }
  }
}
