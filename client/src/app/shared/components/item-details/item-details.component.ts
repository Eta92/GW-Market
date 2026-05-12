import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { WeaponHelper } from '@app/helpers/weapon.helper';
import { BasicItem, ShopItem } from '@app/models/shop.model';

@Component({
  selector: 'app-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: ['./item-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemDetailsComponent {
  @Input() item: ShopItem;
  @Input() details: BasicItem;

  public isWeapon = WeaponHelper.isWeapon;
  public isMiniature = WeaponHelper.isMiniature;

  public WeaponHelper = WeaponHelper;

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

    // Has pre-nerf flag
    if (this.shopItem?.orderDetails?.legacy) return true;

    return false;
  }
}
