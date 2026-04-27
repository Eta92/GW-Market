import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Message, MessageType } from '@app/models/message.model';
import { ItemService } from '@app/services/item.service';
import { ToggleOption } from '@app/shared/components/toggle-group/toggle-group.component';
import { Modal } from '@shared/modal/models/modal.model';

@Component({
  selector: 'app-reply-modal',
  templateUrl: './reply-modal.component.html',
  styleUrls: ['./reply-modal.component.scss']
})
export class ReplyModalComponent extends Modal {
  public MessageType = MessageType;
  public originalMessage: Message | null = null;
  public replyOptions: MessageType[] = [];
  public selectedMessageType: MessageType | null = null;
  public replyToggleOptions: ToggleOption[] = [];
  public replyForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private itemService: ItemService
  ) {
    super();
    this.replyForm = this.fb.group({
      from: [null],
      to: [null],
      negociate: [null],
      currency: ['ectos']
    });
  }

  onInjectInputs(inputs: { originalMessage: Message; replyOptions: MessageType[] }): void {
    this.originalMessage = inputs.originalMessage;
    this.replyOptions = inputs.replyOptions;
    this.replyToggleOptions = this.replyOptions.map(opt => ({
      value: opt,
      label: this.replyTypeLabel(opt),
      icon: this.replyTypeIcon(opt)
    }));
    if (this.replyOptions.length > 0) {
      this.selectedMessageType = this.replyOptions[0];
    }
  }

  get isMeetAt(): boolean {
    return this.selectedMessageType === MessageType.MEETUP_AT;
  }

  get isMeetOver(): boolean {
    return this.selectedMessageType === MessageType.MEETUP_OVER;
  }

  get isCounterAt(): boolean {
    return this.selectedMessageType === MessageType.MEETUP_COUNTER_AT;
  }

  get isCounterOver(): boolean {
    return this.selectedMessageType === MessageType.MEETUP_COUNTER_OVER;
  }

  get isNegociateCounter(): boolean {
    return this.selectedMessageType === MessageType.NEGOCIATE_COUNTER;
  }

  isAcceptOrRefuse(): boolean {
    return (
      this.selectedMessageType === MessageType.MEETUP_ACCEPT ||
      this.selectedMessageType === MessageType.MEETUP_REFUSE ||
      this.selectedMessageType === MessageType.NEGOCIATE_ACCEPT ||
      this.selectedMessageType === MessageType.NEGOCIATE_REFUSE
    );
  }

  replyTypeLabel(type: MessageType): string {
    switch (type) {
      case MessageType.MEETUP_AT:
        return 'Time slot';
      case MessageType.MEETUP_OVER:
        return 'Time window';
      case MessageType.MEETUP_ACCEPT:
        return 'Accept';
      case MessageType.MEETUP_REFUSE:
        return 'Refuse';
      case MessageType.MEETUP_COUNTER_AT:
        return 'Counter (slot)';
      case MessageType.MEETUP_COUNTER_OVER:
        return 'Counter (window)';
      case MessageType.NEGOCIATE_ACCEPT:
        return 'Accept';
      case MessageType.NEGOCIATE_REFUSE:
        return 'Refuse';
      case MessageType.NEGOCIATE_COUNTER:
        return 'Counter offer';
      default:
        return 'Unknown';
    }
  }

  replyTypeIcon(type: MessageType): string {
    switch (type) {
      case MessageType.MEETUP_AT:
        return 'fa-calendar-day';
      case MessageType.MEETUP_OVER:
        return 'fa-calendar-alt';
      case MessageType.MEETUP_ACCEPT:
      case MessageType.NEGOCIATE_ACCEPT:
        return 'fa-check';
      case MessageType.MEETUP_REFUSE:
      case MessageType.NEGOCIATE_REFUSE:
        return 'fa-times';
      case MessageType.MEETUP_COUNTER_AT:
      case MessageType.MEETUP_COUNTER_OVER:
      case MessageType.NEGOCIATE_COUNTER:
        return 'fa-exchange-alt';
      default:
        return 'fa-reply';
    }
  }

  getImageSource(): string {
    const itemName = this.originalMessage?.data?.[0];
    return itemName ? this.itemService?.getItemImage(itemName) || '' : '';
  }

  senderName(): string {
    return this.originalMessage?.senderName || 'the player';
  }

  sendReply(): void {
    if (this.selectedMessageType === null) return;
    const formValue = this.replyForm.value;
    this.close({ messageType: this.selectedMessageType, ...formValue });
  }

  cancel(): void {
    this.dismiss();
  }
}
