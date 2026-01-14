import { NgModule } from '@angular/core';
import { StoreService } from './store.service';
import { ToasterService } from './toaster.service';
import { UtilService } from './util.service';
import { ShopService } from './shop.service';
import { ItemService } from './item.service';

@NgModule({
  providers: [ItemService, ShopService, StoreService, ToasterService, UtilService]
})
export class ServiceModule {}
