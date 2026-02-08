import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-qty-input',
  templateUrl: './qty-input.component.html',
  styleUrls: ['./qty-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QtyInputComponent),
      multi: true
    }
  ]
})
export class QtyInputComponent implements ControlValueAccessor {
  @Input() min = 1;
  @Input() max = 9999;
  @Input() step = 1;
  @Input() small = false;

  value = 1;
  disabled = false;

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number): void {
    this.value = value ?? this.min;
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  increment(event: Event): void {
    event.stopPropagation();
    if (this.value < this.max) {
      this.value = Math.min(this.value + this.step, this.max);
      this.onChange(this.value);
    }
  }

  decrement(event: Event): void {
    event.stopPropagation();
    if (this.value > this.min) {
      this.value = Math.max(this.value - this.step, this.min);
      this.onChange(this.value);
    }
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let newValue = parseInt(input.value, 10);

    if (isNaN(newValue)) {
      newValue = this.min;
    } else {
      newValue = Math.max(this.min, Math.min(this.max, newValue));
    }

    this.value = newValue;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
