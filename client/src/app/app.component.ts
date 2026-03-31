import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { interval, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { StoreService } from './services/store.service';
import { UtilService } from './services/util.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {
  private updateSub?: Subscription;

  constructor(
    private utilService: UtilService,
    private storeService: StoreService,
    private swUpdate: SwUpdate
  ) {}

  ngOnInit(): void {
    this.utilService.start();
    this.initAutoUpdate();
  }

  ngOnDestroy(): void {
    this.updateSub?.unsubscribe();
  }

  private initAutoUpdate(): void {
    if (!this.swUpdate.isEnabled) return;

    // Reload automatically when a new version is ready
    this.updateSub = this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        this.swUpdate.activateUpdate().then(() => document.location.reload());
      });

    // Poll for updates every 15 minutes
    interval(15 * 60 * 1000).subscribe(() => this.swUpdate.checkForUpdate());
  }

  public isWrongDomain =
    window.location.hostname !== 'gwmarket.net' &&
    window.location.hostname !== 'www.gwmarket.net' &&
    window.location.hostname !== 'v2.gwmarket.net' &&
    window.location.hostname !== 'localhost';

  goToNewDomain(): void {
    window.location.href = 'https://gwmarket.net';
  }
}
