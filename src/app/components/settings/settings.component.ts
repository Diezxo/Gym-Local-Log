import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DbService } from '../../services/db.service';
import { UserSettings, DEFAULT_SETTINGS } from '../../models/interfaces';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-[#0a0a0a] px-4 pt-6 pb-28">
      <!-- Header -->
      <h1 class="text-2xl font-bold text-[#f5f5f5] mb-6">Ajustes</h1>

      <!-- Saved confirmation -->
      @if (showSaved()) {
        <div class="mb-4 px-4 py-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm text-center">
          Guardado ✓
        </div>
      }

      <div class="flex flex-col gap-4">
        <!-- Weight unit -->
        <div class="bg-[#141414] rounded-2xl p-5 border border-[#1e1e1e]">
          <h3 class="text-[#f5f5f5] font-semibold mb-1">Unidad de Peso</h3>
          <p class="text-[#737373] text-xs mb-4">Selecciona kilogramos o libras.</p>
          <div class="flex gap-2">
            <button
              (click)="updateSetting('unidadPeso', 'kg')"
              class="flex-1 min-h-14 rounded-xl font-medium transition-colors"
              [class]="settings().unidadPeso === 'kg'
                ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/30'
                : 'bg-[#1e1e1e] text-[#737373] border border-[#2a2a2a]'"
            >
              kg
            </button>
            <button
              (click)="updateSetting('unidadPeso', 'lb')"
              class="flex-1 min-h-14 rounded-xl font-medium transition-colors"
              [class]="settings().unidadPeso === 'lb'
                ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/30'
                : 'bg-[#1e1e1e] text-[#737373] border border-[#2a2a2a]'"
            >
              lb
            </button>
          </div>
        </div>

        <!-- Distance unit -->
        <div class="bg-[#141414] rounded-2xl p-5 border border-[#1e1e1e]">
          <h3 class="text-[#f5f5f5] font-semibold mb-1">Unidad de Distancia</h3>
          <p class="text-[#737373] text-xs mb-4">Selecciona kilómetros o millas.</p>
          <div class="flex gap-2">
            <button
              (click)="updateSetting('unidadDistancia', 'km')"
              class="flex-1 min-h-14 rounded-xl font-medium transition-colors"
              [class]="settings().unidadDistancia === 'km'
                ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/30'
                : 'bg-[#1e1e1e] text-[#737373] border border-[#2a2a2a]'"
            >
              km
            </button>
            <button
              (click)="updateSetting('unidadDistancia', 'mi')"
              class="flex-1 min-h-14 rounded-xl font-medium transition-colors"
              [class]="settings().unidadDistancia === 'mi'
                ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/30'
                : 'bg-[#1e1e1e] text-[#737373] border border-[#2a2a2a]'"
            >
              mi
            </button>
          </div>
        </div>

        <!-- Weight increment -->
        <div class="bg-[#141414] rounded-2xl p-5 border border-[#1e1e1e]">
          <h3 class="text-[#f5f5f5] font-semibold mb-1">Incremento de Peso</h3>
          <p class="text-[#737373] text-xs mb-4">Incremento sugerido para progresión ({{ settings().unidadPeso }}).</p>
          <input
            type="text"
            inputmode="decimal"
            [ngModel]="settings().incrementoPeso"
            (ngModelChange)="updateSetting('incrementoPeso', $event)"
            class="w-full min-h-14 px-4 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a] text-[#f5f5f5] text-lg text-center focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        <!-- Rest timer -->
        <div class="bg-[#141414] rounded-2xl p-5 border border-[#1e1e1e]">
          <h3 class="text-[#f5f5f5] font-semibold mb-1">Tiempo de Descanso</h3>
          <p class="text-[#737373] text-xs mb-4">Duración del descanso entre series (segundos).</p>
          <input
            type="text"
            inputmode="numeric"
            [ngModel]="settings().tiempoDescanso"
            (ngModelChange)="updateSetting('tiempoDescanso', $event)"
            class="w-full min-h-14 px-4 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a] text-[#f5f5f5] text-lg text-center focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        <!-- Language -->
        <div class="bg-[#141414] rounded-2xl p-5 border border-[#1e1e1e]">
          <h3 class="text-[#f5f5f5] font-semibold mb-1">Idioma</h3>
          <p class="text-[#737373] text-xs mb-4">Próximamente más idiomas disponibles.</p>
          <div class="flex gap-2">
            <button
              (click)="updateSetting('idioma', 'es')"
              class="flex-1 min-h-14 rounded-xl font-medium transition-colors"
              [class]="settings().idioma === 'es'
                ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/30'
                : 'bg-[#1e1e1e] text-[#737373] border border-[#2a2a2a]'"
            >
              Español
            </button>
            <button
              (click)="updateSetting('idioma', 'en')"
              class="flex-1 min-h-14 rounded-xl font-medium transition-colors"
              [class]="settings().idioma === 'en'
                ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/30'
                : 'bg-[#1e1e1e] text-[#737373] border border-[#2a2a2a]'"
            >
              English
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class SettingsComponent implements OnInit {
  private db = inject(DbService);

  settings = signal<UserSettings>({ ...DEFAULT_SETTINGS });
  showSaved = signal(false);

  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit() {
    const loaded = await this.db.getSettings();
    this.settings.set(loaded);
  }

  async updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    this.settings.update(s => ({ ...s, [key]: value }));
    await this.db.saveSettings(this.settings());

    // Show confirmation
    this.showSaved.set(true);
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.showSaved.set(false), 1500);
  }
}
