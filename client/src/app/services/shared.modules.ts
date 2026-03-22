import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PipeModule } from '@app/pipes/pipe.module';
import { CurrencyDropdownComponent } from '@app/shared/components/currency-dropdown/currency-dropdown.component';
import { ItemDetailsComponent } from '@app/shared/components/item-details/item-details.component';
import { ModalComponent } from '@app/shared/components/modal/modal.component';
import { OrderCardComponent } from '@app/shared/components/order-card/order-card.component';
import { OrderRowComponent } from '@app/shared/components/order-row/order-row.component';
import { PreviewCardComponent } from '@app/shared/components/preview-card/preview-card.component';
import { QtyInputComponent } from '@app/shared/components/qty-input/qty-input.component';
import { StatsDisplayComponent } from '@app/shared/components/stats-display/stats-display.component';
import { ToggleGroupComponent } from '@app/shared/components/toggle-group/toggle-group.component';
import { StopPropagationDirective } from '@app/shared/directives/stop-propagation.directive';
import { UTILITY_PIPES } from '@app/shared/pipes/utility.pipes';
import { MessageCardComponent } from '@shared/components/message-card/message-card.component';
import { UpgradeDropdownComponent } from '@shared/components/upgrade-dropdown/upgrade-dropdown.component';
import { MiddleclickDirective, RoutingDirective } from '@shared/directives/routing.directive';

const SHARED_COMPONENTS = [
  ModalComponent,
  ToggleGroupComponent,
  QtyInputComponent,
  OrderCardComponent,
  StatsDisplayComponent,
  OrderRowComponent,
  PreviewCardComponent,
  CurrencyDropdownComponent,
  UpgradeDropdownComponent,
  ItemDetailsComponent,
  MessageCardComponent,
  RoutingDirective,
  MiddleclickDirective,
  StopPropagationDirective,
  ...UTILITY_PIPES
];

@NgModule({
  declarations: [...SHARED_COMPONENTS],
  imports: [CommonModule, PipeModule],
  exports: [FormsModule, ReactiveFormsModule, CommonModule, RouterModule, ...SHARED_COMPONENTS]
})
export class SharedModule {}
