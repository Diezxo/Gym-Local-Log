import { Component, inject, effect, Renderer2, HostListener } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet, ChildrenOutletContexts } from '@angular/router';
import { BottomNavComponent } from './components/layout/bottom-nav.component';
import { UnitConversionService } from './services/unit-conversion.service';
import { trigger, transition, style, query, animate, group } from '@angular/animations';

export const fadeAnimation = trigger('routeAnimation', [
  transition('* <=> *', [
    query(':enter', [style({ opacity: 0 })], { optional: true }),
    group([
      query(':leave', [animate('80ms ease-out', style({ opacity: 0 }))], { optional: true }),
      query(':enter', [style({ opacity: 0 }), animate('80ms 40ms ease-in', style({ opacity: 1 }))], { optional: true })
    ])
  ])
]);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent],
  animations: [fadeAnimation],
  template: `
    <div class="global-wrapper max-w-[480px] mx-auto min-h-[100dvh] bg-[var(--color-bg-primary)] sm:border-x border-[var(--color-border)] relative shadow-2xl flex flex-col transition-colors duration-300">
      <main class="app-shell flex-1 w-full pb-nav-safe" [@routeAnimation]="getRouteAnimationData()">
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
export class App {
  private unitSvc = inject(UnitConversionService);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);
  private contexts = inject(ChildrenOutletContexts);

  constructor() {
    effect(() => {
      const theme = this.unitSvc.currentSettings()?.theme || 'dark';
      if (theme === 'amoled') {
        this.renderer.setAttribute(this.document.documentElement, 'data-theme', 'amoled');
      } else {
        this.renderer.removeAttribute(this.document.documentElement, 'data-theme');
      }
    });
  }

  @HostListener('click', ['$event'])
  onGlobalClick(event: Event) {
    const target = event.target as HTMLElement;
    const isClickable = target.closest('button, [role="button"], a, [tabindex="0"]');
    if (isClickable && this.unitSvc.currentSettings()?.hapticFeedback !== false) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(5); // Very subtle 5ms tick
      }
    }
  }

  getRouteAnimationData() {
    const context = this.contexts.getContext('primary');
    return context?.route?.snapshot?.url?.join('/') || 'none';
  }
}
