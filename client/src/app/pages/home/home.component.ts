import { Location } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilityHelper } from '@app/helpers/utility.helper';
import { Item, OrderType, Price, ShopItem } from '@app/models/shop.model';
import { AvailableCategory, AvailableFamily, AvailableTree } from '@app/models/tree.model';
import { ItemService } from '@app/services/item.service';
import { ShopService } from '@app/services/shop.service';
import { StoreService } from '@app/services/store.service';

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
  public availableMode: 'everything' | 'active' | 'sold' | 'bought' = 'everything';
  public availableTree: AvailableTree = { families: [], sellOrders: 0, buyOrders: 0 };
  public availableFamily: AvailableFamily;
  public availableCategory: AvailableCategory;
  public availableList = 'family';
  public queryFamily: string;
  public queryCategory: string;

  public OrderType = OrderType;
  public priceToString = UtilityHelper.priceToString;

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

  getCurrencySource(price: Price): string {
    return '../../../assets/items/currency/' + price.toString() + '.png';
  }

  active(list: any[]): typeof list {
    switch (this.availableMode) {
      case 'everything':
        return list;
      case 'active':
        return list.filter(i => i.sellOrders > 0 || i.buyOrders > 0);
      case 'sold':
        return list.filter(i => i.sellOrders > 0);
      case 'bought':
        return list.filter(i => i.buyOrders > 0);
      default:
        return list;
    }
  }

  getOldOpacity(item: ShopItem): string {
    return UtilityHelper.getOldOpacity(item);
  }

  formatLastUpdate(timestamp: number): string {
    return UtilityHelper.formatLastUpdate(timestamp);
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
