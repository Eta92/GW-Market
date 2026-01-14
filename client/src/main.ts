import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();

  // now done in the AppModule
  // if (environment.production) {
  //   // Only register SW in production
  //   navigator.serviceWorker
  //     .register('ngsw-worker.js')
  //     .then(() => console.log('Service Worker registered'))
  //     .catch(err => console.error('SW registration failed', err));
  // }
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)

  .catch(err => console.error(err));
