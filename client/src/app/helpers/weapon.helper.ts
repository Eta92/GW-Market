import { Item } from '@app/models/shop.model';
import { AvailableTree } from '@app/models/tree.model';

export class WeaponHelper {
  static isWeapon(item: Item): any {
    return item?.family === 'weapon';
  }
  static isMiniature(item: Item): any {
    return item?.family === 'miniature';
  }

  static getItemList(
    item: Item,
    completeTree: AvailableTree
  ): { core: Array<string>; prefix: Array<string>; suffix: Array<string> } {
    const upgrades = completeTree.families.find(fam => fam.name === 'upgrade')?.categories;
    if (!upgrades) {
      return { core: [], prefix: [], suffix: [] };
    }
    switch (item.category) {
      case 'Rare Axes':
        return {
          core: [
            ...(upgrades.find(cat => cat.name === 'All weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'Martial weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'All equippable items Inscriptions')?.items.map(i => i.name) || [])
          ],
          prefix: upgrades.find(cat => cat.name === 'Axe Haft')?.items.map(i => i.name) || [],
          suffix: upgrades.find(cat => cat.name === 'Axe Grip')?.items.map(i => i.name) || []
        };
      case 'Rare Daggers':
        return {
          core: [
            ...(upgrades.find(cat => cat.name === 'All weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'Martial weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'All equippable items Inscriptions')?.items.map(i => i.name) || [])
          ],
          prefix: upgrades.find(cat => cat.name === 'Dagger Tang')?.items.map(i => i.name) || [],
          suffix: upgrades.find(cat => cat.name === 'Dagger Handle')?.items.map(i => i.name) || []
        };
      case 'Rare focus items':
        return {
          core: [
            ...(upgrades.find(cat => cat.name === 'Focus items or shields Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'Focus items Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'All equippable items Inscriptions')?.items.map(i => i.name) || [])
          ],
          prefix: [],
          suffix: upgrades.find(cat => cat.name === 'Focus Core')?.items.map(i => i.name) || []
        };
      case 'Rare Hammers':
        return {
          core: [
            ...(upgrades.find(cat => cat.name === 'All weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'Martial weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'All equippable items Inscriptions')?.items.map(i => i.name) || [])
          ],
          prefix: upgrades.find(cat => cat.name === 'Hammer Haft')?.items.map(i => i.name) || [],
          suffix: upgrades.find(cat => cat.name === 'Hammer Grip')?.items.map(i => i.name) || []
        };
      case 'Rare Scythes':
        return {
          core: [
            ...(upgrades.find(cat => cat.name === 'All weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'Martial weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'All equippable items Inscriptions')?.items.map(i => i.name) || [])
          ],
          prefix: upgrades.find(cat => cat.name === 'Scythe Snathe')?.items.map(i => i.name) || [],
          suffix: upgrades.find(cat => cat.name === 'Scythe Grip')?.items.map(i => i.name) || []
        };
      case 'Rare Shields':
        return {
          core: [
            ...(upgrades.find(cat => cat.name === 'Focus items or shields Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'All equippable items Inscriptions')?.items.map(i => i.name) || [])
          ],
          prefix: [],
          suffix: upgrades.find(cat => cat.name === 'Shield Handle')?.items.map(i => i.name) || []
        };
      case 'Rare Spears':
        return {
          core: [
            ...(upgrades.find(cat => cat.name === 'All weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'Martial weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'All equippable items Inscriptions')?.items.map(i => i.name) || [])
          ],
          prefix: upgrades.find(cat => cat.name === 'Spearhead')?.items.map(i => i.name) || [],
          suffix: upgrades.find(cat => cat.name === 'Spear Grip')?.items.map(i => i.name) || []
        };
      case 'Rare staves':
        return {
          core: [
            ...(upgrades.find(cat => cat.name === 'All weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'Spellcasting weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'All equippable items Inscriptions')?.items.map(i => i.name) || [])
          ],
          prefix: upgrades.find(cat => cat.name === 'Staff Head')?.items.map(i => i.name) || [],
          suffix: upgrades.find(cat => cat.name === 'Staff Wrapping')?.items.map(i => i.name) || []
        };
      case 'Rare Swords':
        return {
          core: [
            ...(upgrades.find(cat => cat.name === 'All weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'Martial weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'All equippable items Inscriptions')?.items.map(i => i.name) || [])
          ],
          prefix: upgrades.find(cat => cat.name === 'Sword Hilt')?.items.map(i => i.name) || [],
          suffix: upgrades.find(cat => cat.name === 'Sword Pommel')?.items.map(i => i.name) || []
        };
      case 'Rare Wands':
        return {
          core: [
            ...(upgrades.find(cat => cat.name === 'All weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'Spellcasting weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'All equippable items Inscriptions')?.items.map(i => i.name) || [])
          ],
          prefix: [],
          suffix: upgrades.find(cat => cat.name === 'Wand Wrapping')?.items.map(i => i.name) || []
        };
      case 'Rare Bows':
        return {
          core: [
            ...(upgrades.find(cat => cat.name === 'All weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'Martial weapons Inscriptions')?.items.map(i => i.name) || []),
            ...(upgrades.find(cat => cat.name === 'All equippable items Inscriptions')?.items.map(i => i.name) || [])
          ],
          prefix: upgrades.find(cat => cat.name === 'Bowstring')?.items.map(i => i.name) || [],
          suffix: upgrades.find(cat => cat.name === 'Bow Grip')?.items.map(i => i.name) || []
        };
      default:
        return { core: [], prefix: [], suffix: [] };
    }
  }
}
