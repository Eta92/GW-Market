import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, debounceTime } from 'rxjs';
import { UtilService } from './util.service';

import { CurrentSubject } from '@app/helpers/current.subject';
import { Message, MessageType } from '@app/models/message.model';
import { ItemOrder } from '@app/models/order.model';
import { Shop } from '@app/models/shop.model';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class MessageService {
  private init = false;
  //private commentsSubscribe
  private messagesSubject = new CurrentSubject<Array<Message>>();

  constructor(
    private utilService: UtilService,
    private toastrService: ToastrService,
    private socket: Socket
  ) {
    this.utilService.getReady().subscribe(ready => {
      if (ready && !this.init) {
        console.log('message init');
        this.init = true;
        this.messageInit();
      }
    });
  }

  messageInit(): void {
    // sockets
    this.socket.on('GetMessages', data => {
      this.messagesSubject.set(data);
    });
    this.socket.on('GetNewMessage', data => {
      const currentMessages = this.messagesSubject.value || [];
      this.messagesSubject.set([...currentMessages, data]);
      this.toastrService.info('You received a new message', 'New Message', {
        timeOut: 10000
      });
    });
  }

  getMessages(): Observable<Array<Message>> {
    return this.messagesSubject.asObservable().pipe(debounceTime(0));
  }

  sendMessage(uuid: string, order: ItemOrder, type: 'meet-at' | 'meet-over' | 'negociate', content: any): void {
    let messageType: MessageType;
    switch (type) {
      case 'meet-at':
        messageType = MessageType.MEETUP_AT;
        break;
      case 'meet-over':
        messageType = MessageType.MEETUP_OVER;
        break;
      case 'negociate':
        messageType = MessageType.NEGOCIATE;
        break;
    }
    const messageData: Array<string> = [order.item.name];
    switch (type) {
      case 'meet-at':
        messageData.push(new Date(content.from).getTime().toString());
        break;
      case 'meet-over':
        messageData.push(new Date(content.from).getTime().toString(), new Date(content.to).getTime().toString());
        break;
      case 'negociate':
        messageData.push(content.negociate, content.currency);
        break;
    }

    const messageBody = {
      type: messageType,
      uuid,
      receiverShopId: order.shopId,
      messageData
    };
    this.socket.emit('sendMessage', messageBody);
  }

  readMessage(shop: Shop, message: Message): void {
    this.socket.emit('readMessage', shop.uuid, message.uuid);
    const activeMessages = this.messagesSubject.value;
    const messageIndex = activeMessages.findIndex(m => m.uuid === message.uuid);
    if (messageIndex !== -1) {
      activeMessages[messageIndex].read = true;
      this.messagesSubject.set([...activeMessages]);
    }
  }

  deleteMessage(shop: Shop, message: Message): void {
    this.socket.emit('deleteMessage', shop.uuid, message.uuid);
    const activeMessages = this.messagesSubject.value;
    const messageIndex = activeMessages.findIndex(m => m.uuid === message.uuid);
    if (messageIndex !== -1) {
      activeMessages.splice(messageIndex, 1);
      this.messagesSubject.set([...activeMessages]);
    }
  }
}
