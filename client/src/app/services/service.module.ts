import { NgModule } from '@angular/core';
import { DeviceService } from './device.service';
import { InspectorService } from './inspector.service';
import { ItemService } from './item.service';
import { MessageService } from './message.service';
import { ShopService } from './shop.service';
import { StoreService } from './store.service';
import { ToasterService } from './toaster.service';
import { UtilService } from './util.service';

@NgModule({
  providers: [InspectorService, ItemService, MessageService, ShopService, StoreService, ToasterService, UtilService, DeviceService],
})
export class ServiceModule {}
