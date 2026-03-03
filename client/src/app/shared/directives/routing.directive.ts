import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

@Directive({ selector: '[appRouting]' })
export class RoutingDirective {
  @Input() routing: string;
  private pendingMiddle = false;

  constructor(private router: Router) {}

  @HostListener('mousedown', ['$event'])
  preventAutoscrollRouting(event: MouseEvent): void {
    if (event.button === 1) {
      event.preventDefault();
      this.pendingMiddle = true;
    }
  }

  @HostListener('mouseup', ['$event'])
  mouseUpEvent(event: MouseEvent): void {
    if (event.button === 0) {
      this.router.navigate([this.routing]);
    }
    if (event.button === 1) {
      const url = this.router.serializeUrl(this.router.createUrlTree([this.routing]));
      window.open(url, '_blank');
    }
  }

  @HostListener('click', ['$event'])
  suppressClick(event: MouseEvent): void {
    if (this.pendingMiddle) {
      event.stopImmediatePropagation();
      event.preventDefault();
      this.pendingMiddle = false;
    }
  }
}

@Directive({ selector: '[appMiddle]' })
export class MiddleclickDirective {
  @Output() appMiddle = new EventEmitter();
  private pendingMiddle = false;

  constructor() {}

  @HostListener('mousedown', ['$event'])
  preventAutoscroll(event: MouseEvent): void {
    if (event.button === 1) {
      event.preventDefault();
      this.pendingMiddle = true;
    }
  }

  @HostListener('mouseup', ['$event'])
  middleclickEvent(event: MouseEvent): void {
    if (event.button === 1) {
      this.appMiddle.emit(event);
    }
  }

  @HostListener('click', ['$event'])
  suppressClick(event: MouseEvent): void {
    if (this.pendingMiddle) {
      event.stopImmediatePropagation();
      event.preventDefault();
      this.pendingMiddle = false;
    }
  }
}
