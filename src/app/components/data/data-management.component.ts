import { Component, OnInit, signal, inject } from '@angular/core';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'app-data-management',
  standalone: true,
  template: `
    <div class="min-h-screen bg-[#0a0a0a] px-6 pt-8 pb-32">
      <!-- Header -->
      <h1 class="text-3xl font-bold text-[#f5f5f5] mb-2 tracking-tight">Gestión de Datos</h1>
      <p class="text-[#737373] text-base mb-8">{{ currentMonthLabel() }}</p>

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
      <div class="flex flex-col gap-6 mb-10">
        <!-- Export JSON -->
        <div class="bg-[#141414] rounded-3xl p-6 border border-[#1e1e1e] transition-all duration-300 hover:border-[#2a2a2a] shadow-sm">
          <h3 class="text-[#f5f5f5] text-lg font-semibold mb-1">Exportar JSON</h3>
          <p class="text-[#737373] text-sm mb-6">Descarga el historial del mes actual en formato JSON.</p>
          <button
            (click)="exportJSON()"
            class="w-full min-h-14 flex items-center justify-center gap-2 rounded-xl bg-cyan-400/10 text-cyan-400 font-medium border border-cyan-400/20 active:scale-95 transition-all duration-300 hover:bg-cyan-400/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Exportar {{ currentMesId() }}.json
          </button>
        </div>

        <!-- Export CSV -->
        <div class="bg-[#141414] rounded-3xl p-6 border border-[#1e1e1e] transition-all duration-300 hover:border-[#2a2a2a] shadow-sm">
          <h3 class="text-[#f5f5f5] text-lg font-semibold mb-1">Exportar CSV</h3>
          <p class="text-[#737373] text-sm mb-6">Descarga el historial del mes actual como hoja de cálculo.</p>
          <button
            (click)="exportCSV()"
            class="w-full min-h-14 flex items-center justify-center gap-2 rounded-xl bg-green-500/10 text-green-400 font-medium border border-green-500/20 active:scale-95 transition-all duration-300 hover:bg-green-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
            Exportar {{ currentMesId() }}.csv
          </button>
        </div>

        <!-- Import -->
        <div class="bg-[#141414] rounded-3xl p-6 border border-[#1e1e1e] transition-all duration-300 hover:border-[#2a2a2a] shadow-sm">
          <h3 class="text-[#f5f5f5] text-lg font-semibold mb-1">Importar Historial</h3>
          <p class="text-[#737373] text-sm mb-6">Carga un archivo JSON exportado previamente.</p>
          <button
            (click)="fileInput.click()"
            class="w-full min-h-14 flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#2a2a2a] text-[#737373] font-medium active:scale-95 transition-all duration-300 hover:border-cyan-400 hover:text-cyan-400 hover:bg-cyan-400/5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4-4 4 4"/></svg>
            Seleccionar archivo .json
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
        <h2 class="text-xl font-bold text-[#f5f5f5] mb-6">Meses con datos</h2>
        <div class="flex flex-col gap-4">
          @for (mesId of availableMonths(); track mesId) {
            <div class="bg-[#141414] rounded-3xl p-5 border border-[#1e1e1e] flex items-center justify-between gap-4 transition-all duration-300 hover:border-[#2a2a2a]">
              <span class="text-[#f5f5f5] font-medium text-lg">{{ formatMonth(mesId) }}</span>
              <div class="flex gap-2 shrink-0">
                <button
                  (click)="exportMonthJSON(mesId)"
                  class="min-h-12 px-5 rounded-xl bg-cyan-400/10 text-cyan-400 text-sm font-semibold active:scale-95 transition-all duration-300 hover:bg-cyan-400/20"
                >
                  JSON
                </button>
                <button
                  (click)="exportMonthCSV(mesId)"
                  class="min-h-12 px-5 rounded-xl bg-green-500/10 text-green-400 text-sm font-semibold active:scale-95 transition-all duration-300 hover:bg-green-500/20"
                >
                  CSV
                </button>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="text-center mt-12 animate-fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="text-[#2a2a2a] mx-auto mb-6"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
          <p class="text-[#737373] text-base">Aún no hay datos registrados.</p>
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
      this.showFeedback(`Exportado ${mesId}.${format} correctamente.`, false);
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
      this.showFeedback(`Importado correctamente: ${mesId}`, false);
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
