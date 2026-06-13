import { Location } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilityHelper } from '@app/helpers/utility.helper';
import { Auction } from '@app/models/auction.model';
import { BasicItem } from '@app/models/item.model';
import { OrderType, ShopItem } from '@app/models/shop.model';
import { AvailableCategory, AvailableFamily, AvailableItem, AvailableTree } from '@app/models/tree.model';
import { ItemService } from '@app/services/item.service';
import { ShopService } from '@app/services/shop.service';
import { StoreService } from '@app/services/store.service';
import { StatsData } from '@app/shared/components/stats-display/stats-display.component';
import { ToggleOption } from '@app/shared/components/toggle-group/toggle-group.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public init = false;
  public searchControl: UntypedFormControl = new UntypedFormControl('');
  public searchedItems: Array<BasicItem> = [];
  public searchOpen = false;
  public lastItems: Array<ShopItem> = [];
  public lastAuctions: Array<Auction> = [];
  public orderOpen = false;
  public availableMode: 'everything' | 'active' | 'sold' | 'bought' | 'auction' = 'everything';
  public timeMode: 'online' | 'today' | 'week' | 'combined' = 'today';
  public viewMode: 'grid' | 'list' = 'grid';
  public availableTree: AvailableTree = {
    families: [],
    sellNow: 0,
    buyNow: 0,
    auctionNow: 0,
    sellDay: 0,
    buyDay: 0,
    auctionDay: 0,
    sellWeek: 0,
    buyWeek: 0,
    auctionWeek: 0
  };
  public availableFamily: AvailableFamily;
  public availableCategory: AvailableCategory;
  public availableFavorite: AvailableCategory;
  public availableList = 'family';
  public queryFamily: string;
  public queryCategory: string;
  public queryFavorite: boolean;
  public favorites: string[] = JSON.parse(localStorage.getItem('favorites') || '[]');

  public OrderType = OrderType;

  // Toggle options for filter buttons
  public availableModeOptions: ToggleOption[] = [
    { value: 'everything', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'sold', label: 'Selling', icon: 'fa-arrow-up', styleClass: 'sell' },
    { value: 'bought', label: 'Buying', icon: 'fa-arrow-down', styleClass: 'buy' },
    { value: 'auction', label: 'Auction', icon: 'fa-gavel', styleClass: 'auction' }
  ];

  public timeModeOptions: ToggleOption[] = [
    { value: 'online', label: 'Live', icon: 'fa-circle', styleClass: 'online' },
    { value: 'today', label: 'Today', icon: 'fa-sun', styleClass: 'today' },
    { value: 'week', label: 'This week', icon: 'fa-calendar', styleClass: 'week' },
    { value: 'combined', label: 'Combined', icon: 'fa-layer-group', styleClass: 'combined' }
  ];

  public viewModeOptions: ToggleOption[] = [
    { value: 'grid', label: 'grid', icon: 'fa-th-large' },
    { value: 'list', label: 'list', icon: 'fa-list' }
  ];

  @ViewChild('list') private listRef: ElementRef<HTMLElement>;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private location: Location,
    private shopService: ShopService,
    private storeService: StoreService,
    private itemService: ItemService,
    private toastrService: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      this.queryFamily = params['family'];
      this.queryCategory = params['category'];
      this.queryFavorite = params['favorite'] === 'true';
      this.itemService.getAvailableTree().subscribe(tree => {
        this.availableTree = tree;
        this.autoExplore();
        this.cdr.detectChanges();
      });
    });
    this.storeService.getLastItems().subscribe(items => {
      this.lastItems = items;
      this.cdr.detectChanges();
    });
    this.storeService.getLastAuctions().subscribe(auctions => {
      this.lastAuctions = auctions;
      this.cdr.detectChanges();
    });

    const modes = localStorage.getItem('home-modes');
    if (modes) {
      const parsed = JSON.parse(modes);
      this.availableMode = parsed.availableMode || this.availableMode;
      this.timeMode = parsed.timeMode || this.timeMode;
      this.viewMode = parsed.viewMode || this.viewMode;
    }
  }

  autoExplore(): void {
    if (this.queryFavorite) {
      this.availableList = 'favorite';
      this.storeService.requestSocket('getLastItemsByFavorite', this.favorites);
      this.createFavoriteTree();
    } else if (this.queryFamily) {
      const family = this.availableTree.families.find(f => f.name === this.queryFamily);
      if (family) {
        this.goToFamily(family, false);
        if (this.queryCategory) {
          const category = family.categories.find(c => c.name === this.queryCategory);
          if (category) {
            this.goToCategory(category, false);
            this.storeService.requestSocket('getLastItemsByFamily', category.name);
          }
        } else {
          this.storeService.requestSocket('getLastItemsByFamily', family.name);
        }
      }
      if (!this.init && this.listRef?.nativeElement) {
        this.scroll(this.listRef.nativeElement);
      }
    } else {
      this.storeService.requestSocket('getLastItemsByFamily', 'all');
    }
    if (this.favorites.length > 0) {
      this.createFavoriteTree();
    }
    // this.storeService.requestSocket('getLastAuctions'); // now cover by lastItemCall
    this.init = true;
  }

  getImageSource(item: BasicItem): string {
    return UtilityHelper.getImage(item);
  }

  getPreviewSource(name: string): string {
    return this.itemService?.getItemImage(name) || '';
  }

  getPreviewSources(previews: string[]): string[] {
    return (previews || []).map(name => this.getPreviewSource(name));
  }

  setAvailableMode(mode: string): void {
    this.availableMode = mode as any;
    localStorage.setItem(
      'home-modes',
      JSON.stringify({ availableMode: this.availableMode, timeMode: this.timeMode, viewMode: this.viewMode })
    );
  }

  setTimeMode(mode: string): void {
    this.timeMode = mode as any;
    localStorage.setItem(
      'home-modes',
      JSON.stringify({ availableMode: this.availableMode, timeMode: this.timeMode, viewMode: this.viewMode })
    );
  }

  setViewMode(mode: string): void {
    this.viewMode = mode as any;
    localStorage.setItem(
      'home-modes',
      JSON.stringify({ availableMode: this.availableMode, timeMode: this.timeMode, viewMode: this.viewMode })
    );
  }

  active(list: any[]): typeof list {
    const getSell = (i: any): number => this.getSellCount(i);
    const getBuy = (i: any): number => this.getBuyCount(i);
    const getAuction = (i: any): number => this.getAuctionCount(i);

    switch (this.availableMode) {
      case 'everything':
        return list;
      case 'active':
        return list.filter(i => getSell(i) > 0 || getBuy(i) > 0 || getAuction(i) > 0);
      case 'sold':
        return list.filter(i => getSell(i) > 0);
      case 'bought':
        return list.filter(i => getBuy(i) > 0);
      case 'auction':
        return list.filter(i => getAuction(i) > 0);
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

  getAuctionCount(item: any): number {
    switch (this.timeMode) {
      case 'online': // < 15 min
        return item.auctionNow || 0;
      case 'today': // < 12 hrs (online + today)
        return item.auctionDay || 0;
      // case 'week': // all time
      // case 'combined': // use total for filtering
      default:
        return item.auctionWeek || 0;
    }
  }

  getStats(item: any): StatsData {
    return {
      sellCount: this.getSellCount(item),
      buyCount: this.getBuyCount(item),
      auctionCount: this.getAuctionCount(item),
      sellNow: item.sellNow || 0,
      buyNow: item.buyNow || 0,
      auctionNow: item.auctionNow || 0,
      sellDay: item.sellDay || 0,
      buyDay: item.buyDay || 0,
      auctionDay: item.auctionDay || 0,
      sellWeek: item.sellWeek || 0,
      buyWeek: item.buyWeek || 0,
      auctionWeek: item.auctionWeek || 0
    };
  }

  goToAll(): void {
    this.availableList = 'family';
    const url = this.router.createUrlTree([], { relativeTo: this.activatedRoute, queryParams: {} }).toString();
    this.location.go(url);
    this.queryFamily = null;
    this.queryCategory = null;
    this.storeService.requestSocket('getLastItemsByFamily', 'all');
  }

  goToFamily(family: AvailableFamily, refresh = true): void {
    this.availableFamily = family;
    this.availableList = 'category';
    const url = this.router
      .createUrlTree([], { relativeTo: this.activatedRoute, queryParams: { family: this.availableFamily.name } })
      .toString();
    this.location.go(url);
    this.queryFamily = family.name;
    if (refresh) {
      this.queryCategory = null;
      this.storeService.requestSocket('getLastItemsByFamily', family.name);
    }
  }

  openToFamily(family: AvailableFamily): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree([], { relativeTo: this.activatedRoute, queryParams: { family: family.name } })
    );
    window.open(url, '_blank');
  }

  goToCategory(category: AvailableCategory, refresh = true): void {
    this.availableCategory = category;
    this.availableList = 'item';
    const url = this.router
      .createUrlTree([], {
        relativeTo: this.activatedRoute,
        queryParams: { family: this.availableFamily.name, category: this.availableCategory.name }
      })
      .toString();
    this.location.go(url);
    this.queryCategory = category.name;
    if (refresh) {
      this.storeService.requestSocket('getLastItemsByFamily', category.name);
    }
  }

  openToCategory(category: AvailableCategory): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree([], {
        relativeTo: this.activatedRoute,
        queryParams: { family: this.availableFamily.name, category: category.name }
      })
    );
    window.open(url, '_blank');
  }

  goToFavorite(): void {
    this.availableList = 'favorite';
    const url = this.router.createUrlTree([], { relativeTo: this.activatedRoute, queryParams: { favorite: true } }).toString();
    this.location.go(url);
    this.queryFavorite = true;
    this.storeService.requestSocket('getLastItemsByFavorite', this.favorites);
  }

  openToFavorite(): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree([], { relativeTo: this.activatedRoute, queryParams: { favorite: true } })
    );
    window.open(url, '_blank');
  }

  createFavoriteTree(): void {
    const items: Array<AvailableItem> = this.favorites
      .map(name => {
        const base = this.itemService.getItemBase(name);
        const availableItem: AvailableItem = this.availableTree.families
          .find(f => f.name === base.family)
          ?.categories.find(c => c.name === base.category)
          ?.items.find(i => i.name === name);
        return availableItem || null;
      })
      .filter(item => item !== null) as Array<AvailableItem>;
    const previews: string[] = this.favorites.slice(0, 4);
    this.availableFavorite = {
      name: 'Favorites',
      previews,
      items,
      sellNow: items.reduce((sum, i) => sum + (i.sellNow || 0), 0),
      buyNow: items.reduce((sum, i) => sum + (i.buyNow || 0), 0),
      auctionNow: items.reduce((sum, i) => sum + (i.auctionNow || 0), 0),
      sellDay: items.reduce((sum, i) => sum + (i.sellDay || 0), 0),
      buyDay: items.reduce((sum, i) => sum + (i.buyDay || 0), 0),
      auctionDay: items.reduce((sum, i) => sum + (i.auctionDay || 0), 0),
      sellWeek: items.reduce((sum, i) => sum + (i.sellWeek || 0), 0),
      buyWeek: items.reduce((sum, i) => sum + (i.buyWeek || 0), 0),
      auctionWeek: items.reduce((sum, i) => sum + (i.auctionWeek || 0), 0)
    };
  }

  goToItem(item: BasicItem | ShopItem): void {
    this.router.navigate(['item', item.name]);
  }

  openToItem(item: BasicItem | ShopItem): void {
    const url = this.router.serializeUrl(this.router.createUrlTree(['item', item.name]));
    window.open(url, '_blank');
  }

  goToShop(): void {
    this.router.navigate(['shop']);
  }

  toggleFavorite(itemName: string, evt?: MouseEvent): void {
    const index = this.favorites.indexOf(itemName);
    if (index > -1) {
      this.favorites.splice(index, 1);
    } else {
      if (this.favorites.length >= 20) {
        this.toastrService.error(
          'You can only have up to 20 favorites. Please remove some before adding new ones.',
          'Favorites limit reached'
        );
        return;
      }
      this.favorites.push(itemName);
    }
    localStorage.setItem('favorites', JSON.stringify(this.favorites));
    if (evt) {
      evt.stopPropagation();
    }
    this.createFavoriteTree();
  }

  isFavorite(itemName: string): boolean {
    return this.favorites.includes(itemName);
  }

  scroll(el: HTMLElement): void {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}
