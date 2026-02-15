import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { PriceInspection } from '@app/models/order.model';
import { Item } from '@app/models/shop.model';
import { InspectorService } from '@app/services/inspector.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-price-inspector',
  templateUrl: './price-inspector.component.html',
  styleUrls: ['./price-inspector.component.scss']
})
export class PriceInspectorComponent implements OnInit {
  public item?: Item;
  public active: boolean;
  public inspection: PriceInspection;

  public times = ['active', 'day', 'week'];

  constructor(
    private fb: UntypedFormBuilder,
    private inspectorService: InspectorService,
    private toastrService: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.inspectorService.getInspectorStatus().subscribe(active => {
      this.active = active;
      this.cdr.detectChanges();
    });
    this.inspectorService.getPriceInspection().subscribe(inspection => {
      this.inspection = inspection;
      this.cdr.detectChanges();
    });
  }

  close(): void {
    this.inspectorService.toggleInspector(false);
  }
}
