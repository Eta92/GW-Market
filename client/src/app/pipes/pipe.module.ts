import { NgModule } from '@angular/core';
import { DatePipe, EnumToArrayPipe, EnumToKeyValuePipe, TimePipe } from './utility.pipe';

@NgModule({
  declarations: [EnumToArrayPipe, EnumToKeyValuePipe, DatePipe, TimePipe],
  exports: [EnumToArrayPipe, EnumToKeyValuePipe, DatePipe, TimePipe]
})
export class PipeModule {}
