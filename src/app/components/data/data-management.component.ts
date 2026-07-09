import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportService } from '../../services/export.service';
import { DbService } from '../../services/db.service';
import { LogDiario, MuscleTag, TAG_COLORS, EjercicioLog } from '../../models/interfaces';

interface MonthStats {
  sesiones: number;
  volumenKg: number;
  distanciaKm: number;
  tagSesiones: { tag: MuscleTag; count: number }[];
}

@Component({
  selector: 'app-data-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-[#0a0a0a] px-5 pt-8 pb-32">

      <!-- Header -->
      <div class="mb-8">
        <p class="text-xs text-[#404040] uppercase tracking-[0.2em] mb-1">{{ currentMonthLabel() }}</p>
        <h1 class="text-3xl font-bold text-[#f5f5f5] tracking-tight">Historial</h1>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-3 gap-2.5 mb-8">
        <div class="bg-[#111] rounded-2xl p-3.5 border border-[#1a1a1a] flex flex-col items-center gap-1">
          <span class="text-2xl font-black text-cyan-400">{{ stats().sesiones }}</span>
          <span class="text-[9px] uppercase tracking-wider text-[#404040] text-center leading-tight">Sesiones</span>
        </div>
        <div class="bg-[#111] rounded-2xl p-3.5 border border-[#1a1a1a] flex flex-col items-center gap-1">
          <span class="text-xl font-black text-[#f5f5f5]">{{ formatVol(stats().volumenKg) }}</span>
          <span class="text-[9px] uppercase tracking-wider text-[#404040] text-center leading-tight">Vol. Fuerza</span>
        </div>
        <div class="bg-[#111] rounded-2xl p-3.5 border border-[#1a1a1a] flex flex-col items-center gap-1">
          <span class="text-xl font-black text-emerald-400">{{ stats().distanciaKm > 0 ? stats().distanciaKm + ' km' : '—' }}</span>
          <span class="text-[9px] uppercase tracking-wider text-[#404040] text-center leading-tight">Cardio</span>
        </div>
      </div>

      <!-- Tags breakdown -->
      @if (stats().tagSesiones.length > 0) {
        <div class="flex gap-2 flex-wrap mb-7">
          @for (ts of stats().tagSesiones; track ts.tag) {
            <span
              class="px-2.5 py-1 rounded-full text-[11px] font-bold border"
              [style.background]="getTagColor(ts.tag).bg"
              [style.borderColor]="getTagColor(ts.tag).border"
              [style.color]="getTagColor(ts.tag).text"
            >{{ ts.tag }} · {{ ts.count }}</span>
          }
        </div>
      }

      <!-- Workout List -->
      <div class="flex flex-col gap-3 mb-10">
        @for (log of allLogs(); track log.fecha + log.templateId) {
          <div class="bg-[#111] rounded-2xl border border-[#1a1a1a] overflow-hidden">

            <!-- Date + Tags row -->
            <div class="flex items-center gap-3 px-4 pt-4 pb-2.5">
              <div class="flex flex-col items-center justify-center bg-cyan-500/10 rounded-xl w-12 h-12 border border-cyan-500/20 shrink-0">
                <span class="text-cyan-400 font-black text-base leading-none">{{ log.fecha | slice:8:10 }}</span>
                <span class="text-cyan-400/70 text-[9px] font-semibold uppercase mt-0.5">{{ getMonthShort(log.fecha) }}</span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap gap-1 mb-1">
                  @for (tag of getLogTags(log); track tag) {
                    <span
                      class="px-1.5 py-0.5 rounded-md text-[10px] font-bold border"
                      [style.background]="getTagColor(tag).bg"
                      [style.borderColor]="getTagColor(tag).border"
                      [style.color]="getTagColor(tag).text"
                    >{{ tag }}</span>
                  }
                  @if (getLogTags(log).length === 0) {
                    <span class="text-[#404040] text-xs">Sin etiquetas</span>
                  }
                </div>
                <p class="text-[#404040] text-[10px]">{{ log.ejercicios.length }} ejercicio{{ log.ejercicios.length !== 1 ? 's' : '' }}</p>
              </div>

              <button
                (click)="confirmDeleteLog(log)"
                class="text-[#2a2a2a] hover:text-rose-500 transition-colors p-2 active:scale-90 shrink-0"
                aria-label="Eliminar entrenamiento"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>

            <!-- Exercise lines -->
            <div class="border-t border-[#1a1a1a] px-4 pt-2.5 pb-3 flex flex-col gap-1.5">
              @for (ej of log.ejercicios; track ej.nombre) {
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[#a3a3a3] text-sm truncate flex-1">{{ ej.nombre }}</span>
                  <span class="text-sm font-bold text-[#f5f5f5] shrink-0 font-mono">
                    {{ getEjercicioResumen(ej) }}
                  </span>
                </div>
              }
            </div>

            <!-- Volume footer -->
            @if (getLogVolumen(log) > 0 || getLogDistancia(log) > 0) {
              <div class="border-t border-[#1a1a1a] px-4 py-2 flex gap-4">
                @if (getLogVolumen(log) > 0) {
                  <span class="text-xs text-[#404040]">
                    Vol: <span class="text-[#737373] font-semibold">{{ formatVol(getLogVolumen(log)) }}</span>
                  </span>
                }
                @if (getLogDistancia(log) > 0) {
                  <span class="text-xs text-[#404040]">
                    Cardio: <span class="text-cyan-400/70 font-semibold">{{ getLogDistancia(log) }} km</span>
                  </span>
                }
              </div>
            }
          </div>
        }

        @if (allLogs().length === 0) {
          <div class="text-center py-16">
            <p class="text-[#2a2a2a] text-5xl mb-3">📭</p>
            <p class="text-[#404040] text-sm">No hay entrenamientos este mes.</p>
          </div>
        }
      </div>

      <!-- Feedback message -->
      @if (feedbackMessage()) {
        <div class="mb-4 px-4 py-3 rounded-xl text-sm" [class]="feedbackIsError() ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400' : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'">
          {{ feedbackMessage() }}
        </div>
      }

      <!-- Exportar -->
      <h2 class="text-sm font-semibold text-[#737373] uppercase tracking-wider mb-3">Exportar Datos</h2>
      <div class="flex gap-3 mb-4">
        <button (click)="exportJSON()" class="flex-1 min-h-12 flex items-center justify-center gap-2 rounded-xl bg-[#111] text-cyan-400 text-sm font-medium border border-[#1a1a1a] active:scale-95 transition-all hover:border-cyan-400/40">
          JSON
        </button>
        <button (click)="exportCSV()" class="flex-1 min-h-12 flex items-center justify-center gap-2 rounded-xl bg-[#111] text-emerald-400 text-sm font-medium border border-[#1a1a1a] active:scale-95 transition-all hover:border-emerald-400/40">
          CSV
        </button>
      </div>
      <button (click)="fileInput.click()" class="w-full min-h-12 flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#2a2a2a] text-[#404040] text-sm font-medium active:scale-95 transition-all hover:border-[#737373] hover:text-[#737373]">
        Importar (.json)
      </button>
      <input #fileInput type="file" accept=".json" (change)="onFileSelected($event)" class="hidden" />

      <!-- Delete confirmation modal -->
      @if (logToDelete()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-sm px-6">
          <div class="bg-[#141414] rounded-3xl p-8 w-full max-w-sm border border-[#1e1e1e] shadow-2xl">
            <h3 class="text-xl font-bold text-[#f5f5f5] mb-3">¿Eliminar registro?</h3>
            <p class="text-[#a3a3a3] text-base mb-8 leading-relaxed">
              Se eliminará el entrenamiento del <span class="text-[#f5f5f5] font-semibold">{{ logToDelete()!.fecha }}</span> permanentemente.
            </p>
            <div class="flex gap-4">
              <button
                (click)="logToDelete.set(null)"
                class="flex-1 min-h-14 rounded-2xl bg-[#1e1e1e] text-[#f5f5f5] font-medium active:scale-95 transition-all"
              >Cancelar</button>
              <button
                (click)="deleteLogConfirmed()"
                class="flex-1 min-h-14 rounded-2xl bg-rose-500 text-white font-semibold active:scale-95 transition-all shadow-lg shadow-rose-500/20"
              >Eliminar</button>
            </div>
          </div>
        </div>
      }
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
  stats = signal<MonthStats>({ sesiones: 0, volumenKg: 0, distanciaKm: 0, tagSesiones: [] });
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
    const archive = await this.db.getMonthlyArchive(this.currentMesId());
    if (archive?.logs) {
      const logs = [...archive.logs].sort((a, b) => b.fecha.localeCompare(a.fecha));
      this.allLogs.set(logs);
      this.calcStats(logs);
    } else {
      this.allLogs.set([]);
      this.calcStats([]);
    }
  }

  private calcStats(logs: LogDiario[]) {
    let volumen = 0;
    let distancia = 0;
    const tagCount = new Map<MuscleTag, Set<string>>();

    for (const log of logs) {
      for (const ej of log.ejercicios) {
        if (ej.tipo === 'fuerza' && ej.series) {
          volumen += ej.series.reduce((s, r) => s + r.peso * r.reps, 0);
        } else if (ej.cardio) {
          distancia += ej.cardio.distanciaKm ?? 0;
        }
        for (const tag of (ej.tags ?? [])) {
          if (!tagCount.has(tag)) tagCount.set(tag, new Set());
          tagCount.get(tag)!.add(log.fecha);
        }
      }
    }

    const tagSesiones = Array.from(tagCount.entries())
      .map(([tag, dates]) => ({ tag, count: dates.size }))
      .sort((a, b) => b.count - a.count);

    this.stats.set({
      sesiones: logs.length,
      volumenKg: Math.round(volumen),
      distanciaKm: Math.round(distancia * 10) / 10,
      tagSesiones,
    });
  }

  // ── Helpers ──

  getMonthShort(fecha: string): string {
    const [, month] = fecha.split('-');
    return this.monthNames[parseInt(month, 10) - 1] || '';
  }

  getLogTags(log: LogDiario): MuscleTag[] {
    const tags = new Set<MuscleTag>();
    log.ejercicios.forEach(e => e.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }

  getTagColor(tag: MuscleTag) {
    return TAG_COLORS[tag] ?? { bg: 'rgba(255,255,255,0.05)', text: '#a3a3a3', border: 'rgba(255,255,255,0.1)' };
  }

  /** Devuelve línea de resumen por ejercicio: '3×8 @ 80kg' o '5.2 km · 32 min' o '0×—' */
  getEjercicioResumen(ej: EjercicioLog): string {
    if (ej.tipo === 'fuerza') {
      const series = ej.series ?? [];
      if (series.length === 0) return '0×—';
      // Best set (highest volume per set)
      const best = series.reduce((prev, cur) =>
        cur.peso * cur.reps > prev.peso * prev.reps ? cur : prev
      );
      return `${series.length}×${best.reps} @ ${best.peso}kg`;
    } else {
      const km = ej.cardio?.distanciaKm ?? 0;
      const min = ej.cardio?.tiempoMinutos ?? 0;
      if (km === 0 && min === 0) return '—';
      const parts: string[] = [];
      if (km > 0) parts.push(`${km} km`);
      if (min > 0) parts.push(`${min} min`);
      return parts.join(' · ');
    }
  }

  getLogVolumen(log: LogDiario): number {
    return log.ejercicios
      .filter(e => e.tipo === 'fuerza' && e.series)
      .reduce((s, e) => s + e.series!.reduce((ss, r) => ss + r.peso * r.reps, 0), 0);
  }

  getLogDistancia(log: LogDiario): number {
    return Math.round(
      log.ejercicios
        .filter(e => e.tipo === 'cardio' && e.cardio)
        .reduce((s, e) => s + (e.cardio?.distanciaKm ?? 0), 0) * 10
    ) / 10;
  }

  formatVol(kg: number): string {
    if (kg === 0) return '—';
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
    return `${kg.toLocaleString()} kg`;
  }

  // ── Actions ──

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
      this.showFeedback('Exportado correctamente.', false);
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
      this.showFeedback('Importado correctamente', false);
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
