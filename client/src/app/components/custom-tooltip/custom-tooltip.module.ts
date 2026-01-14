import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CustomeTooltipComponent } from './custom-tooltip.component';

@NgModule({
  imports: [CommonModule],
  declarations: [CustomeTooltipComponent],
  exports: [CustomeTooltipComponent]
})
export class CustomeTooltipModule {}
