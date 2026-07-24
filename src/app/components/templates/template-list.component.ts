import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { RoutineUseCases } from '../../use-cases/routine.use-cases';
import { Routine } from '../../models/interfaces';
import { ScrollLockDirective } from '../../directives/scroll-lock.directive';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule, A11yModule, ScrollLockDirective],
  template: `
    <div class="min-h-screen bg-[var(--color-bg-primary)] px-4 sm:px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-36 md:pb-12 flex flex-col gap-6 max-w-7xl mx-auto w-full">

      <!-- Header -->
      <div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-white">Rutinas</h1>
        <p class="text-[var(--color-text-muted)] text-sm font-medium mt-1">{{ templates().length }} plantilla{{ templates().length !== 1 ? 's' : '' }} guardada{{ templates().length !== 1 ? 's' : '' }}</p>
      </div>

      @if (activeTemplates().length === 0 && archivedTemplates().length === 0) {
        <!-- Empty state -->
        <div class="flex flex-col items-center justify-center mt-12 text-center px-4 animate-fade-in">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-bg-input)] to-[var(--color-bg-primary)] border border-white/5 shadow-inner flex items-center justify-center mb-6 relative overflow-hidden">
             <div class="absolute inset-0 bg-[var(--color-accent)]/10 z-0"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="z-10 text-[var(--color-accent)]">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>
            </svg>
          </div>
          <h3 class="text-white text-xl font-semibold mb-2">Sin rutinas</h3>
        </div>
      } @else {
        <!-- Active Template cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (template of activeTemplates(); track template.id) {
              <div
                class="bg-[var(--color-bg-card)] rounded-3xl border border-white/5 overflow-hidden transition-all shadow-sm hover:shadow-md group cursor-pointer"
                role="button"
                tabindex="0"
                (click)="editTemplate(template.id)"
                (keydown.enter)="editTemplate(template.id)"
                (keydown.space)="editTemplate(template.id); $event.preventDefault()"
              >
                <!-- Main row -->
                <div class="flex items-start gap-4 p-4 sm:p-5">
                  <!-- Icon -->
                  <div class="w-14 h-14 rounded-2xl bg-[var(--color-bg-input)] border border-white/5 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-white/5 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-accent)]"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0 pt-1">
                    <h2 class="text-xl font-bold text-white tracking-tight mb-1 truncate transition-colors">{{ template.name }}</h2>
                    <p class="text-[var(--color-text-muted)] text-xs font-medium line-clamp-1">{{ getExercisesList(template) }}</p>
                  </div>

                  <!-- Badge + Delete/Archive -->
                  <div class="flex flex-col items-end gap-3 shrink-0">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                      {{ template.exercises.length }} ej.
                    </span>
                    <div class="flex items-center gap-1">
                      <button
                        (click)="toggleArchive(template); $event.stopPropagation()"
                        class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Archivar rutina"
                        title="Archivar rutina"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="4" rx="2"/><path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/></svg>
                      </button>
                      <button
                        (click)="confirmDelete(template); $event.stopPropagation()"
                        class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        aria-label="Eliminar rutina"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Exercise tags row -->
                @if (getTemplateTags(template).length > 0) {
                  <div class="border-t border-white/5 px-5 sm:px-6 py-3.5 flex flex-wrap gap-2 bg-[var(--color-bg-input)]/30">
                    @for (tag of getTemplateTags(template); track tag) {
                      <span class="px-2.5 py-1 rounded-full text-xs font-medium tracking-wider uppercase bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] border border-white/5">{{ tag }}</span>
                    }
                  </div>
                }
              </div>
          }
        </div>

        <!-- Archived Templates Section -->
        @if (archivedTemplates().length > 0) {
          <div class="mt-8">
            <h2 class="text-xl font-bold tracking-tight text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="4" rx="2"/><path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/></svg>
              Archivadas
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75 grayscale-[20%]">
              @for (template of archivedTemplates(); track template.id) {
                <div class="bg-[var(--color-bg-input)] rounded-2xl border border-white/5 overflow-hidden flex items-center justify-between p-4">
                  <div>
                    <h3 class="text-white font-bold mb-1">{{ template.name }}</h3>
                    <p class="text-[var(--color-text-muted)] text-xs">{{ template.exercises.length }} ejercicios</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      (click)="toggleArchive(template); $event.stopPropagation()"
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-white transition-colors"
                    >
                      Desarchivar
                    </button>
                    <button
                      (click)="confirmDelete(template); $event.stopPropagation()"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      aria-label="Eliminar rutina permanentemente"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }

      <!-- Delete confirmation modal -->
      @if (templateToDelete()) {
        <div appScrollLock class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" cdkTrapFocus cdkTrapFocusAutoCapture>
          <div class="bg-[var(--color-bg-card)] rounded-3xl p-6 w-full max-w-sm border border-white/5 shadow-xl animate-scale-in">
            <h3 class="text-xl font-bold text-white tracking-tight mb-2">¿Eliminar rutina?</h3>
            <p class="text-[var(--color-text-muted)] text-sm font-medium mb-8 leading-relaxed">
              Se eliminará <span class="text-white font-semibold">{{ templateToDelete()?.name }}</span> permanentemente.
            </p>
            <div class="flex flex-col gap-3">
              <button
                (click)="deleteConfirmed()"
                class="w-full bg-rose-500/10 text-rose-500 border border-rose-500/20 py-3.5 rounded-2xl font-semibold hover:bg-rose-500/20 active:scale-95 transition-all"
              >Eliminar</button>
              <button
                (click)="templateToDelete.set(null)"
                class="w-full bg-[var(--color-bg-input)] text-white border border-white/5 py-3.5 rounded-2xl font-semibold hover:bg-white/5 active:scale-95 transition-all"
              >Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- FAB: Create new template -->
      <button
        (click)="createTemplate()"
        class="fixed bottom-24 sm:bottom-28 right-6 z-40 h-[60px] w-[60px] rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] text-white flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
        aria-label="Crear nueva rutina"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
      </button>
    </div>
  `,
  styles: [`
    .line-clamp-1 {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateListComponent implements OnInit {
  private routineUseCases = inject(RoutineUseCases);
  private router = inject(Router);

  templates = signal<Routine[]>([]);
  templateToDelete = signal<Routine | null>(null);
  
  // Computeds
  activeTemplates = computed(() => this.templates().filter(t => !t.archived));
  archivedTemplates = computed(() => this.templates().filter(t => t.archived));

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    const data = await this.routineUseCases.getAllRoutines();
    this.templates.set(data);
  }

  getExercisesList(template: Routine): string {
    return template.exercises.map(e => e.name).join(' · ');
  }

  getTemplateTags(template: Routine): string[] {
    const tags = new Set<string>();
    template.exercises.forEach(e => e.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }

  createTemplate() {
    this.router.navigate(['/templates/new']);
  }

  editTemplate(id: string) {
    this.router.navigate(['/templates/edit', id]);
  }

  confirmDelete(template: Routine) {
    this.templateToDelete.set(template);
  }

  async deleteConfirmed() {
    const tmpl = this.templateToDelete();
    if (tmpl) {
      await this.routineUseCases.deleteRoutine(tmpl.id);
      await this.loadData();
    }
    this.templateToDelete.set(null);
  }

  async toggleArchive(template: Routine) {
    template.archived = !template.archived;
    await this.routineUseCases.updateRoutine(template);
    await this.loadData();
  }
}
