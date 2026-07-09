import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
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
    <div class="min-h-screen bg-[var(--color-bg-primary)] px-6 pt-12 pb-36 flex flex-col gap-6">

      <!-- Header -->
      <div>
        <p class="text-sm text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-2 font-bold">{{ currentMonthLabel() }}</p>
        <h1 class="text-[40px] leading-tight font-black text-[var(--color-text-primary)] tracking-tight">Historial</h1>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-[var(--color-bg-card)] rounded-2xl p-3 border border-[var(--color-border)] flex flex-col items-center justify-center gap-1.5  min-h-[110px]">
          <span class="text-[36px] font-black text-[#00f2fe] leading-none">{{ stats().sesiones }}</span>
          <span class="text-[10px]  text-[var(--color-text-muted)] text-center leading-tight font-bold">Sesiones</span>
        </div>
        <div class="bg-[var(--color-bg-card)] rounded-2xl p-3 border border-[var(--color-border)] flex flex-col items-center justify-center gap-1.5  min-h-[110px]">
          <span class="text-[28px] font-black text-[var(--color-text-primary)] leading-none truncate w-full text-center">{{ formatVol(stats().volumenKg) }}</span>
          <span class="text-[10px]  text-[var(--color-text-muted)] text-center leading-tight font-bold">Vol. Fuerza</span>
        </div>
        <div class="bg-[var(--color-bg-card)] rounded-2xl p-3 border border-[var(--color-border)] flex flex-col items-center justify-center gap-1.5  min-h-[110px]">
          <span class="text-[24px] font-black text-emerald-400 leading-none truncate w-full text-center">{{ stats().distanciaKm > 0 ? stats().distanciaKm + ' km' : '—' }}</span>
          <span class="text-[10px]  text-[var(--color-text-muted)] text-center leading-tight font-bold">Cardio</span>
        </div>
      </div>

      <!-- Tags breakdown -->
      @if (stats().tagSesiones.length > 0) {
        <div class="flex gap-2 flex-wrap">
          @for (ts of stats().tagSesiones; track ts.tag) {
            <span
              class="px-3 py-1.5 rounded-full text-xs font-bold border"
              [style.background]="getTagColor(ts.tag).bg"
              [style.borderColor]="getTagColor(ts.tag).border"
              [style.color]="getTagColor(ts.tag).text"
            >{{ ts.tag }} · {{ ts.count }}</span>
          }
        </div>
      }

      <!-- Workout List -->
      <div class="flex flex-col gap-4">
        @for (log of allLogs(); track log.fecha + log.templateId) {
          <div class="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden  hover:border-[var(--color-border-active)] transition-colors">

            <!-- Date + Tags row -->
            <div class="flex items-center gap-4 px-5 pt-5 pb-3">
              <div class="flex flex-col items-center justify-center bg-[#00f2fe]/10 rounded-2xl w-14 h-14 border border-[#00f2fe]/20 shrink-0">
                <span class="text-[#00f2fe] font-black text-xl leading-none">{{ log.fecha | slice:8:10 }}</span>
                <span class="text-[#00f2fe]/80 text-[10px] font-bold uppercase mt-0.5">{{ getMonthShort(log.fecha) }}</span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap gap-1.5 mb-1.5">
                  @for (tag of getLogTags(log); track tag) {
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                      [style.background]="getTagColor(tag).bg"
                      [style.borderColor]="getTagColor(tag).border"
                      [style.color]="getTagColor(tag).text"
                    >{{ tag }}</span>
                  }
                  @if (getLogTags(log).length === 0) {
                    <span class="text-[var(--color-text-muted)] text-xs font-medium">Sin etiquetas</span>
                  }
                </div>
                <p class="text-[var(--color-text-muted)] text-xs font-bold">{{ log.ejercicios.length }} ejercicio{{ log.ejercicios.length !== 1 ? 's' : '' }}</p>
              </div>

              <button
                (click)="confirmDeleteLog(log)"
                class="text-[var(--color-text-muted)] hover:text-rose-500 transition-colors p-2 active:scale-90 shrink-0 bg-[var(--color-bg-input)] rounded-full"
                aria-label="Eliminar entrenamiento"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>

            <!-- Exercise lines -->
            <div class="border-t border-[var(--color-border)] px-5 pt-3 pb-4 flex flex-col gap-2">
              @for (ej of log.ejercicios; track ej.nombre) {
                <div class="flex items-center justify-between gap-3">
                  <span class="text-[var(--color-text-secondary)] text-sm font-medium truncate flex-1">{{ ej.nombre }}</span>
                  <span class="text-sm font-black text-[var(--color-text-primary)] shrink-0 font-mono tracking-tight">
                    {{ getEjercicioResumen(ej) }}
                  </span>
                </div>
              }
            </div>

            <!-- Volume footer -->
            @if (getLogVolumen(log) > 0 || getLogDistancia(log) > 0) {
              <div class="border-t border-[var(--color-border)] px-5 py-3 flex gap-4 bg-[var(--color-bg-input)]/50">
                @if (getLogVolumen(log) > 0) {
                  <span class="text-xs text-[var(--color-text-muted)] font-bold">
                    Vol: <span class="text-[var(--color-text-primary)]">{{ formatVol(getLogVolumen(log)) }}</span>
                  </span>
                }
                @if (getLogDistancia(log) > 0) {
                  <span class="text-xs text-[var(--color-text-muted)] font-bold">
                    Cardio: <span class="text-[#00f2fe]">{{ getLogDistancia(log) }} km</span>
                  </span>
                }
              </div>
            }
          </div>
        }

        @if (allLogs().length === 0) {
          <div class="text-center py-16">
            <p class="text-[var(--color-text-muted)] text-6xl mb-4">📭</p>
            <p class="text-[var(--color-text-muted)] text-base font-medium">No hay entrenamientos este mes.</p>
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
      <div class="mt-8">
        <h2 class="text-sm font-bold text-[var(--color-text-muted)]  mb-4">Exportar Datos</h2>
        <div class="flex gap-4 mb-4">
          <button (click)="exportJSON()" class="btn-secondary flex-1 min-h-[48px] rounded-2xl">
            JSON
          </button>
          <button (click)="exportCSV()" class="btn-secondary flex-1 min-h-[48px] rounded-2xl">
            CSV
          </button>
        </div>
        <button (click)="fileInput.click()" class="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--color-border-active)] text-[var(--color-text-muted)] text-sm font-bold active:scale-95 transition-all hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]">
          Importar (.json)
        </button>
      </div>
      <input #fileInput type="file" accept=".json" (change)="onFileSelected($event)" class="hidden" />

      <!-- Delete confirmation modal -->
      @if (logToDelete()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1121]/80 backdrop-blur-md px-6">
          <div class="bg-[var(--color-bg-card)] rounded-2xl p-8 w-full max-w-sm border border-[var(--color-border)] shadow-2xl animate-scale-in">
            <h3 class="text-2xl font-black text-[var(--color-text-primary)] mb-4">¿Eliminar registro?</h3>
            <p class="text-[var(--color-text-muted)] text-base mb-10 leading-relaxed font-medium">
              Se eliminará el entrenamiento del <span class="text-[var(--color-text-primary)] font-bold">{{ logToDelete()!.fecha }}</span> permanentemente.
            </p>
            <div class="flex flex-col gap-3">
              <button
                (click)="deleteLogConfirmed()"
                class="btn-danger rounded-full min-h-[48px]"
              >Eliminar</button>
              <button
                (click)="logToDelete.set(null)"
                class="btn-secondary rounded-full min-h-[48px]"
              >Cancelar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [``], changeDetection: ChangeDetectionStrategy.OnPush
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
