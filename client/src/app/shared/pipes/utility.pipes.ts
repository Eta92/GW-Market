import { Pipe, PipeTransform } from '@angular/core';
import { UtilityHelper } from '@app/helpers/utility.helper';
import { Item, Price, ShopItem } from '@app/models/shop.model';
import { ItemOrder } from '@app/models/order.model';

@Pipe({ name: 'itemImage' })
export class ItemImagePipe implements PipeTransform {
  transform(item: Item | null | undefined): string {
    return item ? UtilityHelper.getImage(item) : '';
  }
}

@Pipe({ name: 'currencySource' })
export class CurrencySourcePipe implements PipeTransform {
  transform(price: Price): string {
    return UtilityHelper.getCurrencySource(price);
  }
}

@Pipe({ name: 'currencyName' })
export class CurrencyNamePipe implements PipeTransform {
  transform(price: Price): string {
    return UtilityHelper.getCurrencyName(price);
  }
}

@Pipe({ name: 'priceToString' })
export class PriceToStringPipe implements PipeTransform {
  transform(price: Price): string {
    return UtilityHelper.priceToString(price);
  }
}

@Pipe({ name: 'formatLastUpdate' })
export class FormatLastUpdatePipe implements PipeTransform {
  transform(timestamp: number): string {
    return UtilityHelper.formatLastUpdate(timestamp);
  }
}

@Pipe({ name: 'oldOpacity' })
export class OldOpacityPipe implements PipeTransform {
  transform(item: ItemOrder | ShopItem): string {
    return UtilityHelper.getOldOpacity(item);
  }
}

@Pipe({ name: 'timeToString' })
export class TimeToStringPipe implements PipeTransform {
  transform(time: number): string {
    return UtilityHelper.timeToString(time);
  }
}

@Pipe({ name: 'decimalUnitPrice' })
export class DecimalUnitPricePipe implements PipeTransform {
  transform(price: number, quantity: number): string {
    return UtilityHelper.getDecimalUnitPrice(price, quantity);
  }
}

export const UTILITY_PIPES = [
  ItemImagePipe,
  CurrencySourcePipe,
  CurrencyNamePipe,
  PriceToStringPipe,
  FormatLastUpdatePipe,
  OldOpacityPipe,
  TimeToStringPipe,
  DecimalUnitPricePipe
];
