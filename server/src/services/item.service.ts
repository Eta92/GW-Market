import { Index, Document, Encoder, Charset, Resolver, Worker } from 'flexsearch';
import { Item } from '../models/shop.model';
import { ShopService } from './shop.service';

const fs = require('fs');

export class ItemService {
  public static itemInit = false;
  public static allItems: Array<Item> = [];
  public static allItemMap: { [key: string]: Item } = {};
  public static searchIndex: any;

  public static init = () => {
    // load items
    this.allItems = [];
    this.allItemMap = {};
    this.loadSpecial();
    this.loadConsumables();
    this.loadUpgrades();
    this.loadTomes();
    this.loadRunes();
    this.loadMaterials();
    this.loadWeapons();
    this.loadUniques();
    this.loadMiniatures();
    this.loadServices();
    this.generateClientJson();
    this.allItems = Object.values(this.allItemMap);
    // prepare search
    this.searchIndex = new Index({
      tokenize: 'forward',
      cache: true,
    });
    this.allItems.forEach((item, i) => this.searchIndex.add(i, item.name));
    this.itemInit = true;
    this.generateFakeShops();
  };

  private static loadSpecial = () => {
    const jsonData = fs.readFileSync('./data/special.json');
    const categories = JSON.parse(jsonData);
    categories.forEach((category) => {
      category.items.forEach((item) => {
        item.family = 'special';
        item.category = category.type;
        this.allItemMap[item.name] = this.allItemMap[item.name] ? { ...item, ...this.allItemMap[item.name] } : item;
      });
    });
  };

  private static loadConsumables = () => {
    const jsonData = fs.readFileSync('./data/consumable.json');
    const categories = JSON.parse(jsonData);
    categories.forEach((category) => {
      category.items.forEach((item) => {
        item.family = 'consumable';
        item.category = category.type;
        this.allItemMap[item.name] = this.allItemMap[item.name] ? { ...item, ...this.allItemMap[item.name] } : item;
      });
    });
  };

  private static loadUpgrades = () => {
    const jsonData = fs.readFileSync('./data/upgrade.json');
    const categories = JSON.parse(jsonData);
    categories.forEach((category) => {
      category.items.forEach((item) => {
        item.family = 'upgrade';
        item.category = category.type;
        this.allItemMap[item.name] = this.allItemMap[item.name] ? { ...item, ...this.allItemMap[item.name] } : item;
      });
    });
  };

  private static loadTomes = () => {
    const jsonData = fs.readFileSync('./data/tome.json');
    const categories = JSON.parse(jsonData);
    categories.forEach((category) => {
      category.items.forEach((item) => {
        item.family = 'tome';
        item.category = category.type;
        this.allItemMap[item.name] = this.allItemMap[item.name] ? { ...item, ...this.allItemMap[item.name] } : item;
      });
    });
  };

  private static loadRunes = () => {
    const jsonData = fs.readFileSync('./data/rune.json');
    const categories = JSON.parse(jsonData);
    categories.forEach((category) => {
      category.items.forEach((item) => {
        item.family = 'rune';
        item.category = category.type;
        this.allItemMap[item.name] = this.allItemMap[item.name] ? { ...item, ...this.allItemMap[item.name] } : item;
      });
    });
  };

  private static loadMaterials = () => {
    const jsonData = fs.readFileSync('./data/material.json');
    const categories = JSON.parse(jsonData);
    categories.forEach((category) => {
      category.items.forEach((item) => {
        item.family = 'material';
        item.category = category.type;
        this.allItemMap[item.name] = this.allItemMap[item.name] ? { ...item, ...this.allItemMap[item.name] } : item;
      });
    });
  };

  private static loadWeapons = () => {
    const jsonData = fs.readFileSync('./data/weapon.json');
    const categories = JSON.parse(jsonData);
    categories.forEach((category) => {
      category.items.forEach((item) => {
        item.family = 'weapon';
        item.category = category.type;
        this.allItemMap[item.name] = this.allItemMap[item.name] ? { ...item, ...this.allItemMap[item.name] } : item;
      });
    });
  };
  private static loadUniques = () => {
    const jsonData = fs.readFileSync('./data/unique.json');
    const categories = JSON.parse(jsonData);
    categories.forEach((category) => {
      category.items.forEach((item) => {
        item.family = 'unique';
        item.category = category.type;
        this.allItemMap[item.name] = this.allItemMap[item.name] ? { ...item, ...this.allItemMap[item.name] } : item;
      });
    });
  };
  private static loadMiniatures = () => {
    const jsonData = fs.readFileSync('./data/miniature.json');
    const categories = JSON.parse(jsonData);
    categories.forEach((category) => {
      category.items.forEach((item) => {
        item.family = 'miniature';
        item.category = category.type;
        this.allItemMap[item.name] = this.allItemMap[item.name] ? { ...item, ...this.allItemMap[item.name] } : item;
      });
    });
  };
  private static loadServices = () => {
    const jsonData = fs.readFileSync('./data/service.json');
    const categories = JSON.parse(jsonData);
    categories.forEach((category) => {
      category.items.forEach((item) => {
        item.family = 'service';
        item.category = category.type;
        this.allItemMap[item.name] = this.allItemMap[item.name] ? { ...item, ...this.allItemMap[item.name] } : item;
      });
    });
  };

  private static generateClientJson = () => {
    const outputPath = '../assets/data.json';
    const itemTree = { name: 'allItems', families: [] };
    Object.values(this.allItemMap).forEach((item) => {
      let family = itemTree.families.find((f) => f.name === item.family);
      if (!family) {
        family = { name: item.family, categories: [] };
        itemTree.families.push(family);
      }
      let category = family.categories.find((c) => c.name === item.category);
      if (!category) {
        console.log('Creating category ' + item.category + ' in family ' + item.family);
        category = { name: item.category, items: [] };
        family.categories.push(category);
      }
      category.items.push(item);
    });
    fs.writeFileSync(outputPath, JSON.stringify(itemTree, null, 2));
    console.log('Generated client data.json with ' + Object.keys(this.allItemMap).length + ' items');
  };

  public static getItem = (name: string): Item => {
    if (this.allItemMap.hasOwnProperty(name)) {
      return this.allItemMap[name];
    } else {
      return null;
    }
  };

  public static getItems = (names: Array<string>): Array<Item> => {
    return names.map((name) => this.allItemMap[name]).filter((item) => item !== undefined);
  };

  public static getAllItems = (): Array<Item> => {
    return this.allItems;
  };

  public static searchItems = (search: string): Array<Item> => {
    const resultsIndex = this.searchIndex.search(search);
    const results = resultsIndex.map((i) => this.allItems[i]);
    return results.slice(0, 6);
  };

  public static generateFakeShops = () => {
    const fakeShopFiles = fs.readdirSync('./data/fakeshops/');
    const fakeShops = [];
    fakeShopFiles.forEach((file) => {
      const jsonData = fs.readFileSync(`./data/fakeshops/${file}`);
      const shopData = JSON.parse(jsonData);
      shopData.lastRefresh = Date.now();
      fakeShops.push(shopData);
    });
    ShopService.initShops(fakeShops);
  };
}
