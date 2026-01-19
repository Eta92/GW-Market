import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { UtilityHelper } from '@app/helpers/utility.helper';
import { SearchFilter, SearchResult, SearchResultOrder, Time } from '@app/models/order.model';
import { Item, OrderType, Price } from '@app/models/shop.model';
import { AvailableTree } from '@app/models/tree.model';
import { ItemService } from '@app/services/item.service';
import { StoreService } from '@app/services/store.service';
import { ToggleOption } from '@app/shared/components/toggle-group/toggle-group.component';
import { WEAPON_ATTRIBUTES } from '@app/shared/constants/weapon-attributes';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
  public form: UntypedFormGroup;
  public allItems: AvailableTree;
  public attributes = WEAPON_ATTRIBUTES;

  public searchResult: SearchResult | null = null;
  public loading = false;
  public hasSearched = false;
  public sidebarOpen = false;

  public OrderType = OrderType;
  public Price = Price;

  private destroy$ = new Subject<void>();

  // Toggle options
  public orderTypeOptions: ToggleOption[] = [
    { value: null, label: 'All' },
    { value: OrderType.SELL, label: 'Sell', icon: 'fa-arrow-up', styleClass: 'sell' },
    { value: OrderType.BUY, label: 'Buy', icon: 'fa-arrow-down', styleClass: 'buy' }
  ];

  public timeRangeOptions: ToggleOption[] = [
    { value: 'all', label: 'All Time' },
    { value: 'online', label: 'Online', icon: 'fa-circle', styleClass: 'online' },
    { value: 'today', label: 'Today', icon: 'fa-sun', styleClass: 'today' },
    { value: 'week', label: 'This Week', icon: 'fa-calendar', styleClass: 'week' }
  ];

  public sortByOptions: ToggleOption[] = [
    { value: 'time', label: 'Recent' },
    { value: 'price', label: 'Total Price' },
    { value: 'priceEach', label: 'Unit Price' },
    { value: 'quantity', label: 'Quantity' },
    { value: 'name', label: 'Name' }
  ];

  public currencyOptions: ToggleOption[] = [
    { value: null, label: 'All' },
    { value: Price.PLAT, label: 'Plat', imgSrc: UtilityHelper.getCurrencySource(Price.PLAT) },
    { value: Price.ECTO, label: 'Ecto', imgSrc: UtilityHelper.getCurrencySource(Price.ECTO) },
    { value: Price.ZKEY, label: 'Zkey', imgSrc: UtilityHelper.getCurrencySource(Price.ZKEY) },
    { value: Price.ARM, label: 'Arm', imgSrc: UtilityHelper.getCurrencySource(Price.ARM) }
  ];

  public preSearingOptions: ToggleOption[] = [
    { value: null, label: 'Any' },
    { value: true, label: 'Pre', icon: 'fa-sun' },
    { value: false, label: 'Post', icon: 'fa-moon' }
  ];

  public miniDedicatedOptions: ToggleOption[] = [
    { value: null, label: 'Any' },
    { value: true, label: 'Dedicated' },
    { value: false, label: 'Undedicated' }
  ];

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private storeService: StoreService,
    private itemService: ItemService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.itemService.getAvailableTree().subscribe((tree: AvailableTree) => {
      this.allItems = tree;
      this.cdr.detectChanges();
    });

    this.storeService.getSearchOrders().subscribe((result: SearchResult) => {
      if (result) {
        this.searchResult = result;
        this.loading = false;
        this.hasSearched = true;
        this.cdr.detectChanges();
      }
    });

    // Check for query params
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.form.patchValue({ query: params['q'] });
        this.onSearch();
      }
    });

    // Auto-search when filters/sort change (excluding query which needs button)
    this.form.valueChanges.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe((values) => {
      // Only auto-search if we've already searched once (not on initial load)
      // and the change wasn't just the query field
      if (this.hasSearched) {
        this.onSearch();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.storeService.resetSearchOrders();
  }

  initForm(): void {
    this.form = this.fb.group({
      query: [''],
      orderType: [null],
      family: [null],
      category: [null],
      attribute: [null],
      reqMin: [0],
      reqMax: [13],
      inscription: [null],
      oldschool: [null],
      core: [null],
      prefix: [null],
      suffix: [null],
      preSearing: [null],
      miniDedicated: [null],
      currency: [null],
      priceMin: [null],
      priceMax: [null],
      priceEachMin: [null],
      priceEachMax: [null],
      timeRange: ['all'],
      onlineOnly: [false],
      certifiedOnly: [false],
      sortBy: ['time'],
      sortOrder: ['desc']
    });
  }

  onSearch(): void {
    this.loading = true;
    const filter = this.buildFilter();
    this.storeService.searchOrders(filter);
  }

  onClear(): void {
    this.initForm();
    this.searchResult = null;
    this.hasSearched = false;
  }

  buildFilter(): SearchFilter {
    const f = this.form.value;
    const filter: SearchFilter = {
      limit: 50,
      offset: 0
    };

    if (f.query?.trim()) filter.query = f.query.trim();
    if (f.orderType !== null) filter.orderType = f.orderType;
    if (f.family) filter.family = f.family;
    if (f.category) filter.category = f.category;
    if (f.attribute) filter.attribute = f.attribute;
    if (f.reqMin > 0) filter.reqMin = f.reqMin;
    if (f.reqMax < 13) filter.reqMax = f.reqMax;
    if (f.inscription !== null) filter.inscription = f.inscription === 'true';
    if (f.oldschool !== null) filter.oldschool = f.oldschool === 'true';
    if (f.core) filter.core = f.core;
    if (f.prefix) filter.prefix = f.prefix;
    if (f.suffix) filter.suffix = f.suffix;
    if (f.preSearing !== null) filter.preSearing = f.preSearing;
    if (f.miniDedicated !== null) filter.miniDedicated = f.miniDedicated;
    if (f.currency !== null) filter.currency = f.currency;
    if (f.priceMin) filter.priceMin = Number(f.priceMin);
    if (f.priceMax) filter.priceMax = Number(f.priceMax);
    if (f.priceEachMin) filter.priceEachMin = Number(f.priceEachMin);
    if (f.priceEachMax) filter.priceEachMax = Number(f.priceEachMax);
    if (f.timeRange && f.timeRange !== 'all') filter.timeRange = f.timeRange;
    if (f.onlineOnly) filter.onlineOnly = true;
    if (f.certifiedOnly) filter.certifiedOnly = true;
    if (f.sortBy) filter.sortBy = f.sortBy;
    if (f.sortOrder) filter.sortOrder = f.sortOrder;

    return filter;
  }

  // Getters for contextual filters
  get selectedFamily(): string | null {
    return this.form?.get('family')?.value;
  }

  get isWeaponFamily(): boolean {
    return this.selectedFamily === 'weapon';
  }

  get showWeaponFilters(): boolean {
    return this.isWeaponFamily || this.selectedFamily === 'unique';
  }

  get showMiniatureFilters(): boolean {
    return this.selectedFamily === 'miniature';
  }

  getFamilies(): Array<string> {
    return this.allItems?.families.map(f => f.name) || [];
  }

  getCategories(): Array<string> {
    const familyName = this.form.get('family').value;
    const family = this.allItems?.families.find(f => f.name === familyName);
    return family ? family.categories.map(c => c.name) : [];
  }

  // Image helpers
  getImageSource(order: SearchResultOrder): string {
    return this.itemService.getItemImage(order.name) || '';
  }

  getCurrencySource(price: Price): string {
    return UtilityHelper.getCurrencySource(price);
  }

  priceToString(price: Price): string {
    return UtilityHelper.priceToString(price);
  }

  formatLastUpdate(timestamp: number): string {
    return UtilityHelper.formatLastUpdate(timestamp);
  }

  getTimeCategory(lastRefresh: number): Time {
    return UtilityHelper.getTimeCategory(lastRefresh);
  }

  // Price helpers
  getUnitPrice(totalPrice: number, quantity: number): string | null {
    if (quantity <= 1) return null;
    return UtilityHelper.getDecimalUnitPrice(totalPrice, quantity);
  }

  // Navigation
  goToItem(order: SearchResultOrder): void {
    this.router.navigate(['/item', order.name]);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  // Pagination
  loadMore(): void {
    if (!this.searchResult) return;
    const filter = this.buildFilter();
    filter.offset = this.searchResult.orders.length;
    this.loading = true;
    this.storeService.searchOrders(filter);
  }

  get hasMore(): boolean {
    return this.searchResult ? this.searchResult.orders.length < this.searchResult.total : false;
  }

  // Sidebar state (mobile)
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    // Prevent body scroll when sidebar is open
    document.body.style.overflow = this.sidebarOpen ? 'hidden' : '';
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
    document.body.style.overflow = '';
  }

  // Count active filters for badge
  get activeFilterCount(): number {
    if (!this.form) return 0;
    const f = this.form.value;
    let count = 0;

    if (f.orderType !== null) count++;
    if (f.timeRange && f.timeRange !== 'all') count++;
    if (f.family) count++;
    if (f.category) count++;
    if (f.attribute) count++;
    if (f.reqMin > 0 || f.reqMax < 13) count++;
    if (f.inscription !== null) count++;
    if (f.preSearing !== null) count++;
    if (f.miniDedicated !== null) count++;
    if (f.currency !== null) count++;
    if (f.priceMin || f.priceMax) count++;
    if (f.priceEachMin || f.priceEachMax) count++;
    if (f.onlineOnly) count++;
    if (f.certifiedOnly) count++;

    return count;
  }
}
