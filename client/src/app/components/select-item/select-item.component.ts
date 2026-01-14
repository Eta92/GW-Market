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
import { Subscription, debounceTime } from 'rxjs';
import { SelectHelper, SelectPosition } from '../../helpers/select.helper';
import { Item } from '@app/models/shop.model';
import { StoreService } from '@app/services/store.service';
import { UtilityHelper } from '@app/helpers/utility.helper';

@Component({
  selector: 'app-select-item',
  templateUrl: './select-item.component.html',
  styleUrls: ['./select-item.component.scss']
})
export class SelectItemComponent implements OnInit, OnDestroy {
  @Input() width = 800;
  @Input() height = 160;
  @Input() offsetY = 0;

  @Output() selectItem = new EventEmitter<Item>();

  public searchControl: UntypedFormControl = new UntypedFormControl('');
  public searchedItems: Array<Item> = [];
  public searchOpen = false;
  public manualTarget = 0;

  public position: SelectPosition = SelectHelper.getDefaultPosition();
  public inputSize = 0;
  private itemChange: Subscription;
  private inputChange: Subscription;

  @ViewChild('main') private mainRef: ElementRef<HTMLElement>;
  @ViewChild('search') private searchRef: ElementRef<HTMLElement>;

  constructor(
    private storeService: StoreService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.itemChange = this.storeService.getSearchItems().subscribe((items: Array<Item>) => {
      this.searchedItems = items;
      this.position = SelectHelper.getSelectPosition(this.mainRef.nativeElement, this.searchedItems.length * 48);
      const toMatch = this.searchControl.value.toLowerCase();
      this.searchedItems.forEach(item => {
        item.match = item.name.toLowerCase().indexOf(toMatch) + toMatch.length;
      });
      this.inputSize = this.searchRef.nativeElement.clientWidth + 88;
      this.cdr.detectChanges();
    });
    this.inputChange = this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe((value: string) => {
      if (value.length > 2) {
        console.log('send', value);
        this.searchOpen = true;
        this.manualTarget = 0;
        this.storeService.requestSocket('searchItems', value);
      } else {
        this.searchOpen = false;
        this.searchedItems = [];
      }
    });
    setTimeout(() => {
      this.searchRef.nativeElement.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    this.itemChange?.unsubscribe();
    this.inputChange?.unsubscribe();
  }

  canEdit(): boolean {
    return this.searchControl.enabled;
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
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.position = SelectHelper.getSelectPosition(this.mainRef.nativeElement, this.searchedItems.length * 48);
  }

  inputClick(): void {
    this.position = SelectHelper.getSelectPosition(this.mainRef.nativeElement, this.searchedItems.length * 48);
    this.searchOpen = true;
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
