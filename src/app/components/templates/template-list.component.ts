import { Component, OnInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DbService } from '../../services/db.service';
import { Template } from '../../models/interfaces';
import { DEFAULT_TEMPLATES } from '../../models/default-templates';

@Component({
  selector: 'app-template-list',
  standalone: true,
  template: `
    <div class="min-h-screen bg-[#0a0a0a] px-6 pt-8 pb-32">
      <!-- Header -->
      <h1 class="text-3xl font-bold text-[#f5f5f5] mb-8 tracking-tight">Mis Rutinas</h1>

      @if (templates().length === 0) {
        <!-- Empty state -->
        <div class="flex flex-col items-center justify-center mt-32 text-center px-4 animate-fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="text-[#2a2a2a] mb-6"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
          <h3 class="text-[#f5f5f5] text-xl font-semibold mb-2">Sin rutinas</h3>
          <p class="text-[#737373] text-base mb-8">Crea tu primera plantilla de entrenamiento para empezar.</p>
          <button
            (click)="loadDefaultTemplates()"
            class="px-6 py-3 bg-[#1e1e1e] text-[#f5f5f5] rounded-xl font-medium active:bg-[#2a2a2a] transition-colors border border-[#333]"
          >
            Cargar Rutinas por Defecto
          </button>
        </div>
      } @else {
        <!-- Template cards -->
        <div class="flex flex-col gap-6">
          @for (template of templates(); track template.id) {
            <div class="bg-[#141414] rounded-3xl p-6 border border-[#1e1e1e] transition-all duration-300 hover:border-[#2a2a2a] shadow-sm">
              <div class="flex items-start justify-between gap-4">
                <!-- Template info -->
                <div class="flex-1 min-w-0">
                  <h2 class="text-xl font-bold text-[#f5f5f5] mb-1.5 truncate">{{ template.nombre }}</h2>
                  <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-400/15 text-cyan-400">
                    {{ template.ejercicios.length }} {{ template.ejercicios.length === 1 ? 'ejercicio' : 'ejercicios' }}
                  </span>
                  <div class="mt-3 flex flex-wrap gap-1.5">
                    @for (ej of template.ejercicios; track ej.nombre) {
                      <span class="text-xs text-[#737373]">{{ ej.nombre }}{{ !$last ? ' ·' : '' }}</span>
                    }
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-col gap-3 shrink-0">
                  <button
                    (click)="editTemplate(template.id)"
                    class="min-h-14 min-w-14 flex items-center justify-center rounded-2xl bg-[#1e1e1e] text-[#a3a3a3] active:scale-95 transition-all duration-300 hover:bg-[#2a2a2a] hover:text-[#f5f5f5]"
                    aria-label="Editar rutina"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>
                  </button>
                  <button
                    (click)="confirmDelete(template)"
                    class="min-h-14 min-w-14 flex items-center justify-center rounded-2xl bg-[#1e1e1e] text-[#a3a3a3] active:scale-95 transition-all duration-300 hover:bg-rose-500/10 hover:text-rose-500"
                    aria-label="Eliminar rutina"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Delete confirmation modal -->
      @if (templateToDelete()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-sm px-6 transition-opacity">
          <div class="bg-[#141414] rounded-3xl p-8 w-full max-w-sm border border-[#1e1e1e] shadow-2xl animate-slide-up">
            <h3 class="text-xl font-bold text-[#f5f5f5] mb-3">¿Eliminar rutina?</h3>
            <p class="text-[#a3a3a3] text-base mb-8 leading-relaxed">
              Se eliminará <span class="text-[#f5f5f5] font-semibold">{{ templateToDelete()!.nombre }}</span> permanentemente.
            </p>
            <div class="flex gap-4">
              <button
                (click)="templateToDelete.set(null)"
                class="flex-1 min-h-14 rounded-2xl bg-[#1e1e1e] text-[#f5f5f5] font-medium active:scale-95 transition-all duration-300"
              >
                Cancelar
              </button>
              <button
                (click)="deleteConfirmed()"
                class="flex-1 min-h-14 rounded-2xl bg-rose-500 text-white font-semibold active:scale-95 transition-all duration-300 shadow-lg shadow-rose-500/20"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- FAB: Create new template -->
      <button
        (click)="createTemplate()"
        class="fixed bottom-28 right-6 z-40 h-16 w-16 rounded-full bg-cyan-400 text-[#0a0a0a] shadow-xl shadow-cyan-400/20 flex items-center justify-center active:scale-90 transition-all duration-300 hover:bg-cyan-300"
        aria-label="Crear nueva rutina"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
      </button>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class TemplateListComponent implements OnInit {
  private db = inject(DbService);
  private router = inject(Router);

  templates = signal<Template[]>([]);
  templateToDelete = signal<Template | null>(null);

  async ngOnInit() {
    await this.loadTemplates();
  }

  async loadTemplates() {
    const all = await this.db.getTemplates();
    this.templates.set(all);
  }

  async loadDefaultTemplates() {
    for (const t of DEFAULT_TEMPLATES) {
      await this.db.saveTemplate({ ...t, id: t.id + '-' + Date.now() }); // add timestamp to ensure uniqueness just in case
    }
    await this.loadTemplates();
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
      await this.loadTemplates();
    }
  }
}

