import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { StoreService } from './services/store.service';
import { UtilService } from './services/util.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  constructor(
    private utilService: UtilService,
    private storeService: StoreService
  ) {}

  ngOnInit(): void {
    this.utilService.start();
  }

  public isWrongDomain = window.location.hostname !== 'gwmarket.net' && window.location.hostname !== 'www.gwmarket.net';

  goToNewDomain(): void {
    window.location.href = 'https://gwmarket.net';
  }
}
