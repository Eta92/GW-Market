import { Directive, HostListener } from '@angular/core';

/**
 * Directive that stops click event propagation.
 * Usage: <button stopPropagation (click)="doSomething()">Click</button>
 */
@Directive({
  selector: '[stopPropagation]'
})
export class StopPropagationDirective {
  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    event.stopPropagation();
  }
}
