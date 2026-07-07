import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-[#141414] border-t border-[#1e1e1e]">
      <div class="flex items-stretch justify-around max-w-lg mx-auto">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="!text-cyan-400"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            class="flex flex-col items-center justify-center flex-1 min-h-16 py-2 text-[#737373] transition-colors active:text-cyan-400"
          >
            <span class="text-xl leading-none mb-1">{{ item.icon }}</span>
            <span class="text-[10px] font-medium leading-none">{{ item.label }}</span>
          </a>
        }
      </div>
    </nav>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class BottomNavComponent {
  navItems = [
    { icon: '🏋️', label: 'Entrenar', route: '/', exact: true },
    { icon: '📋', label: 'Rutinas', route: '/templates', exact: false },
    { icon: '💾', label: 'Datos', route: '/data', exact: false },
    { icon: '⚙️', label: 'Ajustes', route: '/settings', exact: false },
  ];
}
