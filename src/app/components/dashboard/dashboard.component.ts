import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { WorkoutUseCases } from '../../use-cases/workout.use-cases';
import { UnitConversionService } from '../../services/unit-conversion.service';
import {
  WorkoutSession,
  MonthlyArchive,
  MuscleTag,
  TAG_COLORS,
} from '../../models/interfaces';
import { ProgressionChartComponent } from './progression-chart.component';

interface TagVolumen {
  tag: MuscleTag;
  valor: number; // sets for strength, distance for cardio
  unidad: string;
  sesiones: number;
}

interface HeatDay {
  date: string; // YYYY-MM-DD
  trained: boolean;
  dayNum: number;
}

interface PRRecord {
  exercise: string;
  weight: number; // Base unit (kg)
  reps: number;
  date: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ProgressionChartComponent],
  template: `
    <div class="min-h-screen bg-[var(--color-bg-primary)] px-6 pt-12 pb-36 flex flex-col gap-8 max-w-7xl mx-auto w-full">

      <!-- ── Header ── -->
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-[var(--color-text-muted)] font-heading uppercase tracking-[0.1em] font-bold">{{ dayLabel() }}</p>
          <h1 class="text-5xl uppercase font-heading font-black text-[var(--color-accent)] tracking-tight drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">Dashboard</h1>
        </div>
        
        <div class="flex gap-2">
          <button (click)="changeMonth(-1)" [disabled]="!canGoPrev()" class="w-12 h-12 flex items-center justify-center rounded-lg bg-[var(--color-bg-card)] border-2 border-[var(--color-border)] text-[var(--color-text-primary)] disabled:opacity-30 hover:border-[var(--color-accent)] shadow-[2px_2px_0px_rgba(0,0,0,0.5)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all" aria-label="Mes anterior">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button (click)="changeMonth(1)" [disabled]="!canGoNext()" class="w-12 h-12 flex items-center justify-center rounded-lg bg-[var(--color-bg-card)] border-2 border-[var(--color-border)] text-[var(--color-text-primary)] disabled:opacity-30 hover:border-[var(--color-accent)] shadow-[2px_2px_0px_rgba(0,0,0,0.5)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all" aria-label="Mes siguiente">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Left Column -->
        <div class="lg:col-span-7 flex flex-col gap-8">
          
          <!-- ── Semana Actual ── -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-heading uppercase font-bold text-[var(--color-text-primary)]">Esta semana</h2>
              <span class="text-sm font-heading tracking-widest text-[var(--color-text-muted)] font-medium">{{ weekRangeLabel() }}</span>
            </div>
            <div class="grid grid-cols-7 gap-2 bg-[var(--color-bg-card)] rounded-xl p-4 border-2 border-[var(--color-border)] shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
              @for (day of weekDays(); track day.label) {
                <div class="flex flex-col items-center gap-2">
                  <span class="text-xs font-heading font-bold"
                    [class]="day.isToday ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'">
                    {{ day.label }}
                  </span>
                  <div
                    class="w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg font-heading font-bold transition-all"
                    [class]="getWeekDayClass(day)"
                  >
                    {{ day.dayNum }}
                  </div>
                </div>
              }
            </div>
            @if (weeklyCardioDistance() > 0) {
              <div class="flex justify-start mt-3">
                <span class="text-sm font-bold font-heading uppercase tracking-wider text-[var(--color-accent-success)] border-2 border-[var(--color-accent-success)] bg-[#111827] px-4 py-1.5 rounded-lg shadow-[2px_2px_0px_rgba(34,197,94,0.3)]">
                  🏃 {{ weeklyCardioDistance() }} {{ unitSvc.currentDistanceUnit() }} esta semana
                </span>
              </div>
            }
          </div>

          <!-- ── Streak + Stats Row ── -->
          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-1 bg-[var(--color-bg-card)] rounded-xl p-4 border-2 border-[var(--color-border)] flex flex-col items-center justify-center gap-2 shadow-[4px_4px_0px_rgba(0,0,0,0.3)] min-h-[120px]">
              <span class="text-4xl font-heading font-black text-amber-500 leading-none drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">{{ streak() }}</span>
              <span class="text-xs text-[var(--color-text-muted)] text-center font-heading uppercase tracking-widest font-bold">Racha<br/>días</span>
            </div>
            <div class="col-span-1 bg-[var(--color-accent)] rounded-xl p-4 border-2 border-[var(--color-border)] flex flex-col items-center justify-center gap-2 shadow-[4px_4px_0px_rgba(0,0,0,0.3)] min-h-[120px]">
              <span class="text-4xl font-heading font-black text-[#111827] leading-none drop-shadow-[1px_1px_0_rgba(255,255,255,0.2)]">{{ monthSessions() }}</span>
              <span class="text-xs text-[#111827] text-center font-heading uppercase tracking-widest font-bold">Sesiones<br/>mes</span>
            </div>
            <div class="col-span-1 bg-[var(--color-bg-card)] rounded-xl p-4 border-2 border-[var(--color-border)] flex flex-col items-center justify-center gap-2 shadow-[4px_4px_0px_rgba(0,0,0,0.3)] min-h-[120px]">
              <span class="text-4xl font-heading font-black text-[var(--color-text-primary)] leading-none drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">{{ daysLeftInMonth() }}</span>
              <span class="text-xs text-[var(--color-text-muted)] text-center font-heading uppercase tracking-widest font-bold">Días<br/>restantes</span>
            </div>
          </div>

          <!-- ── Último PR ── -->
          @if (lastPR()) {
            <div>
              <h2 class="text-xl font-heading uppercase font-bold text-[var(--color-text-primary)] mb-4">Último PR</h2>
              <div class="bg-[var(--color-bg-card)] rounded-xl p-5 border-2 border-amber-500/50 shadow-[4px_4px_0px_rgba(245,158,11,0.2)] flex items-center justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <p class="text-amber-500 text-xs font-heading font-bold uppercase tracking-widest mb-1">Récord personal</p>
                  <p class="text-[var(--color-text-primary)] font-heading uppercase font-black text-2xl leading-tight truncate">{{ lastPR()!.exercise }}</p>
                  <p class="text-[var(--color-text-muted)] text-sm font-medium mt-1">{{ getDaysAgo(lastPR()!.date) }}</p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-4xl font-heading font-black text-amber-500 leading-none drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">{{ unitSvc.kgToUser(lastPR()!.weight) }}<span class="text-xl">{{ unitSvc.currentWeightUnit() }}</span></p>
                  <p class="text-sm text-[var(--color-text-muted)] font-bold mt-1">× {{ lastPR()!.reps }} reps</p>
                </div>
              </div>
            </div>
          }

          <!-- ── Chart Integration ── -->
          <div class="mt-4">
             <h2 class="text-xl font-heading uppercase font-bold text-[var(--color-text-primary)] mb-4">Progresión del Volumen</h2>
             <app-progression-chart [logs]="allLogs()"></app-progression-chart>
          </div>
        </div>

        <!-- Right Column -->
        <div class="lg:col-span-5 flex flex-col gap-8">
          
          <!-- ── Último Entrenamiento ── -->
          @if (lastLog()) {
            <div>
              <h2 class="text-xl font-heading uppercase font-bold text-[var(--color-text-primary)] mb-4">Último entrenamiento</h2>
              <div class="bg-[var(--color-bg-card)] rounded-xl p-5 border-2 border-[var(--color-border)] shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
                <div class="flex items-center justify-between mb-5">
                  <span class="text-[var(--color-text-primary)] font-heading uppercase font-black text-2xl drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">{{ formatFecha(lastLog()!.date) }}</span>
                  <span class="text-xs font-heading tracking-widest uppercase font-bold text-[var(--color-text-primary)] bg-[var(--color-bg-input)] border-2 border-[var(--color-border)] px-3 py-1 rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">{{ getDaysAgo(lastLog()!.date) }}</span>
                </div>
                <div class="flex flex-wrap gap-2.5 mb-6">
                  @for (tag of getLogTags(lastLog()!); track tag) {
                    <span
                      class="px-3 py-1 rounded-lg text-xs font-heading tracking-wider uppercase font-bold border-2"
                      [style.background]="getTagColor(tag).bg"
                      [style.borderColor]="getTagColor(tag).border"
                      [style.color]="getTagColor(tag).text"
                    >{{ tag }}</span>
                  }
                </div>
                <button
                  (click)="irAEntrenar()"
                  class="btn-primary"
                >
                  Nuevo entrenamiento →
                </button>
              </div>
            </div>
          } @else {
            <div>
              <button
                (click)="irAEntrenar()"
                class="btn-primary text-2xl h-20"
              >
                ¡Primer Entrenamiento!
              </button>
            </div>
          }

          <!-- ── Volumen por Tag ── -->
          @if (tagVolumens().length > 0) {
            <div>
              <h2 class="text-xl font-heading uppercase font-bold text-[var(--color-text-primary)] mb-4">Volumen mensual</h2>
              <div class="flex flex-col gap-3">
                @for (tv of tagVolumens(); track tv.tag) {
                  <div
                    class="flex items-center gap-4 rounded-xl px-4 py-3 border-2 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
                    [style.background]="getTagColor(tv.tag).bg"
                    [style.borderColor]="getTagColor(tv.tag).border"
                  >
                    <div class="w-3 h-3 border-2 rounded-sm flex-shrink-0" [style.background]="getTagColor(tv.tag).text" [style.borderColor]="getTagColor(tv.tag).border"></div>
                    <span class="flex-1 text-lg font-heading uppercase font-bold text-[var(--color-text-primary)]">{{ tv.tag }}</span>
                    <div class="flex items-center gap-3">
                      <span class="text-xs font-heading tracking-widest text-[var(--color-text-muted)] font-bold">{{ tv.sesiones }} SES.</span>
                      <span class="font-black font-heading text-xl" [style.color]="getTagColor(tv.tag).text">
                        {{ formatTagValue(tv) }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- ── Consistencia (30 días) ── -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-heading uppercase font-bold text-[var(--color-text-primary)]">Consistencia</h2>
              <span class="text-xs font-heading tracking-widest font-bold text-[#111827] border-2 border-[var(--color-accent-success)] bg-[var(--color-accent-success)] px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
                {{ trainedCount() }} / 30 DÍAS
              </span>
            </div>
            <div class="bg-[var(--color-bg-card)] rounded-xl border-2 border-[var(--color-border)] p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
              <div class="grid gap-2" style="grid-template-columns: repeat(10, 1fr)">
                @for (day of heatmap(); track day.date) {
                  <div
                    class="aspect-square rounded border transition-colors"
                    [class]="day.trained ? 'bg-[var(--color-accent-success)] border-[var(--color-accent-success)] shadow-[1px_1px_0px_rgba(0,0,0,0.2)]' : 'bg-[var(--color-bg-input)] border-[var(--color-border)]'"
                    [title]="day.date"
                  ></div>
                }
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  `,
  styles: [], changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private workoutUseCases = inject(WorkoutUseCases);
  private router = inject(Router);
  unitSvc = inject(UnitConversionService);

  dayLabel = signal('');
  weekDays = signal<{ label: string; dayNum: number; isToday: boolean; trained: boolean }[]>([]);
  weekRangeLabel = signal('');
  streak = signal(0);
  monthSessions = signal(0);
  daysLeftInMonth = signal(0);
  tagVolumens = signal<TagVolumen[]>([]);
  heatmap = signal<HeatDay[]>([]);
  trainedCount = signal(0);
  lastLog = signal<WorkoutSession | null>(null);
  monthLogs = signal<WorkoutSession[]>([]);
  /** All logs from all months — used to feed the cross-month progression chart */
  allLogs = signal<WorkoutSession[]>([]);

  // New signals
  weeklyCardioDistance = signal(0);
  lastPR = signal<PRRecord | null>(null);

  currentMonthId = signal('');
  availableMonths = signal<string[]>([]);

  private readonly monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  private readonly monthShort = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  private readonly dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  private readonly dayNamesFull = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

  async ngOnInit() {
    const allSessions = await this.workoutUseCases.getAllWorkouts();
    const monthsSet = new Set<string>();
    allSessions.forEach(s => monthsSet.add(s.date.substring(0, 7)));
    const months = Array.from(monthsSet);
    
    const now = new Date();
    const currentMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    if (!months.includes(currentMes)) {
      months.unshift(currentMes);
    }
    months.sort().reverse();
    
    this.availableMonths.set(months);
    this.currentMonthId.set(currentMes);
    
    await this.loadDashboardData(now);
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

  async changeMonth(direction: -1 | 1) {
    const months = this.availableMonths();
    const currentIndex = months.indexOf(this.currentMonthId());
    if (currentIndex === -1) return;
    
    const nextIndex = currentIndex - direction;
    if (nextIndex >= 0 && nextIndex < months.length) {
      const nextMes = months[nextIndex];
      this.currentMonthId.set(nextMes);
      
      const realNow = new Date();
      const currentRealMes = `${realNow.getFullYear()}-${String(realNow.getMonth() + 1).padStart(2, '0')}`;
      
      let refDate: Date;
      if (nextMes === currentRealMes) {
        refDate = realNow;
      } else {
        const [y, m] = nextMes.split('-');
        refDate = new Date(parseInt(y, 10), parseInt(m, 10), 0);
      }
      
      await this.loadDashboardData(refDate);
    }
  }

  async loadDashboardData(now: Date) {
    const realNow = new Date();
    const isCurrentMonth = now.getMonth() === realNow.getMonth() && now.getFullYear() === realNow.getFullYear();
    
    if (isCurrentMonth) {
      this.dayLabel.set(`${this.dayNamesFull[realNow.getDay()]}, ${realNow.getDate()} de ${this.monthNames[realNow.getMonth()]}`);
    } else {
      this.dayLabel.set(`Resumen: ${this.monthNames[now.getMonth()]} ${now.getFullYear()}`);
    }

    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    this.daysLeftInMonth.set(daysLeft);

    const [allSessions, lastLog] = await Promise.all([
      this.workoutUseCases.getAllWorkouts(),
      this.workoutUseCases.getLastWorkout(),
    ]);

    this.lastLog.set(lastLog);

    const allTrainingDays = new Set<string>();
    allSessions.forEach(s => allTrainingDays.add(s.date));
    const sortedDays = Array.from(allTrainingDays).sort();

    // ── All logs (chronological) for the cross-month progression chart ──
    const allLogsList = [...allSessions].sort((a, b) => a.date.localeCompare(b.date));
    this.allLogs.set(allLogsList);

    // ── Streak ──
    this.streak.set(this.calcStreak(sortedDays, now));

    // ── Heatmap 30 días ──
    this.buildHeatmap(allTrainingDays, now);

    // ── Semana actual ──
    this.buildWeek(allTrainingDays, now);

    // ── Stats del mes ──
    const monthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const logsThisMonth = allSessions.filter(s => s.date.startsWith(monthId));
    
    this.monthSessions.set(logsThisMonth.length);
    this.monthLogs.set(logsThisMonth);

    // ── Volumen por tag (mes actual) ──
    this.calcTagVolumens(logsThisMonth);

    // ── Distancia cardio esta semana (últimos 7 días, todos los meses) ──
    this.weeklyCardioDistance.set(this.calcWeeklyCardioDistance(allSessions, now));

    // ── Último PR (máximo histórico cross-month) ──
    this.lastPR.set(this.calcLastPR(allSessions));
  }

  // ─── Weekly Cardio Distance ───

  private calcWeeklyCardioDistance(sessions: WorkoutSession[], now: Date): number {
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const weekAgoStr = this.toLocalDateStr(weekAgo);
    const todayStr = this.toLocalDateStr(now);
    
    let totalMeters = 0;
    for (const log of sessions) {
      if (log.date >= weekAgoStr && log.date <= todayStr) {
        for (const ej of log.exercises) {
          if (ej.type === 'cardio' && ej.cardio) {
            totalMeters += ej.cardio.distanceMeters ?? 0;
          }
        }
      }
    }
    
    // Convert base distance (meters) to user unit
    const userDistance = this.unitSvc.metersToUser(totalMeters);
    return Math.round(userDistance * 10) / 10;
  }

  // ─── Last PR (most recently set personal record across all time) ───

  private calcLastPR(sessions: WorkoutSession[]): PRRecord | null {
    // Sort chronologically (oldest first) to track progression accurately
    const sortedLogs = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
    const bestByExercise = new Map<string, { weight: number; reps: number }>();
    let latestPR: PRRecord | null = null;

    for (const log of sortedLogs) {
      for (const ej of log.exercises) {
        if (ej.type !== 'strength' || !ej.sets) continue;
        for (const serie of ej.sets) {
          const prev = bestByExercise.get(ej.name);
          const isNewPR = !prev
            || serie.weight > prev.weight
            || (serie.weight === prev.weight && serie.reps > prev.reps);
          if (isNewPR) {
            bestByExercise.set(ej.name, { weight: serie.weight, reps: serie.reps });
            latestPR = { exercise: ej.name, weight: serie.weight, reps: serie.reps, date: log.date };
          }
        }
      }
    }
    return latestPR;
  }

  private buildWeek(trained: Set<string>, now: Date) {
    const days: { label: string; dayNum: number; isToday: boolean; trained: boolean }[] = [];
    const todayStr = this.toLocalDateStr(now);

    // Start of current week (Monday) — use local dates
    const dow = now.getDay(); // 0=Sun
    const startOffset = dow === 0 ? -6 : 1 - dow;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + startOffset);

    const weekLabels = ['L','M','X','J','V','S','D'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
      const ds = this.toLocalDateStr(d);
      days.push({
        label: weekLabels[i],
        dayNum: d.getDate(),
        isToday: ds === todayStr,
        trained: trained.has(ds),
      });
    }

    const endOfWeek = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
    this.weekRangeLabel.set(
      `${weekStart.getDate()} ${this.monthShort[weekStart.getMonth()]} – ${endOfWeek.getDate()} ${this.monthShort[endOfWeek.getMonth()]}`
    );
    this.weekDays.set(days);
  }

  getWeekDayClass(day: { isToday: boolean; trained: boolean; dayNum: number }): string {
    if (day.trained && day.isToday) return 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[#111827] shadow-[2px_2px_0_rgba(0,0,0,0.3)]';
    if (day.trained) return 'bg-[var(--color-accent-success)] border-[var(--color-accent-success)] text-[#111827] shadow-[2px_2px_0_rgba(0,0,0,0.3)]';
    if (day.isToday) return 'bg-transparent border-[var(--color-accent)] text-[var(--color-accent)] border-dashed';
    return 'bg-transparent border-transparent text-[var(--color-text-muted)]';
  }

  private buildHeatmap(trained: Set<string>, now: Date) {
    const days: HeatDay[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const ds = this.toLocalDateStr(d);
      days.push({ date: ds, trained: trained.has(ds), dayNum: d.getDate() });
    }
    this.heatmap.set(days);
    this.trainedCount.set(days.filter(d => d.trained).length);
  }

  private calcStreak(sortedDays: string[], now: Date): number {
    if (sortedDays.length === 0) return 0;
    const trainingSet = new Set(sortedDays);
    let streak = 0;
    const todayStr = this.toLocalDateStr(now);
    // Start from today; if today wasn't trained, start from yesterday
    let checkDate = new Date(now);
    if (!trainingSet.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (true) {
      const ds = this.toLocalDateStr(checkDate);
      if (trainingSet.has(ds)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  /** Returns YYYY-MM-DD in LOCAL time (avoids UTC midnight shift) */
  private toLocalDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private calcTagVolumens(logs: WorkoutSession[]) {
    const tagMap = new Map<MuscleTag, { seriesCount: number; distanceMeters: number; sesiones: Set<string> }>();

    for (const log of logs) {
      for (const ej of log.exercises) {
        const tags = ej.tags ?? [];
        for (const tag of tags) {
          if (!tagMap.has(tag)) tagMap.set(tag, { seriesCount: 0, distanceMeters: 0, sesiones: new Set() });
          const entry = tagMap.get(tag)!;
          entry.sesiones.add(log.date);
          if (ej.type === 'strength' && ej.sets) {
            entry.seriesCount += ej.sets.length;
          } else if (ej.cardio) {
            entry.distanceMeters += ej.cardio.distanceMeters ?? 0;
          }
        }
      }
    }

    const result: TagVolumen[] = [];
    tagMap.forEach((v, tag) => {
      const isCardio = tag === 'Cardio';
      if (isCardio) {
        const userDist = this.unitSvc.metersToUser(v.distanceMeters);
        result.push({
          tag,
          valor: Math.round(userDist * 10) / 10,
          unidad: this.unitSvc.currentDistanceUnit(),
          sesiones: v.sesiones.size,
        });
      } else {
        result.push({
          tag,
          valor: v.seriesCount,
          unidad: 'series',
          sesiones: v.sesiones.size,
        });
      }
    });

    result.sort((a, b) => b.valor - a.valor);
    this.tagVolumens.set(result);
  }

  getTagColor(tag: MuscleTag) {
    return TAG_COLORS[tag] ?? { bg: 'rgba(255,255,255,0.05)', text: '#a3a3a3', border: 'rgba(255,255,255,0.1)' };
  }

  formatTagValue(tv: TagVolumen): string {
    if (tv.tag === 'Cardio') return `${tv.valor} ${tv.unidad}`;
    return `${tv.valor} series`;
  }

  getLogTags(log: WorkoutSession): MuscleTag[] {
    const tags = new Set<MuscleTag>();
    log.exercises.forEach(e => e.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }

  formatFecha(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d} ${this.monthShort[parseInt(m, 10) - 1]} ${y}`;
  }

  getDaysAgo(fecha: string): string {
    // Compare calendar dates in local time to avoid UTC midnight off-by-one
    const [y, m, d] = fecha.split('-').map(Number);
    const logDate = new Date(y, m - 1, d);
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.round((todayLocal.getTime() - logDate.getTime()) / 86400000);
    if (diff <= 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    return `Hace ${diff} días`;
  }

  irAEntrenar() {
    this.router.navigate(['/workout']);
  }
}
