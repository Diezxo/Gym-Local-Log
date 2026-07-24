import { Component, OnInit, signal, inject, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { STORAGE_PORT, StoragePort } from '../../ports/storage.port';
import { SyncUseCases } from '../../use-cases/sync.use-cases';
import { RoutineUseCases } from '../../use-cases/routine.use-cases';
import { WorkoutUseCases } from '../../use-cases/workout.use-cases';
import { UserSettings, DEFAULT_SETTINGS } from '../../models/interfaces';

import { FileSystemService } from '../../services/file-system.service';
import { UnitConversionService } from '../../services/unit-conversion.service';
import { generateId } from '../../utils/generate-id';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-[var(--color-bg-primary)] px-4 sm:px-6 pt-10 pb-36 flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <!-- Header -->
      <div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-white">Ajustes</h1>
      </div>

      <!-- Saved confirmation -->
      @if (showSaved()) {
        <div class="px-5 py-3.5 rounded-2xl bg-[var(--color-accent-success)]/10 border border-[var(--color-accent-success)]/20 text-[var(--color-accent-success)] text-sm font-semibold text-center tracking-wide shadow-sm animate-fade-in">
          ¡Guardado correctamente!
        </div>
      }

      <div class="flex flex-col gap-5">
        <!-- Weight unit -->
        <div class="bg-[var(--color-bg-card)] rounded-3xl p-5 sm:p-6 border border-white/5 shadow-sm">
          <h3 class="text-white font-bold text-lg mb-1">Unidad de Peso</h3>
          <p class="text-[var(--color-text-muted)] text-sm font-medium mb-5">Selecciona kilogramos o libras.</p>
          <div class="flex gap-3">
            <button
              (click)="updateSetting('weightUnit', 'kg')"
              class="flex-1 h-12 rounded-xl font-semibold uppercase tracking-wider text-[11px] transition-all active:scale-95"
              [class]="settings().weightUnit === 'kg'
                ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] border border-white/5 hover:bg-white/5'"
            >
              kg
            </button>
            <button
              (click)="updateSetting('weightUnit', 'lb')"
              class="flex-1 h-12 rounded-xl font-semibold uppercase tracking-wider text-[11px] transition-all active:scale-95"
              [class]="settings().weightUnit === 'lb'
                ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] border border-white/5 hover:bg-white/5'"
            >
              lb
            </button>
          </div>
        </div>

        <!-- Distance unit -->
        <div class="bg-[var(--color-bg-card)] rounded-3xl p-5 sm:p-6 border border-white/5 shadow-sm">
          <h3 class="text-white font-bold text-lg mb-1">Unidad de Distancia</h3>
          <p class="text-[var(--color-text-muted)] text-sm font-medium mb-5">Selecciona kilómetros o millas.</p>
          <div class="flex gap-3">
            <button
              (click)="updateSetting('distanceUnit', 'km')"
              class="flex-1 h-12 rounded-xl font-semibold uppercase tracking-wider text-[11px] transition-all active:scale-95"
              [class]="settings().distanceUnit === 'km'
                ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] border border-white/5 hover:bg-white/5'"
            >
              km
            </button>
            <button
              (click)="updateSetting('distanceUnit', 'mi')"
              class="flex-1 h-12 rounded-xl font-semibold uppercase tracking-wider text-[11px] transition-all active:scale-95"
              [class]="settings().distanceUnit === 'mi'
                ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] border border-white/5 hover:bg-white/5'"
            >
              mi
            </button>
          </div>
        </div>

        <!-- Weight increment -->
        <div class="bg-[var(--color-bg-card)] rounded-3xl p-5 sm:p-6 border border-white/5 shadow-sm">
          <h3 class="text-white font-bold text-lg mb-1">Incremento de Peso</h3>
          <p class="text-[var(--color-text-muted)] text-sm font-medium mb-5">Incremento sugerido para progresión ({{ settings().weightUnit }}).</p>
          <input
            type="text"
            inputmode="decimal"
            [ngModel]="settings().weightIncrement"
            (ngModelChange)="updateSetting('weightIncrement', $event)"
            class="w-full h-14 px-5 rounded-xl bg-[var(--color-bg-input)] border border-white/5 text-white text-2xl font-mono font-semibold text-center focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all shadow-inner"
          />
        </div>

        <!-- Rest timer -->
        <div class="bg-[var(--color-bg-card)] rounded-3xl p-5 sm:p-6 border border-white/5 shadow-sm">
          <h3 class="text-white font-bold text-lg mb-1">Tiempo de Descanso</h3>
          <p class="text-[var(--color-text-muted)] text-sm font-medium mb-5">Duración del descanso entre series (segundos).</p>
          <input
            type="text"
            inputmode="numeric"
            [ngModel]="settings().restTime"
            (ngModelChange)="updateSetting('restTime', $event)"
            class="w-full h-14 px-5 rounded-xl bg-[var(--color-bg-input)] border border-white/5 text-white text-2xl font-mono font-semibold text-center focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all shadow-inner"
          />
        </div>

        <!-- Language -->
        <div class="bg-[var(--color-bg-card)] rounded-3xl p-5 sm:p-6 border border-white/5 shadow-sm">
          <h3 class="text-white font-bold text-lg mb-1">Idioma</h3>
          <p class="text-[var(--color-text-muted)] text-sm font-medium mb-5">Próximamente más idiomas disponibles.</p>
          <div class="flex gap-3">
            <button
              (click)="updateSetting('language', 'es')"
              class="flex-1 h-12 rounded-xl font-semibold uppercase tracking-wider text-[11px] transition-all active:scale-95"
              [class]="settings().language === 'es'
                ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] border border-white/5 hover:bg-white/5'"
            >
              ES
            </button>
            <button
              (click)="updateSetting('language', 'en')"
              class="flex-1 h-12 rounded-xl font-semibold uppercase tracking-wider text-[11px] transition-all active:scale-95"
              [class]="settings().language === 'en'
                ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] border border-white/5 hover:bg-white/5'"
            >
              EN
            </button>
          </div>
        </div>

        <!-- Theme -->
        <div class="bg-[var(--color-bg-card)] rounded-3xl p-5 sm:p-6 border border-white/5 shadow-sm">
          <h3 class="text-white font-bold text-lg mb-1">Tema Visual</h3>
          <p class="text-[var(--color-text-muted)] text-sm font-medium mb-5">Elige tu estilo. AMOLED ahorra batería.</p>
          <div class="flex gap-3">
            <button
              (click)="updateSetting('theme', 'dark')"
              class="flex-1 h-12 rounded-xl font-semibold uppercase tracking-wider text-[11px] transition-all active:scale-95"
              [class]="settings().theme === 'dark'
                ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] border border-white/5 hover:bg-white/5'"
            >
              Oscuro
            </button>
            <button
              (click)="updateSetting('theme', 'amoled')"
              class="flex-1 h-12 rounded-xl font-semibold uppercase tracking-wider text-[11px] transition-all active:scale-95"
              [class]="settings().theme === 'amoled'
                ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] border border-white/5 hover:bg-white/5'"
            >
              AMOLED
            </button>
          </div>
        </div>

        <!-- Haptics -->
        <div class="bg-[var(--color-bg-card)] rounded-3xl p-5 sm:p-6 border border-white/5 shadow-sm flex items-center justify-between">
          <div>
            <h3 class="text-white font-bold text-lg mb-1">Vibración</h3>
            <p class="text-[var(--color-text-muted)] text-sm font-medium">Feedback táctil al pulsar <span class="text-[var(--color-text-muted)]/60">(solo Android)</span></p>
          </div>
          <button
            (click)="updateSetting('hapticFeedback', !settings().hapticFeedback)"
            class="relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
            [class]="settings().hapticFeedback ? 'bg-[var(--color-accent)]' : 'bg-white/10'"
            role="switch"
            [attr.aria-checked]="settings().hapticFeedback"
          >
            <span
              class="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              [class]="settings().hapticFeedback ? 'translate-x-5' : 'translate-x-0'"
            ></span>
          </button>
        </div>

        <!-- Local Storage Sync (File System Access API) -->
        <div class="bg-[var(--color-bg-card)] rounded-3xl p-5 sm:p-6 border border-white/5 shadow-sm mb-8">
          <h3 class="text-white font-bold text-lg mb-1">Sincronización</h3>
          <p class="text-[var(--color-text-muted)] text-sm font-medium mb-6">
            Guarda tus rutinas y registros directamente en una carpeta de tu dispositivo para no perderlos nunca (sólo PC/Android).
          </p>
          
          @if (fsConnected()) {
            <div class="px-5 py-4 rounded-2xl bg-[var(--color-accent-success)]/10 border border-[var(--color-accent-success)]/20 flex items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-accent-success)]"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              <span class="text-[var(--color-accent-success)] text-[11px] font-semibold uppercase tracking-wider">Carpeta conectada</span>
            </div>
          } @else {
            <button
              (click)="conectarCarpeta()"
              class="w-full h-14 bg-[var(--color-bg-input)] border border-white/5 text-white text-sm font-semibold rounded-2xl flex items-center justify-center gap-3 hover:bg-white/5 active:scale-95 transition-all shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
              Conectar Carpeta
            </button>
            @if (fsError()) {
              <p class="text-rose-400 text-[11px] font-semibold tracking-wider uppercase mt-4 text-center">{{ fsError() }}</p>
            }
          }
        </div>

        <!-- Database Maintenance -->
        <div class="bg-[var(--color-bg-card)] rounded-3xl p-5 sm:p-6 border border-white/5 shadow-sm mb-8">
          <h3 class="text-white font-bold text-lg mb-1">Mantenimiento Base de Datos</h3>
          <p class="text-[var(--color-text-muted)] text-sm font-medium mb-6">
            Estandariza los nombres de los ejercicios, traduce etiquetas antiguas y asigna IDs únicos para el historial. Útil si cambias nombres de ejercicios.
          </p>
          <button
            (click)="migrateData()"
            [disabled]="migrationStatus() === 'Procesando...'"
            class="w-full h-14 bg-[var(--color-bg-input)] border border-white/5 text-white text-sm font-semibold rounded-2xl flex items-center justify-center gap-3 hover:bg-white/5 active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
            {{ migrationStatus() || 'Estandarizar y Migrar' }}
          </button>
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
export class SettingsComponent implements OnInit, OnDestroy {
  private storage = inject<StoragePort>(STORAGE_PORT);
  private syncUseCases = inject(SyncUseCases);
  private routineUseCases = inject(RoutineUseCases);
  private workoutUseCases = inject(WorkoutUseCases);
  private fs = inject(FileSystemService);
  private unitSvc = inject(UnitConversionService);

  settings = signal<UserSettings>({ ...DEFAULT_SETTINGS });
  showSaved = signal(false);
  fsConnected = this.fs.isConnected;
  fsError = signal('');
  migrationStatus = signal('');

  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit() {
    const loaded = await this.storage.getSettings();
    this.settings.set(loaded);
  }

  ngOnDestroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
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

    // Fix #12: Always notify UnitConversionService — not just for some keys.
    // This ensures weightIncrement and restTime changes are immediately
    // reflected in ProgressionService and other reactive consumers.
    this.unitSvc.currentSettings.set(newSettings);

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

  async migrateData() {
    this.migrationStatus.set('Procesando...');
    const routines = await this.routineUseCases.getAllRoutines();
    const logs = await this.workoutUseCases.getAllWorkouts();

    const standardizeName = (name: string) => {
      if (!name) return name;
      return name.trim().toLowerCase().replace(/(?:^|\s)\S/g, char => char.toUpperCase());
    };
    
    const translateTags = (tags: any[]) => {
      const map: Record<string, string> = { 'Pecho': 'Chest', 'Espalda': 'Back', 'Piernas': 'Legs', 'Brazos': 'Arms', 'Core': 'Core', 'Cardio': 'Cardio', 'Calentamiento': 'Warmup' };
      return tags ? tags.map(t => map[t] || t) : tags;
    };
    
    const nameToId = new Map<string, string>();

    // Pass 1: Gather existing IDs or assign new ones
    for (const r of routines) {
      for (const e of (r.exercises || [])) {
        const stdName = standardizeName(e.name);
        if (!nameToId.has(stdName)) {
           nameToId.set(stdName, e.exerciseId || generateId());
        }
      }
    }
    for (const l of logs) {
      for (const e of (l.exercises || [])) {
        const stdName = standardizeName(e.name);
        if (!nameToId.has(stdName)) {
           nameToId.set(stdName, e.exerciseId || generateId());
        }
      }
    }

    // Pass 2: Apply to routines
    for (const r of routines) {
      let changed = false;
      for (const e of (r.exercises || [])) {
         const stdName = standardizeName(e.name);
         if (e.name !== stdName) { e.name = stdName; changed = true; }
         const newTags = Array.from(new Set(translateTags(e.tags || [])));
         if (JSON.stringify(newTags) !== JSON.stringify(e.tags)) { e.tags = newTags; changed = true; }
         const targetId = nameToId.get(stdName);
         if (e.exerciseId !== targetId) { e.exerciseId = targetId; changed = true; }
      }
      if (changed) await this.routineUseCases.updateRoutine(r);
    }
    
    // Pass 3: Apply to logs
    for (const l of logs) {
      let changed = false;
      for (const e of (l.exercises || [])) {
         const stdName = standardizeName(e.name);
         if (e.name !== stdName) { e.name = stdName; changed = true; }
         const newTags = Array.from(new Set(translateTags(e.tags || [])));
         if (JSON.stringify(newTags) !== JSON.stringify(e.tags)) { e.tags = newTags; changed = true; }
         const targetId = nameToId.get(stdName);
         if (e.exerciseId !== targetId) { e.exerciseId = targetId; changed = true; }
      }
      if (changed) await this.workoutUseCases.updateWorkoutSession(l);
    }

    // Sync if folder is connected
    if (this.fsConnected()) {
      await this.syncUseCases.exportAllData();
    }

    this.migrationStatus.set('¡Completado!');
    setTimeout(() => this.migrationStatus.set(''), 3000);
  }
}
