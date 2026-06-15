import { Express } from 'express';
import { PurchaseOrigin, TBPurchase } from '../models/purchase.model';
import { MongoService } from './mongo.service';
import { ShopService } from './shop.service';

export class ApiService {
  public static apiInit = false;

  public static init(app: Express): void {
    app.get('/api/shop/orders', (req, res) => {
      const orders = ShopService.getAvailableOrders();
      res.type('text/json');
      res.send(JSON.stringify(orders));
    });

    app.get('/api/shop/public/:publicId', (req, res) => {
      const { publicId } = req.params;
      const shop = ShopService.getPublicShop(publicId);
      res.type('text/json');
      res.send(JSON.stringify(shop));
    });

    app.get('/api/shop/:shopId', (req, res) => {
      const { shopId } = req.params;
      const shop = ShopService.getShop(shopId);
      res.type('text/json');
      res.send(JSON.stringify(shop));
    });

    app.get('/api/shop/closeShop/:shopId', (req, res) => {
      const { shopId } = req.params;
      const shop = ShopService.closeShop(shopId);
      res.type('text/json');
      res.status(200).send({ status: 'ok' });
    });

    app.get('/api/shop/certify/:shopId', (req, res) => {
      const { shopId } = req.params;
      const certification = ShopService.askPlayerCertification(shopId, ApiService.generateFakeSocket());
      res.type('text/json');
      res.send(JSON.stringify(certification));
    });

    app.post('/api/shop/add/:shopId', async function (req, res) {
      const { shopId } = req.params;
      const reqBody = req.body;
      const shop = await ShopService.addShopItem(shopId, reqBody, ApiService.generateFakeSocket());
      res.type('text/json');
      res.send(JSON.stringify(shop));
    });

    app.post('/api/shop/update/:shopId', async function (req, res) {
      const { shopId } = req.params;
      const reqBody = req.body;
      const shop = await ShopService.updateShopItem(shopId, reqBody, ApiService.generateFakeSocket());
      res.type('text/json');
      res.send(JSON.stringify(shop));
    });

    app.post('/api/shop/remove/:shopId', async function (req, res) {
      const { shopId } = req.params;
      const reqBody = req.body;
      const shop = await ShopService.removeShopItem(shopId, reqBody, ApiService.generateFakeSocket());
      res.type('text/json');
      res.send(JSON.stringify(shop));
    });

    app.post('/api/shop/purchase/', async function (req, res) {
      const reqBody = req.body as TBPurchase;
      if (req.body && req.body.name && req.body.price && req.body.orderType) {
        const purchase = {
          name: reqBody.name,
          orderType: reqBody.orderType,
          prices: [
            {
              type: reqBody.price.type,
              unitPrice: reqBody.price.price / (reqBody.price.quantity || 1),
              quantity: reqBody.price.quantity || 1,
              totalPrice: reqBody.price.price,
            },
          ],
          date: Date.now(),
          origin: PurchaseOrigin.TOOLBOX,
        };
        await MongoService.insertPurchase(purchase);
        res.status(200).send({ status: 'ok' });
      } else {
        res.status(400).send({ error: 'Invalid purchase data' });
      }
    });

    this.apiInit = true;
  }

  private static generateFakeSocket() {
    return {
      id: 'fake-socket-id',
      emit: (event: string, data: any) => {},
      join: (event: string, data: any) => {},
    };
  }
}
