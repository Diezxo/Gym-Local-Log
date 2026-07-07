import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EjercicioLog, SerieFuerza, Sugerencia } from '../../models/interfaces';

@Component({
  selector: 'app-exercise-strength',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rounded-2xl bg-[#141414] p-4 space-y-4">
      <!-- Header -->
      <h3 class="text-lg font-bold text-[#f5f5f5]">{{ ejercicioLog().nombre }}</h3>

      <!-- Sugerencia referencia -->
      @if (sugerencia()) {
        <p class="text-sm text-[#737373]">{{ sugerencia()!.textoReferencia }}</p>
      }

      <!-- Alerta de salto de carga -->
      @if (sugerencia()?.esAlertaCarga) {
        <div class="rounded-xl bg-rose-500/15 border border-rose-500/40 p-3 flex items-start gap-2">
          <span class="text-rose-500 text-lg">⚡</span>
          <div>
            <p class="text-rose-500 font-semibold text-sm">¡Salto de carga!</p>
            <p class="text-rose-400 text-xs">
              Sugerido: {{ sugerencia()!.pesoSugerido }}{{ unidadPeso() }} × {{ sugerencia()!.repsSugeridas }} reps
            </p>
          </div>
        </div>
      }

      <!-- Inputs -->
      <div class="flex gap-3">
        <div class="flex-1 space-y-1">
          <label class="text-xs text-[#737373] uppercase tracking-wide">Peso ({{ unidadPeso() }})</label>
          <input
            type="text"
            inputmode="decimal"
            [(ngModel)]="pesoInput"
            [placeholder]="sugerencia() ? '' + sugerencia()!.pesoSugerido : '0'"
            class="w-full min-h-14 rounded-xl bg-[#1e1e1e] border border-[#737373]/30 px-4 text-center text-xl font-mono text-[#f5f5f5] focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>
        <div class="flex-1 space-y-1">
          <label class="text-xs text-[#737373] uppercase tracking-wide">Reps</label>
          <input
            type="text"
            inputmode="numeric"
            [(ngModel)]="repsInput"
            [placeholder]="sugerencia() ? '' + sugerencia()!.repsSugeridas : '0'"
            class="w-full min-h-14 rounded-xl bg-[#1e1e1e] border border-[#737373]/30 px-4 text-center text-xl font-mono text-[#f5f5f5] focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>
      </div>

      <!-- Botón Terminar Serie -->
      <button
        (click)="terminarSerie()"
        class="w-full min-h-14 rounded-xl bg-cyan-400 text-[#0a0a0a] font-bold text-base active:scale-[0.97] transition-transform"
      >
        Terminar Serie
      </button>

      <!-- Series completadas -->
      @if (ejercicioLog().series && ejercicioLog().series!.length > 0) {
        <div class="space-y-2">
          <span class="text-xs text-[#737373] uppercase tracking-wide">Series completadas</span>
          @for (serie of ejercicioLog().series!; track serie.numero) {
            <div class="flex items-center justify-between rounded-xl bg-[#1e1e1e] px-4 py-3">
              <span class="text-sm text-[#737373]">Serie {{ serie.numero }}</span>
              <span class="text-sm font-semibold text-[#f5f5f5]">
                {{ serie.peso }}{{ unidadPeso() }} × {{ serie.reps }} reps
              </span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [``],
})
export class ExerciseStrengthComponent {
  // ─── Inputs / Outputs ───
  ejercicioLog = input.required<EjercicioLog>();
  sugerencia = input<Sugerencia | null>(null);
  unidadPeso = input<string>('kg');

  serieCompletada = output<SerieFuerza>();
  logUpdated = output<EjercicioLog>();

  // ─── Local state ───
  pesoInput = '';
  repsInput = '';

  // ─── Actions ───
  terminarSerie(): void {
    const peso = parseFloat(this.pesoInput) || this.sugerencia()?.pesoSugerido || 0;
    const reps = parseInt(this.repsInput, 10) || this.sugerencia()?.repsSugeridas || 0;

    if (peso <= 0 && reps <= 0) return;

    const log = this.ejercicioLog();
    if (!log.series) {
      log.series = [];
    }

    const nuevaSerie: SerieFuerza = {
      numero: log.series.length + 1,
      peso,
      reps,
    };

    log.series.push(nuevaSerie);

    // Clear inputs
    this.pesoInput = '';
    this.repsInput = '';

    // Emit events
    this.serieCompletada.emit(nuevaSerie);
    this.logUpdated.emit(log);
  }
}
