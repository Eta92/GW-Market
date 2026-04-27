import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, debounceTime } from 'rxjs';
import { UtilService } from './util.service';

import { CurrentSubject } from '@app/helpers/current.subject';
import { Message, MessageType } from '@app/models/message.model';
import { ItemOrder } from '@app/models/order.model';
import { Shop } from '@app/models/shop.model';
import { ReplyModalComponent } from '@shared/components/reply-modal/reply-modal.component';
import { ModalService } from '@shared/modal/services/modal.service';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class MessageService {
  private init = false;
  //private commentsSubscribe
  private messagesSubject = new CurrentSubject<Array<Message>>();

  constructor(
    private modalService: ModalService,
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

  replyToMessage(uuid: string, originalMessage: Message): void {
    const replyOptions = [];
    switch (originalMessage.type) {
      case MessageType.MEETUP_AT:
      case MessageType.MEETUP_OVER:
      case MessageType.MEETUP_COUNTER_AT:
      case MessageType.MEETUP_COUNTER_OVER:
        replyOptions.push(
          MessageType.MEETUP_ACCEPT,
          MessageType.MEETUP_REFUSE,
          MessageType.MEETUP_COUNTER_AT,
          MessageType.MEETUP_COUNTER_OVER
        );
        break;
      case MessageType.NEGOCIATE:
      case MessageType.NEGOCIATE_COUNTER:
        replyOptions.push(MessageType.NEGOCIATE_ACCEPT, MessageType.NEGOCIATE_REFUSE, MessageType.NEGOCIATE_COUNTER);
        break;
      case MessageType.AUCTION_WON:
      case MessageType.AUCTION_END:
        replyOptions.push(MessageType.MEETUP_AT, MessageType.MEETUP_OVER);
        break;
    }
    this.modalService
      .open(ReplyModalComponent, { originalMessage, replyOptions })
      .onResult()
      .subscribe((content: any) => {
        if (content) {
          let messageData: Array<string> = [originalMessage.data[0]]; // item name

          switch (content.messageType) {
            case MessageType.MEETUP_ACCEPT:
            case MessageType.MEETUP_REFUSE:
            case MessageType.NEGOCIATE_ACCEPT:
            case MessageType.NEGOCIATE_REFUSE:
              messageData = originalMessage.data; // reuse original data
              break;
            case MessageType.MEETUP_AT:
            case MessageType.MEETUP_COUNTER_AT:
              messageData.push(new Date(content.from).getTime().toString());
              break;
            case MessageType.MEETUP_OVER:
            case MessageType.MEETUP_COUNTER_OVER:
              messageData.push(new Date(content.from).getTime().toString(), new Date(content.to).getTime().toString());
              break;
            case MessageType.NEGOCIATE_COUNTER:
              messageData.push(content.negociate, content.currency);
              break;
          }

          const messageBody = {
            type: content.messageType,
            uuid,
            receiverShopId: originalMessage.senderShop,
            messageData
          };
          this.socket.emit('sendMessage', messageBody);
        }
      });
  }
}
