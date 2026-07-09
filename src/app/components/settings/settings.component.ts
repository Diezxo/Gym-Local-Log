import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DbService } from '../../services/db.service';
import { UserSettings, DEFAULT_SETTINGS } from '../../models/interfaces';

import { FileSystemService } from '../../services/file-system.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-[var(--color-bg-primary)] px-6 pt-12 pb-36 flex flex-col gap-6">
      <!-- Header -->
      <div>
        <h1 class="text-[40px] leading-tight font-black text-[var(--color-text-primary)] tracking-tight">Ajustes</h1>
      </div>

      <!-- Saved confirmation -->
      @if (showSaved()) {
        <div class="px-5 py-3 rounded-[20px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm text-center font-bold animate-fade-in shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          ¡Guardado correctamente!
        </div>
      }

      <div class="flex flex-col gap-5">
        <!-- Weight unit -->
        <div class="bg-[var(--color-bg-card)] rounded-[32px] p-6 border border-[var(--color-border)] shadow-lg">
          <h3 class="text-[var(--color-text-primary)] font-black text-lg mb-1">Unidad de Peso</h3>
          <p class="text-[var(--color-text-muted)] text-sm mb-5 font-medium">Selecciona kilogramos o libras.</p>
          <div class="flex gap-3">
            <button
              (click)="updateSetting('unidadPeso', 'kg')"
              class="flex-1 min-h-[64px] rounded-[20px] font-bold transition-all text-base"
              [class]="settings().unidadPeso === 'kg'
                ? 'bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/30 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                : 'bg-[var(--color-bg-input)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]'"
            >
              Kilogramos (kg)
            </button>
            <button
              (click)="updateSetting('unidadPeso', 'lb')"
              class="flex-1 min-h-[64px] rounded-[20px] font-bold transition-all text-base"
              [class]="settings().unidadPeso === 'lb'
                ? 'bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/30 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                : 'bg-[var(--color-bg-input)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]'"
            >
              Libras (lb)
            </button>
          </div>
        </div>

        <!-- Distance unit -->
        <div class="bg-[var(--color-bg-card)] rounded-[32px] p-6 border border-[var(--color-border)] shadow-lg">
          <h3 class="text-[var(--color-text-primary)] font-black text-lg mb-1">Unidad de Distancia</h3>
          <p class="text-[var(--color-text-muted)] text-sm mb-5 font-medium">Selecciona kilómetros o millas.</p>
          <div class="flex gap-3">
            <button
              (click)="updateSetting('unidadDistancia', 'km')"
              class="flex-1 min-h-[64px] rounded-[20px] font-bold transition-all text-base"
              [class]="settings().unidadDistancia === 'km'
                ? 'bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/30 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                : 'bg-[var(--color-bg-input)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]'"
            >
              Kilómetros (km)
            </button>
            <button
              (click)="updateSetting('unidadDistancia', 'mi')"
              class="flex-1 min-h-[64px] rounded-[20px] font-bold transition-all text-base"
              [class]="settings().unidadDistancia === 'mi'
                ? 'bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/30 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                : 'bg-[var(--color-bg-input)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]'"
            >
              Millas (mi)
            </button>
          </div>
        </div>

        <!-- Weight increment -->
        <div class="bg-[var(--color-bg-card)] rounded-[32px] p-6 border border-[var(--color-border)] shadow-lg">
          <h3 class="text-[var(--color-text-primary)] font-black text-lg mb-1">Incremento de Peso</h3>
          <p class="text-[var(--color-text-muted)] text-sm mb-5 font-medium">Incremento sugerido para progresión ({{ settings().unidadPeso },
  changeDetection: ChangeDetectionStrategy.OnPush
}).</p>
          <input
            type="text"
            inputmode="decimal"
            [ngModel]="settings().incrementoPeso"
            (ngModelChange)="updateSetting('incrementoPeso', $event)"
            class="w-full min-h-[64px] px-5 rounded-[20px] bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-2xl font-black text-center focus:outline-none focus:border-[#00f2fe] transition-colors shadow-inner"
          />
        </div>

        <!-- Rest timer -->
        <div class="bg-[var(--color-bg-card)] rounded-[32px] p-6 border border-[var(--color-border)] shadow-lg">
          <h3 class="text-[var(--color-text-primary)] font-black text-lg mb-1">Tiempo de Descanso</h3>
          <p class="text-[var(--color-text-muted)] text-sm mb-5 font-medium">Duración del descanso entre series (segundos).</p>
          <input
            type="text"
            inputmode="numeric"
            [ngModel]="settings().tiempoDescanso"
            (ngModelChange)="updateSetting('tiempoDescanso', $event)"
            class="w-full min-h-[64px] px-5 rounded-[20px] bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-2xl font-black text-center focus:outline-none focus:border-[#00f2fe] transition-colors shadow-inner"
          />
        </div>

        <!-- Language -->
        <div class="bg-[var(--color-bg-card)] rounded-[32px] p-6 border border-[var(--color-border)] transition-all duration-300 shadow-lg">
          <h3 class="text-[var(--color-text-primary)] text-lg font-black mb-1">Idioma</h3>
          <p class="text-[var(--color-text-muted)] text-sm mb-5 font-medium">Próximamente más idiomas disponibles.</p>
          <div class="flex gap-3">
            <button
              (click)="updateSetting('idioma', 'es')"
              class="flex-1 min-h-[64px] rounded-[20px] font-bold transition-all text-base"
              [class]="settings().idioma === 'es'
                ? 'bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/30 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                : 'bg-[var(--color-bg-input)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]'"
            >
              Español
            </button>
            <button
              (click)="updateSetting('idioma', 'en')"
              class="flex-1 min-h-[64px] rounded-[20px] font-bold transition-all text-base"
              [class]="settings().idioma === 'en'
                ? 'bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/30 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                : 'bg-[var(--color-bg-input)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]'"
            >
              English
            </button>
          </div>
        </div>

        <!-- Local Storage Sync (File System Access API) -->
        <div class="bg-[var(--color-bg-card)] rounded-[32px] p-6 border border-[var(--color-border)] transition-all duration-300 shadow-lg mb-8">
          <h3 class="text-[var(--color-text-primary)] text-lg font-black mb-1">Carpeta de Sincronización</h3>
          <p class="text-[var(--color-text-muted)] text-sm mb-6 font-medium">
            Guarda tus rutinas y registros directamente en una carpeta de tu dispositivo para no perderlos nunca (sólo PC/Android).
          </p>
          
          @if (fsConnected()) {
            <div class="px-5 py-4 rounded-[20px] bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              <span class="text-emerald-400 text-base font-bold">Carpeta conectada</span>
            </div>
          } @else {
            <button
              (click)="conectarCarpeta()"
              class="btn-primary min-h-[64px] w-full text-lg font-bold flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
              Conectar Carpeta
            </button>
            @if (fsError()) {
              <p class="text-rose-400 text-sm mt-4 font-medium text-center">{{ fsError() }}</p>
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
    // Safely parse numeric fields to avoid storing NaN
    let safeValue: UserSettings[K] = value;
    if (key === 'incrementoPeso' || key === 'tiempoDescanso') {
      const parsed = parseFloat(value as string);
      if (isNaN(parsed) || parsed <= 0) return; // silently ignore invalid inputs
      safeValue = parsed as UserSettings[K];
    }
    this.settings.update(s => ({ ...s, [key]: safeValue }));
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
