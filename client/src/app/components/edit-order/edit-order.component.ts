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
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { UtilityHelper } from '@app/helpers/utility.helper';
import { WeaponHelper } from '@app/helpers/weapon.helper';
import { Item, OrderType, Price, ShopItem } from '@app/models/shop.model';
import { AvailableTree } from '@app/models/tree.model';
import { ItemService } from '@app/services/item.service';
import { StoreService } from '@app/services/store.service';
import { LOCKED_WEAPON, VARIABLE_ATTRIBUTE } from '@app/shared/constants/weapon-attributes';
import { ToggleOption } from '@app/shared/components/toggle-group/toggle-group.component';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-order',
  templateUrl: './edit-order.component.html',
  styleUrls: ['./edit-order.component.scss']
})
export class EditOrderComponent implements OnInit, OnChanges, OnDestroy {
  @Input() preselect?: Item;
  @Input() original?: ShopItem;
  @Input() maskSearch = false;
  @Input() confirm: string;

  @Output() closeEdit = new EventEmitter<void>();
  @Output() confirmOrder = new EventEmitter<ShopItem>();

  public form: UntypedFormGroup;
  public formWeapon: UntypedFormGroup;
  public formOther: UntypedFormGroup;
  public item: Item;
  public bindPrices: Array<Subscription> = [];

  public allItems: AvailableTree;
  public OrderType = OrderType;
  public Price = Price;
  public isMiniature = false;
  public isAdvanced = false;
  // weapons
  public isWeapon = false;
  public isLocked = true;
  public attributes = VARIABLE_ATTRIBUTE;
  public lockWeapons = LOCKED_WEAPON;
  public weaponLists: { core: Array<string>; prefix: Array<string>; suffix: Array<string> } = {
    core: [],
    prefix: [],
    suffix: []
  };

  public visibilityOptions: ToggleOption[] = [
    { value: false, label: 'Visible', icon: 'fa-eye' },
    { value: true, label: 'Hidden', icon: 'fa-eye-slash' }
  ];

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
    this.form = this.fb.group({
      name: [this.preselect ? this.preselect.name : ''],
      orderType: [OrderType.SELL],
      hidden: [false],
      prices: prices,
      quantity: [1, Validators.min(1)],
      description: ['']
    });
    this.formWeapon = this.fb.group({
      attribute: ['any', Validators.required],
      requirement: [9, [Validators.min(0), Validators.max(13)]],
      inscription: [true],
      oldschool: [false],
      core: [null],
      prefix: [null],
      suffix: [null]
    });
    this.formOther = this.fb.group({
      dedicated: [false],
      legacy: [false],
      pre: [false]
    });
    if (this.original) {
      this.loadOrder(this.original);
    }
    this.storeService.getItemDetails().subscribe((item: Item) => {
      this.item = item;
      this.cdr.detectChanges();
    });
    this.itemService.getAvailableTree().subscribe((tree: AvailableTree) => {
      this.allItems = tree;
      if (this.original) {
        this.loadOrder(this.original);
      }
    });
    this.refreshBindPrices();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['original'] && this.original && this.form) {
      this.loadOrder(this.original);
    }
    if (changes['preselect'] && this.preselect) {
      this.item = this.preselect;
      if (this.form) {
        this.form.patchValue({ name: this.preselect.name });
      }
    }
  }

  loadOrder(order: ShopItem): void {
    while (this.getprices()?.value.length < order.prices.length) {
      this.getprices().push(
        this.fb.group({ type: [Price.PLAT], price: [0, Validators.min(0)], unit: [0, Validators.min(0)] })
      );
    }
    order.item = this.itemService.getItemBase(order.name);
    this.form.patchValue(order);
    this.formOther.patchValue(order.orderDetails || {});
    this.isMiniature = WeaponHelper.isMiniature(order.item);
    if (WeaponHelper.isWeapon(order.item) && this.allItems) {
      this.isWeapon = true;
      this.isLocked = LOCKED_WEAPON.includes(order.item.category);
      this.weaponLists = WeaponHelper.getItemList(order.item, this.allItems);
      this.formWeapon.patchValue(order.weaponDetails || {});
    }
    this.storeService.requestSocket('getItemDetails', order.name);
  }

  onSelectItem(item: Item): void {
    this.item = item;
    this.form.patchValue({ name: item.name });
    // Reset flags for new item
    this.isWeapon = false;
    this.isMiniature = false;
    // Set weapon flag if applicable
    if (WeaponHelper.isWeapon(item)) {
      this.isWeapon = true;
      this.isLocked = LOCKED_WEAPON.includes(item.category);
      this.weaponLists = WeaponHelper.getItemList(item, this.allItems);
    }
    // Set miniature flag if applicable
    this.isMiniature = WeaponHelper.isMiniature(item);
  }

  getImageSource(item: Item): string {
    return UtilityHelper.getImage(item);
  }

  selectCurrency(index: number, currency: Price): void {
    this.getprices().at(index).patchValue({ type: currency });
  }

  getprices(): UntypedFormArray {
    return this.form.get('prices') as UntypedFormArray;
  }

  addPrice(): void {
    this.getprices().push(
      this.fb.group({ type: [Price.PLAT], price: [0, Validators.min(0)], unit: [0, Validators.min(0)] })
    );
    this.refreshBindPrices();
  }

  removePrice(index: number): void {
    this.getprices().removeAt(index);
    this.refreshBindPrices();
  }

  incrementQty(): void {
    const current = this.form.get('quantity')?.value || 1;
    this.form.patchValue({ quantity: current + 1 });
  }

  decrementQty(): void {
    const current = this.form.get('quantity')?.value || 1;
    if (current > 1) {
      this.form.patchValue({ quantity: current - 1 });
    }
  }

  refreshBindPrices(): void {
    this.bindPrices.forEach(sub => sub.unsubscribe());
    this.bindPrices = [];
    this.getprices().controls.forEach((group, index) => {
      const toUnit = group.get('price')?.valueChanges.subscribe(value => {
        const amount = this.form.get('quantity')?.value || 1;
        group.get('unit')?.setValue(value / amount, { emitEvent: false });
      });
      this.bindPrices.push(toUnit);
      const toPrice = group.get('unit')?.valueChanges.subscribe(value => {
        const amount = this.form.get('quantity')?.value || 1;
        group.get('price')?.setValue(value * amount, { emitEvent: false });
      });
      this.bindPrices.push(toPrice);
    });
    const toAllPrices = this.form.get('quantity')?.valueChanges.subscribe(qty => {
      this.getprices().controls.forEach(group => {
        const unit = group.get('unit')?.value || 0;
        //const price = group.get('price')?.value || 0;
        group.get('price')?.setValue(Math.round(unit * qty), { emitEvent: false });
      });
    });
    this.bindPrices.push(toAllPrices);
  }

  cancelOrder(): void {
    this.resetForms();
    this.closeEdit.emit();
  }

  validateOrder(): void {
    const order = this.form.value as ShopItem;
    if (this.form.invalid || (this.isWeapon && this.formWeapon.invalid)) {
      this.toastrService.warning('Please check up the value fields', 'Form is invalid');
    } else if (order.name === '') {
      this.toastrService.error('Please first chose an item in the search bar', 'Item not selected');
    } else {
      if (this.isWeapon) {
        order.weaponDetails = this.formWeapon.value;
      }
      order.orderDetails = this.formOther.value;
      this.confirmOrder.emit(order);
      while (this.getprices()?.value.length > 1) {
        this.getprices().removeAt(1);
      }
      this.resetForms();
      this.refreshBindPrices();
    }
  }

  ngOnDestroy(): void {
    this.resetForms();
    this.bindPrices.forEach(sub => sub.unsubscribe());
  }

  resetForms(): void {
    this.form.reset({
      name: '',
      orderType: OrderType.SELL,
      hidden: false,
      prices: [{ type: Price.PLAT, price: 0, unit: 0 }],
      quantity: 1,
      description: ''
    });
    this.item = undefined;
    this.formWeapon.reset({
      attribute: 'any',
      requirement: 9,
      inscription: true,
      oldschool: false,
      core: null,
      prefix: null,
      suffix: null
    });
    this.formOther.reset({
      dedicated: false,
      pre: false
    });
    this.isWeapon = false;
    this.isMiniature = false;
    this.isLocked = true;
  }
}
