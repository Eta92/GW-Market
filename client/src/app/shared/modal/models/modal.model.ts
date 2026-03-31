import { ModalRef } from './modal-ref.model';

export abstract class Modal {
  modalInstance: ModalRef;

  abstract onInjectInputs(inputs: any): void;

  close(output?: any): void {
    this.modalInstance.close(output);
  }

  dismiss(output?: any): void {
    this.modalInstance.dismiss(output);
  }
}
