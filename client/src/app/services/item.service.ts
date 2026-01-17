import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, debounceTime, of } from 'rxjs';
import { UtilService } from './util.service';

import { CurrentSubject } from '@app/helpers/current.subject';
import { UtilityHelper } from '@app/helpers/utility.helper';
import { AvailableTree } from '@app/models/tree.model';
import { HttpClient } from '@angular/common/http';
import { StoreService } from './store.service';
import { ToastrService } from 'ngx-toastr';
import { BasicItem } from '@app/models/shop.model';

@Injectable()
export class ItemService {
  private init = false;
  private treeLoaded = false;
  private readySubject = new CurrentSubject<boolean>();
  //private commentsSubscribe
  private itemJsonUrl = 'assets/data.json';
  private itemJsonData: AvailableTree;
  private itemNameBase: { [key: string]: BasicItem } = {};
  private warningMap: { [key: string]: boolean } = {};
  private availableOrders: { [key: string]: { name: string; sellOrders: number; buyOrders: number; sellOrdersOnline?: number; buyOrdersOnline?: number; sellOrdersToday?: number; buyOrdersToday?: number; sellOrdersWeek?: number; buyOrdersWeek?: number } } = {};
  private availableTreeSubject = new CurrentSubject<AvailableTree>();

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
    // json
    this.http.get(this.itemJsonUrl).subscribe(data => {
      this.itemJsonData = data as AvailableTree;
      this.loadAvailableTree();
    });
    // sockets
    this.socket.on('GetAvailableOrders', data => {
      this.availableOrders = data;
      this.loadAvailableTree();
    });
    // request initial data
    this.socket.emit('getAvailableOrders');
  }

  loadAvailableTree(): void {
    if (this.itemJsonData) {
      const activeTree = UtilityHelper.copy(this.itemJsonData) as AvailableTree;
      activeTree.families.forEach(family => {
        family.categories.forEach(category => {
          this.itemNameBase[category.name] = {
            name: category.name,
            category: category.name,
            family: family.name,
            img: '../../../assets/items/' + family.name + '/' + category.name.replace(/ /g, '_') + '.png'
          };
          category.items.forEach(item => {
            this.itemNameBase[item.name] = {
              name: item.name,
              category: category.name,
              family: family.name,
              img: item.img
                ? '../../../assets/items/' + family.name + '/' + item.img.replace(/ /g, '_') + '.png'
                : '../../../assets/items/' + family.name + '/' + item.name.replace(/ /g, '_') + '.png'
            };
            const orders = this.availableOrders?.[item.name];
            if (orders) {
              item.sellOrders = orders.sellOrders;
              item.buyOrders = orders.buyOrders;
              item.sellOrdersOnline = orders.sellOrdersOnline || 0;
              item.buyOrdersOnline = orders.buyOrdersOnline || 0;
              item.sellOrdersToday = orders.sellOrdersToday || 0;
              item.buyOrdersToday = orders.buyOrdersToday || 0;
              item.sellOrdersWeek = orders.sellOrdersWeek || 0;
              item.buyOrdersWeek = orders.buyOrdersWeek || 0;
            } else {
              item.sellOrders = 0;
              item.buyOrders = 0;
              item.sellOrdersOnline = 0;
              item.buyOrdersOnline = 0;
              item.sellOrdersToday = 0;
              item.buyOrdersToday = 0;
              item.sellOrdersWeek = 0;
              item.buyOrdersWeek = 0;
            }
          });
          category.sellOrders = category.items.reduce((sum, i) => sum + (i.sellOrders || 0), 0);
          category.buyOrders = category.items.reduce((sum, i) => sum + (i.buyOrders || 0), 0);
          category.sellOrdersOnline = category.items.reduce((sum, i) => sum + (i.sellOrdersOnline || 0), 0);
          category.buyOrdersOnline = category.items.reduce((sum, i) => sum + (i.buyOrdersOnline || 0), 0);
          category.sellOrdersToday = category.items.reduce((sum, i) => sum + (i.sellOrdersToday || 0), 0);
          category.buyOrdersToday = category.items.reduce((sum, i) => sum + (i.buyOrdersToday || 0), 0);
          category.sellOrdersWeek = category.items.reduce((sum, i) => sum + (i.sellOrdersWeek || 0), 0);
          category.buyOrdersWeek = category.items.reduce((sum, i) => sum + (i.buyOrdersWeek || 0), 0);
          category.previews = [];
          while (category.previews.length < 4 && category.previews.length < category.items.length) {
            const randomIndex = Math.floor(Math.random() * category.items.length);
            const previewItem = category.items[randomIndex];
            const iconName = previewItem?.img || previewItem?.name;
            // infinite loop for upgrades with same icon
            if (iconName /*&& !category.previews.includes(iconName)*/) {
              if (!this.itemNameBase[iconName]) {
                this.itemNameBase[iconName] = {
                  name: iconName,
                  category: category.name,
                  family: family.name,
                  img: '../../../assets/items/' + family.name + '/' + iconName + '.png'
                };
              }
              category.previews.push(iconName);
            }
          }
        });
        family.sellOrders = family.categories.reduce((sum, c) => sum + (c.sellOrders || 0), 0);
        family.buyOrders = family.categories.reduce((sum, c) => sum + (c.buyOrders || 0), 0);
        family.sellOrdersOnline = family.categories.reduce((sum, c) => sum + (c.sellOrdersOnline || 0), 0);
        family.buyOrdersOnline = family.categories.reduce((sum, c) => sum + (c.buyOrdersOnline || 0), 0);
        family.sellOrdersToday = family.categories.reduce((sum, c) => sum + (c.sellOrdersToday || 0), 0);
        family.buyOrdersToday = family.categories.reduce((sum, c) => sum + (c.buyOrdersToday || 0), 0);
        family.sellOrdersWeek = family.categories.reduce((sum, c) => sum + (c.sellOrdersWeek || 0), 0);
        family.buyOrdersWeek = family.categories.reduce((sum, c) => sum + (c.buyOrdersWeek || 0), 0);
        family.previews = [];
        // there is no family with less then 4 items
        let famtry = 0;
        while (family.previews.length < 4 /*&& family.previews.length < family.categories.length*/) {
          const randomIndex = Math.floor(Math.random() * family.categories.length);
          const previewCategory = family.categories[randomIndex];
          if (previewCategory && previewCategory.previews.length > 0) {
            const randomItemIndex = Math.floor(Math.random() * previewCategory.previews.length);
            const previewItemName = previewCategory.previews[randomItemIndex];
            if (previewItemName && (!family.previews.includes(previewItemName) || famtry > 10)) {
              family.previews.push(previewItemName);
            } else {
              famtry++;
            }
          }
        }
      });
      activeTree.sellOrders = activeTree.families.reduce((sum, f) => sum + (f.sellOrders || 0), 0);
      activeTree.buyOrders = activeTree.families.reduce((sum, f) => sum + (f.buyOrders || 0), 0);
      activeTree.sellOrdersOnline = activeTree.families.reduce((sum, f) => sum + (f.sellOrdersOnline || 0), 0);
      activeTree.buyOrdersOnline = activeTree.families.reduce((sum, f) => sum + (f.buyOrdersOnline || 0), 0);
      activeTree.sellOrdersToday = activeTree.families.reduce((sum, f) => sum + (f.sellOrdersToday || 0), 0);
      activeTree.buyOrdersToday = activeTree.families.reduce((sum, f) => sum + (f.buyOrdersToday || 0), 0);
      activeTree.sellOrdersWeek = activeTree.families.reduce((sum, f) => sum + (f.sellOrdersWeek || 0), 0);
      activeTree.buyOrdersWeek = activeTree.families.reduce((sum, f) => sum + (f.buyOrdersWeek || 0), 0);
      this.availableTreeSubject.next(activeTree);
      this.treeLoaded = true;
      this.setReady();
    }
  }

  getDirectTree(): AvailableTree {
    return this.itemJsonData;
  }

  getAvailableTree(): Observable<AvailableTree> {
    return this.availableTreeSubject.asObservable().pipe(debounceTime(0));
  }

  resetItemWarnings(): void {
    this.warningMap = {};
  }

  getItemImage(name: string): string {
    if (!this.itemNameBase[name]) {
      if (this.treeLoaded && this.warningMap[name] !== true) {
        this.toastrService.warning(`The item ${name} seems to be outdated, please update it.`);
        this.warningMap[name] = true;
      }
      return '';
    } else {
      return this.itemNameBase[name].img;
    }
  }

  getItemBase(name: string): BasicItem | null {
    if (!this.itemNameBase[name]) {
      if (this.treeLoaded && this.warningMap[name] !== true) {
        this.toastrService.warning(`The item ${name} seems to be outdated, please update it.`);
        this.warningMap[name] = true;
      }
      return null;
    } else {
      return this.itemNameBase[name];
    }
  }

  setReady(): void {
    this.treeLoaded = true;
    this.readySubject.set(true);
  }

  getReady(): Observable<boolean> {
    if (this.treeLoaded) {
      return of(true);
    } else {
      return this.readySubject.asObservable().pipe(debounceTime(0));
    }
  }
}
