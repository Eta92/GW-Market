import { NgModule } from '@angular/core';
import { DatePipe, EnumToArrayPipe, EnumToKeyValuePipe, MaxDigitPipe, TimePipe } from './utility.pipe';

@NgModule({
  declarations: [EnumToArrayPipe, EnumToKeyValuePipe, DatePipe, TimePipe, MaxDigitPipe],
  exports: [EnumToArrayPipe, EnumToKeyValuePipe, DatePipe, TimePipe, MaxDigitPipe]
})
export class PipeModule {}
