import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { STORAGE_PORT, StoragePort } from '../../ports/storage.port';
import { SyncUseCases } from '../../use-cases/sync.use-cases';
import { UserSettings, DEFAULT_SETTINGS } from '../../models/interfaces';

import { FileSystemService } from '../../services/file-system.service';
import { UnitConversionService } from '../../services/unit-conversion.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-[var(--color-bg-primary)] px-4 sm:px-6 pt-10 pb-36 flex flex-col gap-6">
      <!-- Header -->
      <div>
        <h1 class="text-4xl sm:text-5xl font-heading font-black text-[var(--color-text-primary)] tracking-widest uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">Ajustes</h1>
      </div>

      <!-- Saved confirmation -->
      @if (showSaved()) {
        <div class="px-5 py-3 rounded-md bg-emerald-500 border-2 border-emerald-900 text-[#111827] text-sm text-center font-heading font-black uppercase tracking-widest shadow-[4px_4px_0_rgba(16,185,129,0.5)] animate-fade-in ">
          ¡Guardado correctamente!
        </div>
      }

      <div class="flex flex-col gap-6">
        <!-- Weight unit -->
        <div class="bg-[var(--color-bg-card)] rounded-xl p-5 border-2 border-[var(--color-border)] shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
          <h3 class="text-[var(--color-text-primary)] font-heading font-black uppercase tracking-widest text-lg mb-1 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">Unidad de Peso</h3>
          <p class="text-[var(--color-text-muted)] text-xs font-mono font-bold mb-5">Selecciona kilogramos o libras.</p>
          <div class="flex gap-3">
            <button
              (click)="updateSetting('weightUnit', 'kg')"
              class="flex-1 h-14 rounded-md font-heading font-black uppercase tracking-widest text-sm transition-all active:translate-y-[2px] active:translate-x-[2px]"
              [class]="settings().weightUnit === 'kg'
                ? 'bg-[var(--color-accent)] text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_rgba(0,0,0,0.5)]'
                : 'bg-[#111827] text-[var(--color-text-muted)] border-2 border-[var(--color-border)] shadow-inner hover:border-[var(--color-accent)]'"
            >
              kg
            </button>
            <button
              (click)="updateSetting('weightUnit', 'lb')"
              class="flex-1 h-14 rounded-md font-heading font-black uppercase tracking-widest text-sm transition-all active:translate-y-[2px] active:translate-x-[2px]"
              [class]="settings().weightUnit === 'lb'
                ? 'bg-[var(--color-accent)] text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_rgba(0,0,0,0.5)]'
                : 'bg-[#111827] text-[var(--color-text-muted)] border-2 border-[var(--color-border)] shadow-inner hover:border-[var(--color-accent)]'"
            >
              lb
            </button>
          </div>
        </div>

        <!-- Distance unit -->
        <div class="bg-[var(--color-bg-card)] rounded-xl p-5 border-2 border-[var(--color-border)] shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
          <h3 class="text-[var(--color-text-primary)] font-heading font-black uppercase tracking-widest text-lg mb-1 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">Unidad de Distancia</h3>
          <p class="text-[var(--color-text-muted)] text-xs font-mono font-bold mb-5">Selecciona kilómetros o millas.</p>
          <div class="flex gap-3">
            <button
              (click)="updateSetting('distanceUnit', 'km')"
              class="flex-1 h-14 rounded-md font-heading font-black uppercase tracking-widest text-sm transition-all active:translate-y-[2px] active:translate-x-[2px]"
              [class]="settings().distanceUnit === 'km'
                ? 'bg-emerald-500 text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_rgba(0,0,0,0.5)]'
                : 'bg-[#111827] text-[var(--color-text-muted)] border-2 border-[var(--color-border)] shadow-inner hover:border-emerald-500'"
            >
              km
            </button>
            <button
              (click)="updateSetting('distanceUnit', 'mi')"
              class="flex-1 h-14 rounded-md font-heading font-black uppercase tracking-widest text-sm transition-all active:translate-y-[2px] active:translate-x-[2px]"
              [class]="settings().distanceUnit === 'mi'
                ? 'bg-emerald-500 text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_rgba(0,0,0,0.5)]'
                : 'bg-[#111827] text-[var(--color-text-muted)] border-2 border-[var(--color-border)] shadow-inner hover:border-emerald-500'"
            >
              mi
            </button>
          </div>
        </div>

        <!-- Weight increment -->
        <div class="bg-[var(--color-bg-card)] rounded-xl p-5 border-2 border-[var(--color-border)] shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
          <h3 class="text-[var(--color-text-primary)] font-heading font-black uppercase tracking-widest text-lg mb-1 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">Incremento de Peso</h3>
          <p class="text-[var(--color-text-muted)] text-xs font-mono font-bold mb-5">Incremento sugerido para progresión ({{ settings().weightUnit }}).</p>
          <input
            type="text"
            inputmode="decimal"
            [ngModel]="settings().weightIncrement"
            (ngModelChange)="updateSetting('weightIncrement', $event)"
            class="w-full h-16 px-5 rounded-md bg-[#111827] border-2 border-[var(--color-border)] text-[var(--color-text-primary)] text-2xl font-mono font-black text-center focus:outline-none focus:border-[var(--color-accent)] transition-colors shadow-inner"
          />
        </div>

        <!-- Rest timer -->
        <div class="bg-[var(--color-bg-card)] rounded-xl p-5 border-2 border-[var(--color-border)] shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
          <h3 class="text-[var(--color-text-primary)] font-heading font-black uppercase tracking-widest text-lg mb-1 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">Tiempo de Descanso</h3>
          <p class="text-[var(--color-text-muted)] text-xs font-mono font-bold mb-5">Duración del descanso entre series (segundos).</p>
          <input
            type="text"
            inputmode="numeric"
            [ngModel]="settings().restTime"
            (ngModelChange)="updateSetting('restTime', $event)"
            class="w-full h-16 px-5 rounded-md bg-[#111827] border-2 border-[var(--color-border)] text-[var(--color-text-primary)] text-2xl font-mono font-black text-center focus:outline-none focus:border-[var(--color-accent)] transition-colors shadow-inner"
          />
        </div>

        <!-- Language -->
        <div class="bg-[var(--color-bg-card)] rounded-xl p-5 border-2 border-[var(--color-border)] shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
          <h3 class="text-[var(--color-text-primary)] font-heading font-black uppercase tracking-widest text-lg mb-1 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">Idioma</h3>
          <p class="text-[var(--color-text-muted)] text-xs font-mono font-bold mb-5">Próximamente más idiomas disponibles.</p>
          <div class="flex gap-3">
            <button
              (click)="updateSetting('language', 'es')"
              class="flex-1 h-14 rounded-md font-heading font-black uppercase tracking-widest text-sm transition-all active:translate-y-[2px] active:translate-x-[2px]"
              [class]="settings().language === 'es'
                ? 'bg-[var(--color-accent)] text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_rgba(0,0,0,0.5)]'
                : 'bg-[#111827] text-[var(--color-text-muted)] border-2 border-[var(--color-border)] shadow-inner hover:border-[var(--color-accent)]'"
            >
              ES
            </button>
            <button
              (click)="updateSetting('language', 'en')"
              class="flex-1 h-14 rounded-md font-heading font-black uppercase tracking-widest text-sm transition-all active:translate-y-[2px] active:translate-x-[2px]"
              [class]="settings().language === 'en'
                ? 'bg-[var(--color-accent)] text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_rgba(0,0,0,0.5)]'
                : 'bg-[#111827] text-[var(--color-text-muted)] border-2 border-[var(--color-border)] shadow-inner hover:border-[var(--color-accent)]'"
            >
              EN
            </button>
          </div>
        </div>

        <!-- Local Storage Sync (File System Access API) -->
        <div class="bg-[var(--color-bg-card)] rounded-xl p-5 border-2 border-[var(--color-border)] shadow-[4px_4px_0_rgba(0,0,0,0.3)] mb-8">
          <h3 class="text-[var(--color-text-primary)] font-heading font-black uppercase tracking-widest text-lg mb-1 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">Sincronización</h3>
          <p class="text-[var(--color-text-muted)] text-xs font-mono font-bold mb-6">
            Guarda tus rutinas y registros directamente en una carpeta de tu dispositivo para no perderlos nunca (sólo PC/Android).
          </p>
          
          @if (fsConnected()) {
            <div class="px-5 py-4 rounded-md bg-emerald-500 border-2 border-emerald-900 flex items-center justify-center gap-3 shadow-[inset_2px_2px_0_rgba(0,0,0,0.3)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-[#111827]"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              <span class="text-[#111827] text-sm font-heading font-black uppercase tracking-widest">Carpeta conectada</span>
            </div>
          } @else {
            <button
              (click)="conectarCarpeta()"
              class="btn-primary min-h-[56px] w-full text-base rounded-md flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
              Conectar Carpeta
            </button>
            @if (fsError()) {
              <p class="text-rose-500 text-xs font-mono font-bold mt-4 text-center">{{ fsError() }}</p>
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
  private storage = inject<StoragePort>(STORAGE_PORT);
  private syncUseCases = inject(SyncUseCases);
  private fs = inject(FileSystemService);
  private unitSvc = inject(UnitConversionService);

  settings = signal<UserSettings>({ ...DEFAULT_SETTINGS });
  showSaved = signal(false);
  
  fsConnected = this.fs.isConnected;
  fsError = signal('');

  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit() {
    const loaded = await this.storage.getSettings();
    this.settings.set(loaded);
  }

  async updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    // Safely parse numeric fields to avoid storing NaN
    let safeValue: UserSettings[K] = value;
    if (key === 'weightIncrement' || key === 'restTime') {
      const parsed = parseFloat(value as string);
      if (isNaN(parsed) || parsed <= 0) return; // silently ignore invalid inputs
      safeValue = parsed as UserSettings[K];
    }
    const newSettings = { ...this.settings(), [key]: safeValue };
    this.settings.set(newSettings);
    await this.storage.saveSettings(newSettings);
    
    // Explicitly notify UnitConversionService about the update
    if (key === 'weightUnit' || key === 'distanceUnit') {
      this.unitSvc.currentSettings.set(newSettings);
    }

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
        await this.syncUseCases.exportAllData();
      }
    } catch (e: any) {
      this.fsError.set(e.message || 'Error al conectar carpeta.');
    }
  }
}
