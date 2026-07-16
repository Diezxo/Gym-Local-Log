import { Component, input, output, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExerciseLog } from '../../models/interfaces';
import { UnitConversionService } from '../../services/unit-conversion.service';

@Component({
  selector: 'app-exercise-cardio',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rounded-2xl bg-[var(--color-bg-card)] p-4  border border-[var(--color-border)] flex flex-col gap-4">
      <!-- Header -->
      <div class="flex items-center justify-between h-8">
        <h3 class="text-xl font-black text-[var(--color-text-primary)] tracking-tight">{{ exerciseLog().name }}</h3>
        @if (showSaved()) {
          <svg class="text-emerald-400 animate-fade-in drop-" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        }
      </div>

      <!-- Distance -->
      <div class="flex flex-col gap-2">
        <label class="text-xs text-[var(--color-text-muted)]  font-bold">
          Distance ({{ unitSvc.currentDistanceUnit() }})
        </label>
        <input
          type="text"
          inputmode="decimal"
          [ngModel]="distanceInput"
          (ngModelChange)="distanceInput = $event; updateLog()"
          placeholder="0"
          class="w-full min-h-[48px] rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] px-5 text-center text-2xl font-black font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[#00f2fe] transition-colors "
        />
      </div>

      <!-- Time -->
      <div class="flex flex-col gap-2">
        <label class="text-xs text-[var(--color-text-muted)]  font-bold">
          Time (minutes)
        </label>
        <input
          type="text"
          inputmode="decimal"
          [ngModel]="timeInput"
          (ngModelChange)="timeInput = $event; updateLog()"
          placeholder="0"
          class="w-full min-h-[48px] rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] px-5 text-center text-2xl font-black font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[#00f2fe] transition-colors "
        />
      </div>

      <!-- Technical notes -->
      <div class="flex flex-col gap-2">
        <label class="text-xs text-[var(--color-text-muted)]  font-bold">
          Technical notes
        </label>
        <textarea
          [ngModel]="notesInput"
          (ngModelChange)="notesInput = $event; updateLog()"
          placeholder="Opcional..."
          rows="3"
          class="w-full rounded-2xl bg-[var(--color-bg-input)] border border-[var(--color-border)] px-5 py-4 text-base font-medium text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[#00f2fe] transition-colors resize-none "
        ></textarea>
      </div>

      <!-- Summary -->
      @if (distanceInput || timeInput) {
        <div class="rounded-xl bg-[var(--color-bg-input)] px-5 py-4 flex items-center justify-between border border-[var(--color-border)] shadow-sm">
          <span class="text-xs text-[var(--color-text-muted)]  font-bold">Summary</span>
          <span class="text-base font-black text-[var(--color-text-primary)]">
            @if (distanceInput) {
              {{ distanceInput }} {{ unitSvc.currentDistanceUnit() }}
            }
            @if (distanceInput && timeInput) {
              <span class="text-[#00f2fe] px-1">·</span>
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
