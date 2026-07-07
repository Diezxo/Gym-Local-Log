import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EjercicioLog } from '../../models/interfaces';

@Component({
  selector: 'app-exercise-cardio',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rounded-2xl bg-[#141414] p-4 space-y-4">
      <!-- Header -->
      <h3 class="text-lg font-bold text-[#f5f5f5]">{{ ejercicioLog().nombre }}</h3>

      <!-- Distancia -->
      <div class="space-y-1">
        <label class="text-xs text-[#737373] uppercase tracking-wide">
          Distancia ({{ unidadDistancia() }})
        </label>
        <input
          type="text"
          inputmode="decimal"
          [ngModel]="distancia"
          (ngModelChange)="distancia = $event; actualizarLog()"
          placeholder="0"
          class="w-full min-h-14 rounded-xl bg-[#1e1e1e] border border-[#737373]/30 px-4 text-center text-xl font-mono text-[#f5f5f5] focus:outline-none focus:border-cyan-400 transition-colors"
        />
      </div>

      <!-- Tiempo -->
      <div class="space-y-1">
        <label class="text-xs text-[#737373] uppercase tracking-wide">
          Tiempo (minutos)
        </label>
        <input
          type="text"
          inputmode="decimal"
          [ngModel]="tiempo"
          (ngModelChange)="tiempo = $event; actualizarLog()"
          placeholder="0"
          class="w-full min-h-14 rounded-xl bg-[#1e1e1e] border border-[#737373]/30 px-4 text-center text-xl font-mono text-[#f5f5f5] focus:outline-none focus:border-cyan-400 transition-colors"
        />
      </div>

      <!-- Notas de técnica -->
      <div class="space-y-1">
        <label class="text-xs text-[#737373] uppercase tracking-wide">
          Notas de técnica
        </label>
        <textarea
          [ngModel]="notas"
          (ngModelChange)="notas = $event; actualizarLog()"
          placeholder="Opcional..."
          rows="3"
          class="w-full rounded-xl bg-[#1e1e1e] border border-[#737373]/30 px-4 py-3 text-sm text-[#f5f5f5] placeholder-[#737373] focus:outline-none focus:border-cyan-400 transition-colors resize-none"
        ></textarea>
      </div>

      <!-- Resumen -->
      @if (distancia || tiempo) {
        <div class="rounded-xl bg-[#1e1e1e] px-4 py-3 flex items-center justify-between">
          <span class="text-xs text-[#737373] uppercase tracking-wide">Resumen</span>
          <span class="text-sm font-semibold text-[#f5f5f5]">
            @if (distancia) {
              {{ distancia }} {{ unidadDistancia() }}
            }
            @if (distancia && tiempo) {
              <span class="text-[#737373]"> · </span>
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

  // ─── Actions ───
  actualizarLog(): void {
    const log = this.ejercicioLog();
    log.cardio = {
      distanciaKm: parseFloat(this.distancia) || 0,
      tiempoMinutos: parseFloat(this.tiempo) || 0,
      notasTecnica: this.notas || undefined,
    };
    this.logUpdated.emit(log);
  }
}
