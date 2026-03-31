import { Component, ComponentRef, Type, ViewChild, ViewContainerRef } from '@angular/core';

import { Modal } from '../models/modal.model';

@Component({
  templateUrl: './modal-container.component.html',
  styleUrls: ['./modal-container.component.scss']
})
export class ModalContainerComponent {
  @ViewChild('modalContainer', { read: ViewContainerRef }) private modalContainer: ViewContainerRef;

  public size: string;
  public options: { noBg: boolean; keepOpen: boolean };

  createModal<T extends Modal>(component: Type<T>): ComponentRef<T> {
    this.modalContainer.clear();
    return this.modalContainer.createComponent(component);
  }
}
