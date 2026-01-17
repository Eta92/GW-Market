import { Component, Input } from '@angular/core';
import { WeaponHelper } from '@app/helpers/weapon.helper';
import { Item, ShopItem } from '@app/models/shop.model';

@Component({
  selector: 'app-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: ['./item-details.component.scss']
})
export class ItemDetailsComponent {
  @Input() item: Item | ShopItem;
  @Input() details: Item;

  public isWeapon = WeaponHelper.isWeapon;
  public isMiniature = WeaponHelper.isMiniature;

  constructor() {}
}
