import { NgModule } from '@angular/core';
import { ActivePlayerComponent } from '@app/components/active-player/active-player.component';
import { EditOrderComponent } from '@app/components/edit-order/edit-order.component';
import { FilterOrderComponent } from '@app/components/filter-order/filter-order.component';
import { FooterComponent } from '@app/components/footer/footer.component';
import { HeaderComponent } from '@app/components/header/header.component';
import { NewOrderComponent } from '@app/components/new-order/new-order.component';
import { SelectItemComponent } from '@app/components/select-item/select-item.component';
import { ServiceModule } from '@app/services/service.module';
import { SharedModule } from '@app/services/shared.modules';
import { EditManyComponent } from './edit-many/edit-many.component';
import { PriceInspectorComponent } from './price-inspector/price-inspector.component';
import { SortOrderComponent } from './sort-order/sort-order.component';

@NgModule({
  declarations: [
    ActivePlayerComponent,
    EditOrderComponent,
    EditManyComponent,
    FilterOrderComponent,
    SortOrderComponent,
    FooterComponent,
    HeaderComponent,
    NewOrderComponent,
    PriceInspectorComponent,
    SelectItemComponent
  ],
  exports: [
    ActivePlayerComponent,
    EditOrderComponent,
    EditManyComponent,
    FilterOrderComponent,
    SortOrderComponent,
    FooterComponent,
    HeaderComponent,
    NewOrderComponent,
    PriceInspectorComponent,
    SelectItemComponent
  ],
  imports: [SharedModule, ServiceModule]
})
export class ComponentModule {}
