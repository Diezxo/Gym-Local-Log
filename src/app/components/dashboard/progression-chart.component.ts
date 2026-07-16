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
    <div class="bg-[var(--color-bg-card)] rounded-2xl p-4 sm:p-8 border border-[var(--color-border)]  mt-8">
      <h2 class="text-base font-bold text-[var(--color-text-muted)]  mb-6">Exercise Progress</h2>
      
      @if (uniqueExercises().length > 0) {
        <div class="flex flex-col gap-4 mb-6">
          <!-- Exercise Selector -->
          <div class="relative">
            <select
              [ngModel]="selectedExercise()"
              (ngModelChange)="selectedExercise.set($event)"
              class="w-full appearance-none rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] px-4 py-3 pr-10 text-sm font-bold text-[var(--color-text-primary)] focus:outline-none focus:border-[#00f2fe] transition-colors"
            >
              @for (ex of uniqueExercises(); track ex) {
                <option [value]="ex">{{ ex }}</option>
              }
            </select>
            <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>

          <!-- Metric Toggle -->
          <div class="flex bg-[var(--color-bg-input)] p-1 rounded-full">
            <button
              (click)="metric.set('maxWeight')"
              [class.bg-[#00f2fe]]="metric() === 'maxWeight'"
              [class.text-black]="metric() === 'maxWeight'"
              [class.text-[var(--color-text-muted)]]="metric() !== 'maxWeight'"
              class="flex-1 py-1.5 text-xs font-bold rounded-full transition-all"
            >
              Max Weight
            </button>
            <button
              (click)="metric.set('volume')"
              [class.bg-[#00f2fe]]="metric() === 'volume'"
              [class.text-black]="metric() === 'volume'"
              [class.text-[var(--color-text-muted)]]="metric() !== 'volume'"
              class="flex-1 py-1.5 text-xs font-bold rounded-full transition-all"
            >
              Volume
            </button>
          </div>
        </div>

        <!-- Chart Area -->
        @if (chartData().length > 1) {
          <div class="relative w-full aspect-[2/1] bg-[var(--color-bg-input)]/30 rounded-2xl p-4 overflow-hidden">
            <!-- Y-Axis max label -->
            <div class="absolute top-2 left-2 text-[10px] font-black text-[var(--color-text-muted)]">{{ chartMax() | number:'1.0-1' }}{{ unitSvc.currentWeightUnit() }}</div>
            
            <svg class="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
              <defs>
                <linearGradient id="neon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#00f2fe" />
                  <stop offset="100%" stop-color="#a252ff" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <!-- Grid lines -->
              <line x1="0" y1="25" x2="100" y2="25" stroke="var(--color-border)" stroke-width="0.5" stroke-dasharray="2 2" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="var(--color-border)" stroke-width="0.5" />

              <!-- Polyline -->
              <polyline
                fill="none"
                stroke="url(#neon-gradient)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                filter="url(#glow)"
                [attr.points]="svgPoints()"
                class="animate-draw-line"
              />

              <!-- Data points dots -->
              @for (pt of chartData(); track pt.dateStr) {
                <circle
                  [attr.cx]="getX(pt.dayNum)"
                  [attr.cy]="getY(pt.value)"
                  r="1.5"
                  fill="var(--color-bg-card)"
                  stroke="#00f2fe"
                  stroke-width="0.8"
                />
              }
            </svg>
          </div>
          
          <!-- X-Axis Labels (first and last) -->
          <div class="flex justify-between mt-3 px-2">
            <span class="text-[10px] font-bold text-[var(--color-text-muted)]">{{ chartData()[0].dateStr | slice:8:10 }} / {{ chartData()[0].dateStr | slice:5:7 }}</span>
            <span class="text-[10px] font-bold text-[var(--color-text-muted)]">{{ chartData()[chartData().length - 1].dateStr | slice:8:10 }} / {{ chartData()[chartData().length - 1].dateStr | slice:5:7 }}</span>
          </div>
        } @else if (chartData().length === 1) {
          <div class="h-32 flex items-center justify-center text-center px-4 bg-[var(--color-bg-input)]/30 rounded-2xl">
            <p class="text-sm text-[var(--color-text-muted)] font-medium">Only 1 record of <span class="text-[var(--color-text-primary)] font-bold">{{ selectedExercise() }}</span>. Do it at least 2 times to see the chart.</p>
          </div>
        } @else {
          <div class="h-32 flex items-center justify-center text-center px-4 bg-[var(--color-bg-input)]/30 rounded-2xl">
            <p class="text-sm text-[var(--color-text-muted)] font-medium">No strength data for this exercise.</p>
          </div>
        }
      } @else {
        <p class="text-sm text-[var(--color-text-muted)] text-center py-4">No exercises logged yet.</p>
      }
    </div>
  `,
  styles: [`
    @keyframes drawLine {
      from { stroke-dasharray: 0 300; }
      to { stroke-dasharray: 300 0; }
    }
    .animate-draw-line {
      animation: drawLine 1.5s ease-out forwards;
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
