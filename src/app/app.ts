import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './components/layout/bottom-nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent],
  template: `
    <main class="app-shell">
      <router-outlet />
    </main>
    <app-bottom-nav />
  `,
  styles: [`
    .app-shell {
      min-height: 100dvh;
      padding-bottom: 80px;
      background-color: var(--color-bg-primary);
      max-width: 480px;
      margin: 0 auto;
      position: relative;
      box-shadow: 0 0 50px rgba(0,0,0,0.5);
    }
  `],
})
export class App {}
