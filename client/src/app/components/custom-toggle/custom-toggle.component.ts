import { Component, Input } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-custom-toggle',
  templateUrl: './custom-toggle.component.html',
  styleUrls: ['./custom-toggle.component.scss']
})
export class CustomToggleComponent {
  @Input() form: UntypedFormGroup;
  @Input() field: string;
  @Input() labelTrue: string;
  @Input() labelFalse: string;
  @Input() size = 'w-64';

  constructor() {}

  setValue(value: boolean): void {
    this.form.patchValue({ [this.field]: value });
  }
}
