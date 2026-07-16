import { Component, input, output, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExerciseLog } from '../../models/interfaces';
import { UnitConversionService } from '../../services/unit-conversion.service';

@Component({
  selector: 'app-exercise-cardio',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rounded-xl bg-[var(--color-bg-card)] p-5 border-2 border-[var(--color-border)] flex flex-col gap-5 shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
      <!-- Header -->
      <div class="flex items-center justify-between h-8">
        <h3 class="text-2xl font-heading font-black text-[var(--color-text-primary)] tracking-widest uppercase drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">{{ exerciseLog().name }}</h3>
        @if (showSaved()) {
          <svg class="text-[var(--color-accent)] animate-fade-in drop-shadow-[1px_1px_0_rgba(0,0,0,1)]" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        }
      </div>

      <!-- Distance -->
      <div class="flex flex-col gap-2">
        <label class="text-xs text-[var(--color-text-muted)] font-heading font-black uppercase tracking-widest">
          Distancia ({{ unitSvc.currentDistanceUnit() }})
        </label>
        <input
          type="text"
          inputmode="decimal"
          [ngModel]="distanceInput"
          (ngModelChange)="distanceInput = $event; updateLog()"
          placeholder="0"
          class="w-full h-14 rounded-md bg-[#111827] border-2 border-[var(--color-border)] px-5 text-center text-2xl font-black font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors shadow-inner"
        />
      </div>

      <!-- Time -->
      <div class="flex flex-col gap-2">
        <label class="text-xs text-[var(--color-text-muted)] font-heading font-black uppercase tracking-widest">
          Tiempo (minutos)
        </label>
        <input
          type="text"
          inputmode="decimal"
          [ngModel]="timeInput"
          (ngModelChange)="timeInput = $event; updateLog()"
          placeholder="0"
          class="w-full h-14 rounded-md bg-[#111827] border-2 border-[var(--color-border)] px-5 text-center text-2xl font-black font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors shadow-inner"
        />
      </div>

      <!-- Technical notes -->
      <div class="flex flex-col gap-2">
        <label class="text-xs text-[var(--color-text-muted)] font-heading font-black uppercase tracking-widest">
          Notas técnicas
        </label>
        <textarea
          [ngModel]="notesInput"
          (ngModelChange)="notesInput = $event; updateLog()"
          placeholder="Opcional..."
          rows="3"
          class="w-full rounded-md bg-[#111827] border-2 border-[var(--color-border)] px-5 py-4 text-base font-medium text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none shadow-[inset_2px_2px_0_rgba(0,0,0,0.5)]"
        ></textarea>
      </div>

      <!-- Summary -->
      @if (distanceInput || timeInput) {
        <div class="rounded-md bg-[var(--color-bg-input)] px-5 py-4 flex items-center justify-between border-2 border-[var(--color-border)] shadow-[2px_2px_0_rgba(0,0,0,0.3)]">
          <span class="text-xs text-[var(--color-text-muted)] font-heading font-black uppercase tracking-widest">Resumen</span>
          <span class="text-lg font-mono font-black text-[var(--color-text-primary)] drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">
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
export class ExerciseCardioComponent implements OnInit {
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
