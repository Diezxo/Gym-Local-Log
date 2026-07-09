import { Component, input, output, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EjercicioLog, SerieFuerza, Sugerencia } from '../../models/interfaces';
import { ProgressionService, ExerciseHistoryRecord } from '../../services/progression.service';

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
        <h3 class="text-xl font-black text-[var(--color-text-primary)] tracking-tight">{{ ejercicioLog().nombre }}</h3>
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
          <h4 class="text-xs  text-[var(--color-text-muted)] font-bold mb-3">Últimas sesiones</h4>
          @if (history().length > 0) {
            <table class="w-full text-sm text-left">
              <thead>
                <tr class="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th class="pb-2 font-bold  text-[10px]">Fecha</th>
                  <th class="pb-2 font-bold  text-[10px]">Mejor Serie</th>
                  <th class="pb-2 font-bold  text-[10px] text-right">Volumen</th>
                </tr>
              </thead>
              <tbody>
                @for (record of history(); track record.fecha) {
                  <tr class="border-b border-[var(--color-border)]/50 last:border-0 text-[var(--color-text-primary)]">
                    <td class="py-2.5 font-medium">{{ record.fecha | slice:5:10 }}</td>
                    <td class="py-2.5 text-[#00f2fe] font-bold">{{ record.peso }}{{ unidadPeso() }} × {{ record.reps }}</td>
                    <td class="py-2.5 text-right text-[var(--color-text-muted)] font-mono text-xs">{{ record.volumenTotal }}{{ unidadPeso() }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="text-[var(--color-text-muted)] text-sm font-medium text-center py-2">No hay historial previo.</p>
          }
        </div>
      }

      <!-- Sugerencia referencia -->
      <!-- We remove the standalone text and integrate it into the active row if needed, except for alert -->
      
      <!-- Alerta de salto de carga -->
      @if (sugerencia()?.esAlertaCarga) {
        <div class="rounded-xl bg-rose-500/15 border border-rose-500/30 p-4 flex items-start gap-3 ">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-rose-500 shrink-0"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <div>
            <p class="text-rose-400 font-black text-sm">¡Salto de carga!</p>
            <p class="text-rose-300 text-xs mt-1 font-medium">
              Sugerido: {{ sugerencia()!.pesoSugerido }}{{ unidadPeso() }} × {{ sugerencia()!.repsSugeridas }} reps
            </p>
          </div>
        </div>
      }

      <!-- Sets Header -->
      <div class="grid grid-cols-[30px_1fr_64px_64px_50px] gap-2 px-2 mt-4 text-[10px]  text-[var(--color-text-muted)] font-black text-center mb-1">
        <div>Set</div>
        <div class="text-left">Anterior</div>
        <div>{{ unidadPeso() }}</div>
        <div>Reps</div>
        <div><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="mx-auto"><polyline points="20 6 9 17 4 12"/></svg></div>
      </div>

      <!-- Completed Sets -->
      @if (ejercicioLog().series) {
        @for (serie of ejercicioLog().series; track serie.numero; let isLast = $last) {
          <div 
            class="grid grid-cols-[30px_1fr_64px_64px_50px] gap-2 px-2 py-2.5 items-center text-[var(--color-text-primary)] bg-emerald-500/10 rounded-[16px] mb-2 border border-emerald-500/20 transition-all "
            [class.animate-pulse-success]="isLast && justAddedSet()"
          >
            <div class="text-center font-black text-emerald-400">{{ serie.numero }}</div>
            <div class="text-left text-[var(--color-text-muted)] text-xs leading-tight line-clamp-1 pr-1 font-medium">
              {{ sugerencia() ? (sugerencia()!.textoReferencia | slice:10) : '—' }}
            </div>
            <div class="text-center font-mono font-bold bg-[var(--color-bg-input)]/80 py-2 rounded-xl border border-[var(--color-border)]">{{ serie.peso }}</div>
            <div class="text-center font-mono font-bold bg-[var(--color-bg-input)]/80 py-2 rounded-xl border border-[var(--color-border)]">{{ serie.reps }}</div>
            <div class="flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#10b981" stroke="none" class="drop-"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
          </div>
        }
      }

      <!-- Active Input Set -->
      <div class="grid grid-cols-[30px_1fr_64px_64px_50px] gap-2 px-2 items-center mt-3 pb-2">
        <div class="text-center font-black text-[var(--color-text-primary)]">{{ (ejercicioLog().series?.length || 0) + 1 }}</div>
        
        <div class="text-left text-[var(--color-text-muted)] text-[11px] leading-tight line-clamp-2 pr-1 font-bold">
          {{ sugerencia() ? sugerencia()!.textoReferencia.replace('Anterior: ', '') : '-' }}
        </div>
        
        <input
          type="text"
          inputmode="decimal"
          [(ngModel)]="pesoInput"
          [placeholder]="sugerencia() ? sugerencia()!.pesoSugerido : '-'"
          class="w-full h-14 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-center font-mono text-lg font-black text-[var(--color-text-primary)] focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/50 placeholder:text-[var(--color-text-muted)] transition-all "
        />
        
        <input
          type="text"
          inputmode="numeric"
          [(ngModel)]="repsInput"
          [placeholder]="sugerencia() ? sugerencia()!.repsSugeridas : '-'"
          class="w-full h-14 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-center font-mono text-lg font-black text-[var(--color-text-primary)] focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/50 placeholder:text-[var(--color-text-muted)] transition-all "
        />
        
        <button
          (click)="terminarSerie()"
          [disabled]="!isValidInput()"
          class="h-14 w-full flex items-center justify-center rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] transition-all group disabled:opacity-50 disabled:active:scale-100 active:scale-90"
          [class]="isValidInput() ? 'text-[#00f2fe] hover:bg-[#00f2fe]/10 hover:border-[#00f2fe] hover: cursor-pointer' : 'text-[var(--color-text-muted)] cursor-not-allowed'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="group-hover:scale-110 transition-transform drop-"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [``], changeDetection: ChangeDetectionStrategy.OnPush
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
