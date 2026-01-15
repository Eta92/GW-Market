import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { OrderFilter } from '@app/models/order.model';
import { AvailableTree } from '@app/models/tree.model';
import { ItemService } from '@app/services/item.service';

const attributes = [
  // Warrior
  'Strength',
  'Axe Mastery',
  'Hammer Mastery',
  'Swordsmanship',
  'Tactics',
  // Ranger
  'Expertise',
  'Beast Mastery',
  'Marksmanship',
  'Wilderness Survival',
  // Monk
  'Divine Favor',
  'Healing Prayers',
  'Protection Prayers',
  'Smiting Prayers',
  // Necromancer
  'Soul Reaping',
  'Blood Magic',
  'Curses',
  'Death Magic',
  // Mesmer
  'Fast Casting',
  'Domination Magic',
  'Illusion Magic',
  'Inspiration Magic',
  // Elementalist
  'Energy Storage',
  'Air Magic',
  'Earth Magic',
  'Fire Magic',
  'Water Magic',
  // Assassin
  'Critical Strikes',
  'Dagger Mastery',
  'Deadly Arts',
  'Shadow Arts',
  // Ritualist
  'Spawning power',
  'Channeling Magic',
  'Communing',
  'Restoration Magic',
  // Paragon
  'Leadership',
  'Command',
  'Motivation',
  'Spear Mastery',
  // Dervish
  'Mysticism',
  'Earth Prayers',
  'Scythe Mastery',
  'Wind Prayers'
];

@Component({
  selector: 'app-filter-order',
  templateUrl: './filter-order.component.html',
  styleUrls: ['./filter-order.component.scss']
})
export class FilterOrderComponent implements OnInit {
  @Output() updateFilter = new EventEmitter<OrderFilter>();

  public form: UntypedFormGroup;
  public allItems: AvailableTree;
  public attributes = attributes;

  constructor(
    private fb: UntypedFormBuilder,
    private itemService: ItemService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [''],
      orderType: [null],
      family: [null],
      category: [null],
      attribute: [null, Validators.required],
      reqMin: [0, [Validators.min(0), Validators.max(13)]],
      reqMax: [13, [Validators.min(0), Validators.max(13)]],
      inscription: [null],
      oldschool: [null],
      core: [null],
      prefix: [null],
      suffix: [null]
    });
    this.form.valueChanges.subscribe(() => {
      this.updateFilter.emit(this.form.value as OrderFilter);
    });
    this.itemService.getAvailableTree().subscribe((tree: AvailableTree) => {
      this.allItems = tree;
    });
  }

  getFamilies(): Array<string> {
    return this.allItems?.families.map(f => f.name) || [];
  }

  getCategories(): Array<string> {
    const familyName = this.form.get('family').value;
    const family = this.allItems?.families.find(f => f.name === familyName);
    return family ? family.categories.map(c => c.name) : [];
  }

  getCores(): Array<string> {
    if (!this.allItems) return [];
    const upgrades = this.allItems.families.find(fam => fam.name === 'upgrade')?.categories;
    if (!upgrades) {
      return [];
    }
    return [
      ...(upgrades.find(cat => cat.name === 'All equippable items Inscriptions')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'All weapons Inscriptions')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Martial weapons Inscriptions')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Spellcasting weapons Inscriptions')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Focus items or shields Inscriptions')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Focus items Inscriptions')?.items.map(i => i.name) || [])
    ];
  }

  getPrefixes(): Array<string> {
    if (!this.allItems) return [];
    const upgrades = this.allItems.families.find(fam => fam.name === 'upgrade')?.categories;
    if (!upgrades) {
      return [];
    }
    return [
      ...(upgrades.find(cat => cat.name === 'Axe Haft')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Dagger Tang')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Hammer Haft')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Scythe Snathe')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Spearhead')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Staff Head')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Sword Hilt')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Bowstring')?.items.map(i => i.name) || [])
    ];
  }

  getSuffixes(): Array<string> {
    if (!this.allItems) return [];
    const upgrades = this.allItems.families.find(fam => fam.name === 'upgrade')?.categories;
    if (!upgrades) {
      return [];
    }
    return [
      ...(upgrades.find(cat => cat.name === 'Axe Grip')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Dagger Handle')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Focus Core')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Hammer Grip')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Scythe Grip')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Shield Handle')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Spear Grip')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Staff Wrapping')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Sword Pommel')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Wand Wrapping')?.items.map(i => i.name) || []),
      ...(upgrades.find(cat => cat.name === 'Bow Grip')?.items.map(i => i.name) || [])
    ];
  }
}
