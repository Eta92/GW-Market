import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { OrderSort } from '@app/models/order.model';
import { AvailableTree } from '@app/models/tree.model';
import { ItemService } from '@app/services/item.service';
import { ToggleOption } from '@app/shared/components/toggle-group/toggle-group.component';
import { WEAPON_ATTRIBUTES } from '@app/shared/constants/weapon-attributes';

@Component({
  selector: 'app-sort-order',
  templateUrl: './sort-order.component.html',
  styleUrls: ['./sort-order.component.scss']
})
export class SortOrderComponent implements OnInit {
  @Output() updateSort = new EventEmitter<OrderSort>();

  public form: UntypedFormGroup;
  public allItems: AvailableTree;
  public attributes = WEAPON_ATTRIBUTES;

  public sortByOptions: ToggleOption[] = [
    { value: 'time', label: 'Recent' },
    { value: 'price', label: 'Total Price' },
    { value: 'priceEach', label: 'Unit Price' },
    { value: 'quantity', label: 'Quantity' },
    { value: 'name', label: 'Name' }
  ];

  constructor(
    private fb: UntypedFormBuilder,
    private itemService: ItemService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      sortBy: ['time'],
      sortOrder: ['desc']
    });

    this.form.valueChanges.subscribe(values => {
      this.updateSort.emit(values);
    });
  }
}
