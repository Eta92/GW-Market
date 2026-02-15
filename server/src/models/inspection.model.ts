import { ShopPrice } from './shop.model';

export interface PriceInspection {
  active: Array<ShopPrice | null>;
  day: Array<ShopPrice | null>;
  week: Array<ShopPrice | null>;
}
