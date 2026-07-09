import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { DbService } from '../../services/db.service';
import { Template } from '../../models/interfaces';
import { DEFAULT_TEMPLATES } from '../../models/default-templates';

@Component({
  selector: 'app-template-list',
  standalone: true,
  template: `
    <div class="min-h-screen bg-[var(--color-bg-primary)] px-6 pt-12 pb-36 flex flex-col gap-6">

      <!-- Header -->
      <div>
        <h1 class="text-[40px] leading-tight font-black text-[var(--color-text-primary)] tracking-tight">Rutinas</h1>
        <p class="text-[var(--color-text-muted)] text-base mt-2 font-medium">{{ templates().length }} plantilla{{ templates().length !== 1 ? 's' : '' }} guardada{{ templates().length !== 1 ? 's' : '' }}</p>
      </div>

      @if (templates().length === 0) {
        <!-- Empty state -->
        <div class="flex flex-col items-center justify-center mt-12 text-center px-4 animate-fade-in">
          <div class="w-24 h-24 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)]  flex items-center justify-center mb-6 relative overflow-hidden">
             <div class="absolute inset-0 bg-gradient-to-br from-[#00f2fe]/10 to-[#a252ff]/10 z-0"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#neon-gradient)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="z-10 drop-">
              <defs>
                <linearGradient id="neon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#00f2fe" />
                  <stop offset="100%" stop-color="#a252ff" />
                </linearGradient>
              </defs>
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>
            </svg>
          </div>
          <h3 class="text-[var(--color-text-primary)] text-2xl font-black mb-3">Sin rutinas</h3>
          <p class="text-[var(--color-text-muted)] text-base mb-10 leading-relaxed font-medium">Crea tu primera plantilla de entrenamiento para empezar.</p>
          <button
            (click)="loadDefaultTemplates()"
            class="btn-secondary w-full max-w-[280px] min-h-[48px] text-lg rounded-full"
          >
            Cargar rutinas por defecto
          </button>
        </div>
      } @else {
        <!-- Template cards -->
        <div class="flex flex-col gap-4">
          @for (template of templates(); track template.id) {
            <div
              class="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden transition-all  hover: hover:border-[var(--color-border-active)]"
            >
              <!-- Main row -->
              <div class="flex items-start gap-4 p-4" (click)="editTemplate(template.id)">
                <!-- Icon -->
                <div class="w-14 h-14 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-[#00f2fe] drop-"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0 cursor-pointer pt-1">
                  <h2 class="text-lg font-black text-[var(--color-text-primary)] mb-1.5 truncate hover:text-[#00f2fe] transition-colors">{{ template.nombre }}</h2>
                  <p class="text-[var(--color-text-muted)] text-sm line-clamp-1 leading-relaxed font-medium">{{ getExercisesList(template) }}</p>
                </div>

                <!-- Badge + Delete -->
                <div class="flex flex-col items-end gap-3 shrink-0">
                  <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/20">
                    {{ template.ejercicios.length }} ej.
                  </span>
                  <button
                    (click)="confirmDelete(template); $event.stopPropagation()"
                    class="text-[var(--color-text-muted)] hover:text-rose-500 transition-colors p-1.5 active:scale-90 bg-[var(--color-bg-input)] rounded-full"
                    aria-label="Eliminar rutina"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>

              <!-- Exercise tags row -->
              @if (getTemplateTags(template).length > 0) {
                <div class="border-t border-[var(--color-border)] px-5 py-3.5 flex flex-wrap gap-2">
                  @for (tag of getTemplateTags(template); track tag) {
                    <span class="px-3 py-1 rounded-full text-[10px] font-bold bg-[var(--color-bg-input)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">{{ tag }}</span>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Delete confirmation modal -->
      @if (templateToDelete()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1121]/80 backdrop-blur-md px-6">
          <div class="bg-[var(--color-bg-card)] rounded-2xl p-8 w-full max-w-sm border border-[var(--color-border)] shadow-2xl animate-scale-in">
            <h3 class="text-2xl font-black text-[var(--color-text-primary)] mb-4">¿Eliminar rutina?</h3>
            <p class="text-[var(--color-text-muted)] text-base mb-10 leading-relaxed font-medium">
              Se eliminará <span class="text-[var(--color-text-primary)] font-bold">{{ templateToDelete()!.nombre }}</span> permanentemente.
            </p>
            <div class="flex flex-col gap-3">
              <button
                (click)="deleteConfirmed()"
                class="btn-danger rounded-full min-h-[48px]"
              >Eliminar</button>
              <button
                (click)="templateToDelete.set(null)"
                class="btn-secondary rounded-full min-h-[48px]"
              >Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- FAB: Create new template -->
      <button
        (click)="createTemplate()"
        class="fixed bottom-28 right-6 z-40 h-[72px] w-[72px] rounded-full bg-gradient-to-r from-[#00f2fe] to-[#a252ff] text-white  flex items-center justify-center active:scale-90 transition-all duration-300"
        aria-label="Crear nueva rutina"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
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
  private db = inject(DbService);
  private router = inject(Router);

  templates = signal<Template[]>([]);
  templateToDelete = signal<Template | null>(null);

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    const data = await this.db.getTemplates();
    this.templates.set(data);
  }

  getExercisesList(template: Template): string {
    return template.ejercicios.map(e => e.nombre).join(' · ');
  }

  getTemplateTags(template: Template): string[] {
    const tags = new Set<string>();
    template.ejercicios.forEach(e => e.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }

  createTemplate() {
    this.router.navigate(['/templates/new']);
  }

  editTemplate(id: string) {
    this.router.navigate(['/templates/edit', id]);
  }

  confirmDelete(template: Template) {
    this.templateToDelete.set(template);
  }

  async deleteConfirmed() {
    const t = this.templateToDelete();
    if (t) {
      await this.db.deleteTemplate(t.id);
      this.templateToDelete.set(null);
      await this.loadData();
    }
  }

  async loadDefaultTemplates() {
    for (const t of DEFAULT_TEMPLATES) {
      await this.db.saveTemplate({ ...t, id: t.id + '-' + Date.now() });
    }
    await this.loadData();
  }
}
