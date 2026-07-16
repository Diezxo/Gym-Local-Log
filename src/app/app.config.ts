import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { STORAGE_PORT } from './ports/storage.port';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';
import { MigrationRunner } from './migrations/migration-runner';

export function initializeApp(migrationRunner: MigrationRunner) {
  return () => migrationRunner.runMigrations();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    { provide: STORAGE_PORT, useClass: LocalStorageAdapter },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [MigrationRunner],
      multi: true
    }
  ],
};
