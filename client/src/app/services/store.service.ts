import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Router } from '@angular/router';
import { Observable, debounceTime } from 'rxjs';
import { UtilService } from './util.service';

import { CurrentSubject } from '@app/helpers/current.subject';
import { Item, ShopItem } from '@app/models/shop.model';

@Injectable()
export class StoreService {
  private init = false;
  //private commentsSubscribe
  private searchItemSubject = new CurrentSubject<Array<Item>>();
  private itemDetailSubject = new CurrentSubject<Item>();
  private itemsDetailSubject = new CurrentSubject<Array<Item>>();
  private itemOrdersSubject = new CurrentSubject<Array<ShopItem>>();
  private lastItemsSubject = new CurrentSubject<Array<ShopItem>>();
  private shopSecretSubject = new CurrentSubject<{ uuid: string; secret: string }>();

  constructor(
    private utilService: UtilService,
    private socket: Socket,
    private router: Router
  ) {
    this.utilService.getReady().subscribe(ready => {
      if (ready && !this.init) {
        console.log('store init');
        this.init = true;
        this.storeInit();
      }
    });
  }

  storeInit(): void {
    this.socket.on('GetItemSearch', (data: Array<Item>) => {
      this.searchItemSubject.set(data);
    });
    this.socket.on('GetItemDetails', (data: Item) => {
      this.itemDetailSubject.set(data);
    });
    this.socket.on('GetItemsDetails', (data: Array<Item>) => {
      this.itemsDetailSubject.set(data);
    });
    this.socket.on('GetItemOrders', (data: Array<ShopItem>) => {
      this.itemOrdersSubject.set(data);
    });
    this.socket.on('GetLastItems', (data: Array<ShopItem>) => {
      this.lastItemsSubject.set(data);
    });
    this.socket.on('ShopCertificationSecret', (certificate: { uuid: string; secret: string }) => {
      this.shopSecretSubject.set(certificate);
    });
  }

  requestSocket(field: string, option?: number | string): void {
    if (this.init) {
      this.socket.emit(field, option);
    } else {
      this.utilService.getReady().subscribe(() => {
        this.socket.emit(field, option);
      });
    }
  }

  secureRequestSocket(field: string, option?: number): void {
    if (this.init) {
      const password = localStorage.getItem('password');
      // if (password) {
      this.socket.emit(field, password, option);
      // }
    } else {
      this.utilService.getReady().subscribe(ready => {
        const password = localStorage.getItem('password');
        // if (password) {
        this.socket.emit(field, password, option);
        // }
      });
    }
  }

  getSearchItems(): Observable<Array<Item>> {
    return this.searchItemSubject.asObservable().pipe(debounceTime(0));
  }

  getItemDetails(): Observable<Item> {
    return this.itemDetailSubject.asObservable().pipe(debounceTime(0));
  }
  resetItemDetails(): void {
    this.itemDetailSubject.set(null);
  }

  getItemsDetails(): Observable<Array<Item>> {
    return this.itemsDetailSubject.asObservable().pipe(debounceTime(0));
  }

  getItemOrders(): Observable<Array<ShopItem>> {
    return this.itemOrdersSubject.asObservable().pipe(debounceTime(0));
  }

  getLastItems(): Observable<Array<ShopItem>> {
    return this.lastItemsSubject.asObservable().pipe(debounceTime(0));
  }

  getShopSecret(): Observable<{ uuid: string; secret: string }> {
    return this.shopSecretSubject.asObservable().pipe(debounceTime(0));
  }
}
