import { Item, ShopItem, WeaponDetails } from '@app/models/shop.model';
import { AvailableTree } from '@app/models/tree.model';

// Inscription category sets
const MARTIAL_INSCRIPTIONS = ['All weapons Inscriptions', 'Martial weapons Inscriptions', 'All equippable items Inscriptions'];
const SPELLCASTING_INSCRIPTIONS = ['All weapons Inscriptions', 'Spellcasting weapons Inscriptions', 'All equippable items Inscriptions'];
const FOCUS_INSCRIPTIONS = ['Focus items or shields Inscriptions', 'Focus items Inscriptions', 'All equippable items Inscriptions'];
const SHIELD_INSCRIPTIONS = ['Focus items or shields Inscriptions', 'All equippable items Inscriptions'];

// Weapon upgrade configuration: maps category to [coreInscriptions, prefixCategory, suffixCategory]
const WEAPON_UPGRADE_CONFIG: Record<string, { core: string[]; prefix: string | null; suffix: string }> = {
  'Rare Axes': { core: MARTIAL_INSCRIPTIONS, prefix: 'Axe Haft', suffix: 'Axe Grip' },
  'Rare Daggers': { core: MARTIAL_INSCRIPTIONS, prefix: 'Dagger Tang', suffix: 'Dagger Handle' },
  'Rare Hammers': { core: MARTIAL_INSCRIPTIONS, prefix: 'Hammer Haft', suffix: 'Hammer Grip' },
  'Rare Scythes': { core: MARTIAL_INSCRIPTIONS, prefix: 'Scythe Snathe', suffix: 'Scythe Grip' },
  'Rare Spears': { core: MARTIAL_INSCRIPTIONS, prefix: 'Spearhead', suffix: 'Spear Grip' },
  'Rare Swords': { core: MARTIAL_INSCRIPTIONS, prefix: 'Sword Hilt', suffix: 'Sword Pommel' },
  'Rare Bows': { core: MARTIAL_INSCRIPTIONS, prefix: 'Bowstring', suffix: 'Bow Grip' },
  'Rare staves': { core: SPELLCASTING_INSCRIPTIONS, prefix: 'Staff Head', suffix: 'Staff Wrapping' },
  'Rare Wands': { core: SPELLCASTING_INSCRIPTIONS, prefix: null, suffix: 'Wand Wrapping' },
  'Rare focus items': { core: FOCUS_INSCRIPTIONS, prefix: null, suffix: 'Focus Core' },
  'Rare Shields': { core: SHIELD_INSCRIPTIONS, prefix: null, suffix: 'Shield Handle' }
};

export class WeaponHelper {
  static isWeapon(item: Item): boolean {
    return item?.family === 'weapon';
  }

  static isMiniature(item: Item): boolean {
    return item?.family === 'miniature';
  }

  /**
   * Check if an order has displayable item details (weapon stats, miniature dedication, pre-searing).
   */
  static hasItemDetails(item: Item, shopItem?: ShopItem): boolean {
    if (WeaponHelper.isWeapon(item) && shopItem?.weaponDetails) return true;
    if (WeaponHelper.isMiniature(item)) return true;
    if (shopItem?.orderDetails?.pre) return true;
    return false;
  }

  /**
   * Format weapon details into a human-readable string.
   */
  static formatWeaponDetails(wd: WeaponDetails): string {
    if (!wd) return '';
    let info = `Req.${wd.requirement}`;
    if (wd.attribute) info += ` ${wd.attribute}`;
    if (wd.oldschool) info += ' (OS)';
    if (wd.core) info += `, ${wd.core}`;
    if (wd.inscription) info += ' (Insc.)';
    return info.trim();
  }

  /**
   * Get available upgrade items for a weapon category.
   */
  static getItemList(
    item: Item,
    completeTree: AvailableTree
  ): { core: string[]; prefix: string[]; suffix: string[] } {
    const upgrades = completeTree.families.find(fam => fam.name === 'upgrade')?.categories;
    if (!upgrades) {
      return { core: [], prefix: [], suffix: [] };
    }

    const config = WEAPON_UPGRADE_CONFIG[item.category];
    if (!config) {
      return { core: [], prefix: [], suffix: [] };
    }

    const getItemNames = (categoryName: string): string[] =>
      upgrades.find(cat => cat.name === categoryName)?.items.map(i => i.name) || [];

    return {
      core: config.core.flatMap(getItemNames),
      prefix: config.prefix ? getItemNames(config.prefix) : [],
      suffix: getItemNames(config.suffix)
    };
  }
}
