import { Component, Input, signal, computed, inject, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkoutSession } from '../../models/interfaces';
import { UnitConversionService } from '../../services/unit-conversion.service';

interface DataPoint {
  dateStr: string;
  dayNum: number;
  value: number;
}

@Component({
  selector: 'app-progression-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-[var(--color-bg-card)] rounded-3xl p-4 sm:p-6 border border-white/5 shadow-sm mt-2">
      <h2 class="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Progreso de Ejercicios</h2>
      
      @if (uniqueExercises().length > 0) {
        <div class="flex flex-col gap-4 mb-5">
          <!-- Exercise Selector -->
          <div class="relative">
            <select
              [ngModel]="selectedExercise()"
              (ngModelChange)="selectedExercise.set($event)"
              class="w-full appearance-none rounded-2xl bg-[var(--color-bg-input)] border border-white/5 px-4 py-3.5 pr-10 text-base font-medium text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-all shadow-inner cursor-pointer"
            >
              @for (ex of uniqueExercises(); track ex) {
                <option [value]="ex">{{ ex }}</option>
              }
            </select>
            <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>

          <!-- Extra Stat & Metric Toggle Row -->
          <div class="flex flex-col sm:flex-row justify-between gap-4">
            
            <!-- Extra Stat -->
            <div class="bg-gradient-to-br from-[var(--color-bg-input)] to-[var(--color-bg-primary)] border border-white/5 p-4 rounded-2xl flex-1 flex flex-col justify-center items-center text-center shadow-sm">
              <span class="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                {{ metric() === 'maxWeight' ? 'Récord Histórico' : 'Volumen Total (Meses)' }}
              </span>
              <span class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)]">
                {{ metric() === 'maxWeight' ? (overallMax() | number:'1.0-1') : (totalVolume() | number:'1.0-1') }}
                <span class="text-sm font-medium text-[var(--color-accent-secondary)]">{{ unitSvc.currentWeightUnit() }}</span>
              </span>
            </div>

            <!-- Metric Toggle -->
            <div class="flex bg-[var(--color-bg-input)] p-1.5 rounded-2xl border border-white/5 flex-1 shadow-inner">
              <button
                (click)="metric.set('maxWeight')"
                [class.bg-[var(--color-bg-card)]]="metric() === 'maxWeight'"
                [class.text-[var(--color-text-primary)]]="metric() === 'maxWeight'"
                [class.shadow-sm]="metric() === 'maxWeight'"
                [class.text-[var(--color-text-muted)]]="metric() !== 'maxWeight'"
                class="flex-1 py-2 text-sm font-medium rounded-xl transition-all border border-transparent"
                [class.border-white/5]="metric() === 'maxWeight'"
              >
                Peso Máx
              </button>
              <button
                (click)="metric.set('volume')"
                [class.bg-[var(--color-bg-card)]]="metric() === 'volume'"
                [class.text-[var(--color-text-primary)]]="metric() === 'volume'"
                [class.shadow-sm]="metric() === 'volume'"
                [class.text-[var(--color-text-muted)]]="metric() !== 'volume'"
                class="flex-1 py-2 text-sm font-medium rounded-xl transition-all border border-transparent"
                [class.border-white/5]="metric() === 'volume'"
              >
                Volumen
              </button>
            </div>

          </div>
        </div>

        <!-- Chart Area -->
        @if (chartData().length > 1) {
          <div class="relative w-full aspect-[2/1] bg-gradient-to-b from-[var(--color-bg-input)] to-transparent rounded-2xl p-4 overflow-visible border border-white/5 shadow-inner">
            <!-- Y-Axis max label -->
            <div class="absolute top-2 left-3 text-[10px] font-medium tracking-wider text-[var(--color-text-muted)]">{{ chartMax() | number:'1.0-1' }}{{ unitSvc.currentWeightUnit() }}</div>
            
            <svg class="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
              <defs>
                <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="var(--color-accent)" />
                  <stop offset="100%" stop-color="var(--color-accent-secondary)" />
                </linearGradient>
              </defs>
              <!-- Grid lines -->
              <line x1="0" y1="25" x2="100" y2="25" stroke="var(--color-border)" stroke-width="0.5" stroke-dasharray="2 4" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="var(--color-border)" stroke-width="0.5" />

              <!-- Polyline -->
              <polyline
                fill="none"
                stroke="url(#line-grad)"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                [attr.points]="svgPoints()"
                class="animate-draw-line drop-shadow-[0_4px_6px_rgba(59,130,246,0.2)]"
              />

              <!-- Data points dots -->
              @for (pt of chartData(); track pt.dateStr) {
                <circle
                  [attr.cx]="getX(pt.dayNum)"
                  [attr.cy]="getY(pt.value)"
                  r="2.5"
                  fill="var(--color-bg-card)"
                  stroke="var(--color-accent-secondary)"
                  stroke-width="1.5"
                />
              }
            </svg>
          </div>
          
          <!-- X-Axis Labels (first and last) -->
          <div class="flex justify-between mt-3 px-1">
            <span class="text-[10px] font-medium text-[var(--color-text-muted)]">{{ chartData()[0].dateStr | slice:8:10 }} / {{ chartData()[0].dateStr | slice:5:7 }}</span>
            <span class="text-[10px] font-medium text-[var(--color-text-muted)]">{{ chartData()[chartData().length - 1].dateStr | slice:8:10 }} / {{ chartData()[chartData().length - 1].dateStr | slice:5:7 }}</span>
          </div>
        } @else if (chartData().length === 1) {
          <div class="h-32 flex items-center justify-center text-center px-6 bg-[var(--color-bg-input)]/30 rounded-2xl border border-dashed border-[var(--color-border)]">
            <p class="text-sm text-[var(--color-text-muted)]">Solo 1 registro de <span class="text-[var(--color-accent)] font-medium">{{ selectedExercise() }}</span>. Hazlo al menos 2 veces para ver el gráfico.</p>
          </div>
        } @else {
          <div class="h-32 flex items-center justify-center text-center px-6 bg-[var(--color-bg-input)]/30 rounded-2xl border border-dashed border-[var(--color-border)]">
            <p class="text-sm text-[var(--color-text-muted)]">No hay datos de fuerza para este ejercicio.</p>
          </div>
        }
      } @else {
        <p class="text-sm text-[var(--color-text-muted)] text-center py-6">Aún no hay ejercicios registrados.</p>
      }
    </div>
  `,
  styles: [`
    @keyframes drawLine {
      from { stroke-dasharray: 0 400; }
      to { stroke-dasharray: 400 0; }
    }
    .animate-draw-line {
      animation: drawLine 1s ease-out forwards;
    }
  `]
})
export class ProgressionChartComponent implements OnChanges {
  @Input() logs: WorkoutSession[] = [];
  
  unitSvc = inject(UnitConversionService);

  // State
  metric = signal<'maxWeight' | 'volume'>('maxWeight');
  selectedExercise = signal<string>('');
  uniqueExercises = signal<string[]>([]);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['logs'] && this.logs) {
      this.extractExercises();
    }
  }

  private extractExercises() {
    const exercises = new Set<string>();
    for (const log of this.logs) {
      for (const ej of log.exercises) {
        if (ej.type === 'strength') {
          exercises.add(ej.name);
        }
      }
    }
    const arr = Array.from(exercises).sort();
    this.uniqueExercises.set(arr);
    
    // Select first by default if current selection is not valid
    if (arr.length > 0 && !arr.includes(this.selectedExercise())) {
      this.selectedExercise.set(arr[0]);
    }
  }

  // Computed data for the chart
  chartData = computed<DataPoint[]>(() => {
    const exercise = this.selectedExercise();
    const met = this.metric();
    if (!exercise || this.logs.length === 0) return [];

    const data: DataPoint[] = [];

    // logs are already sorted by date usually, but let's ensure chronological for the chart (oldest to newest)
    const sortedLogs = [...this.logs].sort((a, b) => a.date.localeCompare(b.date));

    for (const log of sortedLogs) {
      // Find all instances of this exercise in this log (rare but possible)
      const ejs = log.exercises.filter(e => e.name === exercise && e.type === 'strength');
      if (ejs.length === 0) continue;

      let value = 0;
      if (met === 'maxWeight') {
        // Find max weight lifted across all sets of all instances of this exercise today
        let maxW = 0;
        for (const ej of ejs) {
          for (const s of ej.sets ?? []) {
            const userWeight = this.unitSvc.kgToUser(s.weight);
            if (userWeight > maxW) maxW = userWeight;
          }
        }
        value = maxW;
      } else {
        // Find total volume across all instances today
        let vol = 0;
        for (const ej of ejs) {
          for (const s of ej.sets ?? []) {
            const userWeight = this.unitSvc.kgToUser(s.weight);
            vol += userWeight * s.reps;
          }
        }
        value = vol;
      }

      if (value > 0) {
        // Use the absolute days from some epoch, or just day of month if it's single month.
        // Wait, the chart can now handle all months across time!
        // To accurately map x-axis over time, we should map based on exact date diff.
        // But the previous code just parsed the day of month. That looks broken across months!
        // Let's fix this since the dashboard passes ALL logs across ALL months.
        const d = new Date(`${log.date}T00:00:00`);
        // Calculate dayNum as the number of days since epoch (or since first log)
        const dayNum = Math.floor(d.getTime() / 86400000);
        
        data.push({ dateStr: log.date, dayNum, value });
      }
    }

    return data;
  });

  chartMax = computed(() => {
    const data = this.chartData();
    if (data.length === 0) return 0;
    return Math.max(...data.map(d => d.value));
  });

  chartMin = computed(() => {
    const data = this.chartData();
    if (data.length === 0) return 0;
    return Math.min(...data.map(d => d.value));
  });

  overallMax = computed(() => {
    return this.chartMax();
  });

  totalVolume = computed(() => {
    return this.chartData().reduce((acc, pt) => acc + pt.value, 0);
  });

  // SVG Coordinate mapping functions (100x50 viewBox)
  // X maps dayNum into 0 to 100
  // Y maps value into 50 to 0 (SVG Y is inverted)
  getX(dayNum: number): number {
    const data = this.chartData();
    if (data.length < 2) return 50; // middle
    const firstDay = data[0].dayNum;
    const lastDay = data[data.length - 1].dayNum;
    
    // If the exercises were done on the same day
    if (lastDay === firstDay) return 50;
    
    // Spread across 5 to 95 width instead of 0-100 to prevent edge clipping
    return 5 + ((dayNum - firstDay) / (lastDay - firstDay)) * 90;
  }

  getY(val: number): number {
    const min = this.chartMin();
    const max = this.chartMax();
    // Add 10% padding top and bottom so line doesn't clip
    const range = (max - min) || 1; // avoid div by 0
    const paddedMin = min - (range * 0.1);
    const paddedMax = max + (range * 0.1);
    const paddedRange = paddedMax - paddedMin;
    
    // Calculate percentage (0 = min, 1 = max)
    const pct = (val - paddedMin) / paddedRange;
    
    // Map to 50 -> 0
    return 50 - (pct * 50);
  }

  svgPoints = computed(() => {
    return this.chartData().map(d => `${this.getX(d.dayNum)},${this.getY(d.value)}`).join(' ');
  });
}
