import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormArray, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Item, OrderType, Price, ShopItem } from '@app/models/shop.model';
import { AvailableTree } from '@app/models/tree.model';
import { ItemService } from '@app/services/item.service';
import { StoreService } from '@app/services/store.service';
import { ToggleOption } from '@app/shared/components/toggle-group/toggle-group.component';
import { ToastrService } from 'ngx-toastr';
import { Subscription, take } from 'rxjs';

@Component({
  selector: 'app-edit-many',
  templateUrl: './edit-many.component.html',
  styleUrls: ['./edit-many.component.scss']
})
export class EditManyComponent implements OnInit, OnChanges, OnDestroy {
  @Input() originals?: Array<ShopItem>;
  @Input() daybreaks?: Array<any>;
  @Input() confirm: string;

  @Output() closeEdit = new EventEmitter<void>();
  @Output() confirmOrders = new EventEmitter<Array<ShopItem>>();

  public forms: UntypedFormArray;
  public bindPrices: Array<Subscription> = [];

  public allItems: AvailableTree;
  public OrderType = OrderType;
  public Price = Price;

  public visibilityOptions: ToggleOption[] = [
    { value: false, label: 'Visible', icon: 'fa-eye' },
    { value: true, label: 'Hidden', icon: 'fa-eye-slash' }
  ];
  public availablePrices: Array<{ type: Price; label: string; icon: number; active: boolean }> = [
    { type: Price.PLAT, label: 'Plat', icon: 0, active: true },
    { type: Price.ECTO, label: 'Ecto', icon: 1, active: true },
    { type: Price.ZKEY, label: 'ZKey', icon: 2, active: false },
    { type: Price.ARM, label: 'Arm', icon: 3, active: false },
    { type: Price.BD, label: 'BD', icon: 4, active: false }
  ];
  public items: Array<Item> = [];

  constructor(
    private fb: UntypedFormBuilder,
    private storeService: StoreService,
    private itemService: ItemService,
    private toastrService: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const prices = this.fb.array([
      this.fb.group({ type: [Price.PLAT], price: [0, Validators.min(0)], unit: [0, Validators.min(0)] })
    ]);
    this.forms = this.fb.array([]);
    if (this.originals) {
      this.loadOrders(this.originals);
    }
    // if (this.daybreaks) {
    //   this.loadDaybreaks(this.daybreaks);
    // }
    this.itemService
      .getAvailableTree()
      .pipe(take(1))
      .subscribe((tree: AvailableTree) => {
        this.allItems = tree;
        if (this.originals) {
          this.loadOrders(this.originals);
        }
      });
    this.refreshBindPrices();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.originals && this.originals && this.forms) {
      this.loadOrders(this.originals);
    }
  }

  loadOrders(orders: Array<ShopItem>): void {
    this.items = orders
      .map(order => order.name)
      .map(name => this.itemService.getItemBase(name))
      .filter(item => item !== null) as Array<Item>;
    const orderArray = orders.map(order => {
      const prices = this.availablePrices.map(p => {
        const existingPrice = order.prices.find(op => op.type === p.type);
        return this.fb.group({
          type: [existingPrice?.type || p.type, Validators.required],
          price: [existingPrice?.price || 0, Validators.min(0)],
          unit: [existingPrice?.unit || 0, Validators.min(0)]
        });
      });
      return this.fb.group({
        name: [order.name, Validators.required],
        orderType: [order.orderType, Validators.required],
        hidden: [order.hidden],
        prices: this.fb.array(prices),
        quantity: [order.quantity, Validators.min(1)],
        description: [order.description]
      });
    });
    this.forms = this.fb.array(orderArray);
    this.refreshBindPrices();
  }

  getImageSource(itemName: string): string {
    return this.itemService?.getItemImage(itemName) || '';
  }

  togglePrice(activePrice: any): void {
    activePrice.active = !activePrice.active;
    this.cdr.detectChanges();
  }

  refreshBindPrices(): void {
    this.bindPrices.forEach(sub => sub.unsubscribe());
    this.bindPrices = [];
    this.formGroups.forEach((formGroup, formIndex) => {
      (formGroup.get('prices') as FormArray).controls.forEach((group, index) => {
        const toUnit = group.get('price')?.valueChanges.subscribe(value => {
          const amount = formGroup.get('quantity')?.value || 1;
          group.get('unit')?.setValue(value / amount, { emitEvent: false });
        });
        this.bindPrices.push(toUnit);
        const toPrice = group.get('unit')?.valueChanges.subscribe(value => {
          const amount = formGroup.get('quantity')?.value || 1;
          group.get('price')?.setValue(value * amount, { emitEvent: false });
        });
        this.bindPrices.push(toPrice);
      });
      const toAllPrices = formGroup.get('quantity')?.valueChanges.subscribe(qty => {
        (formGroup.get('prices') as FormArray).controls.forEach(group => {
          const unit = group.get('unit')?.value || 0;
          //const price = group.get('price')?.value || 0;
          group.get('price')?.setValue(Math.round(unit * qty), { emitEvent: false });
        });
      });
      this.bindPrices.push(toAllPrices);
    });
  }

  cancelOrder(): void {
    this.resetForms();
    this.closeEdit.emit();
  }

  validateOrders(): void {
    const orders = this.forms.value as Array<ShopItem>;
    if (this.forms.invalid) {
      this.toastrService.warning('Please check up the value fields', 'Form is invalid');
    } else {
      orders.forEach((order, index) => {
        order.prices = order.prices.filter(p => p.price > 0);
      });
      this.confirmOrders.emit(orders);
      this.resetForms();
      this.refreshBindPrices();
    }
  }

  ngOnDestroy(): void {
    this.resetForms();
    this.bindPrices.forEach(sub => sub.unsubscribe());
  }

  resetForms(): void {
    this.bindPrices.forEach(sub => sub.unsubscribe());
    this.bindPrices = [];
    this.forms = this.fb.array([]);
  }

  getFormPrices(formGroup: UntypedFormGroup): FormArray {
    return formGroup.get('prices') as FormArray;
  }

  get activePrices(): Array<{ type: Price; label: string; icon: number; active: boolean }> {
    return this.availablePrices.filter(p => p.active);
  }

  get formGroups(): Array<UntypedFormGroup> {
    return this.forms.controls as Array<UntypedFormGroup>;
  }

  get gridColumns(): string {
    const cols: string[] = [];

    // Item search
    cols.push('32px');
    cols.push('3fr');

    // Qty
    cols.push('1fr');

    // For each price row: currency + unit + total + remove
    const priceCount = this.activePrices.length;
    for (let i = 0; i < priceCount; i++) {
      cols.push('1fr'); // per unit
      cols.push('1fr'); // total
    }

    // Type
    cols.push('2fr');

    // Visibility
    cols.push('2fr');

    // Notes
    cols.push('3fr');

    return cols.join(' ');
  }
}
