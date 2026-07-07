import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DbService } from '../../services/db.service';
import { UserSettings, DEFAULT_SETTINGS } from '../../models/interfaces';

import { FileSystemService } from '../../services/file-system.service';

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
        <div class="bg-[#141414] rounded-3xl p-6 border border-[#1e1e1e] transition-all duration-300 hover:border-[#2a2a2a] shadow-sm">
          <h3 class="text-[#f5f5f5] text-lg font-semibold mb-1">Idioma</h3>
          <p class="text-[#737373] text-sm mb-6">Próximamente más idiomas disponibles.</p>
          <div class="flex gap-3">
            <button
              (click)="updateSetting('idioma', 'es')"
              class="flex-1 min-h-14 rounded-xl font-medium transition-all duration-300 active:scale-95"
              [class]="settings().idioma === 'es'
                ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                : 'bg-[#1e1e1e] text-[#737373] border border-[#2a2a2a] hover:bg-[#2a2a2a]'"
            >
              Español
            </button>
            <button
              (click)="updateSetting('idioma', 'en')"
              class="flex-1 min-h-14 rounded-xl font-medium transition-all duration-300 active:scale-95"
              [class]="settings().idioma === 'en'
                ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                : 'bg-[#1e1e1e] text-[#737373] border border-[#2a2a2a] hover:bg-[#2a2a2a]'"
            >
              English
            </button>
          </div>
        </div>

        <!-- Local Storage Sync (File System Access API) -->
        <div class="bg-[#141414] rounded-3xl p-6 border border-[#1e1e1e] transition-all duration-300 hover:border-[#2a2a2a] shadow-sm mb-8">
          <h3 class="text-[#f5f5f5] text-lg font-semibold mb-1">Carpeta de Sincronización</h3>
          <p class="text-[#737373] text-sm mb-6">
            Guarda tus rutinas y registros directamente en una carpeta de tu dispositivo para no perderlos nunca (sólo PC/Android).
          </p>
          
          @if (fsConnected()) {
            <div class="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              <span class="text-emerald-500 text-sm font-medium">Carpeta conectada</span>
            </div>
          } @else {
            <button
              (click)="conectarCarpeta()"
              class="w-full flex items-center justify-center gap-2 min-h-14 rounded-xl bg-cyan-400/10 text-cyan-400 font-medium border border-cyan-400/20 active:scale-[0.98] transition-all duration-300 hover:bg-cyan-400/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
              Conectar Carpeta
            </button>
            @if (fsError()) {
              <p class="text-rose-400 text-xs mt-3">{{ fsError() }}</p>
            }
          }
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
  private fs = inject(FileSystemService);

  settings = signal<UserSettings>({ ...DEFAULT_SETTINGS });
  showSaved = signal(false);
  
  fsConnected = this.fs.isConnected;
  fsError = signal('');

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

  async conectarCarpeta() {
    this.fsError.set('');
    try {
      const success = await this.fs.connectFolder();
      if (success) {
        // Enforce a sync from IndexedDB to the folder for existing data
        await this.db.syncToFileSystem();
      }
    } catch (e: any) {
      this.fsError.set(e.message || 'Error al conectar carpeta.');
    }
  }
}
