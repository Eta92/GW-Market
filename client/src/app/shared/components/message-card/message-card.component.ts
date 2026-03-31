import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UtilityHelper } from '@app/helpers/utility.helper';
import { Message, MessageType } from '@app/models/message.model';
import { Price } from '@app/models/shop.model';
import { ItemService } from '@app/services/item.service';

@Component({
  selector: 'app-message-card',
  templateUrl: './message-card.component.html',
  styleUrls: ['./message-card.component.scss']
})
export class MessageCardComponent {
  @Input() message: Message;

  @Output() readMessage = new EventEmitter<Message>();
  @Output() deleteMessage = new EventEmitter<Message>();

  public deleting = false;

  constructor(private itemService: ItemService) {}

  onMessageClick(): void {
    this.readMessage.emit(this.message);
  }

  onRemoveClick(): void {
    if (!this.deleting) {
      this.deleting = true;
    } else {
      this.deleteMessage.emit(this.message);
    }
  }

  onRemoveLeave(): void {
    this.deleting = false;
  }

  getMessageTitle(): string {
    switch (this.message.type) {
      case MessageType.MEETUP_AT:
      case MessageType.MEETUP_OVER:
        return 'Trade Meetup Proposal';
      case MessageType.NEGOCIATE:
        return 'Offer Negotiation';
      case MessageType.REPUTATION_UP:
        return 'Reputation Gained';
      case MessageType.REPUTATION_DOWN:
        return 'Reputation Lost';
      case MessageType.AUCTION_WON:
        return 'Auction Won';
      case MessageType.AUCTION_LOST:
        return 'Auction Lost';
      case MessageType.AUCTION_OUTBID:
        return 'Outbid in Auction';
      case MessageType.AUCTION_END:
        return 'Auction Success';
      case MessageType.AUCTION_FAIL:
        return 'Auction Failure';
    }
    return '';
  }

  getMessageContent(): string {
    const data = this.message.data;
    switch (this.message.type) {
      case MessageType.MEETUP_AT:
        return (
          'The player ' +
          this.message.senderName +
          ' proposed a trade meetup for the item ' +
          data[0] +
          ' at ' +
          new Date(parseInt(data[1])).toLocaleString() +
          '. Try to connect at this time to complete the trade.'
        );
      case MessageType.MEETUP_OVER:
        return (
          'The player ' +
          this.message.senderName +
          ' proposed a trade meetup for the item ' +
          data[0] +
          ' from ' +
          new Date(parseInt(data[1])).toLocaleString() +
          ' to ' +
          new Date(parseInt(data[2])).toLocaleString() +
          '. Try to connect during this time frame to complete the trade.'
        );
      case MessageType.NEGOCIATE:
        return (
          'The player ' +
          this.message.senderName +
          ' proposed a negociated offer for the item ' +
          data[0] +
          ' with a price of ' +
          data[1] +
          ' ' +
          UtilityHelper.priceToString(parseInt(data[2]) as Price) +
          '. Try to connect with them to accept or refuse the offer.'
        );
      case MessageType.REPUTATION_UP:
        return 'You received a positive reputation vote from ' + this.message.senderName + '. Feel free to send them a vote as well.';
      case MessageType.REPUTATION_DOWN:
        return 'You sadly received a negative reputation vote  for the reason: "' + data[2] + '". We hope this is an helpful feedback.';
      case MessageType.AUCTION_WON:
        return (
          'Congratulations! You won the auction for ' +
          data[0] +
          ' with a bid of ' +
          data[1] +
          ' ' +
          UtilityHelper.priceToString(parseInt(data[2]) as Price) +
          '. You can contact the player ' +
          this.message.senderName +
          ' to trade your item.'
        );
      case MessageType.AUCTION_LOST:
        return (
          'You unfortunately lost the auction for ' +
          data[0] +
          ' which reached a bid of ' +
          data[1] +
          ' ' +
          UtilityHelper.priceToString(parseInt(data[2]) as Price) +
          '. Good luck for the others!'
        );
      case MessageType.AUCTION_OUTBID:
        return (
          'You have been outbid in the auction for ' +
          data[0] +
          ' by the player ' +
          data[1] +
          ' who offered ' +
          data[2] +
          ' ' +
          UtilityHelper.priceToString(parseInt(data[3]) as Price)
        );
      case MessageType.AUCTION_END:
        return (
          'The auction for ' +
          data[0] +
          ' has succesfuly ended with a bid of ' +
          data[1] +
          ' ' +
          UtilityHelper.priceToString(parseInt(data[2]) as Price) +
          '. You can contact the winner ' +
          this.message.senderName +
          ' to trade your item.'
        );
      case MessageType.AUCTION_FAIL:
        return (
          'The auction for ' + data[0] + ' has ended without any bids. You can try to relist it or lower the price to attract more players.'
        );
    }
    return '';
  }

  isContactPossible(): boolean {
    return [
      MessageType.MEETUP_AT,
      MessageType.MEETUP_OVER,
      MessageType.NEGOCIATE,
      MessageType.REPUTATION_UP,
      MessageType.AUCTION_WON,
      MessageType.AUCTION_END
    ].includes(this.message.type);
  }

  getPlayerLink(): string {
    return 'shop/showcase?public=' + this.message.senderShop;
  }

  getItemLink(): string {
    if (this.message.data.length > 0) {
      return 'item/' + this.message.data[0];
    }
    return '';
  }

  isItem(): boolean {
    return ![MessageType.REPUTATION_UP, MessageType.REPUTATION_DOWN].includes(this.message.type);
  }

  getImageSource(itemName: string): string {
    return this.itemService?.getItemImage(itemName) || '';
  }
}
