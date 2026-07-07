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
      <!-- We remove the standalone text and integrate it into the active row if needed, except for alert -->
      
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

      <!-- Sets Header -->
      <div class="grid grid-cols-[30px_1fr_60px_60px_40px] gap-2 px-2 mt-4 text-[10px] uppercase tracking-widest text-[#737373] font-bold text-center mb-2">
        <div>Set</div>
        <div class="text-left">Anterior</div>
        <div>{{ unidadPeso() }}</div>
        <div>Reps</div>
        <div><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="mx-auto"><polyline points="20 6 9 17 4 12"/></svg></div>
      </div>

      <!-- Completed Sets -->
      @if (ejercicioLog().series) {
        @for (serie of ejercicioLog().series; track serie.numero; let isLast = $last) {
          <div 
            class="grid grid-cols-[30px_1fr_60px_60px_40px] gap-2 px-2 py-2 items-center text-[#f5f5f5] bg-emerald-500/5 rounded-xl mb-2 border border-emerald-500/10 transition-all"
            [class.animate-pulse-success]="isLast && justAddedSet()"
          >
            <div class="text-center font-bold text-emerald-400">{{ serie.numero }}</div>
            <div class="text-left text-[#737373] text-xs truncate">
              <!-- Podríamos mostrar el historial real, por ahora simple '-' -->
              -
            </div>
            <div class="text-center font-mono font-medium bg-[#1e1e1e]/60 py-1.5 rounded-lg">{{ serie.peso }}</div>
            <div class="text-center font-mono font-medium bg-[#1e1e1e]/60 py-1.5 rounded-lg">{{ serie.reps }}</div>
            <div class="flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#10b981" stroke="none" class="drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
          </div>
        }
      }

      <!-- Active Input Set -->
      <div class="grid grid-cols-[30px_1fr_60px_60px_40px] gap-2 px-2 items-center mt-2 pb-2">
        <div class="text-center font-bold text-[#f5f5f5]">{{ (ejercicioLog().series?.length || 0) + 1 }}</div>
        
        <div class="text-left text-[#737373] text-xs leading-tight line-clamp-2 pr-1">
          {{ sugerencia() ? sugerencia()!.textoReferencia.replace('Anterior: ', '') : '-' }}
        </div>
        
        <input
          type="text"
          inputmode="decimal"
          [(ngModel)]="pesoInput"
          [placeholder]="sugerencia() ? sugerencia()!.pesoSugerido : '-'"
          class="w-full h-11 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a] text-center font-mono text-base font-semibold text-[#f5f5f5] focus:outline-none focus:border-cyan-400 focus:bg-[#141414] focus:ring-1 focus:ring-cyan-400/50 placeholder:text-[#404040] transition-all"
        />
        
        <input
          type="text"
          inputmode="numeric"
          [(ngModel)]="repsInput"
          [placeholder]="sugerencia() ? sugerencia()!.repsSugeridas : '-'"
          class="w-full h-11 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a] text-center font-mono text-base font-semibold text-[#f5f5f5] focus:outline-none focus:border-cyan-400 focus:bg-[#141414] focus:ring-1 focus:ring-cyan-400/50 placeholder:text-[#404040] transition-all"
        />
        
        <button
          (click)="terminarSerie()"
          [disabled]="!isValidInput()"
          class="h-11 w-full flex items-center justify-center rounded-xl bg-[#1e1e1e] border border-[#2a2a2a] transition-all group disabled:opacity-50 disabled:active:scale-100 active:scale-90"
          [class]="isValidInput() ? 'text-emerald-400 hover:bg-emerald-500 hover:border-emerald-400 hover:text-[#0a0a0a] hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'text-[#404040]'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="group-hover:scale-110 transition-transform"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
      </div>
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
  justAddedSet = signal(false);

  async ngOnInit() {
    const records = await this.progressionService.getExerciseHistory(this.ejercicioLog().nombre);
    this.history.set(records);
  }

  toggleHistory() {
    this.showHistory.update(v => !v);
  }

  isValidInput(): boolean {
    const peso = parseFloat(this.pesoInput) || this.sugerencia()?.pesoSugerido || 0;
    const reps = parseInt(this.repsInput, 10) || this.sugerencia()?.repsSugeridas || 0;
    return peso > 0 || reps > 0;
  }

  // ─── Actions ───
  terminarSerie(): void {
    if (!this.isValidInput()) return;

    const peso = parseFloat(this.pesoInput) || this.sugerencia()?.pesoSugerido || 0;
    const reps = parseInt(this.repsInput, 10) || this.sugerencia()?.repsSugeridas || 0;

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

    // Pulse animation
    this.justAddedSet.set(true);
    setTimeout(() => {
      this.justAddedSet.set(false);
    }, 1000);

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
