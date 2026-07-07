import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DbService } from '../../services/db.service';
import { Template, LogDiario } from '../../models/interfaces';
import { DEFAULT_TEMPLATES } from '../../models/default-templates';

interface HeatmapDay {
  date: Date;
  trained: boolean;
  label: string;
}

@Component({
  selector: 'app-template-list',
  standalone: true,
  template: `
    <div class="min-h-screen bg-[#0a0a0a] px-6 pt-8 pb-32">
      <!-- Header -->
      <h1 class="text-3xl font-bold text-[#f5f5f5] mb-8 tracking-tight">Dashboard</h1>

      <!-- Heatmap de Consistencia -->
      <div class="mb-10">
        <div class="flex items-end justify-between mb-3">
          <h2 class="text-[#f5f5f5] font-semibold text-lg">Consistencia (30 días)</h2>
          <span class="text-cyan-400 font-bold text-sm bg-cyan-400/10 px-2 py-0.5 rounded-md">
            {{ getTrainedDaysCount() }} / 30
          </span>
        </div>
        
        <div class="flex flex-wrap gap-1.5 p-4 bg-[#141414] rounded-3xl border border-[#1e1e1e]">
          @for (day of heatmapDays(); track day.date.toISOString()) {
            <div 
              class="w-4 h-4 rounded-sm transition-colors duration-300"
              [class.bg-emerald-500]="day.trained"
              [class.bg-[#1e1e1e]]="!day.trained"
              [class.shadow-[0_0_8px_rgba(16,185,129,0.3)]]="day.trained"
              [title]="day.label"
            ></div>
          }
        </div>
      </div>

      <!-- Quick Action: Repeat Last Workout -->
      @if (lastLog()) {
        <div class="mb-10 animate-fade-in">
          <h2 class="text-[#737373] text-sm font-semibold mb-3 uppercase tracking-wider">Acceso Rápido</h2>
          <button
            (click)="repeatLastWorkout()"
            class="w-full text-left p-5 bg-gradient-to-br from-[#1a1a1a] to-[#141414] rounded-3xl border border-[#2a2a2a] active:scale-95 transition-all duration-300 hover:border-cyan-400/50 group"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="text-cyan-400 font-semibold text-sm">Repetir último entrenamiento</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#737373] group-hover:text-cyan-400 transition-colors"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
            <h3 class="text-[#f5f5f5] text-lg font-bold truncate">{{ lastLog()?.ejercicios?.length }} Ejercicios</h3>
            <p class="text-[#737373] text-xs mt-1">Hace {{ getDaysAgo(lastLog()!.fecha) }}</p>
          </button>
        </div>
      }

      <h2 class="text-[#737373] text-sm font-semibold mb-4 uppercase tracking-wider">Mis Rutinas</h2>

      @if (templates().length === 0) {
        <!-- Empty state -->
        <div class="flex flex-col items-center justify-center mt-12 text-center px-4 animate-fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="text-[#2a2a2a] mb-6"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
          <h3 class="text-[#f5f5f5] text-xl font-semibold mb-2">Sin rutinas</h3>
          <p class="text-[#737373] text-base mb-8">Crea tu primera plantilla de entrenamiento para empezar.</p>
          <button
            (click)="loadDefaultTemplates()"
            class="px-6 py-3 bg-[#1e1e1e] text-[#f5f5f5] rounded-xl font-medium active:scale-95 transition-all hover:bg-[#2a2a2a]"
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
                <div class="flex-1 min-w-0 cursor-pointer" (click)="editTemplate(template.id)">
                  <h2 class="text-xl font-bold text-[#f5f5f5] mb-1.5 truncate hover:text-cyan-400 transition-colors">{{ template.nombre }}</h2>
                  <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-400/15 text-cyan-400">
                    {{ template.ejercicios.length }} {{ template.ejercicios.length === 1 ? 'ejercicio' : 'ejercicios' }}
                  </span>
                  
                  <div class="mt-3 text-sm text-[#737373] line-clamp-2 leading-relaxed">
                    {{ getExercisesList(template) }}
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-col gap-3 shrink-0">
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
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
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
  
  heatmapDays = signal<HeatmapDay[]>([]);
  lastLog = signal<LogDiario | null>(null);

  async ngOnInit() {
    await this.loadData();
    this.generateHeatmap();
  }

  async loadData() {
    const data = await this.db.getTemplates();
    this.templates.set(data);
    
    const last = await this.db.getLastLog();
    this.lastLog.set(last);
  }

  async generateHeatmap() {
    const trainingDays = await this.db.getTrainingDays();
    const trainingSet = new Set(trainingDays); // Format: 'YYYY-MM-DD'
    
    const days: HeatmapDay[] = [];
    const today = new Date();
    
    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      
      days.push({
        date: d,
        trained: trainingSet.has(dateString),
        label: dateString
      });
    }
    this.heatmapDays.set(days);
  }

  getTrainedDaysCount(): number {
    return this.heatmapDays().filter(d => d.trained).length;
  }
  
  getDaysAgo(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'hoy';
    if (diffDays === 1) return 'ayer';
    return `${diffDays} días`;
  }

  repeatLastWorkout() {
    const last = this.lastLog();
    if (!last) return;
    
    const tempTemplate: Template = {
      id: 'temp-repeat',
      nombre: 'Repetición: ' + this.getDaysAgo(last.fecha),
      ejercicios: last.ejercicios.map(e => ({ nombre: e.nombre, tipo: e.tipo }))
    };
    
    this.router.navigate(['/workout'], { state: { template: tempTemplate } });
  }

  getExercisesList(template: Template): string {
    return template.ejercicios.map(e => e.nombre).join(' • ');
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
