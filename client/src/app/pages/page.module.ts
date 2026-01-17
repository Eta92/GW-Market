import { NgModule } from '@angular/core';
import { HomeComponent } from './home/home.component';
import { SharedModule } from '@app/services/shared.modules';
import { ServiceModule } from '@app/services/service.module';
import { ItemComponent } from './item/item.component';
import { SelectItemComponent } from '@app/components/select-item/select-item.component';
import { ShopComponent } from './shop/shop.component';
import { NewOrderComponent } from '@app/components/new-order/new-order.component';
import { EditOrderComponent } from '@app/components/edit-order/edit-order.component';
import { FooterComponent } from '@app/components/footer/footer.component';
import { FilterOrderComponent } from '@app/components/filter-order/filter-order.component';
import { ActivePlayerComponent } from '@app/components/active-player/active-player.component';
import { CustomToggleComponent } from '@app/components/custom-toggle/custom-toggle.component';
import { ItemDetailsComponent } from '@app/components/item-details/item-details.component';

@NgModule({
  declarations: [
    ActivePlayerComponent,
    CustomToggleComponent,
    EditOrderComponent,
    FilterOrderComponent,
    FooterComponent,
    ItemDetailsComponent,
    NewOrderComponent,
    SelectItemComponent,
    HomeComponent,
    ItemComponent,
    ShopComponent
  ],
  imports: [SharedModule, ServiceModule]
})
export class PageModule {}
