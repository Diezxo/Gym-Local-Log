import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './components/layout/bottom-nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent],
  template: `
    <div class="global-wrapper max-w-[480px] mx-auto min-h-[100dvh] bg-[var(--color-bg-primary)] sm:border-x border-[var(--color-border)] relative shadow-2xl flex flex-col">
      <main class="app-shell flex-1 w-full pb-20">
        <router-outlet />
      </main>
      <app-bottom-nav />
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100dvh;
      background-color: var(--color-bg-backdrop);
    }
    .app-shell {
      position: relative;
    }
  `],
})
export class App {}
