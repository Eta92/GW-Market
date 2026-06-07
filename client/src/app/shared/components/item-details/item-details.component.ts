import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { WeaponHelper } from '@app/helpers/weapon.helper';
import { BasicItem, DetailItem } from '@app/models/item.model';
import { ShopItem } from '@app/models/shop.model';
import { ItemService } from '@app/services/item.service';

@Component({
  selector: 'app-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: ['./item-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemDetailsComponent implements OnChanges {
  @Input() item: DetailItem;
  @Input() details: BasicItem;
  @Input() center = false;

  public isWeapon = WeaponHelper.isWeapon;
  public isMiniature = WeaponHelper.isMiniature;

  public WeaponHelper = WeaponHelper;

  constructor(
    private itemService: ItemService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes.item && this.item) || (changes.details && this.details) || (changes.center && this.center)) {
      this.cdr.detectChanges();
    }
  }

  exoticModDescription(name: string): string {
    return this.itemService.getExoticUpgradeDescription(name);
  }

  get shopItem(): ShopItem | null {
    if (!this.item) return null;
    // Check if it's a ShopItem by looking for ShopItem-specific properties
    if ('orderType' in this.item || 'weaponDetails' in this.item || 'orderDetails' in this.item || 'prices' in this.item) {
      return this.item as ShopItem;
    }
    return null;
  }

  get hasDetails(): boolean {
    // Has weapon details
    if (this.isWeapon(this.details) && this.shopItem?.weaponDetails) return true;

    // Has miniature - always show dedication status
    if (this.isMiniature(this.details)) return true;

    // Has pre-searing flag
    if (this.shopItem?.orderDetails?.pre) return true;

    return false;
  }
}
