import { Component } from '@angular/core';
import { ReputationReason } from '@app/models/reputation.model';
import { Modal } from '@shared/modal/models/modal.model';

@Component({
  selector: 'app-negative-modal',
  templateUrl: './negative-modal.component.html',
  styleUrls: ['./negative-modal.component.scss']
})
export class NegativeModalComponent extends Modal {
  constructor() {
    super();
  }

  public ReputationReason = ReputationReason;
  public selectedReason: ReputationReason = ReputationReason.NONE;

  public reasons: ReputationReason[] = [
    ReputationReason.REFUSE,
    ReputationReason.NO_RESPONSE,
    ReputationReason.WRONG_PRICE,
    ReputationReason.WRONG_ITEM,
    ReputationReason.IMPOLITE,
    ReputationReason.NO_AUCTION_SELL,
    ReputationReason.NO_AUCTION_BUY,
    ReputationReason.OTHER
  ];

  onInjectInputs(inputs: any): void {}

  reasonToText(reason: ReputationReason): string {
    switch (reason) {
      case ReputationReason.NONE:
        return 'None';
      case ReputationReason.REFUSE:
        return 'Refused to trade a listed item';
      case ReputationReason.NO_RESPONSE:
        return 'Did not respond to multiple attempts to contact';
      case ReputationReason.WRONG_PRICE:
        return 'Asked for a different price than listed';
      case ReputationReason.WRONG_ITEM:
        return 'Tried to trade me the wrong item (despite telling them)';
      case ReputationReason.IMPOLITE:
        return 'Was impolite, rude or insulting';
      case ReputationReason.NO_AUCTION_SELL:
        return 'Did not accept to sell the item at the end of the auction';
      case ReputationReason.NO_AUCTION_BUY:
        return 'Did not accept to buy the item at the end of the auction';
      case ReputationReason.OTHER:
        return 'Other reason';
      default:
        return 'Unknown reason';
    }
  }

  confirm(reason: ReputationReason): void {
    this.close(reason);
  }

  cancel(): void {
    this.dismiss();
  }
}
