import { NgModule } from '@angular/core';
import { SharedModule } from '@app/services/shared.modules';
import { ServiceModule } from '@app/services/service.module';
import { SelectItemComponent } from '@app/components/select-item/select-item.component';
import { NewOrderComponent } from '@app/components/new-order/new-order.component';
import { EditOrderComponent } from '@app/components/edit-order/edit-order.component';
import { FooterComponent } from '@app/components/footer/footer.component';
import { FilterOrderComponent } from '@app/components/filter-order/filter-order.component';
import { ActivePlayerComponent } from '@app/components/active-player/active-player.component';
import { HeaderComponent } from '@app/components/header/header.component';
import { EditManyComponent } from './edit-many/edit-many.component';

@NgModule({
  declarations: [
    ActivePlayerComponent,
    EditOrderComponent,
    EditManyComponent,
    FilterOrderComponent,
    FooterComponent,
    HeaderComponent,
    NewOrderComponent,
    SelectItemComponent
  ],
  exports: [
    ActivePlayerComponent,
    EditOrderComponent,
    EditManyComponent,
    FilterOrderComponent,
    FooterComponent,
    HeaderComponent,
    NewOrderComponent,
    SelectItemComponent
  ],
  imports: [SharedModule, ServiceModule]
})
export class ComponentModule {}
