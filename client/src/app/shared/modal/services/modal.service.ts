import { DOCUMENT } from '@angular/common';
import { ApplicationRef, Inject, Injectable, Renderer2, RendererFactory2, Type } from '@angular/core';

import { ModalContainerComponent } from '../container/modal-container.component';
import { ModalRef } from '../models/modal-ref.model';
import { Modal } from '../models/modal.model';

@Injectable()
export class ModalService {
  private renderer: Renderer2;
  private modalContainer: HTMLElement;

  constructor(
    private appRef: ApplicationRef,
    private rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document
  ) {
    this.setupModalContainerFactory();
  }

  open<T extends Modal>(
    component: Type<T>,
    inputs?: any,
    size?: 'small' | 'large' | 'xl' | 'fullscreen',
    options?: { noBg?: boolean; keepOpen?: boolean }
  ): ModalRef {
    this.setupModalContainerDiv();

    const modalContainerRef = this.appRef.bootstrap(ModalContainerComponent, this.modalContainer);
    modalContainerRef.instance.size = size || 'small';
    modalContainerRef.instance.options = {
      noBg: options?.noBg || false,
      keepOpen: options?.keepOpen || false
    };

    const modalComponentRef = modalContainerRef.instance.createModal(component);

    if (inputs) {
      modalComponentRef.instance.onInjectInputs(inputs);
    } else {
      modalComponentRef.instance.onInjectInputs({});
    }

    const modalRef = new ModalRef(modalContainerRef, modalComponentRef);

    return modalRef;
  }

  private setupModalContainerDiv(): void {
    this.modalContainer = this.renderer.createElement('div');
    this.renderer.appendChild(this.document.body, this.modalContainer);
  }

  private setupModalContainerFactory(): void {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }
}
