import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-primary)]/80 backdrop-blur-2xl border-t border-[var(--color-border)] pb-safe pt-1">
      <div class="flex items-stretch justify-around max-w-lg mx-auto px-2">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="is-active"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            #navLink="routerLinkActive"
            class="group relative flex flex-col items-center justify-center flex-1 min-h-[72px] py-2 text-[var(--color-text-muted)] transition-all duration-300 active:scale-90"
          >
            <!-- Background Pill for Active State -->
            <div
              class="absolute inset-0 m-auto h-11 w-16 rounded-2xl bg-gradient-to-r from-[#00f2fe]/15 to-[#a252ff]/15 scale-0 opacity-0 transition-all duration-300 group-[.is-active]:scale-100 group-[.is-active]:opacity-100 -z-10"
            ></div>

            <div
              class="mb-1 transition-all duration-300 group-[.is-active]:text-[#00f2fe] group-[.is-active]:drop-shadow-[0_0_8px_rgba(0,242,254,0.5)] group-[.is-active]:scale-110 group-[.is-active]:-translate-y-0.5"
              [innerHTML]="getIconSvg(item.id)"
            ></div>

            <span
              class="text-[10px] tracking-wide font-medium transition-colors duration-300 group-[.is-active]:text-[#00f2fe] group-[.is-active]:font-bold"
            >{{ item.label }}</span>

            <!-- Dot Indicator -->
            <div class="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#00f2fe] shadow-[0_0_8px_rgba(0,242,254,0.8)] opacity-0 scale-0 transition-all duration-300 group-[.is-active]:opacity-100 group-[.is-active]:scale-100"></div>
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
  private sanitizer = inject(DomSanitizer);

  navItems = [
    {
      id: 'dashboard',
      label: 'Inicio',
      route: '/dashboard',
      exact: true,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>'
    },
    {
      id: 'workout',
      label: 'Entrenar',
      route: '/workout',
      exact: true,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>'
    },
    {
      id: 'templates',
      label: 'Rutinas',
      route: '/templates',
      exact: false,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>'
    },
    {
      id: 'data',
      label: 'Historial',
      route: '/data',
      exact: false,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>'
    },
    {
      id: 'settings',
      label: 'Ajustes',
      route: '/settings',
      exact: false,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>'
    },
  ];

  getIconSvg(id: string): SafeHtml {
    const item = this.navItems.find(i => i.id === id);
    return this.sanitizer.bypassSecurityTrustHtml(item?.svg || '');
  }
}
