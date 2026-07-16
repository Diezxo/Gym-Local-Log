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
    <div class="rounded-xl bg-[var(--color-bg-card)] p-4 sm:p-5 border-2 border-[var(--color-border)] flex flex-col gap-5 shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
      <!-- Header -->
      <div
        class="flex items-center justify-between cursor-pointer active:translate-y-[2px] transition-all group"
        (click)="toggleHistory()"
      >
        <h3 class="text-xl sm:text-2xl font-heading font-black text-[var(--color-text-primary)] tracking-widest uppercase drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">{{ exerciseLog().name }}</h3>
        <svg
          xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
          class="text-[var(--color-accent)] transition-transform duration-300 group-hover:scale-110 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]"
          [class.rotate-180]="showHistory()"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      <!-- In-Line History -->
      @if (showHistory()) {
        <div class="animate-fade-in bg-[var(--color-bg-input)] rounded-lg p-4 border-2 border-[var(--color-border)] shadow-inner">
          <h4 class="text-sm text-[var(--color-text-muted)] font-heading font-black uppercase tracking-widest mb-4">Últimas sesiones</h4>
          @if (history().length > 0) {
            <div class="flex flex-col gap-4">
              @for (record of history(); track record.date) {
                <div class="border-b-2 border-dashed border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
                  <!-- Session date + volume -->
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-heading font-black text-[var(--color-accent)] tracking-widest">{{ record.date | slice:5:10 }}</span>
                    <span class="text-xs text-[var(--color-text-muted)] font-mono font-bold">{{ displayWeight(record.totalVolume) }} {{ unitSvc.currentWeightUnit() }} total</span>
                  </div>
                  <!-- Individual sets -->
                  @if (hasProgressiveOverload(record.sets)) {
                    <!-- Weights varied: show each set on its own line -->
                    <div class="flex flex-wrap gap-2">
                      @for (s of record.sets; track $index; let i = $index) {
                        <span
                          class="text-xs font-mono font-bold px-2 py-1 rounded-md border-2"
                          [class]="s.weight === record.weight
                            ? 'bg-[var(--color-accent)] border-[#111827] text-[#111827] shadow-[2px_2px_0_rgba(0,0,0,0.5)]'
                            : 'bg-[#111827] border-[var(--color-border)] text-[var(--color-text-secondary)]'"
                        >S{{ i + 1 }}: {{ displayWeight(s.weight) }}{{ unitSvc.currentWeightUnit() }}×{{ s.reps }}</span>
                      }
                    </div>
                  } @else {
                    <!-- All sets equal: compact summary -->
                    <span class="text-sm font-mono font-bold text-[var(--color-accent)]">{{ record.sets.length }}×{{ record.sets[0]?.reps ?? record.reps }} @ {{ displayWeight(record.weight) }}{{ unitSvc.currentWeightUnit() }}</span>
                  }
                </div>
              }
            </div>
          } @else {
            <p class="text-[var(--color-text-muted)] text-sm font-heading font-bold uppercase tracking-widest text-center py-2">No hay historial previo.</p>
          }
        </div>
      }

      <!-- Alerta de salto de carga -->
      @if (suggestion()?.isLoadAlert) {
        <div class="rounded-lg bg-rose-500 border-2 border-rose-900 p-4 flex items-start gap-3 shadow-[4px_4px_0_rgba(0,0,0,0.5)] mt-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-rose-900 shrink-0"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <div>
            <p class="text-rose-900 font-heading font-black text-lg uppercase tracking-widest drop-shadow-[1px_1px_0_rgba(255,255,255,0.3)]">¡Salto de carga!</p>
            <p class="text-rose-100 text-sm mt-1 font-mono font-bold">
              Sugerido: {{ suggestion()!.suggestedWeight }}{{ unitSvc.currentWeightUnit() }} × {{ suggestion()!.suggestedReps }} reps
            </p>
          </div>
        </div>
      }

      <!-- Completed Sets Header -->
      @if (exerciseLog().sets && exerciseLog().sets!.length > 0) {
        <div class="grid grid-cols-[32px_1fr_64px_64px_36px_40px] gap-2 px-2 text-[10px] text-[var(--color-text-muted)] font-heading font-black uppercase tracking-widest text-center mt-2">
          <div>Set</div>
          <div class="text-left">Ant.</div>
          <div>{{ unitSvc.currentWeightUnit() }}</div>
          <div>Reps</div>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="mx-auto text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>×</div>
        </div>

        <!-- Completed Sets -->
        <div class="flex flex-col gap-2">
        @for (set of exerciseLog().sets; track set.setNumber; let i = $index; let isLast = $last) {
          <div
            class="grid grid-cols-[32px_1fr_64px_64px_36px_40px] gap-2 px-2 py-3 items-center text-[var(--color-text-primary)] bg-emerald-500/10 rounded-lg border-2 border-emerald-900 shadow-[2px_2px_0_rgba(16,185,129,0.3)] transition-all"
            [class.animate-pulse-success]="isLast && justAddedSet()"
          >
            <div class="text-center font-heading font-black text-emerald-400 text-lg drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">{{ set.setNumber }}</div>
            <div class="text-left text-[var(--color-text-muted)] text-xs font-mono font-bold leading-tight line-clamp-1 pr-1">
              {{ suggestion() ? (suggestion()!.referenceText | slice:10) : '—' }}
            </div>
            <div class="text-center font-mono font-bold bg-[#111827] py-2 rounded-md border-2 border-emerald-900 text-sm shadow-inner">{{ displayWeight(set.weight) }}</div>
            <div class="text-center font-mono font-bold bg-[#111827] py-2 rounded-md border-2 border-emerald-900 text-sm shadow-inner">{{ set.reps }}</div>
            <div class="flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#10b981" stroke="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
            <div class="flex justify-center">
              <button
                (click)="deleteSet(i); $event.stopPropagation()"
                class="w-8 h-8 rounded-md flex items-center justify-center text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/20 active:translate-y-[2px] active:translate-x-[2px] transition-all border-2 border-transparent hover:border-rose-900 hover:shadow-[1px_1px_0_rgba(244,63,94,0.5)]"
                aria-label="Eliminar serie"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
          </div>
        }
        </div>
      }

      <!-- Active Input Row -->
      <div class="flex flex-col gap-3 border-t-2 border-dashed border-[var(--color-border)] pt-4 mt-2">
        <!-- Reference line -->
        <div class="flex items-center gap-2 px-1">
          <span class="w-8 text-center text-[var(--color-accent)] font-heading font-black text-xl drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">{{ (exerciseLog().sets?.length || 0) + 1 }}</span>
          <span class="flex-1 text-[var(--color-text-muted)] text-xs font-heading font-bold uppercase tracking-widest leading-tight truncate">
            {{ suggestion() ? suggestion()!.referenceText.replace('Anterior: ', '') : 'Sin referencia previa' }}
          </span>
        </div>
        <!-- Stepper inputs -->
        <div class="flex items-center gap-2">
          <!-- Peso stepper -->
          <div class="flex flex-col gap-1 flex-1">
            <label class="text-[10px] font-heading font-black text-[var(--color-text-muted)] text-center uppercase tracking-widest">{{ unitSvc.currentWeightUnit() }}</label>
            <div class="flex items-center gap-1">
              <button
                (click)="decrementWeight()"
                class="w-10 h-14 rounded-md bg-[var(--color-bg-input)] border-2 border-[var(--color-border)] text-[var(--color-text-muted)] font-black text-xl flex items-center justify-center active:translate-y-[2px] active:translate-x-[2px] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-all shadow-[2px_2px_0_rgba(0,0,0,0.5)] hover:shadow-none"
                aria-label="Bajar peso"
              >−</button>
              <input
                type="text"
                inputmode="decimal"
                [(ngModel)]="weightInput"
                [placeholder]="suggestion() ? String(suggestion()!.suggestedWeight) : '—'"
                class="flex-1 h-14 w-12 sm:w-auto rounded-md bg-[#111827] border-2 border-[var(--color-border)] text-center font-mono text-xl font-black text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-all shadow-inner placeholder:text-[var(--color-text-muted)]"
              />
              <button
                (click)="incrementWeight()"
                class="w-10 h-14 rounded-md bg-[var(--color-bg-input)] border-2 border-[var(--color-border)] text-[var(--color-text-muted)] font-black text-xl flex items-center justify-center active:translate-y-[2px] active:translate-x-[2px] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-all shadow-[2px_2px_0_rgba(0,0,0,0.5)] hover:shadow-none"
                aria-label="Subir peso"
              >+</button>
            </div>
          </div>
          <!-- Reps stepper -->
          <div class="flex flex-col gap-1 flex-1">
            <label class="text-[10px] font-heading font-black text-[var(--color-text-muted)] text-center uppercase tracking-widest">Reps</label>
            <div class="flex items-center gap-1">
              <button
                (click)="decrementReps()"
                class="w-10 h-14 rounded-md bg-[var(--color-bg-input)] border-2 border-[var(--color-border)] text-[var(--color-text-muted)] font-black text-xl flex items-center justify-center active:translate-y-[2px] active:translate-x-[2px] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-all shadow-[2px_2px_0_rgba(0,0,0,0.5)] hover:shadow-none"
                aria-label="Bajar reps"
              >−</button>
              <input
                type="text"
                inputmode="numeric"
                [(ngModel)]="repsInput"
                [placeholder]="suggestion() ? String(suggestion()!.suggestedReps) : '—'"
                class="flex-1 h-14 w-12 sm:w-auto rounded-md bg-[#111827] border-2 border-[var(--color-border)] text-center font-mono text-xl font-black text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-all shadow-inner placeholder:text-[var(--color-text-muted)]"
              />
              <button
                (click)="incrementReps()"
                class="w-10 h-14 rounded-md bg-[var(--color-bg-input)] border-2 border-[var(--color-border)] text-[var(--color-text-muted)] font-black text-xl flex items-center justify-center active:translate-y-[2px] active:translate-x-[2px] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-all shadow-[2px_2px_0_rgba(0,0,0,0.5)] hover:shadow-none"
                aria-label="Subir reps"
              >+</button>
            </div>
          </div>
          <!-- Complete button -->
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-black text-transparent text-center uppercase tracking-wider select-none">✓</label>
            <button
              (click)="completeSet()"
              [disabled]="!isValidInput()"
              class="w-14 h-14 shrink-0 flex items-center justify-center rounded-md border-2 transition-all group disabled:opacity-40 disabled:active:translate-y-0 disabled:active:translate-x-0"
              [class]="isValidInput() ? 'bg-[var(--color-bg-card)] border-[var(--color-accent)] text-[var(--color-accent)] shadow-[4px_4px_0_rgba(249,115,22,0.5)] hover:bg-[var(--color-accent)] hover:text-[#111827] hover:shadow-none active:translate-y-[4px] active:translate-x-[4px] cursor-pointer' : 'bg-[var(--color-bg-input)] border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed'"
              aria-label="Completar serie"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="group-hover:scale-110 transition-transform"><polyline points="20 6 9 17 4 12"/></svg>
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
