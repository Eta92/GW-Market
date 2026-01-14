import { FormArray, FormBuilder } from "@angular/forms";

export class FormHelper {
  
  static addToForm(form: FormArray, value): void {
    form.push(new FormBuilder().group({
      id: [value.id],
      short: [value.short],
      long: [value.long],
    }))
  }

  static upInForm(form: FormArray, index): void {
    //this.shipForm.get('orders').value.splice(i - 1, 0, this.shipForm.get('orders').value.splice(i, 1)[0]);
    form.insert(index - 1, form.at(index));
    form.removeAt(index + 1);
  }

  static downInForm(form: FormArray, index): void {
    //this.shipForm.get('orders').value.splice(i + 1, 0, this.data.orders.splice(i, 1)[0]);
    form.insert(index + 2, form.at(index));
    form.removeAt(index);
  }

  static removeFromForm(form: FormArray, index): void {
    form.removeAt(index);
  }
}
