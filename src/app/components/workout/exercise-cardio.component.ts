import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EjercicioLog } from '../../models/interfaces';

@Component({
  selector: 'app-exercise-cardio',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rounded-2xl bg-[var(--color-bg-card)] p-4  border border-[var(--color-border)] flex flex-col gap-4">
      <!-- Header -->
      <div class="flex items-center justify-between h-8">
        <h3 class="text-xl font-black text-[var(--color-text-primary)] tracking-tight">{{ ejercicioLog().nombre }}</h3>
        @if (showSaved()) {
          <svg class="text-emerald-400 animate-fade-in drop-" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        }
      </div>

      <!-- Distancia -->
      <div class="flex flex-col gap-2">
        <label class="text-xs text-[var(--color-text-muted)]  font-bold">
          Distancia ({{ unidadDistancia() }})
        </label>
        <input
          type="text"
          inputmode="decimal"
          [ngModel]="distancia"
          (ngModelChange)="distancia = $event; actualizarLog()"
          placeholder="0"
          class="w-full min-h-[48px] rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] px-5 text-center text-2xl font-black font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[#00f2fe] transition-colors "
        />
      </div>

      <!-- Tiempo -->
      <div class="flex flex-col gap-2">
        <label class="text-xs text-[var(--color-text-muted)]  font-bold">
          Tiempo (minutos)
        </label>
        <input
          type="text"
          inputmode="decimal"
          [ngModel]="tiempo"
          (ngModelChange)="tiempo = $event; actualizarLog()"
          placeholder="0"
          class="w-full min-h-[48px] rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] px-5 text-center text-2xl font-black font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[#00f2fe] transition-colors "
        />
      </div>

      <!-- Notas de técnica -->
      <div class="flex flex-col gap-2">
        <label class="text-xs text-[var(--color-text-muted)]  font-bold">
          Notas de técnica
        </label>
        <textarea
          [ngModel]="notas"
          (ngModelChange)="notas = $event; actualizarLog()"
          placeholder="Opcional..."
          rows="3"
          class="w-full rounded-2xl bg-[var(--color-bg-input)] border border-[var(--color-border)] px-5 py-4 text-base font-medium text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[#00f2fe] transition-colors resize-none "
        ></textarea>
      </div>

      <!-- Resumen -->
      @if (distancia || tiempo) {
        <div class="rounded-xl bg-[var(--color-bg-input)] px-5 py-4 flex items-center justify-between border border-[var(--color-border)] shadow-sm">
          <span class="text-xs text-[var(--color-text-muted)]  font-bold">Resumen</span>
          <span class="text-base font-black text-[var(--color-text-primary)]">
            @if (distancia) {
              {{ distancia }} {{ unidadDistancia() }}
            }
            @if (distancia && tiempo) {
              <span class="text-[#00f2fe] px-1">·</span>
            }
            @if (tiempo) {
              {{ tiempo }} min
            }
          </span>
        </div>
      }
    </div>
  `,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExerciseCardioComponent {
  // ─── Inputs / Outputs ───
  ejercicioLog = input.required<EjercicioLog>();
  unidadDistancia = input<string>('km');

  logUpdated = output<EjercicioLog>();

  // ─── Local state ───
  distancia: string = '';
  tiempo: string = '';
  notas: string = '';
  
  showSaved = signal(false);
  private saveTimeout: any;

  // ─── Actions ───
  actualizarLog(): void {
    const log = this.ejercicioLog();
    log.cardio = {
      distanciaKm: parseFloat(this.distancia) || 0,
      tiempoMinutos: parseFloat(this.tiempo) || 0,
      notasTecnica: this.notas || undefined,
    };
    this.logUpdated.emit(log);
    
    this.showSaved.set(true);
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.showSaved.set(false), 1500);
  }
}
