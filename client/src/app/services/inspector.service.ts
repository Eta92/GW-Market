import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, debounceTime } from 'rxjs';
import { UtilService } from './util.service';

import { CurrentSubject } from '@app/helpers/current.subject';
import { PriceInspection } from '@app/models/order.model';
import { OrderType } from '@app/models/shop.model';
import { HistoryModalComponent } from '@shared/components/history-modal/history-modal.component';
import { ModalService } from '@shared/modal/services/modal.service';

@Injectable()
export class InspectorService {
  private init = false;
  private itemName: string;
  //private commentsSubscribe
  private inspectorSubject = new CurrentSubject<boolean>();
  private inspectionSubject = new CurrentSubject<PriceInspection>();

  constructor(
    private utilService: UtilService,
    private modalService: ModalService,
    private socket: Socket
  ) {
    this.utilService.getReady().subscribe(ready => {
      if (ready && !this.init) {
        console.log('item init');
        this.init = true;
        this.itemInit();
      }
    });
  }

  itemInit(): void {
    // sockets
    this.socket.on('GetPriceInspection', data => {
      this.inspectionSubject.set({ ...data, itemName: this.itemName });
    });
    this.socket.on('GetPriceHistory', data => {
      this.modalService
        .open(
          HistoryModalComponent,
          {
            name: data[0]?.name || this.itemName,
            history: data
          },
          'footer'
        )
        .onResult()
        .subscribe();
    });
  }

  toggleInspector(active: boolean): void {
    this.inspectorSubject.set(active);
  }

  requestInspection(itemName: string, orderType: OrderType): void {
    this.itemName = itemName;
    this.socket.emit('getPriceInspection', itemName, orderType);
  }

  getInspectorStatus(): Observable<boolean> {
    return this.inspectorSubject.asObservable().pipe(debounceTime(0));
  }

  getPriceInspection(): Observable<PriceInspection> {
    return this.inspectionSubject.asObservable().pipe(debounceTime(0));
  }
}
