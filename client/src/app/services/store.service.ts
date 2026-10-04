import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { Observable, debounceTime } from 'rxjs';
import { UtilService } from './util.service';

import { CurrentSubject } from '@app/helpers/current.subject';
import { Auction } from '@app/models/auction.model';
import { ChangeLog } from '@app/models/changelog.model';
import { BasicItem } from '@app/models/item.model';
import { SearchFilter, SearchResult } from '@app/models/order.model';
import { Overview } from '@app/models/overview.model';
import { ShopItem, ShopLink } from '@app/models/shop.model';

@Injectable()
export class StoreService {
  private init = false;
  private searchedItemName = '';
  //private commentsSubscribe
  private overlaySubject = new CurrentSubject<boolean>();
  private searchItemSubject = new CurrentSubject<Array<BasicItem>>();
  private searchShopSubject = new CurrentSubject<Array<ShopLink>>();
  private itemOrdersSubject = new CurrentSubject<Array<ShopItem>>();
  private itemAuctionsSubject = new CurrentSubject<Array<Auction>>();
  private lastItemsSubject = new CurrentSubject<Array<ShopItem>>();
  private lastAuctionsSubject = new CurrentSubject<Array<Auction>>();
  private shopSecretSubject = new CurrentSubject<{ uuid: string; secret: string }>();
  private searchOrdersSubject = new CurrentSubject<SearchResult>();
  private overviewSubject = new CurrentSubject<Overview>();
  private changelogsSubject = new CurrentSubject<Array<ChangeLog>>();

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
    this.socket.on('GetItemSearch', (data: Array<BasicItem>) => {
      this.searchItemSubject.set(data);
    });
    this.socket.on('GetShopSearch', (data: Array<ShopLink>) => {
      this.searchShopSubject.set(data);
    });
    this.socket.on('GetItemOrders', (data: Array<ShopItem>, itemName: string) => {
      if (itemName === this.searchedItemName) {
        this.itemOrdersSubject.set(data);
      }
    });
    this.socket.on('GetItemAuctions', (data: Array<Auction>, itemName: string) => {
      if (itemName === this.searchedItemName) {
        this.itemAuctionsSubject.set(data);
      }
    });
    // the server forgets item rooms on reconnect, so join the tracked item again
    this.socket.on('connect', () => {
      if (this.searchedItemName) {
        this.socket.emit('trackItem', this.searchedItemName);
        this.socket.emit('getItemOrders', this.searchedItemName);
      }
    });
    this.socket.on('GetLastItems', (data: Array<ShopItem>) => {
      this.lastItemsSubject.set(data);
    });
    this.socket.on('GetLastAuctions', (data: Array<Auction>) => {
      this.lastAuctionsSubject.set(data);
    });
    this.socket.on('ShopCertificationSecret', (certificate: { uuid: string; secret: string }) => {
      this.shopSecretSubject.set(certificate);
    });
    this.socket.on('SearchOrdersResult', (data: SearchResult) => {
      this.searchOrdersSubject.set(data);
    });
    this.socket.on('LoadMoreResults', (data: SearchResult) => {
      const globalResults = [...this.searchOrdersSubject.value.orders, ...data.orders];
      this.searchOrdersSubject.set({ ...data, orders: globalResults });
    });
    this.socket.on('GetOverview', (data: Overview) => {
      this.overviewSubject.set(data);
    });
    this.socket.on('GetChangeLogs', (data: Array<ChangeLog>) => {
      this.changelogsSubject.set(data);
    });
    this.socket.emit('getChangeLogs');
  }

  requestSocket(field: string, option?: any): void {
    if (this.init) {
      this.socket.emit(field, option);
    } else {
      this.utilService.getReady().subscribe(() => {
        this.socket.emit(field, option);
      });
    }
  }

  secureRequestSocket(field: string, option?: any): void {
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

  trackItem(name: string): void {
    if (this.searchedItemName && this.searchedItemName !== name) {
      this.requestSocket('untrackItem', this.searchedItemName);
    }
    this.searchedItemName = name;
    // drop the previous item's offers so they never show under this item
    this.itemOrdersSubject.set([]);
    this.itemAuctionsSubject.set([]);
    this.requestSocket('getItemOrders', name);
    this.requestSocket('trackItem', name);
  }

  untrackItem(name: string): void {
    if (this.searchedItemName === name) {
      this.searchedItemName = '';
    }
    this.requestSocket('untrackItem', name);
  }

  setOverlay(value: boolean): void {
    this.overlaySubject.set(value);
  }

  getOverlay(): Observable<boolean> {
    return this.overlaySubject.asObservable().pipe(debounceTime(0));
  }

  getSearchItems(): Observable<Array<BasicItem>> {
    return this.searchItemSubject.asObservable().pipe(debounceTime(0));
  }

  getSearchShops(): Observable<Array<ShopLink>> {
    return this.searchShopSubject.asObservable().pipe(debounceTime(0));
  }

  getItemOrders(): Observable<Array<ShopItem>> {
    return this.itemOrdersSubject.asObservable().pipe(debounceTime(0));
  }

  getItemAuctions(): Observable<Array<Auction>> {
    return this.itemAuctionsSubject.asObservable().pipe(debounceTime(0));
  }

  getLastItems(): Observable<Array<ShopItem>> {
    return this.lastItemsSubject.asObservable().pipe(debounceTime(0));
  }

  getLastAuctions(): Observable<Array<Auction>> {
    return this.lastAuctionsSubject.asObservable().pipe(debounceTime(0));
  }

  getShopSecret(): Observable<{ uuid: string; secret: string }> {
    return this.shopSecretSubject.asObservable().pipe(debounceTime(0));
  }

  getOverview(): Observable<Overview> {
    return this.overviewSubject.asObservable().pipe(debounceTime(0));
  }

  getChangeLogs(): Observable<Array<ChangeLog>> {
    return this.changelogsSubject.asObservable().pipe(debounceTime(0));
  }

  // ================================
  // GLOBAL SEARCH
  // ================================

  searchOrders(filter: SearchFilter): void {
    if (this.init) {
      this.socket.emit('searchOrders', filter);
    } else {
      this.utilService.getReady().subscribe(() => {
        this.socket.emit('searchOrders', filter);
      });
    }
  }

  loadMoreOrders(previousResult: SearchResult): void {
    this.socket.emit('loadMoreResults', previousResult);
  }

  getSearchOrders(): Observable<SearchResult> {
    return this.searchOrdersSubject.asObservable().pipe(debounceTime(0));
  }

  resetSearchOrders(): void {
    this.searchOrdersSubject.set(null);
  }
}
