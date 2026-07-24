import { Component, input, output, signal, computed, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { ScrollLockDirective } from '../../directives/scroll-lock.directive';
import { StrengthSet, ExerciseLog, Suggestion } from '../../models/interfaces';
import { ProgressionService, ExerciseHistoryRecord } from '../../services/progression.service';
import { UnitConversionService } from '../../services/unit-conversion.service';

@Component({
  selector: 'app-exercise-strength',
  standalone: true,
  imports: [CommonModule, FormsModule, A11yModule, ScrollLockDirective],
  template: `
    <div class="rounded-3xl bg-[var(--color-bg-card)] p-4 sm:p-5 border border-white/5 flex flex-col gap-5 shadow-sm">
      <!-- Header -->
      <div
        class="sticky top-0 z-10 -mx-4 -mt-4 p-4 sm:-mx-5 sm:-mt-5 sm:p-5 flex items-center justify-between cursor-pointer transition-all group bg-[var(--color-bg-card)]/95 backdrop-blur-md rounded-t-3xl border-b border-white/5"
        (click)="toggleHistory()"
      >
        <h3 class="text-lg sm:text-xl font-bold text-white tracking-tight uppercase">{{ exerciseLog().name }}</h3>
        <svg
          xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="text-[var(--color-accent)] transition-transform duration-300 group-hover:scale-110 active:scale-95"
          [class.rotate-180]="showHistory()"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      <!-- In-Line History -->
      @if (showHistory()) {
        <div class="animate-fade-in bg-[var(--color-bg-input)] rounded-2xl p-4 border border-white/5 shadow-inner">
          <h4 class="text-[11px] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider mb-4">Últimas sesiones</h4>
          @if (history().length > 0) {
            <div class="flex flex-col gap-4">
              @for (record of history(); track record.date) {
                <div class="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <!-- Session date + volume -->
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[11px] font-semibold text-[var(--color-accent)] tracking-wider">{{ record.date | slice:5:10 }}</span>
                    <span class="text-[11px] text-[var(--color-text-muted)] font-mono font-medium">{{ displayWeight(record.totalVolume) }} {{ unitSvc.currentWeightUnit() }} total</span>
                  </div>
                  <!-- Individual sets -->
                  @if (hasProgressiveOverload(record.sets)) {
                    <!-- Weights varied: show each set on its own line -->
                    <div class="flex flex-wrap gap-2">
                      @for (s of record.sets; track $index; let i = $index) {
                        <span
                          class="text-xs font-mono font-medium px-2 py-1 rounded-md"
                          [class]="s.weight === record.weight
                            ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                            : 'bg-[var(--color-bg-primary)] border border-white/5 text-[var(--color-text-muted)]'"
                        >S{{ i + 1 }}: {{ displayWeight(s.weight) }}{{ unitSvc.currentWeightUnit() }}×{{ s.reps }}</span>
                      }
                    </div>
                  } @else {
                    <!-- All sets equal: compact summary -->
                    <span class="text-sm font-mono font-medium text-white">{{ record.sets.length }}×{{ record.sets[0]?.reps ?? record.reps }} &#64; {{ displayWeight(record.weight) }}{{ unitSvc.currentWeightUnit() }}</span>
                  }
                </div>
              }
            </div>
          } @else {
            <p class="text-[var(--color-text-muted)] text-xs font-medium text-center py-2">No hay historial previo.</p>
          }
        </div>
      }

      <!-- Alerta de salto de carga -->
      @if (suggestion()?.isLoadAlert) {
        <div class="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 flex items-start gap-3 mt-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-rose-400 shrink-0 mt-0.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <div>
            <p class="text-rose-400 font-semibold text-sm tracking-wide">¡Salto de carga!</p>
            <p class="text-rose-200/80 text-xs mt-1 font-mono">
              Sugerido: {{ suggestion()!.suggestedWeight }}{{ unitSvc.currentWeightUnit() }} × {{ suggestion()!.suggestedReps }} reps
            </p>
          </div>
        </div>
      }

      <!-- Completed Sets Header -->
      @if (exerciseLog().sets && exerciseLog().sets!.length > 0) {
        <div class="grid grid-cols-[32px_1fr_64px_64px_36px_40px] gap-2 px-2 text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wider text-center mt-2">
          <div>Set</div>
          <div class="text-left">Ant.</div>
          <div>{{ unitSvc.currentWeightUnit() }}</div>
          <div>Reps</div>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto text-[var(--color-accent-success)]"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div></div>
        </div>

        <!-- Completed Sets -->
        <div class="flex flex-col gap-2">
        @for (set of exerciseLog().sets; track set.setNumber; let i = $index; let isLast = $last) {
          <div
            class="grid grid-cols-[32px_1fr_64px_64px_36px_40px] gap-2 px-2 py-2 items-center text-white bg-[var(--color-accent-success)]/10 rounded-2xl border border-[var(--color-accent-success)]/20 transition-all"
            [class.animate-pulse-success]="isLast && justAddedSet()"
          >
            <div class="text-center font-bold text-[var(--color-accent-success)]">{{ set.setNumber }}</div>
            <div class="text-left text-[var(--color-text-muted)] text-[11px] font-mono font-medium leading-tight line-clamp-1 pr-1">
              {{ suggestion() ? (suggestion()!.referenceText | slice:10) : '—' }}
            </div>
            <div class="text-center font-mono font-semibold bg-[var(--color-bg-primary)] py-1.5 rounded-xl text-sm">{{ displayWeight(set.weight) }}</div>
            <div class="text-center font-mono font-semibold bg-[var(--color-bg-primary)] py-1.5 rounded-xl text-sm">{{ set.reps }}</div>
            <div class="flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="var(--color-accent-success)" stroke="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
            <div class="flex justify-center">
              <button
                (click)="deleteSet(i); $event.stopPropagation()"
                class="w-11 h-11 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all"
                aria-label="Eliminar serie"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
          </div>
        }
        </div>
      }

      <!-- Active Input Row -->
      <div class="flex flex-col gap-3 border-t border-white/5 pt-4 mt-2">
        <!-- Reference line -->
        <div class="flex items-center gap-2 px-2">
          <span class="w-6 text-center text-[var(--color-accent)] font-bold text-lg">{{ (exerciseLog().sets?.length || 0) + 1 }}</span>
          <span class="flex-1 text-[var(--color-text-muted)] text-[11px] font-medium uppercase tracking-wider leading-tight truncate">
            {{ suggestion() ? suggestion()!.referenceText.replace('Anterior: ', '') : 'Sin referencia previa' }}
          </span>
        </div>
        <!-- Stepper inputs -->
        <div class="flex items-center gap-2">
          <!-- Peso stepper -->
          <div class="flex flex-col gap-1.5 flex-1">
            <div class="flex items-center justify-center gap-1.5">
              <label class="text-xs font-semibold text-[var(--color-text-muted)] text-center uppercase tracking-wider">{{ unitSvc.currentWeightUnit() }}</label>
              <button (click)="showPlateCalculator.set(true)" class="text-[var(--color-accent)] hover:text-white transition-colors p-0.5 rounded-full hover:bg-white/5 active:scale-95" aria-label="Calculadora de discos" title="Calculadora de discos">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              </button>
            </div>
            <div class="flex items-center gap-1 bg-[var(--color-bg-input)] rounded-2xl p-1 border border-white/5">
              <button
                (click)="decrementWeight()"
                class="w-12 h-12 rounded-xl bg-transparent text-[var(--color-text-muted)] font-bold text-xl flex items-center justify-center active:scale-95 hover:text-white transition-all hover:bg-white/5"
                aria-label="Bajar peso"
              >−</button>
              <input
                type="text"
                inputmode="decimal"
                [(ngModel)]="weightInput"
                [placeholder]="suggestion() ? String(suggestion()!.suggestedWeight) : '—'"
                class="flex-1 h-12 w-12 sm:w-auto rounded-xl bg-[var(--color-bg-primary)] text-center font-mono text-lg font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all placeholder:text-white/20 shadow-inner"
              />
              <button
                (click)="incrementWeight()"
                class="w-12 h-12 rounded-xl bg-transparent text-[var(--color-text-muted)] font-bold text-xl flex items-center justify-center active:scale-95 hover:text-white transition-all hover:bg-white/5"
                aria-label="Subir peso"
              >+</button>
            </div>
          </div>
          <!-- Reps stepper -->
          <div class="flex flex-col gap-1.5 flex-1">
            <label class="text-xs font-semibold text-[var(--color-text-muted)] text-center uppercase tracking-wider">Reps</label>
            <div class="flex items-center gap-1 bg-[var(--color-bg-input)] rounded-2xl p-1 border border-white/5">
              <button
                (click)="decrementReps()"
                class="w-12 h-12 rounded-xl bg-transparent text-[var(--color-text-muted)] font-bold text-xl flex items-center justify-center active:scale-95 hover:text-white transition-all hover:bg-white/5"
                aria-label="Bajar reps"
              >−</button>
              <input
                type="text"
                inputmode="numeric"
                [(ngModel)]="repsInput"
                [placeholder]="suggestion() ? String(suggestion()!.suggestedReps) : '—'"
                class="flex-1 h-12 w-12 sm:w-auto rounded-xl bg-[var(--color-bg-primary)] text-center font-mono text-lg font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all placeholder:text-white/20 shadow-inner"
              />
              <button
                (click)="incrementReps()"
                class="w-12 h-12 rounded-xl bg-transparent text-[var(--color-text-muted)] font-bold text-xl flex items-center justify-center active:scale-95 hover:text-white transition-all hover:bg-white/5"
                aria-label="Subir reps"
              >+</button>
            </div>
          </div>
          <!-- Complete button -->
          <div class="flex flex-col gap-1.5 shrink-0">
            <label class="text-xs font-bold text-transparent text-center uppercase tracking-wider select-none">✓</label>
            <button
              (click)="completeSet()"
              [disabled]="!isValidInput()"
              class="w-14 h-14 flex items-center justify-center rounded-2xl transition-all disabled:opacity-30 disabled:scale-100"
              [class]="isValidInput() ? 'bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] text-white shadow-md hover:shadow-lg active:scale-95 cursor-pointer' : 'bg-[var(--color-bg-input)] text-[var(--color-text-muted)] border border-white/5 cursor-not-allowed'"
              aria-label="Completar serie"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Plate Calculator Modal -->
    @if (showPlateCalculator()) {
      <div appScrollLock class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in" (click)="showPlateCalculator.set(false)" cdkTrapFocus cdkTrapFocusAutoCapture>
        <div class="bg-[var(--color-bg-card)] rounded-3xl p-6 w-full max-w-sm border border-white/5 shadow-xl animate-scale-in" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-white tracking-tight">Discos a cargar</h3>
            <button (click)="showPlateCalculator.set(false)" class="text-[var(--color-text-muted)] hover:text-white transition-colors p-1 rounded-full hover:bg-white/5 active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
            </button>
          </div>
          
          @if (plateCalculation; as calc) {
            <p class="text-[var(--color-text-muted)] text-sm font-medium mb-6 leading-relaxed">
              Para levantar <span class="text-white font-bold">{{ getTargetWeight() }} {{ unitSvc.currentWeightUnit() }}</span> usando una barra estándar de {{ calc.bar }} {{ unitSvc.currentWeightUnit() }}, coloca <span class="text-[var(--color-accent)] font-semibold">por cada lado</span>:
            </p>
            <div class="flex flex-col gap-2">
              @for (plate of calc.plates; track plate.weight) {
                <div class="flex items-center justify-between bg-[var(--color-bg-input)] rounded-2xl px-4 py-3 border border-white/5">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full border-4 border-[var(--color-accent)]/30 flex items-center justify-center bg-[var(--color-bg-primary)]">
                      <span class="text-xs font-bold text-white">{{ plate.weight }}</span>
                    </div>
                    <span class="text-sm font-semibold text-white">Disco de {{ plate.weight }}{{ unitSvc.currentWeightUnit() }}</span>
                  </div>
                  <span class="text-lg font-bold text-[var(--color-accent)]">x{{ plate.count }}</span>
                </div>
              }
              @if (calc.plates.length === 0) {
                <div class="text-center py-4 bg-[var(--color-bg-input)] rounded-2xl border border-white/5 text-[var(--color-text-muted)] text-sm font-medium">Solo necesitas la barra vacía.</div>
              }
              @if (calc.remainder > 0) {
                <p class="text-xs text-rose-400 mt-2 font-medium text-center">No se puede armar exacto. Faltan {{ calc.remainder * 2 }}{{ unitSvc.currentWeightUnit() }}.</p>
              }
            </div>
          } @else {
            <div class="text-center py-8">
              <p class="text-[var(--color-text-muted)] text-sm font-medium">El peso actual es menor o igual a la barra vacía.</p>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [``], changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExerciseStrengthComponent implements OnInit {
  private progressionService = inject(ProgressionService);
  unitSvc = inject(UnitConversionService);

  // ─── Inputs / Outputs ───
  exerciseLog = input.required<ExerciseLog>();
  suggestion = input<Suggestion | null>(null);

  setCompleted = output<StrengthSet>();
  logUpdated = output<ExerciseLog>();

  // ─── Local state ───
  weightInput = '';
  repsInput = '';
  showHistory = signal(false);
  showPlateCalculator = signal(false);
  history = signal<ExerciseHistoryRecord[]>([]);
  justAddedSet = signal(false);

  // Expose String constructor for use in template
  readonly String = String;

  async ngOnInit() {
    const records = await this.progressionService.getExerciseHistory(this.exerciseLog().exerciseId, this.exerciseLog().name);
    this.history.set(records);
  }

  toggleHistory() {
    this.showHistory.update(v => !v);
  }

  displayWeight(baseWeight: number): number {
    return this.unitSvc.kgToUser(baseWeight);
  }

  /**
   * Returns true if not all sets in a session have the same weight.
   * When true, the history shows per-set detail instead of a compact summary.
   */
  hasProgressiveOverload(sets: { weight: number; reps: number }[]): boolean {
    if (!sets || sets.length <= 1) return false;
    const firstWeight = sets[0].weight;
    return sets.some(s => s.weight !== firstWeight);
  }

  getTargetWeight(): number {
    const v = parseFloat(this.weightInput);
    return isNaN(v) ? (this.suggestion()?.suggestedWeight ?? 0) : v;
  }

  // Plate calculation logic
  get plateCalculation() {
    const unit = this.unitSvc.currentWeightUnit();
    const barWeight = unit === 'kg' ? 20 : 45;
    const availablePlates = unit === 'kg' ? [25, 20, 15, 10, 5, 2.5, 1.25] : [45, 35, 25, 10, 5, 2.5];
    
    const target = this.getTargetWeight(); 
    if (target <= barWeight) return null;

    let remainingPerSide = (target - barWeight) / 2;
    const platesUsed: { weight: number; count: number }[] = [];

    for (const plate of availablePlates) {
      if (remainingPerSide >= plate) {
        const count = Math.floor(remainingPerSide / plate);
        platesUsed.push({ weight: plate, count });
        remainingPerSide -= count * plate;
      }
    }

    // round remainder to 2 decimals to avoid floating point issues
    return { bar: barWeight, plates: platesUsed, remainder: Math.round(remainingPerSide * 100) / 100 };
  }

  private getTargetReps(fallback = 0): number {
    const v = parseInt(this.repsInput, 10);
    return isNaN(v) ? (this.suggestion()?.suggestedReps ?? fallback) : v;
  }

  isValidInput(): boolean {
    const weight = this.getTargetWeight();
    const reps = this.getTargetReps();
    return weight > 0 || reps > 0;
  }

  // ─── Weight steppers ───
  incrementWeight(): void {
    const current = this.getTargetWeight();
    const increment = this.unitSvc.currentSettings()?.weightIncrement ?? 2.5;
    const next = Math.round((current + increment) * 100) / 100;
    this.weightInput = String(next);
    this.vibrarShort();
  }

  decrementWeight(): void {
    const current = this.getTargetWeight();
    const increment = this.unitSvc.currentSettings()?.weightIncrement ?? 2.5;
    const next = Math.max(0, Math.round((current - increment) * 100) / 100);
    this.weightInput = String(next);
    this.vibrarShort();
  }

  // ─── Reps steppers ───
  incrementReps(): void {
    const current = this.getTargetReps();
    this.repsInput = String(current + 1);
    this.vibrarShort();
  }

  decrementReps(): void {
    const current = this.getTargetReps(1);
    this.repsInput = String(Math.max(1, current - 1));
    this.vibrarShort();
  }

  // ─── Delete a completed series ───
  // Fix #4: Build a new array instead of mutating the input object in-place.
  // Angular OnPush + signals require reference changes to trigger re-renders.
  deleteSet(index: number): void {
    const log = this.exerciseLog();
    if (!log.sets || log.sets.length === 0) return;
    const newSets = log.sets
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, setNumber: i + 1 }));
    this.logUpdated.emit({ ...log, sets: newSets });
  }

  // ─── Complete a set ───
  // Fix #4: Create a new ExerciseLog object (spread) instead of mutating the
  // input reference. This ensures the parent signal updates correctly with OnPush.
  completeSet(): void {
    if (!this.isValidInput()) return;

    const userWeight = this.getTargetWeight();
    const baseWeight = this.unitSvc.userToKg(userWeight);
    const reps = this.getTargetReps();

    const log = this.exerciseLog();
    const currentSets = log.sets ?? [];

    const newSet: StrengthSet = {
      setNumber: currentSets.length + 1,
      weight: baseWeight,
      reps,
    };

    // Immutable update: spread existing sets + new set
    const updatedLog = { ...log, sets: [...currentSets, newSet] };

    // Clear inputs
    this.weightInput = '';
    this.repsInput = '';

    // Pulse animation
    this.justAddedSet.set(true);
    setTimeout(() => {
      this.justAddedSet.set(false);
    }, 1000);

    // Emit events
    this.setCompleted.emit(newSet);
    this.logUpdated.emit(updatedLog);

    this.vibrarShort();
  }

  private vibrarShort() {
    try {
      navigator?.vibrate?.([20]);
    } catch {}
  }
}
