import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { STORAGE_PORT } from './ports/storage.port';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode() }),
    { provide: STORAGE_PORT, useClass: LocalStorageAdapter }
  ],
};
