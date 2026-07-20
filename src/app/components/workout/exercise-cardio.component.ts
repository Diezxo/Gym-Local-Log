import { Component, input, output, signal, inject, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExerciseLog } from '../../models/interfaces';
import { UnitConversionService } from '../../services/unit-conversion.service';

@Component({
  selector: 'app-exercise-cardio',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rounded-3xl bg-[var(--color-bg-card)] p-5 border border-white/5 flex flex-col gap-5 shadow-sm">
      <!-- Header -->
      <div class="sticky top-0 z-10 -mx-5 -mt-5 p-5 flex items-center justify-between h-auto bg-[var(--color-bg-card)]/95 backdrop-blur-md rounded-t-3xl border-b border-white/5">
        <h3 class="text-lg font-bold text-white tracking-tight uppercase">{{ exerciseLog().name }}</h3>
        @if (showSaved()) {
          <svg class="text-[var(--color-accent-success)] animate-fade-in" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        }
      </div>

      <!-- Distance -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[11px] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
          Distancia ({{ unitSvc.currentDistanceUnit() }})
        </label>
        <input
          type="text"
          inputmode="decimal"
          [ngModel]="distanceInput"
          (ngModelChange)="distanceInput = $event; updateLog()"
          placeholder="0"
          class="w-full h-12 rounded-xl bg-[var(--color-bg-primary)] border border-white/5 px-4 text-center text-xl font-semibold font-mono text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all shadow-inner placeholder:text-white/20"
        />
      </div>

      <!-- Time -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[11px] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
          Tiempo (minutos)
        </label>
        <input
          type="text"
          inputmode="decimal"
          [ngModel]="timeInput"
          (ngModelChange)="timeInput = $event; updateLog()"
          placeholder="0"
          class="w-full h-12 rounded-xl bg-[var(--color-bg-primary)] border border-white/5 px-4 text-center text-xl font-semibold font-mono text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all shadow-inner placeholder:text-white/20"
        />
      </div>

      <!-- Technical notes -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[11px] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
          Notas técnicas
        </label>
        <textarea
          [ngModel]="notesInput"
          (ngModelChange)="notesInput = $event; updateLog()"
          placeholder="Opcional..."
          rows="2"
          class="w-full rounded-xl bg-[var(--color-bg-primary)] border border-white/5 px-4 py-3 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all resize-none shadow-inner"
        ></textarea>
      </div>

      <!-- Summary -->
      @if (distanceInput || timeInput) {
        <div class="rounded-xl bg-gradient-to-r from-[var(--color-bg-input)] to-transparent px-4 py-3 flex items-center justify-between border border-white/5 shadow-inner">
          <span class="text-[11px] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">Resumen</span>
          <span class="text-base font-mono font-semibold text-white">
            @if (distanceInput) {
              {{ distanceInput }} {{ unitSvc.currentDistanceUnit() }}
            }
            @if (distanceInput && timeInput) {
              <span class="text-[var(--color-accent)] px-2">·</span>
            }
            @if (timeInput) {
              {{ timeInput }} min
            }
          </span>
        </div>
      }
    </div>
  `,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExerciseCardioComponent implements OnInit, OnDestroy {
  unitSvc = inject(UnitConversionService);

  // ─── Inputs / Outputs ───
  exerciseLog = input.required<ExerciseLog>();
  logUpdated = output<ExerciseLog>();

  // ─── Local state ───
  distanceInput: string = '';
  timeInput: string = '';
  notesInput: string = '';
  
  showSaved = signal(false);
  private saveTimeout: any;

  ngOnInit() {
    // Pre-fill inputs if the log already has cardio data
    const cardio = this.exerciseLog().cardio;
    if (cardio) {
      if (cardio.distanceMeters > 0) {
        this.distanceInput = String(this.unitSvc.metersToUser(cardio.distanceMeters));
      }
      if (cardio.timeMinutes > 0) {
        this.timeInput = String(cardio.timeMinutes);
      }
      if (cardio.technicalNotes) {
        this.notesInput = cardio.technicalNotes;
      }
    }
  }

  ngOnDestroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }

  // ─── Actions ───
  updateLog(): void {
    const log = this.exerciseLog();
    const userDistance = parseFloat(this.distanceInput) || 0;
    
    log.cardio = {
      distanceMeters: this.unitSvc.userToMeters(userDistance),
      timeMinutes: parseFloat(this.timeInput) || 0,
      technicalNotes: this.notesInput || undefined,
    };
    
    this.logUpdated.emit(log);
    
    this.showSaved.set(true);
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.showSaved.set(false), 1500);
  }
}
