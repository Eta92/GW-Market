import { Location } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilityHelper } from '@app/helpers/utility.helper';
import { Item, OrderType, ShopItem } from '@app/models/shop.model';
import { AvailableCategory, AvailableFamily, AvailableTree } from '@app/models/tree.model';
import { ItemService } from '@app/services/item.service';
import { ShopService } from '@app/services/shop.service';
import { StoreService } from '@app/services/store.service';
import { StatsData } from '@app/shared/components/stats-display/stats-display.component';
import { ToggleOption } from '@app/shared/components/toggle-group/toggle-group.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public searchControl: UntypedFormControl = new UntypedFormControl('');
  public searchedItems: Array<Item> = [];
  public searchOpen = false;
  public lastItems: Array<ShopItem> = [];
  public orderOpen = false;
  public availableMode: 'everything' | 'active' | 'sold' | 'bought' = 'everything';
  public timeMode: 'online' | 'today' | 'week' | 'combined' = 'online';
  public viewMode: 'grid' | 'list' = 'grid';
  public availableTree: AvailableTree = {
    families: [],
    sellNow: 0,
    buyNow: 0,
    sellDay: 0,
    buyDay: 0,
    sellWeek: 0,
    buyWeek: 0
  };
  public availableFamily: AvailableFamily;
  public availableCategory: AvailableCategory;
  public availableList = 'family';
  public queryFamily: string;
  public queryCategory: string;

  public OrderType = OrderType;

  // Toggle options for filter buttons
  public availableModeOptions: ToggleOption[] = [
    { value: 'everything', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'sold', label: 'Selling', icon: 'fa-arrow-up', styleClass: 'sell' },
    { value: 'bought', label: 'Buying', icon: 'fa-arrow-down', styleClass: 'buy' }
  ];

  public timeModeOptions: ToggleOption[] = [
    { value: 'online', label: 'Live', icon: 'fa-circle', styleClass: 'online' },
    { value: 'today', label: 'Today', icon: 'fa-sun', styleClass: 'today' },
    { value: 'week', label: 'This Week', icon: 'fa-calendar', styleClass: 'week' },
    { value: 'combined', label: 'Combined', icon: 'fa-layer-group', styleClass: 'combined' }
  ];

  public viewModeOptions: ToggleOption[] = [
    { value: 'grid', label: '', icon: 'fa-th-large' },
    { value: 'list', label: '', icon: 'fa-list' }
  ];

  @ViewChild('list') private listRef: ElementRef<HTMLElement>;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private location: Location,
    private shopService: ShopService,
    private storeService: StoreService,
    private itemService: ItemService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.storeService.resetItemDetails();
    this.activatedRoute.queryParams.subscribe(params => {
      this.queryFamily = params['family'];
      this.queryCategory = params['category'];
      this.autoExplore();
    });
    this.itemService.getAvailableTree().subscribe(tree => {
      this.availableTree = tree;
      this.autoExplore();
      this.cdr.detectChanges();
    });
    this.storeService.getLastItems().subscribe(items => {
      this.lastItems = items;
      this.cdr.detectChanges();
    });
  }

  autoExplore(): void {
    if (this.availableTree?.families?.length) {
      if (this.queryFamily) {
        const family = this.availableTree.families.find(f => f.name === this.queryFamily);
        if (family) {
          this.goToFamily(family);
          if (this.queryCategory) {
            const category = family.categories.find(c => c.name === this.queryCategory);
            if (category) {
              this.goToCategory(category);
            }
          }
        }
        this.scroll(this.listRef.nativeElement);
      } else {
        this.storeService.requestSocket('getLastItemsByFamily', 'all');
      }
    }
  }

  getImageSource(item: Item): string {
    return UtilityHelper.getImage(item);
  }

  getPreviewSource(name: string): string {
    return this.itemService?.getItemImage(name) || '';
  }

  getPreviewSources(previews: string[]): string[] {
    return (previews || []).map(name => this.getPreviewSource(name));
  }

  active(list: any[]): typeof list {
    const getSell = (i: any): number => this.getSellCount(i);
    const getBuy = (i: any): number => this.getBuyCount(i);

    switch (this.availableMode) {
      case 'everything':
        return list;
      case 'active':
        return list.filter(i => getSell(i) > 0 || getBuy(i) > 0);
      case 'sold':
        return list.filter(i => getSell(i) > 0);
      case 'bought':
        return list.filter(i => getBuy(i) > 0);
      default:
        return list;
    }
  }

  getSellCount(item: any): number {
    switch (this.timeMode) {
      case 'online': // < 15 min
        return item.sellNow || 0;
      case 'today': // < 12 hrs (online + today)
        return item.sellDay || 0;
      // case 'week': // all time
      // case 'combined': // use total for filtering
      default:
        return item.sellWeek || 0;
    }
  }

  getBuyCount(item: any): number {
    switch (this.timeMode) {
      case 'online': // < 15 min
        return item.buyNow || 0;
      case 'today': // < 12 hrs (online + today)
        return item.buyDay || 0;
      // case 'week': // all time
      // case 'combined': // use total for filtering
      default:
        return item.buyWeek || 0;
    }
  }

  getStats(item: any): StatsData {
    return {
      sellCount: this.getSellCount(item),
      buyCount: this.getBuyCount(item),
      sellNow: item.sellNow || 0,
      buyNow: item.buyNow || 0,
      sellDay: item.sellDay || 0,
      buyDay: item.buyDay || 0,
      sellWeek: item.sellWeek || 0,
      buyWeek: item.buyWeek || 0
    };
  }

  goToAll(): void {
    this.availableList = 'family';
    const url = this.router.createUrlTree([], { relativeTo: this.activatedRoute, queryParams: {} }).toString();
    this.location.go(url);
    this.storeService.requestSocket('getLastItemsByFamily', 'all');
  }

  goToFamily(family: AvailableFamily): void {
    this.availableFamily = family;
    this.availableList = 'category';
    const url = this.router
      .createUrlTree([], { relativeTo: this.activatedRoute, queryParams: { family: this.availableFamily.name } })
      .toString();
    this.location.go(url);
    this.storeService.requestSocket('getLastItemsByFamily', family.name);
  }

  goToCategory(category: AvailableCategory): void {
    this.availableCategory = category;
    this.availableList = 'item';
    const url = this.router
      .createUrlTree([], {
        relativeTo: this.activatedRoute,
        queryParams: { family: this.availableFamily.name, category: this.availableCategory.name }
      })
      .toString();
    this.location.go(url);
    this.storeService.requestSocket('getLastItemsByFamily', category.name);
  }

  goToItem(item: Item | ShopItem): void {
    this.router.navigate(['item', item.name]);
  }

  goToShop(): void {
    this.router.navigate(['shop']);
  }

  onCreateOrder(order): void {
    this.shopService.addShopItem(order);
    this.router.navigate(['shop']);
  }

  scroll(el: HTMLElement): void {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}
