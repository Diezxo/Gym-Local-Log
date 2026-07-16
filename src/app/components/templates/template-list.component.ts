import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { RoutineUseCases } from '../../use-cases/routine.use-cases';
import { Routine } from '../../models/interfaces';
import { DEFAULT_TEMPLATES } from '../../models/default-templates';

@Component({
  selector: 'app-template-list',
  standalone: true,
  template: `
    <div class="min-h-screen bg-[var(--color-bg-primary)] px-4 sm:px-6 pt-10 pb-36 flex flex-col gap-6 max-w-4xl mx-auto w-full">

      <!-- Header -->
      <div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-white">Rutinas</h1>
        <p class="text-[var(--color-text-muted)] text-sm font-medium mt-1">{{ templates().length }} plantilla{{ templates().length !== 1 ? 's' : '' }} guardada{{ templates().length !== 1 ? 's' : '' }}</p>
      </div>

      @if (templates().length === 0) {
        <!-- Empty state -->
        <div class="flex flex-col items-center justify-center mt-12 text-center px-4 animate-fade-in">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-bg-input)] to-[var(--color-bg-primary)] border border-white/5 shadow-inner flex items-center justify-center mb-6 relative overflow-hidden">
             <div class="absolute inset-0 bg-[var(--color-accent)]/10 z-0"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="z-10 text-[var(--color-accent)]">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>
            </svg>
          </div>
          <h3 class="text-white text-xl font-semibold mb-2">Sin rutinas</h3>
          <p class="text-[var(--color-text-muted)] text-sm font-medium mb-10 max-w-[280px]">Crea tu primera plantilla de entrenamiento para empezar.</p>
          <button
            (click)="loadDefaultTemplates()"
            class="btn-secondary w-full max-w-[280px] min-h-[48px] text-sm"
          >
            Cargar rutinas por defecto
          </button>
        </div>
      } @else {
        <!-- Template cards -->
        <div class="flex flex-col gap-4">
          @for (template of templates(); track template.id) {
            <div
              class="bg-[var(--color-bg-card)] rounded-3xl border border-white/5 overflow-hidden transition-all shadow-sm hover:shadow-md hover:border-[var(--color-accent)]/30 group cursor-pointer"
              (click)="editTemplate(template.id)"
            >
              <!-- Main row -->
              <div class="flex items-start gap-4 p-5 sm:p-6">
                <!-- Icon -->
                <div class="w-14 h-14 rounded-2xl bg-[var(--color-bg-input)] border border-white/5 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-white/5 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-accent)]"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0 pt-1">
                  <h2 class="text-xl font-bold text-white tracking-tight mb-1 truncate transition-colors">{{ template.name }}</h2>
                  <p class="text-[var(--color-text-muted)] text-xs font-medium line-clamp-1">{{ getExercisesList(template) }}</p>
                </div>

                <!-- Badge + Delete -->
                <div class="flex flex-col items-end gap-3 shrink-0">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                    {{ template.exercises.length }} ej.
                  </span>
                  <button
                    (click)="confirmDelete(template); $event.stopPropagation()"
                    class="text-[var(--color-text-muted)] hover:text-rose-400 transition-colors p-1.5 active:scale-95 bg-[var(--color-bg-input)] rounded-full border border-white/5 hover:border-rose-500/30 hover:bg-rose-500/10"
                    aria-label="Eliminar rutina"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>

              <!-- Exercise tags row -->
              @if (getTemplateTags(template).length > 0) {
                <div class="border-t border-white/5 px-5 sm:px-6 py-3.5 flex flex-wrap gap-2 bg-[var(--color-bg-input)]/30">
                  @for (tag of getTemplateTags(template); track tag) {
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wider uppercase bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] border border-white/5">{{ tag }}</span>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Delete confirmation modal -->
      @if (templateToDelete()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div class="bg-[var(--color-bg-card)] rounded-3xl p-6 w-full max-w-sm border border-white/5 shadow-xl animate-scale-in">
            <h3 class="text-xl font-bold text-white tracking-tight mb-2">¿Eliminar rutina?</h3>
            <p class="text-[var(--color-text-muted)] text-sm font-medium mb-8 leading-relaxed">
              Se eliminará <span class="text-white font-semibold">{{ templateToDelete()!.name }}</span> permanentemente.
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
    const t = this.templateToDelete();
    if (t) {
      await this.routineUseCases.deleteRoutine(t.id);
      this.templateToDelete.set(null);
      await this.loadData();
    }
  }

  async loadDefaultTemplates() {
    for (const t of DEFAULT_TEMPLATES) {
      await this.routineUseCases.updateRoutine({
        id: t.id + '-' + Date.now(),
        schemaVersion: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deviceId: 'local',
        version: 1,
        syncStatus: 'local_only',
        name: t.name,
        exercises: t.exercises
      });
    }
    await this.loadData();
  }
}
