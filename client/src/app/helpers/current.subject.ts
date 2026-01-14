import { ReplaySubject } from 'rxjs';

/*
export class CurrentSubject<T> extends Subject<T> {
  public value: T = null;

  constructor() {
    super();
  }

  public set(value?: T) {
    this.value = value;
    this.next(value);
  }

  public next(value: T): void {
    super.next(value);
  }

  public sub(subscriber: Subscriber<T>): Subscription {
    const subscription = this._subscribe(subscriber);

    const value = UtilityHelper.copy(this.value);
    subscriber.next(value as T);

    return subscription;
  }
}*/

// works but replay too many things
export class CurrentSubject<T> extends ReplaySubject<T> {
  value: T;

  set(value?: T): void {
    this.value = value;
    this.next(value);
  }
}

// attempt to fix a previous mistake, was previously ReplaySubject
/*export class CurrentSubject<T> extends Subject<T> {
  public value: T;

  constructor() {
    super();
  }

  set(value: T): void {
    this.value = value;
    super.next(value);
  }

  public _subscribe(subscriber: Subscriber<T>): Subscription {
    const subscription = super._innerSubscribe(subscriber);
    // We use a copy here, so reentrant code does not mutate our array while we're
    // emitting it to a new subscriber.
    const copy = JSON.parse(JSON.stringify(this.value));

    if (!subscriber.closed) {
    subscriber.next(copy as T);
    }

    //this._checkFinalizedStatuses(subscriber);

    return subscription;
  }
}*/

/*
export class CurrentSubject<T> extends BehaviorSubject<T> {
  public currentValue: T;

  constructor() {
    super(null);
  }

  set(value?: T) {
    this.currentValue = value;
    super.next(value);
  }
}*/
