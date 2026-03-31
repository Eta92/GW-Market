import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ModalContainerComponent } from './container/modal-container.component';
import { ModalService } from './services/modal.service';

@NgModule({
  imports: [CommonModule],
  declarations: [ModalContainerComponent],
  providers: [ModalService]
})
export class ModalModule {}
