import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { Observable, debounceTime } from 'rxjs';
import { UtilService } from './util.service';

import { CurrentSubject } from '@app/helpers/current.subject';
import { Message, MessageType, Tracking } from '@app/models/message.model';
import { ToastrService } from 'ngx-toastr';

const TRACKINGS_KEY = 'trackings';
const LOCAL_MESSAGES_KEY = 'localMessages';

@Injectable()
export class TrackingService {
  private init = false;
  private trackingsSubject = new CurrentSubject<Array<Tracking>>();
  private localMessagesSubject = new CurrentSubject<Array<Message>>();

  constructor(
    private utilService: UtilService,
    private toastrService: ToastrService,
    private socket: Socket,
    private router: Router
  ) {
    this.trackingsSubject.set(this.load<Tracking>(TRACKINGS_KEY));
    this.localMessagesSubject.set(this.load<Message>(LOCAL_MESSAGES_KEY));
    this.utilService.getReady().subscribe(ready => {
      if (ready && !this.init) {
        console.log('tracking init');
        this.init = true;
        this.trackingInit();
      }
    });
  }

  trackingInit(): void {
    this.socket.on('OnlineShop', (publicId: string) => {
      this.onShopOnline(publicId);
    });
    // keep several tabs in sync
    window.addEventListener('storage', event => {
      if (event.key === TRACKINGS_KEY) {
        this.trackingsSubject.set(this.load<Tracking>(TRACKINGS_KEY));
      } else if (event.key === LOCAL_MESSAGES_KEY) {
        this.localMessagesSubject.set(this.load<Message>(LOCAL_MESSAGES_KEY));
      }
    });
  }

  getTrackings(): Observable<Array<Tracking>> {
    return this.trackingsSubject.asObservable().pipe(debounceTime(0));
  }

  getLocalMessages(): Observable<Array<Message>> {
    return this.localMessagesSubject.asObservable().pipe(debounceTime(0));
  }

  isTracked(senderShop: string, itemName?: string): boolean {
    return this.trackingsSubject.value.some(t => this.sameTracking(t, senderShop, itemName));
  }

  // add the tracking, or remove it if it already exists
  async toggleTracking(tracking: Tracking): Promise<void> {
    if (!tracking.senderShop) {
      return;
    }
    const trackings = this.trackingsSubject.value;
    if (this.isTracked(tracking.senderShop, tracking.itemName)) {
      this.saveTrackings(trackings.filter(t => !this.sameTracking(t, tracking.senderShop, tracking.itemName)));
      return;
    }
    if (!(await this.checkPermission())) {
      return;
    }
    this.saveTrackings([...trackings, tracking]);
    const target = tracking.itemName ? `${tracking.senderName} (${tracking.itemName})` : tracking.senderName;
    this.toastrService.info(`You will be notified when ${target} comes online.`, 'Tracking enabled');
  }

  isLocalMessage(message: Message): boolean {
    return [MessageType.ONLINE_ITEM, MessageType.ONLINE_SHOP].includes(message.type);
  }

  // redirect to the item or the shop, then remove the message
  openLocalMessage(message: Message): void {
    if (message.type === MessageType.ONLINE_ITEM && message.data[0]) {
      this.router.navigate(['/item', message.data[0]]);
    } else {
      this.router.navigate(['/shop/showcase'], { queryParams: { public: message.senderShop } });
    }
    this.deleteLocalMessage(message);
  }

  deleteLocalMessage(message: Message): void {
    this.saveLocalMessages(this.localMessagesSubject.value.filter(m => m.uuid !== message.uuid));
  }

  private onShopOnline(publicId: string): void {
    // read storage again in case another tab already consumed the tracking
    const trackings = this.load<Tracking>(TRACKINGS_KEY);
    const consumed = trackings.filter(t => t.senderShop === publicId);
    if (consumed.length === 0) {
      return;
    }
    this.saveTrackings(trackings.filter(t => t.senderShop !== publicId));
    const newMessages: Array<Message> = consumed.map(tracking => ({
      uuid: 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      senderName: tracking.senderName,
      senderShop: tracking.senderShop,
      receiverName: '',
      receiverShop: '',
      time: Date.now(),
      type: tracking.itemName ? MessageType.ONLINE_ITEM : MessageType.ONLINE_SHOP,
      data: tracking.itemName ? [tracking.itemName] : [],
      read: false,
      deleted: false
    }));
    this.saveLocalMessages([...this.load<Message>(LOCAL_MESSAGES_KEY), ...newMessages]);
    newMessages.forEach(message => this.sendNotification(message));
  }

  private sendNotification(message: Message): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    const body =
      message.type === MessageType.ONLINE_ITEM
        ? `${message.senderName} is now online and sells ${message.data[0]}.`
        : `${message.senderName} is now online.`;
    const notification = new Notification('GW Market – Seller online', {
      body,
      icon: '/assets/icons/manifest/icon-192x192.png'
    });
    notification.onclick = () => {
      window.focus();
      this.openLocalMessage(message);
      notification.close();
    };
  }

  private async checkPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      this.toastrService.warning('Desktop notifications are not supported by your browser', 'Notifications unavailable');
      return false;
    }
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      this.toastrService.warning('Notifications are blocked. Please allow them in your browser settings.', 'Permission denied');
      return false;
    }
    return true;
  }

  private sameTracking(tracking: Tracking, senderShop: string, itemName?: string): boolean {
    return tracking.senderShop === senderShop && (tracking.itemName || '') === (itemName || '');
  }

  private saveTrackings(trackings: Array<Tracking>): void {
    localStorage.setItem(TRACKINGS_KEY, JSON.stringify(trackings));
    this.trackingsSubject.set(trackings);
  }

  private saveLocalMessages(messages: Array<Message>): void {
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(messages));
    this.localMessagesSubject.set(messages);
  }

  private load<T>(key: string): Array<T> {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }
}
