import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EjercicioLog, SerieFuerza, Sugerencia } from '../../models/interfaces';
import { ProgressionService, ExerciseHistoryRecord } from '../../services/progression.service';

@Component({
  selector: 'app-exercise-strength',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rounded-2xl bg-[#141414] p-4 space-y-4">
      <!-- Header -->
      <div 
        class="flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity"
        (click)="toggleHistory()"
      >
        <h3 class="text-lg font-bold text-[#f5f5f5]">{{ ejercicioLog().nombre }}</h3>
        <svg 
          xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="text-[#737373] transition-transform duration-300"
          [class.rotate-180]="showHistory()"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      <!-- In-Line History -->
      @if (showHistory()) {
        <div class="animate-fade-in bg-[#1e1e1e] rounded-xl p-3 border border-[#2a2a2a]">
          <h4 class="text-xs uppercase tracking-wider text-[#737373] mb-3">Últimas sesiones</h4>
          @if (history().length > 0) {
            <table class="w-full text-sm text-left">
              <thead>
                <tr class="text-[#737373] border-b border-[#2a2a2a]">
                  <th class="pb-2 font-medium">Fecha</th>
                  <th class="pb-2 font-medium">Mejor Serie</th>
                  <th class="pb-2 font-medium text-right">Volumen</th>
                </tr>
              </thead>
              <tbody>
                @for (record of history(); track record.fecha) {
                  <tr class="border-b border-[#2a2a2a]/50 last:border-0 text-[#f5f5f5]">
                    <td class="py-2">{{ record.fecha | slice:5:10 }}</td>
                    <td class="py-2 text-cyan-400">{{ record.peso }}{{ unidadPeso() }} × {{ record.reps }}</td>
                    <td class="py-2 text-right">{{ record.volumenTotal }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="text-[#737373] text-sm text-center py-2">No hay historial previo.</p>
          }
        </div>
      }

      <!-- Sugerencia referencia -->
      @if (sugerencia()) {
        <p class="text-sm text-[#737373]">{{ sugerencia()!.textoReferencia }}</p>
      }

      <!-- Alerta de salto de carga -->
      @if (sugerencia()?.esAlertaCarga) {
        <div class="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-rose-500 mt-0.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <div>
            <p class="text-rose-500 font-semibold text-sm">¡Salto de carga!</p>
            <p class="text-rose-400/80 text-xs mt-1">
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
export class ExerciseStrengthComponent implements OnInit {
  private progressionService = inject(ProgressionService);

  // ─── Inputs / Outputs ───
  ejercicioLog = input.required<EjercicioLog>();
  sugerencia = input<Sugerencia | null>(null);
  unidadPeso = input<string>('kg');

  serieCompletada = output<SerieFuerza>();
  logUpdated = output<EjercicioLog>();

  // ─── Local state ───
  pesoInput = '';
  repsInput = '';
  showHistory = signal(false);
  history = signal<ExerciseHistoryRecord[]>([]);

  async ngOnInit() {
    const records = await this.progressionService.getExerciseHistory(this.ejercicioLog().nombre);
    this.history.set(records);
  }

  toggleHistory() {
    this.showHistory.update(v => !v);
  }

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
    
    this.vibrarShort();
  }

  private vibrarShort() {
    try {
      navigator?.vibrate?.([20]);
    } catch {}
  }
}
