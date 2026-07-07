import { Component, OnInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DbService } from '../../services/db.service';
import { Template } from '../../models/interfaces';

@Component({
  selector: 'app-template-list',
  standalone: true,
  template: `
    <div class="min-h-screen bg-[#0a0a0a] px-4 pt-6 pb-28">
      <!-- Header -->
      <h1 class="text-2xl font-bold text-[#f5f5f5] mb-6">Mis Rutinas</h1>

      @if (templates().length === 0) {
        <!-- Empty state -->
        <div class="flex flex-col items-center justify-center mt-24 text-center">
          <span class="text-5xl mb-4">📋</span>
          <p class="text-[#737373] text-lg">No tienes rutinas. ¡Crea tu primera!</p>
        </div>
      } @else {
        <!-- Template cards -->
        <div class="flex flex-col gap-4">
          @for (template of templates(); track template.id) {
            <div class="bg-[#141414] rounded-2xl p-5 border border-[#1e1e1e]">
              <div class="flex items-start justify-between gap-3">
                <!-- Template info -->
                <div class="flex-1 min-w-0">
                  <h2 class="text-lg font-semibold text-[#f5f5f5] truncate">{{ template.nombre }}</h2>
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
                <div class="flex flex-col gap-2 shrink-0">
                  <button
                    (click)="editTemplate(template.id)"
                    class="min-h-14 min-w-14 flex items-center justify-center rounded-xl bg-[#1e1e1e] text-lg active:bg-[#2a2a2a] transition-colors"
                    aria-label="Editar rutina"
                  >
                    ✏️
                  </button>
                  <button
                    (click)="confirmDelete(template)"
                    class="min-h-14 min-w-14 flex items-center justify-center rounded-xl bg-[#1e1e1e] text-lg active:bg-rose-500/20 transition-colors"
                    aria-label="Eliminar rutina"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Delete confirmation modal -->
      @if (templateToDelete()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div class="bg-[#141414] rounded-2xl p-6 w-full max-w-sm border border-[#1e1e1e]">
            <h3 class="text-lg font-semibold text-[#f5f5f5] mb-2">¿Eliminar rutina?</h3>
            <p class="text-[#737373] text-sm mb-6">
              Se eliminará <span class="text-[#f5f5f5] font-medium">{{ templateToDelete()!.nombre }}</span> permanentemente.
            </p>
            <div class="flex gap-3">
              <button
                (click)="templateToDelete.set(null)"
                class="flex-1 min-h-14 rounded-xl bg-[#1e1e1e] text-[#f5f5f5] font-medium active:bg-[#2a2a2a] transition-colors"
              >
                Cancelar
              </button>
              <button
                (click)="deleteConfirmed()"
                class="flex-1 min-h-14 rounded-xl bg-rose-500 text-white font-medium active:bg-rose-600 transition-colors"
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
        class="fixed bottom-24 right-5 z-40 h-16 w-16 rounded-full bg-cyan-400 text-[#0a0a0a] text-3xl font-bold shadow-lg shadow-cyan-400/25 flex items-center justify-center active:bg-cyan-500 transition-colors"
        aria-label="Crear nueva rutina"
      >
        +
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
