import { ComponentRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { ModalContainerComponent } from '../container/modal-container.component';

import { Modal } from './modal.model';

export class ModalRef {
  private result$ = new Subject<any>();

  constructor(
    private modalContainer: ComponentRef<ModalContainerComponent>,
    private modal: ComponentRef<Modal>
  ) {
    this.modal.instance.modalInstance = this;
  }

  close(output: any): void {
    this.result$.next(output);
    if (!this.modalContainer.instance.options?.keepOpen) {
      this.destroy$();
    }
  }

  dismiss(output: any): void {
    if (output) {
      this.result$.error(output);
    }
    this.destroy$();
  }

  destroy(): void {
    this.modal.destroy();
    this.modalContainer.destroy();
  }

  onResult(): Observable<any> {
    return this.result$.asObservable();
  }

  private destroy$(): void {
    this.modal.destroy();
    this.modalContainer.destroy();
    this.result$.complete();
  }
}
