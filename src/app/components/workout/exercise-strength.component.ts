import { Component, input, output, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExerciseLog, StrengthSet, Suggestion } from '../../models/interfaces';
import { ProgressionService, ExerciseHistoryRecord } from '../../services/progression.service';
import { UnitConversionService } from '../../services/unit-conversion.service';

@Component({
  selector: 'app-exercise-strength',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rounded-2xl bg-[var(--color-bg-card)] p-4  border border-[var(--color-border)] flex flex-col gap-4">
      <!-- Header -->
      <div
        class="flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity"
        (click)="toggleHistory()"
      >
        <h3 class="text-xl font-black text-[var(--color-text-primary)] tracking-tight">{{ exerciseLog().name }}</h3>
        <svg
          xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
          class="text-[var(--color-text-muted)] transition-transform duration-300"
          [class.rotate-180]="showHistory()"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      <!-- In-Line History -->
      @if (showHistory()) {
        <div class="animate-fade-in bg-[var(--color-bg-input)] rounded-xl p-4 border border-[var(--color-border)] ">
          <h4 class="text-xs text-[var(--color-text-muted)] font-bold mb-3">Últimas sesiones</h4>
          @if (history().length > 0) {
            <div class="flex flex-col gap-4">
              @for (record of history(); track record.date) {
                <div>
                  <!-- Session date + volume -->
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs font-black text-[var(--color-text-muted)]">{{ record.date | slice:5:10 }}</span>
                    <span class="text-[10px] text-[var(--color-text-muted)] font-mono">{{ displayWeight(record.totalVolume) }} {{ unitSvc.currentWeightUnit() }} total</span>
                  </div>
                  <!-- Individual sets -->
                  @if (hasProgressiveOverload(record.sets)) {
                    <!-- Weights varied: show each set on its own line -->
                    <div class="flex flex-wrap gap-1.5">
                      @for (s of record.sets; track $index; let i = $index) {
                        <span
                          class="text-xs font-bold px-2 py-1 rounded-lg border"
                          [class]="s.weight === record.weight
                            ? 'bg-[#00f2fe]/10 border-[#00f2fe]/30 text-[#00f2fe]'
                            : 'bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-secondary)]'"
                        >S{{ i + 1 }}: {{ displayWeight(s.weight) }}{{ unitSvc.currentWeightUnit() }}×{{ s.reps }}</span>
                      }
                    </div>
                  } @else {
                    <!-- All sets equal: compact summary -->
                    <span class="text-sm font-bold text-[#00f2fe]">{{ record.sets.length }}×{{ record.sets[0]?.reps ?? record.reps }} @ {{ displayWeight(record.weight) }}{{ unitSvc.currentWeightUnit() }}</span>
                  }
                </div>
              }
            </div>
          } @else {
            <p class="text-[var(--color-text-muted)] text-sm font-medium text-center py-2">No hay historial previo.</p>
          }
        </div>
      }

      <!-- Alerta de salto de carga -->
      @if (suggestion()?.isLoadAlert) {
        <div class="rounded-xl bg-rose-500/15 border border-rose-500/30 p-4 flex items-start gap-3 ">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-rose-500 shrink-0"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <div>
            <p class="text-rose-400 font-black text-sm">¡Salto de carga!</p>
            <p class="text-rose-300 text-xs mt-1 font-medium">
              Sugerido: {{ suggestion()!.suggestedWeight }}{{ unitSvc.currentWeightUnit() }} × {{ suggestion()!.suggestedReps }} reps
            </p>
          </div>
        </div>
      }

      <!-- Completed Sets Header -->
      @if (exerciseLog().sets && exerciseLog().sets!.length > 0) {
        <div class="grid grid-cols-[28px_1fr_60px_60px_36px_36px] gap-1.5 px-2 text-[10px]  text-[var(--color-text-muted)] font-black text-center">
          <div>Set</div>
          <div class="text-left">Anterior</div>
          <div>{{ unitSvc.currentWeightUnit() }}</div>
          <div>Reps</div>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="mx-auto"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>×</div>
        </div>

        <!-- Completed Sets -->
        @for (set of exerciseLog().sets; track set.setNumber; let i = $index; let isLast = $last) {
          <div
            class="grid grid-cols-[28px_1fr_60px_60px_36px_36px] gap-1.5 px-2 py-2.5 items-center text-[var(--color-text-primary)] bg-emerald-500/10 rounded-[16px] border border-emerald-500/20 transition-all"
            [class.animate-pulse-success]="isLast && justAddedSet()"
          >
            <div class="text-center font-black text-emerald-400 text-sm">{{ set.setNumber }}</div>
            <div class="text-left text-[var(--color-text-muted)] text-xs leading-tight line-clamp-1 pr-1 font-medium">
              {{ suggestion() ? (suggestion()!.referenceText | slice:10) : '—' }}
            </div>
            <div class="text-center font-mono font-bold bg-[var(--color-bg-input)]/80 py-1.5 rounded-xl border border-[var(--color-border)] text-sm">{{ displayWeight(set.weight) }}</div>
            <div class="text-center font-mono font-bold bg-[var(--color-bg-input)]/80 py-1.5 rounded-xl border border-[var(--color-border)] text-sm">{{ set.reps }}</div>
            <div class="flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#10b981" stroke="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
            <div class="flex justify-center">
              <button
                (click)="deleteSet(i); $event.stopPropagation()"
                class="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 active:scale-90 transition-all"
                aria-label="Eliminar serie"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
          </div>
        }
      }

      <!-- Active Input Row -->
      <div class="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
        <!-- Reference line -->
        <div class="flex items-center gap-2 px-1">
          <span class="w-7 text-center text-[var(--color-text-primary)] font-black text-sm">{{ (exerciseLog().sets?.length || 0) + 1 }}</span>
          <span class="flex-1 text-[var(--color-text-muted)] text-xs font-bold leading-tight truncate">
            {{ suggestion() ? suggestion()!.referenceText.replace('Anterior: ', '') : 'Sin referencia previa' }}
          </span>
        </div>
        <!-- Stepper inputs -->
        <div class="flex items-center gap-2">
          <!-- Peso stepper -->
          <div class="flex flex-col gap-1 flex-1">
            <label class="text-[9px] font-black text-[var(--color-text-muted)] text-center uppercase tracking-wider">{{ unitSvc.currentWeightUnit() }}</label>
            <div class="flex items-center gap-1">
              <button
                (click)="decrementWeight()"
                class="w-9 h-12 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text-muted)] font-black text-lg flex items-center justify-center active:scale-90 hover:text-[#00f2fe] hover:border-[#00f2fe]/40 transition-all"
                aria-label="Bajar peso"
              >−</button>
              <input
                type="text"
                inputmode="decimal"
                [(ngModel)]="weightInput"
                [placeholder]="suggestion() ? String(suggestion()!.suggestedWeight) : '—'"
                class="flex-1 h-12 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-center font-mono text-base font-black text-[var(--color-text-primary)] focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/50 placeholder:text-[var(--color-text-muted)] transition-all "
              />
              <button
                (click)="incrementWeight()"
                class="w-9 h-12 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text-muted)] font-black text-lg flex items-center justify-center active:scale-90 hover:text-[#00f2fe] hover:border-[#00f2fe]/40 transition-all"
                aria-label="Subir peso"
              >+</button>
            </div>
          </div>
          <!-- Reps stepper -->
          <div class="flex flex-col gap-1 flex-1">
            <label class="text-[9px] font-black text-[var(--color-text-muted)] text-center uppercase tracking-wider">Reps</label>
            <div class="flex items-center gap-1">
              <button
                (click)="decrementReps()"
                class="w-9 h-12 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text-muted)] font-black text-lg flex items-center justify-center active:scale-90 hover:text-[#00f2fe] hover:border-[#00f2fe]/40 transition-all"
                aria-label="Bajar reps"
              >−</button>
              <input
                type="text"
                inputmode="numeric"
                [(ngModel)]="repsInput"
                [placeholder]="suggestion() ? String(suggestion()!.suggestedReps) : '—'"
                class="flex-1 h-12 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-center font-mono text-base font-black text-[var(--color-text-primary)] focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/50 placeholder:text-[var(--color-text-muted)] transition-all "
              />
              <button
                (click)="incrementReps()"
                class="w-9 h-12 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text-muted)] font-black text-lg flex items-center justify-center active:scale-90 hover:text-[#00f2fe] hover:border-[#00f2fe]/40 transition-all"
                aria-label="Subir reps"
              >+</button>
            </div>
          </div>
          <!-- Complete button -->
          <div class="flex flex-col gap-1">
            <label class="text-[9px] font-black text-transparent text-center uppercase tracking-wider select-none">✓</label>
            <button
              (click)="completeSet()"
              [disabled]="!isValidInput()"
              class="w-12 h-12 flex items-center justify-center rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] transition-all group disabled:opacity-40 disabled:active:scale-100 active:scale-90"
              [class]="isValidInput() ? 'text-[#00f2fe] hover:bg-[#00f2fe]/10 hover:border-[#00f2fe] cursor-pointer' : 'text-[var(--color-text-muted)] cursor-not-allowed'"
              aria-label="Completar serie"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="group-hover:scale-110 transition-transform"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
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
  history = signal<ExerciseHistoryRecord[]>([]);
  justAddedSet = signal(false);

  // Expose String constructor for use in template
  readonly String = String;

  async ngOnInit() {
    const records = await this.progressionService.getExerciseHistory(this.exerciseLog().name);
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

  isValidInput(): boolean {
    const weight = parseFloat(this.weightInput) || this.suggestion()?.suggestedWeight || 0;
    const reps = parseInt(this.repsInput, 10) || this.suggestion()?.suggestedReps || 0;
    return weight > 0 || reps > 0;
  }

  // ─── Weight steppers ───
  incrementWeight(): void {
    const current = parseFloat(this.weightInput) || this.suggestion()?.suggestedWeight || 0;
    const increment = this.unitSvc.currentSettings()?.weightIncrement ?? 2.5;
    const next = Math.round((current + increment) * 100) / 100;
    this.weightInput = String(next);
    this.vibrarShort();
  }

  decrementWeight(): void {
    const current = parseFloat(this.weightInput) || this.suggestion()?.suggestedWeight || 0;
    const increment = this.unitSvc.currentSettings()?.weightIncrement ?? 2.5;
    const next = Math.max(0, Math.round((current - increment) * 100) / 100);
    this.weightInput = String(next);
    this.vibrarShort();
  }

  // ─── Reps steppers ───
  incrementReps(): void {
    const current = parseInt(this.repsInput, 10) || this.suggestion()?.suggestedReps || 0;
    this.repsInput = String(current + 1);
    this.vibrarShort();
  }

  decrementReps(): void {
    const current = parseInt(this.repsInput, 10) || this.suggestion()?.suggestedReps || 1;
    this.repsInput = String(Math.max(1, current - 1));
    this.vibrarShort();
  }

  // ─── Delete a completed series ───
  deleteSet(index: number): void {
    const log = this.exerciseLog();
    if (!log.sets || log.sets.length === 0) return;
    log.sets.splice(index, 1);
    // Renumber remaining sets
    log.sets.forEach((s, i) => (s.setNumber = i + 1));
    this.logUpdated.emit(log);
  }

  // ─── Complete a set ───
  completeSet(): void {
    if (!this.isValidInput()) return;

    const userWeight = parseFloat(this.weightInput) || this.suggestion()?.suggestedWeight || 0;
    const baseWeight = this.unitSvc.userToKg(userWeight);
    const reps = parseInt(this.repsInput, 10) || this.suggestion()?.suggestedReps || 0;

    const log = this.exerciseLog();
    if (!log.sets) {
      log.sets = [];
    }

    const newSet: StrengthSet = {
      setNumber: log.sets.length + 1,
      weight: baseWeight,
      reps,
    };

    log.sets.push(newSet);

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
    this.logUpdated.emit(log);

    this.vibrarShort();
  }

  private vibrarShort() {
    try {
      navigator?.vibrate?.([20]);
    } catch {}
  }
}
