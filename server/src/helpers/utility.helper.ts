import { ReputationReason } from '../models/reputation.model';

export class UtilityHelper {
  static copy(item) {
    return JSON.parse(JSON.stringify(item));
  }

  static hash(array) {
    const object = {};
    array.forEach((item, i) => {
      object[item.id] = item;
    });
    return object;
  }

  static normalize = (text: string | null): string => {
    if (text) {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    } else {
      return '';
    }
  };

  static unique<T>(array: T[]): T[] {
    return array.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }

  static reasonToText(reason: ReputationReason): string {
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
}
