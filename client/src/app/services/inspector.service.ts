import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, debounceTime } from 'rxjs';
import { UtilService } from './util.service';

import { HttpClient } from '@angular/common/http';
import { CurrentSubject } from '@app/helpers/current.subject';
import { PriceInspection } from '@app/models/order.model';
import { ToastrService } from 'ngx-toastr';
import { StoreService } from './store.service';
import { OrderType } from '@app/models/shop.model';

@Injectable()
export class InspectorService {
  private init = false;
  private itemName: string;
  private readySubject = new CurrentSubject<boolean>();
  //private commentsSubscribe
  private inspectorSubject = new CurrentSubject<boolean>();
  private inspectionSubject = new CurrentSubject<PriceInspection>();

  constructor(
    private http: HttpClient,
    private utilService: UtilService,
    private storeService: StoreService,
    private toastrService: ToastrService,
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
