import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, debounceTime, of } from 'rxjs';
import { UtilService } from './util.service';

import { CurrentSubject } from '@app/helpers/current.subject';
import { UtilityHelper } from '@app/helpers/utility.helper';
import { AvailableTree, TimeOrderCounts } from '@app/models/tree.model';
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
  private availableOrders: {
    [key: string]: TimeOrderCounts;
  } = {};
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
              item.sellNow = orders.sellNow || 0;
              item.buyNow = orders.buyNow || 0;
              item.sellDay = orders.sellDay || 0;
              item.buyDay = orders.buyDay || 0;
              item.sellWeek = orders.sellWeek || 0;
              item.buyWeek = orders.buyWeek || 0;
            } else {
              item.sellNow = 0;
              item.buyNow = 0;
              item.sellDay = 0;
              item.buyDay = 0;
              item.sellWeek = 0;
              item.buyWeek = 0;
            }
          });
          category.sellNow = category.items.reduce((sum, i) => sum + (i.sellNow || 0), 0);
          category.buyNow = category.items.reduce((sum, i) => sum + (i.buyNow || 0), 0);
          category.sellDay = category.items.reduce((sum, i) => sum + (i.sellDay || 0), 0);
          category.buyDay = category.items.reduce((sum, i) => sum + (i.buyDay || 0), 0);
          category.sellWeek = category.items.reduce((sum, i) => sum + (i.sellWeek || 0), 0);
          category.buyWeek = category.items.reduce((sum, i) => sum + (i.buyWeek || 0), 0);
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
        family.sellNow = family.categories.reduce((sum, c) => sum + (c.sellNow || 0), 0);
        family.buyNow = family.categories.reduce((sum, c) => sum + (c.buyNow || 0), 0);
        family.sellDay = family.categories.reduce((sum, c) => sum + (c.sellDay || 0), 0);
        family.buyDay = family.categories.reduce((sum, c) => sum + (c.buyDay || 0), 0);
        family.sellWeek = family.categories.reduce((sum, c) => sum + (c.sellWeek || 0), 0);
        family.buyWeek = family.categories.reduce((sum, c) => sum + (c.buyWeek || 0), 0);
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
      activeTree.sellNow = activeTree.families.reduce((sum, f) => sum + (f.sellNow || 0), 0);
      activeTree.buyNow = activeTree.families.reduce((sum, f) => sum + (f.buyNow || 0), 0);
      activeTree.sellDay = activeTree.families.reduce((sum, f) => sum + (f.sellDay || 0), 0);
      activeTree.buyDay = activeTree.families.reduce((sum, f) => sum + (f.buyDay || 0), 0);
      activeTree.sellWeek = activeTree.families.reduce((sum, f) => sum + (f.sellWeek || 0), 0);
      activeTree.buyWeek = activeTree.families.reduce((sum, f) => sum + (f.buyWeek || 0), 0);
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
