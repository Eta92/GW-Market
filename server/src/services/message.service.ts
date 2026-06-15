import { nanoid } from 'nanoid';
import { Server as SocketServer } from 'socket.io';
import { SyncHelper } from '../helpers/sync.helper';
import { Message, MessageType } from '../models/message.model';
import { MongoService } from './mongo.service';
import { ShopService } from './shop.service';

export class MessageService {
  public static messageInit = false;
  public static activeMessageMap: { [key: string]: Array<Message> } = {};
  public static io: SocketServer;

  public static init(io: SocketServer): void {
    this.io = io;
    this.messageInit = true;
    SyncHelper.initMessages();
  }

  public static initMessages(messages: Array<Message>): void {
    //console.log('message found in db : ' + messages.length);
    messages.forEach((message) => {
      if (message && message.uuid) {
        if (!this.activeMessageMap[message.receiverShop]) {
          this.activeMessageMap[message.receiverShop] = [];
        }
        this.activeMessageMap[message.receiverShop].push(message);
      }
    });
  }

  public static getMessages(shopId: string): Array<Message> {
    const shop = ShopService.allShopMap[shopId];
    if (shop) {
      //console.log('message found : ' + (this.activeMessageMap[shop.publicId]?.length || 0));
      return this.activeMessageMap[shop.publicId] || [];
    }
    return [];
  }

  public static readMessage(shopId: string, messageId: string): void {
    const shop = ShopService.allShopMap[shopId];
    if (shop) {
      const message = this.activeMessageMap[shop.publicId]?.find((m) => m.uuid === messageId);
      if (message) {
        message.read = true;
        MongoService.upsertMessage(message);
      }
    }
  }

  public static deleteMessage(shopId: string, messageId: string): void {
    const shop = ShopService.allShopMap[shopId];
    if (shop) {
      const message = this.activeMessageMap[shop.publicId]?.find((m) => m.uuid === messageId);
      if (message) {
        message.deleted = true;
        MongoService.upsertMessage(message);
        this.activeMessageMap[shop.publicId] = this.activeMessageMap[shop.publicId].filter((m) => m.uuid !== messageId);
      }
    }
  }

  public static insertMessage(type: MessageType, senderShopId: string, receiverShopId: string, data?: Array<string>): void {
    const senderShop = ShopService.allShopMap[ShopService.publicShopMap[senderShopId]];
    const receiverShop = ShopService.allShopMap[ShopService.publicShopMap[receiverShopId]];
    if (senderShop && receiverShop) {
      const message = {
        uuid: nanoid(10), // Generate a unique UUID for the message
        type,
        data: data || [],
        senderShop: senderShop.publicId,
        senderName: senderShop.player,
        receiverShop: receiverShop.publicId,
        receiverName: receiverShop.player,
        read: false,
        deleted: false,
        time: Date.now(),
      } as Message;
      MongoService.insertMessage(message);
      this.activeMessageMap[receiverShop.publicId] = this.activeMessageMap[receiverShop.publicId] || [];
      this.activeMessageMap[receiverShop.publicId].push(message);
      this.io.to(receiverShop.uuid).emit('GetNewMessage', message);
    }
  }

  private static allowedManualMessages = [
    MessageType.MEETUP_AT,
    MessageType.MEETUP_OVER,
    MessageType.MEETUP_ACCEPT,
    MessageType.MEETUP_REFUSE,
    MessageType.MEETUP_COUNTER_AT,
    MessageType.MEETUP_COUNTER_OVER,
    MessageType.NEGOCIATE,
    MessageType.NEGOCIATE_ACCEPT,
    MessageType.NEGOCIATE_REFUSE,
    MessageType.NEGOCIATE_COUNTER,
  ];
  public static requestInsertMessage(type: MessageType, uuid: string, receiverShopId: string, data?: Array<string>): void {
    const senderShop = ShopService.allShopMap[uuid];
    const receiverShop = ShopService.allShopMap[ShopService.publicShopMap[receiverShopId]];
    if (senderShop && receiverShop) {
      if (this.allowedManualMessages.includes(type)) {
        this.insertMessage(type, senderShop.publicId, receiverShopId, data);
      }
    }
  }
}
