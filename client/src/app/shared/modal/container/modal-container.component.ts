import { Component, ComponentRef, Type, ViewChild, ViewContainerRef } from '@angular/core';

import { ModalRef } from '../models/modal-ref.model';
import { Modal } from '../models/modal.model';

@Component({
  templateUrl: './modal-container.component.html',
  styleUrls: ['./modal-container.component.scss']
})
export class ModalContainerComponent {
  @ViewChild('modalContainer', { read: ViewContainerRef }) private modalContainer: ViewContainerRef;

  public size: string;
  public options: { noBg: boolean; keepOpen: boolean };
  public modalRef: ModalRef;

  createModal<T extends Modal>(component: Type<T>): ComponentRef<T> {
    this.modalContainer.clear();
    return this.modalContainer.createComponent(component);
  }

  close(): void {
    this.modalRef?.dismiss(undefined);
  }
}
