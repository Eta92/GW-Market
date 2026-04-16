import { ReplaySubject } from 'rxjs';

export class CurrentSubject<T> extends ReplaySubject<T> {
  constructor() {
    super(1);
  }

  value: T;

  set(value?: T): void {
    this.value = value;
    this.next(value);
  }
}
