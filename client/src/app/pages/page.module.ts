import { NgModule } from '@angular/core';
import { HomeComponent } from './home/home.component';
import { SharedModule } from '@app/services/shared.modules';
import { ServiceModule } from '@app/services/service.module';
import { ItemComponent } from './item/item.component';
import { ShopComponent } from './shop/shop.component';
import { AboutComponent } from './about/about.component';
import { SearchComponent } from './search/search.component';
import { HelpComponent } from './help/help.component';
import { ComponentModule } from '@app/components/components.module';

@NgModule({
  declarations: [AboutComponent, HelpComponent, HomeComponent, ItemComponent, SearchComponent, ShopComponent],
  imports: [SharedModule, ServiceModule, ComponentModule]
})
export class PageModule {}
