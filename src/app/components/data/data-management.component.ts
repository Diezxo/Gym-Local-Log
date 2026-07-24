import { Component, OnInit, signal, inject, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { ScrollLockDirective } from '../../directives/scroll-lock.directive';
import { ExportService } from '../../services/export.service';
import { WorkoutUseCases } from '../../use-cases/workout.use-cases';
import { UnitConversionService } from '../../services/unit-conversion.service';
import { WorkoutSession, MuscleTag, TAG_COLORS, ExerciseLog, StrengthSet } from '../../models/interfaces';

interface MonthStats {
  sesiones: number;
  seriesWeight: number; // Changed from volumenWeight
  distanceMeters: number;
  tagSesiones: { tag: MuscleTag; count: number }[];
}

@Component({
  selector: 'app-data-management',
  standalone: true,
  imports: [CommonModule, A11yModule, ScrollLockDirective],
  template: `
    <div class="min-h-screen bg-[var(--color-bg-primary)] px-4 sm:px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-36 md:pb-12 flex flex-col gap-6 max-w-xl mx-auto w-full">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-[var(--color-accent)] font-bold tracking-wider uppercase mb-1">{{ currentMonthLabel() }}</p>
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-white">Historial</h1>
        </div>
        
        <div class="flex gap-2">
          <button (click)="changeMonth(-1)" [disabled]="!canGoPrev()" class="w-12 h-12 flex items-center justify-center rounded-xl bg-[var(--color-bg-input)] border border-white/5 text-white disabled:opacity-30 disabled:scale-100 active:scale-95 transition-all shadow-inner hover:bg-white/5" aria-label="Mes anterior">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button (click)="changeMonth(1)" [disabled]="!canGoNext()" class="w-12 h-12 flex items-center justify-center rounded-xl bg-[var(--color-bg-input)] border border-white/5 text-white disabled:opacity-30 disabled:scale-100 active:scale-95 transition-all shadow-inner hover:bg-white/5" aria-label="Mes siguiente">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-[var(--color-bg-card)] rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center gap-1 min-h-[100px] shadow-sm">
          <span class="text-3xl font-bold text-[var(--color-accent)] leading-none">{{ stats().sesiones }}</span>
          <span class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-center mt-1">Sesiones</span>
        </div>
        <div class="bg-[var(--color-bg-card)] rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center gap-1 min-h-[100px] shadow-sm">
          <span class="text-2xl font-bold text-white leading-none truncate w-full text-center">{{ stats().seriesWeight }}</span>
          <span class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-center mt-1">Series Fza</span>
        </div>
        <div class="bg-[var(--color-bg-card)] rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center gap-1 min-h-[100px] shadow-sm">
          <span class="text-2xl font-bold text-[var(--color-accent-success)] leading-none truncate w-full text-center">{{ stats().distanceMeters > 0 ? unitSvc.metersToUser(stats().distanceMeters) + ' ' + unitSvc.currentDistanceUnit() : '—' }}</span>
          <span class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-center mt-1">Cardio</span>
        </div>
      </div>

      <!-- Tags breakdown -->
      @if (stats().tagSesiones.length > 0) {
        <div class="flex gap-2 flex-wrap">
          @for (ts of stats().tagSesiones; track ts.tag) {
            <span
              class="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-white/5"
              [style.background]="getTagColor(ts.tag).bg"
              [style.borderColor]="getTagColor(ts.tag).border"
              [style.color]="getTagColor(ts.tag).text"
            >{{ ts.tag }} · {{ ts.count }}</span>
          }
        </div>
      }

      <!-- Workout List -->
      <div class="flex flex-col gap-4">
        @for (log of allLogs(); track log.date + log.routineId) {
            <div
              class="bg-[var(--color-bg-card)] rounded-3xl border border-white/5 overflow-hidden shadow-sm transition-all group"
            >
              <!-- Date + Tags row -->
              <div class="flex items-center gap-4 p-5">
                <div class="flex flex-col items-center justify-center bg-[var(--color-bg-input)] rounded-2xl w-14 h-14 border border-white/5 shrink-0 shadow-inner">
                  <span class="text-[var(--color-accent)] font-bold text-xl leading-none">{{ log.date | slice:8:10 }}</span>
                  <span class="text-[var(--color-text-muted)] text-xs font-semibold uppercase tracking-wider mt-0.5">{{ getMonthShort(log.date) }}</span>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap gap-1.5 mb-1.5">
                    @for (tag of getLogTags(log); track tag) {
                      <span
                        class="px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider border border-white/5"
                        [style.background]="getTagColor(tag).bg"
                        [style.borderColor]="getTagColor(tag).border"
                        [style.color]="getTagColor(tag).text"
                      >{{ tag }}</span>
                    }
                    @if (getLogTags(log).length === 0) {
                      <span class="text-[var(--color-text-muted)] text-xs font-semibold uppercase tracking-wider">Sin etiquetas</span>
                    }
                  </div>
                  <p class="text-[var(--color-text-muted)] text-[11px] font-medium">{{ log.exercises.length }} ejercicio{{ log.exercises.length !== 1 ? 's' : '' }}</p>
                </div>

                <!-- Delete button -->
                <button
                  (click)="confirmDelete(log); $event.stopPropagation()"
                  class="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                  aria-label="Eliminar registro"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>

            <!-- Exercise lines -->
            <div class="border-t border-white/5 px-5 pt-4 pb-5 flex flex-col gap-4 bg-[var(--color-bg-input)]/20">
              @for (ej of log.exercises; track ej.name) {
                <div class="flex flex-col gap-1.5">
                   <!-- Ejercicio header -->
                  <div class="flex items-center justify-between">
                    <span class="text-white text-sm font-semibold tracking-wide uppercase">{{ ej.name }}</span>
                    @if (ej.type === 'strength' && ej.sets && ej.sets.length > 0) {
                      <!-- Compact summary always visible on the right -->
                      <span class="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)]">
                        {{ ej.sets.length }} SERIES
                      </span>
                    }
                  </div>
                  
                  @if (ej.type === 'strength' && ej.sets && ej.sets.length > 0) {
                    @if (hasProgressiveOverload(ej.sets)) {
                      <!-- Different sets: show minimal chips -->
                      <div class="flex flex-wrap gap-1.5 mt-1">
                        @for (s of ej.sets; track $index; let i = $index) {
                          <span
                            class="text-[10px] font-mono font-medium px-2 py-0.5 rounded border"
                            [class]="isMaxSet(s, ej.sets)
                              ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/20'
                              : 'bg-transparent border-white/5 text-[var(--color-text-muted)]'"
                          >{{ s.reps }}×{{ unitSvc.kgToUser(s.weight) }}</span>
                        }
                      </div>
                    } @else {
                      <!-- All sets equal -->
                      <span class="text-xs font-semibold text-[var(--color-text-muted)] font-mono">
                        Todo a {{ ej.sets[0].reps }} reps × {{ unitSvc.kgToUser(ej.sets[0].weight) }}{{ unitSvc.currentWeightUnit() }}
                      </span>
                    }
                  } @else if (ej.type === 'cardio') {
                    <span class="text-xs font-semibold text-[var(--color-accent-success)] font-mono">{{ getEjercicioResumen(ej) }}</span>
                  }
                </div>
              }
            </div>

            <!-- Distancia Footer (Only for cardio) -->
            @if (getLogDistancia(log) > 0) {
              <div class="border-t border-white/5 px-5 py-3.5 flex gap-4 bg-[var(--color-bg-input)]/50">
                <span class="text-xs text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
                  Cardio: <span class="text-[var(--color-accent-success)] font-mono">{{ unitSvc.metersToUser(getLogDistancia(log)) }} {{ unitSvc.currentDistanceUnit() }}</span>
                </span>
              </div>
            }
          </div>
        }

        @if (allLogs().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in bg-[var(--color-bg-card)] rounded-3xl border border-white/5 shadow-sm">
            <div class="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-accent-secondary)]/20 to-[var(--color-accent)]/20 border border-[var(--color-accent-secondary)]/30 flex items-center justify-center mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-accent-secondary)]">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white tracking-tight mb-2">Sin actividad este mes</h3>
            <p class="text-[var(--color-text-muted)] text-sm font-medium max-w-[240px] leading-relaxed">No tienes entrenamientos registrados. Ve a Entrenar para sumar volumen a tu progreso.</p>
          </div>
        }
      </div>

      <!-- Feedback message -->
      @if (feedbackMessage()) {
        <div class="mb-4 px-4 py-3.5 rounded-2xl text-xs font-semibold uppercase tracking-wider text-center shadow-sm transition-all" [class]="feedbackIsError() ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-[var(--color-accent-success)]/10 border border-[var(--color-accent-success)]/20 text-[var(--color-accent-success)]'">
          {{ feedbackMessage() }}
        </div>
      }

      <!-- Exportar / Importar Compacto -->
      <div class="mt-8 bg-[var(--color-bg-card)] rounded-3xl p-5 border border-white/5 shadow-sm">
        <h2 class="text-sm font-bold uppercase tracking-wider text-white mb-4">Gestión de Datos</h2>
        
        <div class="grid grid-cols-2 gap-3 mb-4">
          <button (click)="exportJSON()" class="flex items-center justify-center gap-2 bg-[var(--color-bg-input)] hover:bg-white/5 text-[var(--color-text-primary)] border border-white/5 py-3 rounded-xl text-[10px] font-semibold uppercase tracking-wider active:scale-95 transition-all w-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-accent)]"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Mes JSON
          </button>
          <button (click)="exportCSV()" class="flex items-center justify-center gap-2 bg-[var(--color-bg-input)] hover:bg-white/5 text-[var(--color-text-primary)] border border-white/5 py-3 rounded-xl text-[10px] font-semibold uppercase tracking-wider active:scale-95 transition-all w-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-accent-success)]"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Mes CSV
          </button>
          <button (click)="exportAllJSON()" class="flex items-center justify-center gap-2 bg-[var(--color-bg-input)] hover:bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30 py-3 rounded-xl text-[10px] font-semibold uppercase tracking-wider active:scale-95 transition-all w-full">
            Todo JSON
          </button>
          <button (click)="exportAllCSV()" class="flex items-center justify-center gap-2 bg-[var(--color-bg-input)] hover:bg-[var(--color-accent-success)]/10 text-[var(--color-accent-success)] border border-[var(--color-accent-success)]/30 py-3 rounded-xl text-[10px] font-semibold uppercase tracking-wider active:scale-95 transition-all w-full">
            Todo CSV
          </button>
        </div>
        
        <div class="grid grid-cols-2 gap-3">
          <button (click)="fileInput.click()" class="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 text-[var(--color-text-muted)] py-2.5 text-[10px] font-semibold uppercase tracking-wider active:scale-95 transition-all hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)] bg-[var(--color-bg-input)]/50 hover:bg-[var(--color-bg-input)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            Importar JSON
          </button>
          <button (click)="csvInput.click()" class="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 text-[var(--color-text-muted)] py-2.5 text-[10px] font-semibold uppercase tracking-wider active:scale-95 transition-all hover:border-[var(--color-accent-success)]/50 hover:text-[var(--color-accent-success)] bg-[var(--color-bg-input)]/50 hover:bg-[var(--color-bg-input)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            Importar CSV
          </button>
        </div>
      </div>
      <input #fileInput type="file" accept=".json" (change)="onFileSelected($event)" class="hidden" aria-label="Seleccionar archivo JSON" />
      <input #csvInput type="file" accept=".csv" (change)="onCSVSelected($event)" class="hidden" aria-label="Seleccionar archivo CSV" />

      <!-- Delete confirmation modal -->
      @if (logToDelete()) {
        <div appScrollLock class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" cdkTrapFocus cdkTrapFocusAutoCapture>
          <div class="bg-[var(--color-bg-card)] rounded-3xl p-6 w-full max-w-sm border border-white/5 shadow-xl animate-scale-in">
            <h3 class="text-xl font-bold text-white tracking-tight mb-2">¿Eliminar registro?</h3>
            <p class="text-[var(--color-text-muted)] text-sm font-medium mb-8 leading-relaxed">
              Se eliminará el entrenamiento del <span class="text-white font-semibold">{{ logToDelete()?.date }}</span> permanentemente.
            </p>
            <div class="flex flex-col gap-3">
              <button
                (click)="deleteLogConfirmed()"
                class="w-full bg-rose-500/10 text-rose-500 border border-rose-500/20 py-3.5 rounded-2xl font-semibold hover:bg-rose-500/20 active:scale-95 transition-all"
              >Eliminar</button>
              <button
                (click)="logToDelete.set(null)"
                class="w-full bg-[var(--color-bg-input)] text-white border border-white/5 py-3.5 rounded-2xl font-semibold hover:bg-white/5 active:scale-95 transition-all"
              >Cancelar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [``], changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataManagementComponent implements OnInit, OnDestroy {
  private exportService = inject(ExportService);
  private workoutUseCases = inject(WorkoutUseCases);
  unitSvc = inject(UnitConversionService);

  currentMonthId = signal('');
  currentMonthLabel = signal('');
  feedbackMessage = signal('');
  feedbackIsError = signal(false);

  allLogs = signal<WorkoutSession[]>([]);
  stats = signal<MonthStats>({ sesiones: 0, seriesWeight: 0, distanceMeters: 0, tagSesiones: [] });
  logToDelete = signal<WorkoutSession | null>(null);
  
  private feedbackTimeout: ReturnType<typeof setTimeout> | null = null;

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

  ngOnDestroy() {
    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
    }
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
    const allWorkouts = await this.workoutUseCases.getAllWorkouts();
    const currentMonth = this.currentMonthId();
    const logs = allWorkouts.filter(w => w.date.startsWith(currentMonth));
    
    if (logs.length > 0) {
      logs.sort((a, b) => b.date.localeCompare(a.date));
      this.allLogs.set(logs);
      this.calcStats(logs);
    } else {
      this.allLogs.set([]);
      this.calcStats([]);
    }
  }

  private calcStats(logs: WorkoutSession[]) {
    let seriesCount = 0;
    let distancia = 0;
    const tagCount = new Map<MuscleTag, Set<string>>();

    for (const log of logs) {
      for (const ej of log.exercises) {
        if (ej.type === 'strength' && ej.sets) {
          seriesCount += ej.sets.length;
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
      seriesWeight: seriesCount,
      distanceMeters: distancia,
      tagSesiones,
    });
  }

  // ── Helpers ──

  getMonthShort(fecha: string): string {
    const [, month] = fecha.split('-');
    return this.monthNames[parseInt(month, 10) - 1] || '';
  }

  getLogTags(log: WorkoutSession): MuscleTag[] {
    const tags = new Set<MuscleTag>();
    log.exercises.forEach(e => e.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }

  getTagColor(tag: MuscleTag) {
    return TAG_COLORS[tag] ?? { bg: 'rgba(255,255,255,0.05)', text: '#a3a3a3', border: 'rgba(255,255,255,0.1)' };
  }

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

  hasProgressiveOverload(series: StrengthSet[]): boolean {
    if (!series || series.length <= 1) return false;
    const firstWeight = series[0].weight;
    const firstReps = series[0].reps;
    return series.some(s => s.weight !== firstWeight || s.reps !== firstReps);
  }

  isMaxSet(serie: StrengthSet, allSeries: StrengthSet[]): boolean {
    const maxPeso = Math.max(...allSeries.map(s => s.weight));
    return serie.weight === maxPeso;
  }

  getLogVolumen(log: WorkoutSession): number {
    return log.exercises
      .filter(e => e.type === 'strength' && e.sets)
      .reduce((s, e) => s + e.sets!.reduce((ss, r) => ss + r.weight * r.reps, 0), 0);
  }

  getLogDistancia(log: WorkoutSession): number {
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

  confirmDelete(log: WorkoutSession) {
    this.logToDelete.set(log);
  }

  async deleteLogConfirmed() {
    const log = this.logToDelete();
    if (log) {
      await this.workoutUseCases.deleteWorkoutSession(log.id);
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
    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
    }
    this.feedbackTimeout = setTimeout(() => this.feedbackMessage.set(''), 4000);
  }
}
