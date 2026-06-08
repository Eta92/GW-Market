import { formatDate } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { WeaponHelper } from '@app/helpers/weapon.helper';
import { BasicItem, Upgrade } from '@app/models/item.model';
import { OrderType, Price, ShopItem } from '@app/models/shop.model';
import { AvailableTree } from '@app/models/tree.model';
import { InspectorService } from '@app/services/inspector.service';
import { ItemService } from '@app/services/item.service';
import { StoreService } from '@app/services/store.service';
import { ToggleOption } from '@app/shared/components/toggle-group/toggle-group.component';
import { LOCKED_WEAPON, VARIABLE_ATTRIBUTE } from '@app/shared/constants/weapon-attributes';
import { ToastrService } from 'ngx-toastr';
import { Subscription, take } from 'rxjs';

@Component({
  selector: 'app-edit-order',
  templateUrl: './edit-order.component.html',
  styleUrls: ['./edit-order.component.scss']
})
export class EditOrderComponent implements OnInit, OnChanges, OnDestroy {
  @Input() preselect?: BasicItem;
  @Input() original?: ShopItem;
  @Input() maskSearch = false;
  @Input() confirm: string;
  @Input() status: boolean;

  @Output() closeEdit = new EventEmitter<void>();
  @Output() confirmOrder = new EventEmitter<ShopItem>();

  public init = false;
  public loading = false;
  public form: UntypedFormGroup;
  public formWeapon: UntypedFormGroup;
  public formOther: UntypedFormGroup;
  public item: BasicItem;
  public bindPrices: Array<Subscription> = [];

  public allItems: AvailableTree;
  public OrderType = OrderType;
  public Price = Price;
  public isOldSchool = false;
  public isMiniature = false;
  public isAdvanced = false;
  public isAuction = false;
  // weapons
  public isWeapon = false;
  public isLocked = true;
  public attributes = VARIABLE_ATTRIBUTE;
  public lockWeapons = LOCKED_WEAPON;
  public weaponLists: { core: Array<Upgrade>; prefix: Array<Upgrade>; suffix: Array<Upgrade> } = {
    core: [],
    prefix: [],
    suffix: []
  };

  public visibilityOptions: ToggleOption[] = [
    { value: false, label: 'Visible', icon: 'fa-eye' },
    { value: true, label: 'Hidden', icon: 'fa-eye-slash' }
  ];

  public exoticUpgrades: Array<BasicItem> = [];
  public extraModValues: string[] = [];
  public exoticUpgradeOptions: Array<Upgrade> = [];
  public generalUpgradeOptions: Array<Upgrade> = [];

  constructor(
    private fb: UntypedFormBuilder,
    private storeService: StoreService,
    private itemService: ItemService,
    private toastrService: ToastrService,
    private inspectorService: InspectorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.forceInit();
    this.itemService.getExoticUpgrades().subscribe(upgrades => {
      this.exoticUpgrades = upgrades;
      this.exoticUpgradeOptions = upgrades.map(u => ({
        value: u.name,
        description: [u.enhancement, u.condition].filter(Boolean).join(' / '),
        img: '../../../assets/items/upgrade/' + u.img.replace(/ /g, '_') + '.png'
      }));
      this.generalUpgradeOptions = [...this.weaponLists.core, ...this.exoticUpgradeOptions];
      this.cdr.markForCheck();
    });
  }

  private forceInit(): void {
    this.init = true;
    const prices = this.fb.array([
      this.fb.group({
        type: [Price.PLAT],
        price: [0, [Validators.min(0), Validators.max(9999)]],
        unit: [0, [Validators.min(0), Validators.max(9999)]],
        max: [null, [Validators.min(1), Validators.max(9999)]]
      })
    ]);
    this.form = this.fb.group({
      name: [this.preselect ? this.preselect.name : ''],
      orderType: [OrderType.SELL],
      hidden: [false],
      prices: prices,
      quantity: [1, Validators.min(1)],
      description: [''],
      // auction only
      acknowledge: [false],
      endTime: [formatDate(Date.now() + 7 * 24 * 60 * 60 * 1000, 'yyyy-MM-ddTHH:mm', 'en-US')]
    });
    this.formWeapon = this.fb.group({
      attribute: ['any', Validators.required],
      requirement: [9, [Validators.min(0), Validators.max(13)]],
      inscription: [true],
      core: [null],
      prefix: [null],
      suffix: [null],
      extraMods: [[]]
    });
    this.formOther = this.fb.group({
      dedicated: [false],
      pre: [false],
      note: [''],
      goldPrice: [null, Validators.min(0)]
    });
    if (this.original) {
      this.loadOrder(this.original);
    }
    this.itemService
      .getAvailableTree()
      .pipe(take(1))
      .subscribe((tree: AvailableTree) => {
        this.allItems = tree;
        if (this.original) {
          this.loadOrder(this.original);
        }
      });
    this.form.get('orderType')?.valueChanges.subscribe(value => {
      this.isAuction = value === OrderType.AUCTION;
      if (this.isAuction) {
        while (this.getprices().controls.length > 1) {
          this.getprices().removeAt(1);
        }
      }
    });
    this.formWeapon.get('inscription')?.valueChanges.subscribe(value => {
      this.isOldSchool = !value;
      if (!this.loading) {
        if (this.isOldSchool) {
          this.extraModValues = [];
          const previousMod = this.formWeapon.get('core')?.value;
          if (previousMod) {
            this.extraModValues = [previousMod];
          }
          this.formWeapon.patchValue({ extraMods: this.extraModValues, core: null });
        } else {
          const previousMods = this.formWeapon.get('extraMods')?.value || [];
          const compatibleMods = this.weaponLists.core.map(mod => mod.value);
          const coreMods = previousMods.filter(mod => compatibleMods.includes(mod));
          const coreMod = coreMods.length > 0 ? coreMods[0] : null;
          this.formWeapon.patchValue({ core: coreMod, extraMods: [] });
        }
        this.cdr.markForCheck();
      }
    });
    this.refreshBindPrices();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.init && changes['status'] && this.status) {
      this.forceInit();
    }
    if (changes['original'] && this.original && this.form) {
      this.loadOrder(this.original);
    }
    if (changes['preselect'] && this.preselect) {
      this.onSelectItem(this.preselect);
    }
  }

  loadOrder(order: ShopItem): void {
    this.loading = true;
    while (this.getprices().controls.length < order.prices.length) {
      this.getprices().push(
        this.fb.group({
          type: [Price.PLAT],
          price: [0, Validators.min(0)],
          unit: [0, Validators.min(0)],
          max: [null, Validators.min(1)]
        })
      );
    }
    order.item = this.itemService.getItemBase(order.name);
    this.item = { ...order.item };
    this.form.patchValue(order);
    this.formOther.patchValue(order.orderDetails || {});
    this.isWeapon = WeaponHelper.isWeapon(order.item);
    this.isMiniature = WeaponHelper.isMiniature(order.item);
    if (this.isWeapon && this.allItems) {
      this.isLocked = LOCKED_WEAPON.includes(order.item.category);
      this.isOldSchool = order.weaponDetails ? !order.weaponDetails.inscription : false;
      this.weaponLists = WeaponHelper.getItemList(order.item?.category, this.itemService.getUpgrades());
      this.generalUpgradeOptions = [...this.weaponLists.core, ...this.exoticUpgradeOptions];
      this.extraModValues = [...(order.weaponDetails?.extraMods || [])];
      // only patch previous old school item wit core instead of extra mod
      if (this.isOldSchool && order.weaponDetails?.core) {
        this.addExtraMod();
        order.weaponDetails.extraMods = [order.weaponDetails.core];
        this.extraModValues = this.extraModValues.map((v, i) => (i === 0 ? order.weaponDetails.core : v));
        order.weaponDetails.core = null;
      }
      this.formWeapon.patchValue(order.weaponDetails || {});
    }
    this.loading = false;
    this.cdr.markForCheck();
  }

  onSelectItem(item: BasicItem): void {
    this.item = item;
    if (this.form) {
      this.form.patchValue({ name: item.name });
    }
    // Reset flags for new item
    this.isWeapon = WeaponHelper.isWeapon(item);
    this.isMiniature = WeaponHelper.isMiniature(item);
    // Set weapon flag if applicable
    if (this.isWeapon && this.allItems) {
      this.isLocked = LOCKED_WEAPON.includes(item.category);
      this.weaponLists = WeaponHelper.getItemList(item?.category, this.itemService.getUpgrades());
      this.generalUpgradeOptions = [...this.weaponLists.core, ...this.exoticUpgradeOptions];
      this.cdr.markForCheck();
    }
  }

  selectCurrency(index: number, currency: Price): void {
    this.getprices().at(index).patchValue({ type: currency });
  }

  getprices(): UntypedFormArray {
    return this.form.get('prices') as UntypedFormArray;
  }

  addExtraMod(): void {
    this.extraModValues = [...this.extraModValues, null];
    this.formWeapon.patchValue({ extraMods: this.extraModValues });
  }

  removeExtraMod(index: number): void {
    this.extraModValues = this.extraModValues.filter((_, i) => i !== index);
    this.formWeapon.patchValue({ extraMods: this.extraModValues });
  }

  updateExtraMod(index: number, value: string): void {
    this.extraModValues = this.extraModValues.map((v, i) => (i === index ? value : v));
    this.formWeapon.patchValue({ extraMods: this.extraModValues });
  }

  addPrice(): void {
    this.getprices().push(this.fb.group({ type: [Price.PLAT], price: [0, Validators.min(0)], unit: [0, Validators.min(0)] }));
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

  togglePriceInspector(show: boolean): void {
    this.inspectorService.toggleInspector(show);
    if (show && this.item) {
      const orderType = this.form.get('orderType')?.value || OrderType.SELL;
      this.inspectorService.requestInspection(this.item.name, orderType);
    }
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
    } else if (order.orderType === OrderType.AUCTION && !order.acknowledge) {
      this.toastrService.error('Please read and agree to the auction terms', 'Auction not acknowledged');
    } else if (order.orderType === OrderType.AUCTION && new Date(order.endTime).getTime() <= Date.now()) {
      this.toastrService.error('Please set an auction end time in the future', 'Auction end time not valid');
    } else {
      if (this.isWeapon) {
        order.weaponDetails = this.formWeapon.value;
      }
      order.orderDetails = this.formOther.value;
      this.confirmOrder.emit(order);
      this.resetForms();
      this.refreshBindPrices();
    }
  }

  ngOnDestroy(): void {
    this.resetForms();
    this.bindPrices.forEach(sub => sub.unsubscribe());
  }

  resetForms(): void {
    this.init = false;
    while (this.getprices().controls.length > 1) {
      this.getprices().removeAt(1);
    }
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
      core: null,
      prefix: null,
      suffix: null,
      extraMods: []
    });
    this.extraModValues = [];
    this.formOther.reset({
      dedicated: false,
      pre: false,
      note: ''
    });
    this.isWeapon = false;
    this.isOldSchool = false;
    this.isMiniature = false;
    this.isLocked = true;
  }
}
