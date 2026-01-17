import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ModalComponent } from '@app/shared/components/modal/modal.component';
import { ToggleGroupComponent } from '@app/shared/components/toggle-group/toggle-group.component';
import { QtyInputComponent } from '@app/shared/components/qty-input/qty-input.component';
import { OrderCardComponent } from '@app/shared/components/order-card/order-card.component';
import { StatsDisplayComponent } from '@app/shared/components/stats-display/stats-display.component';
import { OrderRowComponent } from '@app/shared/components/order-row/order-row.component';
import { PreviewCardComponent } from '@app/shared/components/preview-card/preview-card.component';
import { CurrencyDropdownComponent } from '@app/shared/components/currency-dropdown/currency-dropdown.component';
import { ItemDetailsComponent } from '@app/shared/components/item-details/item-details.component';
import { UTILITY_PIPES } from '@app/shared/pipes/utility.pipes';
import { StopPropagationDirective } from '@app/shared/directives/stop-propagation.directive';

const SHARED_COMPONENTS = [
  ModalComponent,
  ToggleGroupComponent,
  QtyInputComponent,
  OrderCardComponent,
  StatsDisplayComponent,
  OrderRowComponent,
  PreviewCardComponent,
  CurrencyDropdownComponent,
  ItemDetailsComponent,
  StopPropagationDirective,
  ...UTILITY_PIPES
];

@NgModule({
  declarations: [...SHARED_COMPONENTS],
  imports: [CommonModule],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    ...SHARED_COMPONENTS
  ]
})
export class SharedModule {}
