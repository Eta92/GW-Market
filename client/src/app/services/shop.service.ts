import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Router } from '@angular/router';
import { Observable, debounceTime } from 'rxjs';
import { UtilService } from './util.service';

import { CurrentSubject } from '@app/helpers/current.subject';
import { Shop, ShopItem } from '@app/models/shop.model';
import { DateTime } from 'luxon';
import { UtilityHelper } from '@app/helpers/utility.helper';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { ItemService } from './item.service';

@Injectable()
export class ShopService {
  private init = false;
  private daybreakLinked = false;
  private daybreakOnline = false;
  //private commentsSubscribe
  private activeShopSubject = new CurrentSubject<Shop>();
  private publicShopSubject = new CurrentSubject<Shop>();

  constructor(
    private http: HttpClient,
    private utilService: UtilService,
    private toastrService: ToastrService,
    private itemService: ItemService,
    private socket: Socket,
    private router: Router
  ) {
    this.utilService.getReady().subscribe(ready => {
      if (ready && !this.init) {
        console.log('shop init');
        this.init = true;
        this.shopInit();
      }
    });
  }

  shopInit(): void {
    // sockets
    this.socket.on('RefreshShop', (shop: Shop) => {
      const activeShop = {
        ...this.activeShopSubject.value,
        uuid: shop.uuid,
        publicId: shop.publicId,
        lastRefresh: shop.lastRefresh,
        daybreakOnline: shop.daybreakOnline,
        authCertified: shop.certified?.includes(this.activeShopSubject.value.player),
        certified: shop.certified,
        items: shop.items
      };
      activeShop.items.forEach(item => {
        item.item = this.itemService.getItemBase(item.name);
      });
      this.activeShopSubject.set(activeShop);
      this.saveShop();
      this.toastrService.success('Shop registration updated', '', {
        timeOut: 5000
      });
      if (!this.daybreakLinked) {
        this.daybreakMaxTry = 3;
        this.maintainDaybreakLink();
      }
    });
    // rest of init
    this.itemService.getReady().subscribe(ready => {
      const shopString = localStorage.getItem('personalShop');
      if (shopString) {
        const shop = JSON.parse(shopString) as Shop;
        shop.items.forEach(item => {
          item.item = this.itemService.getItemBase(item.name);
        });
        this.activeShopSubject.set(shop);
      } else {
        const shop: Shop = {
          player: 'GWTrader',
          items: []
        };
        this.activeShopSubject.set(shop);
      }
    });
    this.socket.on('GetPublicShop', (shop: Shop) => {
      this.publicShopSubject.set(shop);
    });
  }

  addShopItem(item: ShopItem): void {
    const activeShop = this.activeShopSubject.value;
    activeShop.items.push(item);
    this.activeShopSubject.set(activeShop);
    this.saveShop();
  }

  updateShopItem(index: number, item: ShopItem): void {
    const activeShop = this.activeShopSubject.value;
    activeShop.items[index] = item;
    this.activeShopSubject.set(activeShop);
    this.saveShop();
  }

  removeShopItem(index: number): void {
    const activeShop = this.activeShopSubject.value;
    activeShop.items.splice(index, 1);
    this.activeShopSubject.set(activeShop);
    this.saveShop();
  }

  updateShopName(name: string): void {
    const activeShop = this.activeShopSubject.value;
    activeShop.player = name;
    this.activeShopSubject.set(activeShop);
    this.saveShop();
  }

  private saveShop(): void {
    const activeShop = this.activeShopSubject.value;
    localStorage.setItem('personalShop', JSON.stringify(activeShop));
  }

  exportShop(): void {
    const copyShop = UtilityHelper.copy(this.activeShopSubject.value);
    copyShop.items.forEach(item => {
      delete item.item;
      delete item.completed;
      delete item.removed;
    });
    // stupid hotfix cause of name inside items
    copyShop.items = copyShop.items.filter(item => typeof item !== 'string' && item.name);
    const jsonContent = JSON.stringify(copyShop);
    const startDate = DateTime.now();
    const newBlob = new Blob([jsonContent], { type: 'text/json;charset=utf-8;' });
    const data = window.URL.createObjectURL(newBlob);
    const link = document.createElement('a');
    link.href = data;
    link.download = `GWT-Shop-${copyShop.player}-${startDate.toFormat('dd-MM-yyyy')}.json`;
    link.click();
  }

  importShop(importedShop: Shop): void {
    this.activeShopSubject.set(importedShop);
    this.saveShop();
  }

  clearShop(): void {
    const activeShop = this.activeShopSubject.value;
    activeShop.items = [];
    this.activeShopSubject.set(activeShop);
    this.saveShop();
  }

  enableShop(): void {
    this.itemService.resetItemWarnings();
    const activeShop = UtilityHelper.copy(this.activeShopSubject.value);
    activeShop.daybreakOnline = this.daybreakOnline;
    activeShop.items = activeShop.items.filter(item => !item.hidden);
    activeShop.items.forEach(item => {
      delete item.item;
      delete item.completed;
      delete item.removed;
    });
    this.socket.emit('refreshShop', activeShop);
  }

  disableShop(): void {
    const activeShop = this.activeShopSubject.value;
    activeShop.lastRefresh = undefined;
    this.activeShopSubject.set(activeShop);
    this.saveShop();
    this.socket.emit('closeShop', activeShop.uuid);
  }

  getActiveShop(): Observable<Shop> {
    return this.activeShopSubject.asObservable().pipe(debounceTime(0));
  }

  getPublicShop(): Observable<Shop> {
    return this.publicShopSubject.asObservable().pipe(debounceTime(0));
  }

  getdaybreakOnline(): boolean {
    return this.daybreakOnline;
  }

  // Daybreak API
  private daybreakMaxTry = 3;
  private maintainDaybreakLink(): void {
    const activeShop = this.activeShopSubject.value;
    if (!activeShop.lastRefresh) {
      this.daybreakLinked = false;
      return;
    }
    this.daybreakLinked = true;
    try {
      this.http.get('http://localhost:5080/api/v1/rest/character-select').subscribe(data => {
        const currentName = (data as any)?.currentCharacter?.name;
        if (currentName) {
          this.daybreakOnline = true;
          if (activeShop.player !== currentName) {
            activeShop.player = currentName;
            this.activeShopSubject.set(activeShop);
            this.saveShop();
          }
          if (!activeShop.daybreakOnline) {
            this.enableShop();
          }
        }
      });
    } catch (error) {
      this.daybreakOnline = false;
      console.log('failed to connect to daybreak api');
      this.daybreakMaxTry--;
    }
    if (this.daybreakMaxTry > 0) {
      setTimeout(() => {
        this.maintainDaybreakLink();
      }, 60000);
    } else {
      this.daybreakLinked = false;
    }
  }
}
