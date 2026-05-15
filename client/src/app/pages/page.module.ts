import { NgModule } from '@angular/core';
import { ComponentModule } from '@app/components/components.module';
import { ServiceModule } from '@app/services/service.module';
import { SharedModule } from '@app/services/shared.modules';
import { AboutComponent } from './about/about.component';
import { HelpComponent } from './help/help.component';
import { HomeComponent } from './home/home.component';
import { ItemComponent } from './item/item.component';
import { OverviewComponent } from './overview/overview.component';
import { SearchComponent } from './search/search.component';
import { ShopComponent } from './shop/shop.component';

@NgModule({
  declarations: [AboutComponent, HelpComponent, HomeComponent, ItemComponent, OverviewComponent, SearchComponent, ShopComponent],
  imports: [SharedModule, ServiceModule, ComponentModule]
})
export class PageModule {}
