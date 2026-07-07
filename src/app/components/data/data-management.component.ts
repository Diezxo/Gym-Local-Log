import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportService } from '../../services/export.service';
import { DbService } from '../../services/db.service';
import { LogDiario } from '../../models/interfaces';

interface HistoryStats {
  workouts: number;
  duration: string; // "10h 43m"
  volume: string; // "11,895kg"
}

@Component({
  selector: 'app-data-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-[#0a0a0a] px-6 pt-8 pb-32">
      <!-- Header -->
      <h1 class="text-3xl font-bold text-[#f5f5f5] mb-2 tracking-tight">Historial</h1>
      <p class="text-[#737373] text-base mb-8">{{ currentMonthLabel() }}</p>

      <!-- Stats Summary -->
      <div class="flex items-center justify-between bg-[#141414] rounded-2xl p-4 mb-8 border border-[#1e1e1e]">
        <div class="flex flex-col items-center">
          <span class="text-2xl font-bold text-cyan-400">{{ stats().workouts }}</span>
          <span class="text-[10px] uppercase tracking-wider text-[#737373] mt-1">Workouts</span>
        </div>
        <div class="w-px h-10 bg-[#2a2a2a]"></div>
        <div class="flex flex-col items-center">
          <span class="text-xl font-bold text-cyan-400">{{ stats().duration }}</span>
          <span class="text-[10px] uppercase tracking-wider text-[#737373] mt-1">Duration</span>
        </div>
        <div class="w-px h-10 bg-[#2a2a2a]"></div>
        <div class="flex flex-col items-center">
          <span class="text-xl font-bold text-cyan-400">{{ stats().volume }}</span>
          <span class="text-[10px] uppercase tracking-wider text-[#737373] mt-1">Volume</span>
        </div>
      </div>

      <!-- Workout List -->
      <div class="flex flex-col gap-4 mb-12">
        @for (log of allLogs(); track log.fecha + log.templateId) {
          <div class="bg-[#141414] rounded-3xl p-5 border border-[#1e1e1e] flex gap-4 items-start relative overflow-hidden transition-all hover:border-[#2a2a2a]">
            <!-- Date Box -->
            <div class="flex flex-col items-center justify-center bg-cyan-500/10 rounded-xl min-w-[50px] min-h-[55px] border border-cyan-500/20 shrink-0">
              <span class="text-cyan-400 font-bold text-lg leading-none">{{ log.fecha | slice:8:10 }}</span>
              <span class="text-cyan-400/80 text-xs font-medium uppercase mt-0.5">{{ getMonthShort(log.fecha) }}</span>
            </div>
            
            <!-- Workout Info -->
            <div class="flex-1 min-w-0 pr-10">
              <h3 class="text-[#f5f5f5] font-bold text-lg mb-0.5 truncate">{{ getWorkoutName(log) }}</h3>
              <p class="text-[#737373] text-xs truncate mb-2">
                {{ getMusclesString(log) }}
              </p>
              
              <!-- Exercise Summary -->
              <div class="flex flex-col gap-1 text-sm text-[#a3a3a3]">
                @for (ej of log.ejercicios; track ej.nombre) {
                  <span class="truncate">
                    {{ ej.series?.length || 0 }}x {{ ej.nombre }}
                  </span>
                }
              </div>
            </div>
            
            <!-- Delete Button -->
            <button
              (click)="confirmDeleteLog(log)"
              class="absolute right-4 top-4 text-[#404040] hover:text-rose-500 transition-colors p-2 active:scale-90"
              aria-label="Eliminar entrenamiento"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </button>
          </div>
        }
        @if (allLogs().length === 0) {
          <p class="text-center text-[#737373] text-sm mt-4">No hay entrenamientos este mes.</p>
        }
      </div>

      <!-- Delete confirmation modal -->
      @if (logToDelete()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-sm px-6 transition-opacity">
          <div class="bg-[#141414] rounded-3xl p-8 w-full max-w-sm border border-[#1e1e1e] shadow-2xl animate-scale-in">
            <h3 class="text-xl font-bold text-[#f5f5f5] mb-3">¿Eliminar registro?</h3>
            <p class="text-[#a3a3a3] text-base mb-8 leading-relaxed">
              Se eliminará el entrenamiento del <span class="text-[#f5f5f5] font-semibold">{{ logToDelete()!.fecha }}</span> permanentemente.
            </p>
            <div class="flex gap-4">
              <button
                (click)="logToDelete.set(null)"
                class="flex-1 min-h-14 rounded-2xl bg-[#1e1e1e] text-[#f5f5f5] font-medium active:scale-95 transition-all duration-300 hover:bg-[#2a2a2a]"
              >
                Cancelar
              </button>
              <button
                (click)="deleteLogConfirmed()"
                class="flex-1 min-h-14 rounded-2xl bg-rose-500 text-white font-semibold active:scale-95 transition-all duration-300 shadow-lg shadow-rose-500/20 hover:bg-rose-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Feedback message -->
      @if (feedbackMessage()) {
        <div class="mb-4 px-4 py-3 rounded-xl text-sm" [class]="feedbackIsError() ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400' : 'bg-green-500/15 border border-green-500/30 text-green-400'">
          {{ feedbackMessage() }}
        </div>
      }

      <!-- Action cards (Export) -->
      <h2 class="text-xl font-bold text-[#f5f5f5] mb-4">Exportar Datos</h2>
      <div class="flex gap-3 mb-6">
        <button (click)="exportJSON()" class="flex-1 min-h-12 flex items-center justify-center gap-2 rounded-xl bg-[#141414] text-cyan-400 text-sm font-medium border border-[#1e1e1e] active:scale-95 transition-all hover:border-cyan-400/50">
          Exportar JSON
        </button>
        <button (click)="exportCSV()" class="flex-1 min-h-12 flex items-center justify-center gap-2 rounded-xl bg-[#141414] text-green-400 text-sm font-medium border border-[#1e1e1e] active:scale-95 transition-all hover:border-green-500/50">
          Exportar CSV
        </button>
      </div>
      <button (click)="fileInput.click()" class="w-full min-h-12 flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#2a2a2a] text-[#737373] text-sm font-medium active:scale-95 transition-all hover:border-[#f5f5f5] hover:text-[#f5f5f5]">
        Importar Historial (.json)
      </button>
      <input #fileInput type="file" accept=".json" (change)="onFileSelected($event)" class="hidden" />
    </div>
  `,
  styles: [``],
})
export class DataManagementComponent implements OnInit {
  private exportService = inject(ExportService);
  private db = inject(DbService);

  currentMesId = signal('');
  currentMonthLabel = signal('');
  feedbackMessage = signal('');
  feedbackIsError = signal(false);

  allLogs = signal<LogDiario[]>([]);
  stats = signal<HistoryStats>({ workouts: 0, duration: '0h 0m', volume: '0kg' });
  logToDelete = signal<LogDiario | null>(null);

  private monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  async ngOnInit() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    this.currentMesId.set(`${year}-${month}`);
    this.currentMonthLabel.set(`${this.monthNames[now.getMonth()]} ${year}`);
    
    await this.loadHistory();
  }

  async loadHistory() {
    // Only load current month for simplicity, or we could flatten all months.
    const archive = await this.db.getMonthlyArchive(this.currentMesId());
    if (archive && archive.logs) {
      const logsDescending = [...archive.logs].sort((a, b) => b.fecha.localeCompare(a.fecha));
      this.allLogs.set(logsDescending);
      
      // Calculate Stats
      const workouts = logsDescending.length;
      let totalVolume = 0;
      
      for (const log of logsDescending) {
        for (const ej of log.ejercicios) {
          if (ej.tipo === 'fuerza' && ej.series) {
            for (const serie of ej.series) {
              totalVolume += (serie.peso * serie.reps);
            }
          }
        }
      }
      
      this.stats.set({
        workouts,
        duration: '1h 15m', // Placeholder as we aren't tracking duration natively right now
        volume: totalVolume.toLocaleString() + 'kg'
      });
    }
  }

  getMonthShort(fecha: string): string {
    const [year, month] = fecha.split('-');
    return this.monthNames[parseInt(month, 10) - 1] || '';
  }

  getWorkoutName(log: LogDiario): string {
    // If it was based on a template, we could show it, otherwise Fallback
    return 'Entrenamiento';
  }

  getMusclesString(log: LogDiario): string {
    // Collect unique muscles (if we had them), for now return exercise types
    const types = new Set(log.ejercicios.map(e => e.tipo === 'fuerza' ? 'Fuerza' : 'Cardio'));
    return Array.from(types).join(', ');
  }

  confirmDeleteLog(log: LogDiario) {
    this.logToDelete.set(log);
  }

  async deleteLogConfirmed() {
    const log = this.logToDelete();
    if (log) {
      await this.db.deleteLog(log.fecha, log.templateId);
      this.logToDelete.set(null);
      await this.loadHistory();
      this.showFeedback('Registro eliminado.', false);
    }
  }

  async exportJSON() {
    await this.exportMonth(this.currentMesId(), 'json');
  }

  async exportCSV() {
    await this.exportMonth(this.currentMesId(), 'csv');
  }

  private async exportMonth(mesId: string, format: 'json' | 'csv') {
    try {
      if (format === 'json') {
        await this.exportService.exportJSON(mesId);
      } else {
        await this.exportService.exportCSV(mesId);
      }
      this.showFeedback(`Exportado correctamente.`, false);
    } catch (err: any) {
      this.showFeedback(err.message || 'Error al exportar.', true);
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      await this.exportService.importJSON(file);
      this.showFeedback(`Importado correctamente`, false);
      await this.loadHistory();
    } catch (err: any) {
      this.showFeedback(err.message || 'Error al importar.', true);
    }
    input.value = '';
  }

  private showFeedback(message: string, isError: boolean) {
    this.feedbackMessage.set(message);
    this.feedbackIsError.set(isError);
    setTimeout(() => this.feedbackMessage.set(''), 4000);
  }
}
