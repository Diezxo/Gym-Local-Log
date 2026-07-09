import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DbService } from '../../services/db.service';
import { Template } from '../../models/interfaces';
import { DEFAULT_TEMPLATES } from '../../models/default-templates';

@Component({
  selector: 'app-template-list',
  standalone: true,
  template: `
    <div class="min-h-screen bg-[#0a0a0a] px-5 pt-8 pb-32">

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-[#f5f5f5] tracking-tight">Rutinas</h1>
        <p class="text-[#404040] text-sm mt-1">{{ templates().length }} plantilla{{ templates().length !== 1 ? 's' : '' }} guardada{{ templates().length !== 1 ? 's' : '' }}</p>
      </div>

      @if (templates().length === 0) {
        <!-- Empty state -->
        <div class="flex flex-col items-center justify-center mt-16 text-center px-4 animate-fade-in">
          <div class="w-20 h-20 rounded-3xl bg-[#111] border border-[#1a1a1a] flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="text-[#2a2a2a]"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
          </div>
          <h3 class="text-[#f5f5f5] text-xl font-semibold mb-2">Sin rutinas</h3>
          <p class="text-[#404040] text-sm mb-8 leading-relaxed">Crea tu primera plantilla de entrenamiento para empezar.</p>
          <button
            (click)="loadDefaultTemplates()"
            class="px-6 py-3 bg-[#1a1a1a] text-[#f5f5f5] rounded-xl font-medium active:scale-95 transition-all hover:bg-[#222] border border-[#2a2a2a]"
          >
            Cargar rutinas por defecto
          </button>
        </div>
      } @else {
        <!-- Template cards -->
        <div class="flex flex-col gap-3">
          @for (template of templates(); track template.id) {
            <div
              class="bg-[#111] rounded-2xl border border-[#1a1a1a] overflow-hidden transition-all hover:border-[#222]"
            >
              <!-- Main row -->
              <div class="flex items-start gap-3 p-4" (click)="editTemplate(template.id)">
                <!-- Icon -->
                <div class="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#222] flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-cyan-400"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0 cursor-pointer">
                  <h2 class="text-base font-bold text-[#f5f5f5] mb-1 truncate hover:text-cyan-400 transition-colors">{{ template.nombre }}</h2>
                  <p class="text-[#404040] text-xs line-clamp-1 leading-relaxed">{{ getExercisesList(template) }}</p>
                </div>

                <!-- Badge + Delete -->
                <div class="flex flex-col items-end gap-2 shrink-0">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                    {{ template.ejercicios.length }} ej.
                  </span>
                  <button
                    (click)="confirmDelete(template); $event.stopPropagation()"
                    class="text-[#2a2a2a] hover:text-rose-500 transition-colors p-1 active:scale-90"
                    aria-label="Eliminar rutina"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>

              <!-- Exercise tags row -->
              @if (getTemplateTags(template).length > 0) {
                <div class="border-t border-[#1a1a1a] px-4 py-2.5 flex flex-wrap gap-1.5">
                  @for (tag of getTemplateTags(template); track tag) {
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#1a1a1a] text-[#404040] border border-[#222]">{{ tag }}</span>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Delete confirmation modal -->
      @if (templateToDelete()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-sm px-6">
          <div class="bg-[#141414] rounded-3xl p-8 w-full max-w-sm border border-[#1e1e1e] shadow-2xl">
            <h3 class="text-xl font-bold text-[#f5f5f5] mb-3">¿Eliminar rutina?</h3>
            <p class="text-[#a3a3a3] text-base mb-8 leading-relaxed">
              Se eliminará <span class="text-[#f5f5f5] font-semibold">{{ templateToDelete()!.nombre }}</span> permanentemente.
            </p>
            <div class="flex gap-4">
              <button
                (click)="templateToDelete.set(null)"
                class="flex-1 min-h-14 rounded-2xl bg-[#1e1e1e] text-[#f5f5f5] font-medium active:scale-95 transition-all"
              >Cancelar</button>
              <button
                (click)="deleteConfirmed()"
                class="flex-1 min-h-14 rounded-2xl bg-rose-500 text-white font-semibold active:scale-95 transition-all shadow-lg shadow-rose-500/20"
              >Eliminar</button>
            </div>
          </div>
        </div>
      }

      <!-- FAB: Create new template -->
      <button
        (click)="createTemplate()"
        class="fixed bottom-28 right-5 z-40 h-14 w-14 rounded-full bg-cyan-400 text-[#0a0a0a] shadow-xl shadow-cyan-400/20 flex items-center justify-center active:scale-90 transition-all duration-300 hover:bg-cyan-300"
        aria-label="Crear nueva rutina"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
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
