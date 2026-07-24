import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { STORAGE_PORT } from './ports/storage.port';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';
import { UnitConversionService } from './services/unit-conversion.service';

/**
 * APP_INITIALIZER factory: waits for UnitConversionService.initialize()
 * to resolve before Angular renders any component.
 * This guarantees that user settings (weight unit, distance unit, theme)
 * are loaded from IndexedDB before the first render, preventing the
 * "unit resets to default on reload" bug.
 *
 * The service is received as a parameter (via deps) rather than via inject()
 * to ensure compatibility across all Angular 17+ bootstrap contexts.
 */
function initializeAppSettings(unitSvc: UnitConversionService): () => Promise<void> {
  return () => unitSvc.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode() }),
    { provide: STORAGE_PORT, useClass: LocalStorageAdapter },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppSettings,
      multi: true,
      deps: [UnitConversionService],
    },
  ],
};
