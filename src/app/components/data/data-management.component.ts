import { Component, OnInit, signal, inject } from '@angular/core';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'app-data-management',
  standalone: true,
  template: `
    <div class="min-h-screen bg-[#0a0a0a] px-4 pt-6 pb-28">
      <!-- Header -->
      <h1 class="text-2xl font-bold text-[#f5f5f5] mb-2">Gestión de Datos</h1>
      <p class="text-[#737373] text-sm mb-6">{{ currentMonthLabel() }}</p>

      <!-- Feedback message -->
      @if (feedbackMessage()) {
        <div
          class="mb-4 px-4 py-3 rounded-xl text-sm"
          [class]="feedbackIsError()
            ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
            : 'bg-green-500/15 border border-green-500/30 text-green-400'"
        >
          {{ feedbackMessage() }}
        </div>
      }

      <!-- Action cards -->
      <div class="flex flex-col gap-4 mb-8">
        <!-- Export JSON -->
        <div class="bg-[#141414] rounded-2xl p-5 border border-[#1e1e1e]">
          <h3 class="text-[#f5f5f5] font-semibold mb-1">Exportar JSON</h3>
          <p class="text-[#737373] text-xs mb-4">Descarga el historial del mes actual en formato JSON.</p>
          <button
            (click)="exportJSON()"
            class="w-full min-h-14 rounded-xl bg-cyan-400/15 text-cyan-400 font-medium border border-cyan-400/30 active:bg-cyan-400/25 transition-colors"
          >
            📥 Exportar {{ currentMesId() }}.json
          </button>
        </div>

        <!-- Export CSV -->
        <div class="bg-[#141414] rounded-2xl p-5 border border-[#1e1e1e]">
          <h3 class="text-[#f5f5f5] font-semibold mb-1">Exportar CSV</h3>
          <p class="text-[#737373] text-xs mb-4">Descarga el historial del mes actual como hoja de cálculo.</p>
          <button
            (click)="exportCSV()"
            class="w-full min-h-14 rounded-xl bg-green-500/15 text-green-400 font-medium border border-green-500/30 active:bg-green-500/25 transition-colors"
          >
            📊 Exportar {{ currentMesId() }}.csv
          </button>
        </div>

        <!-- Import -->
        <div class="bg-[#141414] rounded-2xl p-5 border border-[#1e1e1e]">
          <h3 class="text-[#f5f5f5] font-semibold mb-1">Importar Historial</h3>
          <p class="text-[#737373] text-xs mb-4">Carga un archivo JSON exportado previamente.</p>
          <button
            (click)="fileInput.click()"
            class="w-full min-h-14 rounded-xl bg-amber-500/15 text-amber-400 font-medium border border-amber-500/30 active:bg-amber-500/25 transition-colors"
          >
            📂 Seleccionar archivo .json
          </button>
          <input
            #fileInput
            type="file"
            accept=".json"
            (change)="onFileSelected($event)"
            class="hidden"
          />
        </div>
      </div>

      <!-- Available months -->
      @if (availableMonths().length > 0) {
        <h2 class="text-lg font-semibold text-[#f5f5f5] mb-4">Meses con datos</h2>
        <div class="flex flex-col gap-3">
          @for (mesId of availableMonths(); track mesId) {
            <div class="bg-[#141414] rounded-2xl p-4 border border-[#1e1e1e] flex items-center justify-between gap-3">
              <span class="text-[#f5f5f5] font-medium">{{ formatMonth(mesId) }}</span>
              <div class="flex gap-2 shrink-0">
                <button
                  (click)="exportMonthJSON(mesId)"
                  class="min-h-14 px-4 rounded-xl bg-cyan-400/10 text-cyan-400 text-sm font-medium active:bg-cyan-400/20 transition-colors"
                >
                  JSON
                </button>
                <button
                  (click)="exportMonthCSV(mesId)"
                  class="min-h-14 px-4 rounded-xl bg-green-500/10 text-green-400 text-sm font-medium active:bg-green-500/20 transition-colors"
                >
                  CSV
                </button>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="text-center mt-8">
          <span class="text-3xl mb-2 block">📭</span>
          <p class="text-[#737373] text-sm">Aún no hay datos registrados.</p>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class DataManagementComponent implements OnInit {
  private exportService = inject(ExportService);

  currentMesId = signal('');
  currentMonthLabel = signal('');
  availableMonths = signal<string[]>([]);
  feedbackMessage = signal('');
  feedbackIsError = signal(false);

  private monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  ngOnInit() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    this.currentMesId.set(`${year}-${month}`);
    this.currentMonthLabel.set(`${this.monthNames[now.getMonth()]} ${year}`);
    this.loadAvailableMonths();
  }

  async loadAvailableMonths() {
    const months = await this.exportService.getAvailableMonths();
    this.availableMonths.set(months);
  }

  formatMonth(mesId: string): string {
    const [year, month] = mesId.split('-');
    const monthIdx = parseInt(month, 10) - 1;
    return `${this.monthNames[monthIdx]} ${year}`;
  }

  async exportJSON() {
    await this.exportMonth(this.currentMesId(), 'json');
  }

  async exportCSV() {
    await this.exportMonth(this.currentMesId(), 'csv');
  }

  async exportMonthJSON(mesId: string) {
    await this.exportMonth(mesId, 'json');
  }

  async exportMonthCSV(mesId: string) {
    await this.exportMonth(mesId, 'csv');
  }

  private async exportMonth(mesId: string, format: 'json' | 'csv') {
    try {
      if (format === 'json') {
        await this.exportService.exportJSON(mesId);
      } else {
        await this.exportService.exportCSV(mesId);
      }
      this.showFeedback(`✅ Exportado ${mesId}.${format} correctamente.`, false);
    } catch (err: any) {
      this.showFeedback(err.message || 'Error al exportar.', true);
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const mesId = await this.exportService.importJSON(file);
      this.showFeedback(`✅ Importado correctamente: ${mesId}`, false);
      await this.loadAvailableMonths();
    } catch (err: any) {
      this.showFeedback(err.message || 'Error al importar.', true);
    }

    // Reset file input so the same file can be re-selected
    input.value = '';
  }

  private showFeedback(message: string, isError: boolean) {
    this.feedbackMessage.set(message);
    this.feedbackIsError.set(isError);
    setTimeout(() => {
      this.feedbackMessage.set('');
    }, 4000);
  }
}
