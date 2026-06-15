import { Index } from 'flexsearch';
import { Item } from '../models/shop.model';

const fs = require('fs');

export class ItemService {
  public static itemInit = false;
  public static allCategoryMap: { [key: string]: { name: string; description: string; inherit?: string } } = {};
  public static allItems: Array<Item> = [];
  public static allItemMap: { [key: string]: Item } = {};
  public static exoticUpgrades: Array<Item> = [];
  public static categoryInheritances: { [key: string]: Array<string> } = {};
  public static reverseCategoryInheritances: { [key: string]: Array<string> } = {};
  public static searchIndex: Index;

  public static init = () => {
    // load items
    this.allItems = [];
    this.allItemMap = {};
    this.exoticUpgrades = [];
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
    this.loadExotic();
    this.generateClientJson();
    this.generateInheritances();
    this.allItems = Object.values(this.allItemMap).filter((item) => !item.hidden);
    // prepare search
    this.searchIndex = new Index({
      tokenize: 'full',
      resolution: 100,
      cache: true,
    });
    //this.allItems.filter((item) => !item.hidden).forEach((item, i) => this.searchIndex.add(i, item.name));
    this.itemInit = true;
  };

  private static loadSpecial = () => {
    const jsonData = fs.readFileSync('./data/special.json');
    const categories = JSON.parse(jsonData);
    categories.forEach((category) => {
      this.allCategoryMap[category.type] = { name: category.type, description: category.description, inherit: category.inherit };
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
      this.allCategoryMap[category.type] = { name: category.type, description: category.description, inherit: category.inherit };
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
      this.allCategoryMap[category.type] = { name: category.type, description: category.description, inherit: category.inherit };
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
      this.allCategoryMap[category.type] = { name: category.type, description: category.description, inherit: category.inherit };
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
      this.allCategoryMap[category.type] = { name: category.type, description: category.description, inherit: category.inherit };
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
      this.allCategoryMap[category.type] = { name: category.type, description: category.description, inherit: category.inherit };
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
      this.allCategoryMap[category.type] = { name: category.type, description: category.description, inherit: category.inherit };
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
      this.allCategoryMap[category.type] = { name: category.type, description: category.description, inherit: category.inherit };
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
      this.allCategoryMap[category.type] = { name: category.type, description: category.description, inherit: category.inherit };
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
      this.allCategoryMap[category.type] = { name: category.type, description: category.description, inherit: category.inherit };
      category.items.forEach((item) => {
        item.family = 'service';
        item.category = category.type;
        this.allItemMap[item.name] = this.allItemMap[item.name] ? { ...item, ...this.allItemMap[item.name] } : item;
      });
    });
  };
  private static loadExotic = () => {
    const jsonData = fs.readFileSync('./data/exotic.json');
    const upgrades = JSON.parse(jsonData);
    upgrades.forEach((upgrade) => {
      if (upgrade.variations) {
        upgrade.variations.forEach((variation) => {
          const item = {
            name: upgrade.name.replace('REPLACE', variation),
            enhancement: upgrade.enhancement.replace('REPLACE', variation),
            condition: upgrade.condition,
            img: upgrade.img,
            family: 'exotic',
          };
          this.exoticUpgrades.push(item as any);
        });
      } else {
        this.exoticUpgrades.push(upgrade);
      }
    });
  };

  private static generateClientJson = () => {
    const outputPath = '../assets/data.json';
    const itemTree = { name: 'allItems', families: [], exoticUpgrades: this.exoticUpgrades };
    Object.values(this.allItemMap).forEach((item) => {
      let family = itemTree.families.find((f) => f.name === item.family);
      if (!family) {
        family = { name: item.family, categories: [] };
        itemTree.families.push(family);
      }
      let category = family.categories.find((c) => c.name === item.category);
      if (!category) {
        //console.log('Creating category ' + item.category + ' in family ' + item.family);
        category = {
          name: item.category,
          items: [],
          description: this.allCategoryMap[item.category]?.description || '',
          inherit: this.allCategoryMap[item.category]?.inherit,
        };
        family.categories.push(category);
      }
      category.items.push(item);
    });
    fs.writeFileSync(outputPath, JSON.stringify(itemTree, null, 2));
    console.log('Generated client data.json with ' + Object.keys(this.allItemMap).length + ' items');
  };

  public static generateInheritances = () => {
    this.categoryInheritances = {};
    const loadInheritance = (category): Array<string> => {
      if (category.inherit) {
        const inherited = this.allCategoryMap[category.inherit];
        if (inherited) {
          const total = [category.inherit, ...loadInheritance(inherited)];
          this.categoryInheritances[category.name] = total;
          return total;
        }
      }
      return [];
    };
    Object.values(this.allCategoryMap).forEach((category) => {
      loadInheritance(category);
    });
    this.reverseCategoryInheritances = {};
    Object.entries(this.categoryInheritances).forEach(([category, inherits]) => {
      inherits.forEach((inherit) => {
        if (!this.reverseCategoryInheritances[inherit]) {
          this.reverseCategoryInheritances[inherit] = [];
        }
        this.reverseCategoryInheritances[inherit].push(category);
      });
    });
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

  public static searchItems = (search: string, limit: number = 50): Array<Item> => {
    // Pass limit to Flexsearch to get enough results
    // const resultsIndex = this.searchIndex.search(search, { limit: 100 });
    // const results = resultsIndex.map((i) => this.allItems[i]);
    const portions = search.split(' ').filter((p) => p.trim());
    const results = this.allItems.filter((item) => portions.every((p) => item.name.toLowerCase().includes(p.toLowerCase())));
    return results.slice(0, limit);
  };
}
