import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportService } from '../../services/export.service';
import { DbService } from '../../services/db.service';
import { UnitConversionService } from '../../services/unit-conversion.service';
import { DailyLog, MuscleTag, TAG_COLORS, ExerciseLog, StrengthSet } from '../../models/interfaces';

interface MonthStats {
  sesiones: number;
  volumenWeight: number;
  distanceMeters: number;
  tagSesiones: { tag: MuscleTag; count: number }[];
}

@Component({
  selector: 'app-data-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-[var(--color-bg-primary)] px-6 pt-12 pb-36 flex flex-col gap-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-2 font-bold">{{ currentMonthLabel() }}</p>
          <h1 class="text-[40px] leading-tight font-black text-[var(--color-text-primary)] tracking-tight">Historial</h1>
        </div>
        
        <div class="flex gap-2">
          <button (click)="changeMonth(-1)" [disabled]="!canGoPrev()" class="w-12 h-12 flex items-center justify-center rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] disabled:opacity-30 disabled:active:scale-100 active:scale-95 transition-all" aria-label="Mes anterior">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button (click)="changeMonth(1)" [disabled]="!canGoNext()" class="w-12 h-12 flex items-center justify-center rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] disabled:opacity-30 disabled:active:scale-100 active:scale-95 transition-all" aria-label="Mes siguiente">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-[var(--color-bg-card)] rounded-2xl p-3 border border-[var(--color-border)] flex flex-col items-center justify-center gap-1.5  min-h-[110px]">
          <span class="text-[36px] font-black text-[#00f2fe] leading-none">{{ stats().sesiones }}</span>
          <span class="text-[10px]  text-[var(--color-text-muted)] text-center leading-tight font-bold">Sesiones</span>
        </div>
        <div class="bg-[var(--color-bg-card)] rounded-2xl p-3 border border-[var(--color-border)] flex flex-col items-center justify-center gap-1.5  min-h-[110px]">
          <span class="text-[28px] font-black text-[var(--color-text-primary)] leading-none truncate w-full text-center">{{ formatVol(stats().volumenWeight) }}</span>
          <span class="text-[10px]  text-[var(--color-text-muted)] text-center leading-tight font-bold">Vol. Fuerza</span>
        </div>
        <div class="bg-[var(--color-bg-card)] rounded-2xl p-3 border border-[var(--color-border)] flex flex-col items-center justify-center gap-1.5  min-h-[110px]">
          <span class="text-[24px] font-black text-emerald-400 leading-none truncate w-full text-center">{{ stats().distanceMeters > 0 ? unitSvc.metersToUser(stats().distanceMeters) + ' ' + unitSvc.currentDistanceUnit() : '—' }}</span>
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
        @for (log of allLogs(); track log.date + log.templateId) {
          <div class="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden  hover:border-[var(--color-border-active)] transition-colors">

            <!-- Date + Tags row -->
            <div class="flex items-center gap-4 px-5 pt-5 pb-3">
              <div class="flex flex-col items-center justify-center bg-[#00f2fe]/10 rounded-2xl w-14 h-14 border border-[#00f2fe]/20 shrink-0">
                <span class="text-[#00f2fe] font-black text-xl leading-none">{{ log.date | slice:8:10 }}</span>
                <span class="text-[#00f2fe]/80 text-[10px] font-bold uppercase mt-0.5">{{ getMonthShort(log.date) }}</span>
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
                <p class="text-[var(--color-text-muted)] text-xs font-bold">{{ log.exercises.length }} ejercicio{{ log.exercises.length !== 1 ? 's' : '' }}</p>
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
            <div class="border-t border-[var(--color-border)] px-5 pt-3 pb-4 flex flex-col gap-3">
              @for (ej of log.exercises; track ej.name) {
                <div class="flex flex-col gap-1.5">
                  <span class="text-[var(--color-text-secondary)] text-sm font-medium">{{ ej.name }}</span>
                  @if (ej.type === 'strength' && ej.sets && ej.sets.length > 0) {
                    @if (hasProgressiveOverload(ej.sets)) {
                      <!-- Progressive overload: show each set as a chip -->
                      <div class="flex flex-wrap gap-1.5">
                        @for (s of ej.sets; track $index; let i = $index) {
                          <span
                            class="text-[11px] font-bold px-2 py-0.5 rounded-lg border"
                            [class]="isMaxSet(s, ej.sets!)
                              ? 'bg-[#00f2fe]/10 border-[#00f2fe]/30 text-[#00f2fe]'
                              : 'bg-[var(--color-bg-input)] border-[var(--color-border)] text-[var(--color-text-secondary)]'"
                          >S{{ i + 1 }}: {{ unitSvc.kgToUser(s.weight) }}{{ unitSvc.currentWeightUnit() }}×{{ s.reps }}</span>
                        }
                      </div>
                    } @else {
                      <!-- All sets equal: compact summary -->
                      <span class="text-sm font-black text-[var(--color-text-primary)] font-mono">
                        {{ ej.sets.length }}×{{ ej.sets[0].reps }} @ {{ unitSvc.kgToUser(ej.sets[0].weight) }}{{ unitSvc.currentWeightUnit() }}
                      </span>
                    }
                  } @else if (ej.type === 'cardio') {
                    <span class="text-sm font-black text-emerald-400 font-mono">{{ getEjercicioResumen(ej) }}</span>
                  } @else {
                    <span class="text-sm text-[var(--color-text-muted)]">—</span>
                  }
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
                    Cardio: <span class="text-[#00f2fe]">{{ unitSvc.metersToUser(getLogDistancia(log)) }} {{ unitSvc.currentDistanceUnit() }}</span>
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
        <div class="flex flex-col gap-3 mb-4">
          <div class="flex gap-3">
            <button (click)="exportJSON()" class="btn-secondary flex-1 min-h-[48px] rounded-2xl text-xs">
              Mes (JSON)
            </button>
            <button (click)="exportCSV()" class="btn-secondary flex-1 min-h-[48px] rounded-2xl text-xs">
              Mes (CSV)
            </button>
          </div>
          <div class="flex gap-3">
            <button (click)="exportAllJSON()" class="btn-secondary flex-1 min-h-[48px] rounded-2xl font-bold bg-[#00f2fe]/10 text-[#00f2fe] border-[#00f2fe]/20 hover:bg-[#00f2fe]/20 text-xs">
              Todo (JSON)
            </button>
            <button (click)="exportAllCSV()" class="btn-secondary flex-1 min-h-[48px] rounded-2xl font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 text-xs">
              Todo (CSV)
            </button>
          </div>
        </div>
        <button (click)="fileInput.click()" class="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--color-border-active)] text-[var(--color-text-muted)] text-sm font-bold active:scale-95 transition-all hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]">
          Importar (.json)
        </button>
        <button (click)="csvInput.click()" class="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--color-border-active)] text-[var(--color-text-muted)] text-sm font-bold active:scale-95 transition-all hover:border-emerald-400/50 hover:text-emerald-400">
          Importar (.csv)
        </button>
      </div>
      <input #fileInput type="file" accept=".json" (change)="onFileSelected($event)" class="hidden" />
      <input #csvInput type="file" accept=".csv" (change)="onCSVSelected($event)" class="hidden" />

      <!-- Delete confirmation modal -->
      @if (logToDelete()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1121]/80 backdrop-blur-md px-6">
          <div class="bg-[var(--color-bg-card)] rounded-2xl p-8 w-full max-w-sm border border-[var(--color-border)] shadow-2xl animate-scale-in">
            <h3 class="text-2xl font-black text-[var(--color-text-primary)] mb-4">¿Eliminar registro?</h3>
            <p class="text-[var(--color-text-muted)] text-base mb-10 leading-relaxed font-medium">
              Se eliminará el entrenamiento del <span class="text-[var(--color-text-primary)] font-bold">{{ logToDelete()!.date }}</span> permanentemente.
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
  unitSvc = inject(UnitConversionService);

  currentMonthId = signal('');
  currentMonthLabel = signal('');
  feedbackMessage = signal('');
  feedbackIsError = signal(false);

  allLogs = signal<DailyLog[]>([]);
  stats = signal<MonthStats>({ sesiones: 0, volumenWeight: 0, distanceMeters: 0, tagSesiones: [] });
  logToDelete = signal<DailyLog | null>(null);

  private monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  availableMonths = signal<string[]>([]);

  async ngOnInit() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const defaultMes = `${year}-${month}`;
    this.currentMonthId.set(defaultMes);
    this.currentMonthLabel.set(`${this.monthNames[now.getMonth()]} ${year}`);
    
    await this.refreshAvailableMonths(defaultMes);
    await this.loadHistory();
  }

  private async refreshAvailableMonths(defaultMes: string) {
    const months = await this.exportService.getAvailableMonths();
    if (!months.includes(defaultMes)) {
      months.unshift(defaultMes);
      months.sort().reverse();
    }
    this.availableMonths.set(months);
  }

  canGoPrev(): boolean {
    const months = this.availableMonths();
    const currentIndex = months.indexOf(this.currentMonthId());
    return currentIndex < months.length - 1 && currentIndex !== -1;
  }

  canGoNext(): boolean {
    const months = this.availableMonths();
    const currentIndex = months.indexOf(this.currentMonthId());
    return currentIndex > 0;
  }

  changeMonth(direction: -1 | 1) {
    const months = this.availableMonths();
    const currentIndex = months.indexOf(this.currentMonthId());
    if (currentIndex === -1) return;
    
    const nextIndex = currentIndex - direction; // -1 (prev) means higher index in reverse sorted array
    if (nextIndex >= 0 && nextIndex < months.length) {
      const nextMes = months[nextIndex];
      this.currentMonthId.set(nextMes);
      const [y, m] = nextMes.split('-');
      this.currentMonthLabel.set(`${this.monthNames[parseInt(m, 10) - 1]} ${y}`);
      this.loadHistory();
    }
  }

  async loadHistory() {
    const archive = await this.db.getMonthlyArchive(this.currentMonthId());
    if (archive?.logs) {
      const logs = [...archive.logs].sort((a, b) => b.date.localeCompare(a.date));
      this.allLogs.set(logs);
      this.calcStats(logs);
    } else {
      this.allLogs.set([]);
      this.calcStats([]);
    }
  }

  private calcStats(logs: DailyLog[]) {
    let volumen = 0;
    let distancia = 0;
    const tagCount = new Map<MuscleTag, Set<string>>();

    for (const log of logs) {
      for (const ej of log.exercises) {
        if (ej.type === 'strength' && ej.sets) {
          volumen += ej.sets.reduce((s, r) => s + r.weight * r.reps, 0);
        } else if (ej.cardio) {
          distancia += ej.cardio.distanceMeters ?? 0;
        }
        for (const tag of (ej.tags ?? [])) {
          if (!tagCount.has(tag)) tagCount.set(tag, new Set());
          tagCount.get(tag)!.add(log.date);
        }
      }
    }

    const tagSesiones = Array.from(tagCount.entries())
      .map(([tag, dates]) => ({ tag, count: dates.size }))
      .sort((a, b) => b.count - a.count);

    this.stats.set({
      sesiones: logs.length,
      volumenWeight: volumen,
      distanceMeters: distancia,
      tagSesiones,
    });
  }

  // ── Helpers ──

  getMonthShort(fecha: string): string {
    const [, month] = fecha.split('-');
    return this.monthNames[parseInt(month, 10) - 1] || '';
  }

  getLogTags(log: DailyLog): MuscleTag[] {
    const tags = new Set<MuscleTag>();
    log.exercises.forEach(e => e.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }

  getTagColor(tag: MuscleTag) {
    return TAG_COLORS[tag] ?? { bg: 'rgba(255,255,255,0.05)', text: '#a3a3a3', border: 'rgba(255,255,255,0.1)' };
  }

  /** Returns line summary for cardio or fallback; strength handled inline in template */
  getEjercicioResumen(ej: ExerciseLog): string {
    if (ej.type === 'strength') {
      const series = ej.sets ?? [];
      if (series.length === 0) return '0×—';
      const best = series.reduce((prev, cur) =>
        cur.weight * cur.reps > prev.weight * prev.reps ? cur : prev
      );
      const userWeight = this.unitSvc.kgToUser(best.weight);
      return `${series.length}×${best.reps} @ ${userWeight}${this.unitSvc.currentWeightUnit()}`;
    } else {
      const meters = ej.cardio?.distanceMeters ?? 0;
      const min = ej.cardio?.timeMinutes ?? 0;
      if (meters === 0 && min === 0) return '—';
      const parts: string[] = [];
      if (meters > 0) parts.push(`${this.unitSvc.metersToUser(meters)} ${this.unitSvc.currentDistanceUnit()}`);
      if (min > 0) parts.push(`${min} min`);
      return parts.join(' · ');
    }
  }

  /** Returns true if not all sets in a session have the same weight or reps (so we expand them in UI). */
  hasProgressiveOverload(series: StrengthSet[]): boolean {
    if (!series || series.length <= 1) return false;
    const firstWeight = series[0].weight;
    const firstReps = series[0].reps;
    return series.some(s => s.weight !== firstWeight || s.reps !== firstReps);
  }

  /** Returns true if this set has the maximum weight (used to highlight the top set in cian). */
  isMaxSet(serie: StrengthSet, allSeries: StrengthSet[]): boolean {
    const maxPeso = Math.max(...allSeries.map(s => s.weight));
    return serie.weight === maxPeso;
  }

  getLogVolumen(log: DailyLog): number {
    return log.exercises
      .filter(e => e.type === 'strength' && e.sets)
      .reduce((s, e) => s + e.sets!.reduce((ss, r) => ss + r.weight * r.reps, 0), 0);
  }

  getLogDistancia(log: DailyLog): number {
    return log.exercises
      .filter(e => e.type === 'cardio' && e.cardio)
      .reduce((s, e) => s + (e.cardio?.distanceMeters ?? 0), 0);
  }

  formatVol(baseWeight: number): string {
    if (baseWeight === 0) return '—';
    const userWeight = this.unitSvc.kgToUser(baseWeight);
    if (userWeight >= 1000) return `${(userWeight / 1000).toFixed(1)}k ${this.unitSvc.currentWeightUnit()}`;
    return `${userWeight.toLocaleString()} ${this.unitSvc.currentWeightUnit()}`;
  }

  // ── Actions ──

  confirmDeleteLog(log: DailyLog) {
    this.logToDelete.set(log);
  }

  async deleteLogConfirmed() {
    const log = this.logToDelete();
    if (log) {
      await this.db.deleteLog(log.date, log.templateId);
      this.logToDelete.set(null);
      await this.loadHistory();
      this.showFeedback('Registro eliminado.', false);
    }
  }

  async exportJSON() {
    await this.exportMonth(this.currentMonthId(), 'json');
  }

  async exportCSV() {
    await this.exportMonth(this.currentMonthId(), 'csv');
  }

  async exportAllJSON() {
    try {
      await this.exportService.exportAllJSON();
      this.showFeedback('Copia de seguridad exportada.', false);
    } catch (err: any) {
      this.showFeedback(err.message || 'Error al exportar.', true);
    }
  }

  async exportAllCSV() {
    try {
      await this.exportService.exportAllCSV();
      this.showFeedback('Datos exportados en CSV.', false);
    } catch (err: any) {
      this.showFeedback(err.message || 'Error al exportar.', true);
    }
  }

  private async exportMonth(monthId: string, format: 'json' | 'csv') {
    try {
      if (format === 'json') {
        await this.exportService.exportJSON(monthId);
      } else {
        await this.exportService.exportCSV(monthId);
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
      await this.refreshAvailableMonths(this.currentMonthId());
      await this.loadHistory();
    } catch (err: any) {
      this.showFeedback(err.message || 'Error al importar.', true);
    }
    input.value = '';
  }

  async onCSVSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const result = await this.exportService.importCSV(file);
      let msg = `CSV importado: ${result.imported} log${result.imported !== 1 ? 's' : ''}.`;
      if (result.rejected > 0) {
        msg += ` ${result.rejected} fila${result.rejected !== 1 ? 's' : ''} rechazada${result.rejected !== 1 ? 's' : ''} (rutina desconocida).`;
      }
      this.showFeedback(msg, result.rejected > 0 && result.imported === 0);
      await this.refreshAvailableMonths(this.currentMonthId());
      await this.loadHistory();
    } catch (err: any) {
      this.showFeedback(err.message || 'Error al importar CSV.', true);
    }
    input.value = '';
  }

  private showFeedback(message: string, isError: boolean) {
    this.feedbackMessage.set(message);
    this.feedbackIsError.set(isError);
    setTimeout(() => this.feedbackMessage.set(''), 4000);
  }
}
