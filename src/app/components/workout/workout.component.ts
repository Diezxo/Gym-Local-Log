import { Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ViewChild, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { Router } from '@angular/router';
import {
  Routine,
  WorkoutSession,
  ExerciseLog,
  StrengthSet,
  Suggestion,
  UserSettings,
  DEFAULT_SETTINGS,
  TAG_COLORS,
  MuscleTag,
} from '../../models/interfaces';
import { generateId } from '../../utils/generate-id';
import { WorkoutUseCases } from '../../use-cases/workout.use-cases';
import { RoutineUseCases } from '../../use-cases/routine.use-cases';
import { STORAGE_PORT, StoragePort } from '../../ports/storage.port';
import { ProgressionService } from '../../services/progression.service';
import { RestTimerComponent } from './rest-timer.component';
import { ExerciseStrengthComponent } from './exercise-strength.component';
import { ExerciseCardioComponent } from './exercise-cardio.component';
import { ScrollLockDirective } from '../../directives/scroll-lock.directive';

@Component({
  selector: 'app-workout',
  standalone: true,
  imports: [
    FormsModule,
    RestTimerComponent,
    ExerciseStrengthComponent,
    ExerciseCardioComponent,
    A11yModule,
    ScrollLockDirective,
  ],
  template: `
    <div class="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] pb-36 md:pb-12 px-4 sm:px-6 max-w-xl mx-auto w-full">

      <!-- Header -->
      <header class="pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6">
        <p class="text-xs sm:text-xs text-[var(--color-accent)] uppercase font-semibold tracking-widest mb-1">{{ activeLog() ? 'Entrenamiento Activo' : 'Entrenar' }}</p>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-white capitalize">{{ dateDisplay() }}</h1>
      </header>

      <!-- ── View: Template selection ── -->
      @if (!activeLog()) {
        <div class="flex flex-col gap-5 animate-fade-in">
          <p class="text-lg font-semibold text-[var(--color-text-primary)]">Elige tu rutina</p>

          @if (templates().length === 0) {
            <div class="rounded-3xl bg-[var(--color-bg-card)] border border-white/5 shadow-sm p-10 text-center flex flex-col gap-2">
              <p class="text-[var(--color-text-primary)] text-lg font-semibold">No tienes plantillas creadas.</p>
              <p class="text-[var(--color-text-muted)] text-sm font-medium">Ve a Rutinas para crear una.</p>
            </div>
          }

          @for (tmpl of templates(); track tmpl.id) {
            <button
              (click)="selectTemplate(tmpl)"
              class="w-full text-left bg-[var(--color-bg-card)] border border-white/5 rounded-3xl overflow-hidden active:scale-95 transition-all hover:border-[var(--color-accent)]/50 group shadow-sm"
            >
              <!-- Main content -->
              <div class="flex items-center gap-4 p-5 sm:p-6">
                <!-- Dumbbell icon -->
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-bg-input)] to-[var(--color-bg-primary)] border border-white/5 flex items-center justify-center shrink-0 group-hover:from-[var(--color-accent)] group-hover:to-[var(--color-accent-secondary)] transition-all shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-text-muted)] group-hover:text-white transition-all"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
                </div>

                <div class="flex-1 min-w-0">
                  <p class="text-[var(--color-text-primary)] font-bold text-xl truncate mb-1 tracking-tight">{{ tmpl.name }}</p>
                  <p class="text-[var(--color-text-muted)] text-xs truncate font-medium tracking-wide">
                    {{ getExerciseNames(tmpl) }}
                  </p>
                </div>

                <span class="shrink-0 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-1.5 rounded-full">
                  {{ tmpl.exercises.length }} ej.
                </span>
              </div>

              <!-- Tags row -->
              @if (getTemplateTags(tmpl).length > 0) {
                <div class="border-t border-white/5 px-5 sm:px-6 py-3.5 flex flex-wrap gap-2 bg-[var(--color-bg-input)]/30">
                  @for (tag of getTemplateTags(tmpl); track tag) {
                    <span
                      class="px-2.5 py-1 rounded-full text-xs font-medium tracking-wider uppercase"
                      [style.background]="getTagColor(tag).bg"
                      [style.color]="getTagColor(tag).text"
                    >{{ tag }}</span>
                  }
                </div>
              }
            </button>
          }
        </div>
      }

      <!-- ── View: Active Workout ── -->
      @if (activeLog()) {
        <div class="flex flex-col gap-6 animate-scale-in">

          <!-- Active header: cancel + timer + badge -->
          <div class="flex items-center justify-between gap-3 pt-2">
            <button
              (click)="cancelWorkout()"
              class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-white transition-colors flex items-center gap-1.5 active:scale-95 bg-[var(--color-bg-card)] px-4 py-2 rounded-full border border-white/5 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Cancelar
            </button>

            <!-- Session timer -->
            <div class="flex items-center gap-2.5 bg-[var(--color-bg-input)] rounded-full px-4 py-2 shadow-inner border border-white/5">
              <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span class="font-mono text-sm font-semibold tracking-wider text-white">{{ sessionTimerLabel() }}</span>
            </div>

            <span class="text-xs font-semibold uppercase tracking-wider text-white bg-[var(--color-accent)]/80 px-3 py-1.5 rounded-full hidden sm:inline-block">En curso</span>
          </div>

          <!-- Template name + tags -->
          <div class="flex flex-col gap-3">
            <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate">{{ activeTemplateName() }}</h2>
            @if (activeTemplateTags().length > 0) {
              <div class="flex flex-wrap gap-2">
                @for (tag of activeTemplateTags(); track tag) {
                  <span
                    class="px-2.5 py-1 rounded-full text-xs font-medium tracking-wider uppercase"
                    [style.background]="getTagColor(tag).bg"
                    [style.color]="getTagColor(tag).text"
                  >{{ tag }}</span>
                }
              </div>
            }
          </div>

          <!-- Barra de Progreso -->
          <div class="flex flex-col gap-2 mt-2">
            <div class="flex justify-between text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
              <span>Progreso</span>
              <span class="text-[var(--color-accent)]">{{ getCompletedExercisesCount() }} / {{ activeLog()?.exercises?.length ?? 0 }}</span>
            </div>
            <div class="w-full h-2.5 bg-[var(--color-bg-input)] rounded-full overflow-hidden shadow-inner">
              <div
                class="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] transition-all duration-500 ease-out rounded-full"
                [style.width.%]="activeLog()?.exercises?.length ? (getCompletedExercisesCount() / activeLog()!.exercises.length) * 100 : 0"
              ></div>
            </div>
          </div>

          <!-- Rest Timer -->
          <app-rest-timer
            #restTimerRef
            [duration]="settings().restTime"
            (timerFinished)="onTimerFinished()"
          />

          <!-- Exercises -->
          <div class="flex flex-col gap-6 mt-4">
            @for (ejLog of activeLog()?.exercises ?? []; track $index; let i = $index) {
              <div>
                @if (ejLog.type === 'strength') {
                  <app-exercise-strength
                    [exerciseLog]="ejLog"
                    [suggestion]="suggestions()[i] ?? null"
                    (setCompleted)="onSetCompleted($event)"
                    (logUpdated)="onLogUpdated($event)"
                  />
                } @else {
                  <app-exercise-cardio
                    [exerciseLog]="ejLog"
                    (logUpdated)="onLogUpdated($event)"
                  />
                }
              </div>
            }
          </div>

          <!-- Notas del día -->
          <div class="flex flex-col gap-3 mt-6">
            <label class="text-sm text-[var(--color-text-primary)] font-semibold">Notas del día</label>
            <textarea
              [ngModel]="dailyNotes()"
              (ngModelChange)="updateNotes($event)"
              placeholder="¿Cómo te sentiste hoy?"
              rows="3"
              class="w-full rounded-2xl bg-[var(--color-bg-card)] border border-white/5 px-5 py-4 text-sm font-medium text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all resize-none shadow-sm"
            ></textarea>
          </div>

          <!-- Botón Finalizar -->
          <button
            (click)="finishWorkout()"
            class="btn-primary min-h-[64px] text-lg mt-8"
          >
            ✓ Finalizar Entrenamiento
          </button>
        </div>
      }

      <!-- Toast de éxito -->
      @if (showToast()) {
        <div class="fixed bottom-28 left-1/2 -translate-x-1/2 w-max max-w-[90vw] z-50 rounded-full bg-[var(--color-accent-success)] px-6 py-3 flex items-center justify-center gap-3 text-white shadow-lg animate-slide-up">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span class="font-medium text-sm">Entrenamiento Guardado</span>
        </div>
      }

      <!-- Modal Cancelar Entrenamiento -->
      @if (showCancelModal()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" appScrollLock>
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="showCancelModal.set(false)"></div>
          <div class="relative bg-[var(--color-bg-card)] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl" cdkTrapFocus cdkTrapFocusAutoCapture>
            <div class="p-6">
              <div class="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-hot)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">¿Cancelar Entrenamiento?</h3>
              <p class="text-[var(--color-text-muted)] text-sm leading-relaxed mb-6">
                Se perderá todo el progreso de la sesión actual. Esta acción no se puede deshacer.
              </p>
              <div class="flex gap-3">
                <button
                  (click)="showCancelModal.set(false)"
                  class="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-[var(--color-bg-input)] hover:bg-white/10 transition-colors"
                >
                  Continuar
                </button>
                <button
                  (click)="confirmCancelWorkout()"
                  class="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-[var(--color-accent-hot)] hover:bg-rose-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-up {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    :host .animate-slide-up {
      animation: slide-up 0.3s ease-out;
    }
  `], changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkoutComponent implements OnInit, OnDestroy {
  private workoutUseCases = inject(WorkoutUseCases);
  private routineUseCases = inject(RoutineUseCases);
  private storage = inject<StoragePort>(STORAGE_PORT);
  private progression = inject(ProgressionService);
  private router = inject(Router);

  @ViewChild('restTimerRef') restTimerRef!: RestTimerComponent;

  // ─── State ───
  dateDisplay = signal('');
  dateISO = signal('');
  templates = signal<Routine[]>([]);
  settings = signal<UserSettings>({ ...DEFAULT_SETTINGS });
  activeLog = signal<WorkoutSession | null>(null);
  activeTemplateName = signal('');
  activeTemplateTags = signal<MuscleTag[]>([]);
  suggestions = signal<(Suggestion | null)[]>([]);
  dailyNotes = signal('');
  showToast = signal(false);
  restTimerActive = signal(false);
  showCancelModal = signal(false);

  // Session timer
  sessionStartTime = signal<number | null>(null);
  sessionTimerLabel = signal('0:00');
  private timerInterval: any;
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;
  // Fix #3: debounce handle for auto-save to prevent concurrent IDB writes
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.activeLog()) {
      $event.returnValue = true;
    }
  }

  async ngOnInit() {
    const hoy = new Date();
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long', day: 'numeric', month: 'long',
    };
    this.dateDisplay.set(hoy.toLocaleDateString('es-ES', opciones));
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    this.dateISO.set(`${y}-${m}-${d}`);

    const [tmpls, setts] = await Promise.all([
      this.routineUseCases.getAllRoutines(),
      this.storage.getSettings()
    ]);
    this.templates.set(tmpls);
    this.settings.set(setts);
  }

  ngOnDestroy() {
    this.stopTimer();
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
  }

  // ─── Session Timer ───
  private startTimer() {
    this.sessionStartTime.set(Date.now());
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.sessionStartTime()!) / 1000);
      const m = Math.floor(elapsed / 60);
      const s = elapsed % 60;
      this.sessionTimerLabel.set(`${m}:${String(s).padStart(2, '0')}`);
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.sessionTimerLabel.set('0:00');
    this.sessionStartTime.set(null);
  }

  // ─── Template Selection ───
  async selectTemplate(tmpl: Routine): Promise<void> {
    const exercises: ExerciseLog[] = tmpl.exercises.map((ej) => ({
      id: generateId(),
      exerciseId: ej.exerciseId,
      name: ej.name,
      type: ej.type,
      tags: ej.tags ?? [],
      sets: ej.type === 'strength' ? [] : undefined,
      cardio: ej.type === 'cardio' ? { distanceMeters: 0, timeMinutes: 0 } : undefined,
    }));

    const log: WorkoutSession = {
      id: generateId(),
      schemaVersion: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deviceId: 'local',
      version: 1,
      syncStatus: 'local_only',
      date: this.dateISO(),
      routineId: tmpl.id,
      exercises,
      notes: '',
    };

    this.activeLog.set(log);
    this.activeTemplateName.set(tmpl.name);
    this.activeTemplateTags.set(this.getTemplateTags(tmpl));
    this.dailyNotes.set('');
    this.startTimer();

    await this.loadSuggestions(log);
  }

  private async loadSuggestions(log: WorkoutSession): Promise<void> {
    const promesas = log.exercises.map((ej) =>
      this.getSuggestionForExercise(ej)
    );
    this.suggestions.set(await Promise.all(promesas));
  }

  private getSuggestionForExercise(ej: ExerciseLog): Promise<Suggestion | null> {
    return ej.type === 'strength'
        ? this.progression.getSuggestion(ej.exerciseId, ej.name)
        : Promise.resolve(null);
  }

  getExerciseNames(tmpl: Routine): string {
    return tmpl.exercises.map(e => e.name).join(' · ');
  }

  // ─── Helpers ───
  getTemplateTags(tmpl: Routine): MuscleTag[] {
    const tags = new Set<MuscleTag>();
    tmpl.exercises.forEach(e => e.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }

  getTagColor(tag: MuscleTag) {
    return TAG_COLORS[tag] ?? { bg: 'rgba(255,255,255,0.05)', text: '#a3a3a3', border: 'rgba(255,255,255,0.1)' };
  }

  // ─── Exercise Events ───
  onSetCompleted(setLog: StrengthSet) {
    if (!this.restTimerActive()) {
      this.restTimerActive.set(true);
    }
    this.restTimerRef.start();
    this.autoSave();
  }

  // Fix #4 (parent side): Replace the updated exercise inside the activeLog
  // signal with the new immutable object emitted by ExerciseStrengthComponent.
  // This makes the signal reference change so OnPush detects it and re-renders
  // the progress bar correctly.
  onLogUpdated(updatedEj: ExerciseLog): void {
    const log = this.activeLog();
    if (!log) return;
    const updatedExercises = log.exercises.map(ej =>
      ej.id === updatedEj.id ? updatedEj : ej
    );
    this.activeLog.set({ ...log, exercises: updatedExercises });
    this.autoSave();
  }

  /**
   * Fired when the rest timer reaches zero.
   * Audio/haptic feedback is handled inside RestTimerComponent itself.
   * No additional action is required at this level.
   */
  onTimerFinished(): void {}

  // ─── Progress ───
  getCompletedExercisesCount(): number {
    const log = this.activeLog();
    if (!log) return 0;
    return log.exercises.filter(ej => {
      if (ej.type === 'strength') return ej.sets && ej.sets.length > 0;
      return ej.cardio && (ej.cardio.distanceMeters > 0 || ej.cardio.timeMinutes > 0);
    }).length;
  }

  // ─── Notes ───
  updateNotes(value: string): void {
    this.dailyNotes.set(value);
    const log = this.activeLog();
    if (log) {
      log.notes = value;
      this.autoSave();
    }
  }

  // ─── Auto-save (debounced) ───
  // Fix #3: Debounce prevents multiple concurrent IDB writes when the user
  // completes sets in rapid succession. The 500ms window collapses all
  // intermediate saves into a single write, keeping the version counter correct.
  private autoSave(): void {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(async () => {
      const log = this.activeLog();
      if (!log) return;
      try {
        await this.workoutUseCases.updateWorkoutSession(log);
      } catch (e) {
        console.error('Auto-save failed:', e);
      }
    }, 500);
  }

  // ─── Finalize ───
  async finishWorkout(): Promise<void> {
    const log = this.activeLog();
    if (!log) return;

    log.notes = this.dailyNotes();
    await this.workoutUseCases.updateWorkoutSession(log);
    this.stopTimer();

    this.showToast.set(true);
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => this.showToast.set(false), 3000);

    this.activeLog.set(null);
    this.activeTemplateName.set('');
    this.activeTemplateTags.set([]);
    this.suggestions.set([]);
    this.dailyNotes.set('');
  }

  // ─── Cancel ───
  cancelWorkout(): void {
    this.showCancelModal.set(true);
  }

  confirmCancelWorkout(): void {
    this.stopTimer();
    this.activeLog.set(null);
    this.activeTemplateName.set('');
    this.activeTemplateTags.set([]);
    this.suggestions.set([]);
    this.dailyNotes.set('');
    this.showCancelModal.set(false);
  }
}
