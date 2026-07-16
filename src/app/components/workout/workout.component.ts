import { Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { WorkoutUseCases } from '../../use-cases/workout.use-cases';
import { RoutineUseCases } from '../../use-cases/routine.use-cases';
import { STORAGE_PORT, StoragePort } from '../../ports/storage.port';
import { ProgressionService } from '../../services/progression.service';
import { RestTimerComponent } from './rest-timer.component';
import { ExerciseStrengthComponent } from './exercise-strength.component';
import { ExerciseCardioComponent } from './exercise-cardio.component';

@Component({
  selector: 'app-workout',
  standalone: true,
  imports: [
    FormsModule,
    RestTimerComponent,
    ExerciseStrengthComponent,
    ExerciseCardioComponent,
  ],
  template: `
    <div class="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] pb-36">

      <!-- Header -->
      <header class="px-6 pt-12 pb-6">
        <p class="text-sm text-[var(--color-accent)] uppercase font-heading font-bold tracking-[0.2em] mb-2 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">Entrenar</p>
        <h1 class="text-4xl sm:text-5xl font-heading font-black capitalize tracking-tight drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">{{ dateDisplay() }}</h1>
      </header>

      <!-- ── View: Template selection ── -->
      @if (!activeLog()) {
        <div class="px-6 flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto">
          <p class="text-lg font-heading font-black uppercase text-[var(--color-text-muted)] tracking-widest drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">Elige tu rutina</p>

          @if (templates().length === 0) {
            <div class="rounded-xl bg-[var(--color-bg-card)] border-2 border-[var(--color-border)] shadow-[6px_6px_0px_rgba(0,0,0,0.3)] p-12 text-center flex flex-col gap-3">
              <p class="text-[var(--color-text-primary)] text-xl font-heading font-black uppercase">No tienes plantillas creadas.</p>
              <p class="text-[var(--color-text-muted)] text-sm font-heading font-bold uppercase tracking-widest">Ve a Rutinas para crear una.</p>
            </div>
          }

          @for (tmpl of templates(); track tmpl.id) {
            <button
              (click)="selectTemplate(tmpl)"
              class="w-full text-left bg-[var(--color-bg-card)] border-2 border-[var(--color-border)] rounded-xl overflow-hidden active:translate-y-[2px] active:translate-x-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,0.5)] transition-all hover:border-[var(--color-accent)] group shadow-[6px_6px_0_rgba(0,0,0,0.3)]"
            >
              <!-- Main content -->
              <div class="flex items-center gap-4 p-5">
                <!-- Dumbbell icon -->
                <div class="w-16 h-16 rounded-lg bg-[#111827] border-2 border-[var(--color-accent)] flex items-center justify-center shrink-0 group-hover:bg-[var(--color-accent)] transition-colors shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1)] group-hover:shadow-[inset_2px_2px_0px_rgba(0,0,0,0.2)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-accent)] group-hover:text-[#111827] transition-all"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
                </div>

                <div class="flex-1 min-w-0">
                  <p class="text-[var(--color-text-primary)] font-heading font-black text-2xl truncate mb-1 uppercase tracking-wide drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">{{ tmpl.name }}</p>
                  <p class="text-[var(--color-text-muted)] text-sm truncate font-heading font-bold tracking-widest uppercase">
                    {{ tmpl.exercises.map(e => e.name).join(' · ') }}
                  </p>
                </div>

                <span class="shrink-0 text-sm font-heading font-black uppercase tracking-widest text-[#111827] bg-[var(--color-accent)] px-3 py-1.5 rounded-md border-2 border-[#111827] shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                  {{ tmpl.exercises.length }} ej.
                </span>
              </div>

              <!-- Tags row -->
              @if (getTemplateTags(tmpl).length > 0) {
                <div class="border-t-2 border-[var(--color-border)] px-5 py-3.5 flex flex-wrap gap-2 bg-[var(--color-bg-input)]">
                  @for (tag of getTemplateTags(tmpl); track tag) {
                    <span
                      class="px-3 py-1 rounded-md text-xs font-heading font-black uppercase tracking-widest border-2 shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
                      [style.background]="getTagColor(tag).bg"
                      [style.borderColor]="getTagColor(tag).border"
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
        <div class="px-6 flex flex-col gap-6 animate-scale-in max-w-4xl mx-auto">

          <!-- Active header: cancel + timer + badge -->
          <div class="flex items-center justify-between gap-3 pt-2">
            <button
              (click)="cancelWorkout()"
              class="text-sm font-heading font-black uppercase tracking-widest text-[var(--color-text-muted)] hover:text-white transition-colors flex items-center gap-1.5 active:translate-y-[2px] bg-[var(--color-bg-card)] px-4 py-2 rounded-lg border-2 border-[var(--color-border)] shadow-[2px_2px_0_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Cancelar
            </button>

            <!-- Session timer -->
            <div class="flex items-center gap-2.5 bg-[#111827] border-2 border-[var(--color-accent)] rounded-lg px-4 py-2 shadow-[2px_2px_0_rgba(249,115,22,0.5)]">
              <div class="w-3 h-3 rounded-sm bg-emerald-400 animate-pulse border border-emerald-900"></div>
              <span class="font-mono text-lg font-black text-[var(--color-accent)] tracking-widest drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">{{ sessionTimerLabel() }}</span>
            </div>

            <span class="text-xs font-heading font-black uppercase tracking-widest text-[#111827] bg-[var(--color-accent)] px-3 py-2 rounded-lg border-2 border-[#111827] shadow-[2px_2px_0_rgba(0,0,0,0.5)] hidden sm:inline-block">En curso</span>
          </div>

          <!-- Template name + tags -->
          <div class="flex flex-col gap-3">
            <h2 class="text-3xl font-heading font-black text-[var(--color-text-primary)] uppercase tracking-wide drop-shadow-[2px_2px_0_rgba(0,0,0,1)] truncate">{{ activeTemplateName() }}</h2>
            @if (activeTemplateTags().length > 0) {
              <div class="flex flex-wrap gap-2">
                @for (tag of activeTemplateTags(); track tag) {
                  <span
                    class="px-3 py-1 rounded-md text-xs font-heading font-black uppercase tracking-widest border-2 shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
                    [style.background]="getTagColor(tag).bg"
                    [style.borderColor]="getTagColor(tag).border"
                    [style.color]="getTagColor(tag).text"
                  >{{ tag }}</span>
                }
              </div>
            }
          </div>

          <!-- Barra de Progreso -->
          <div class="flex flex-col gap-2">
            <div class="flex justify-between text-sm text-[var(--color-text-muted)] font-heading font-bold uppercase tracking-widest">
              <span>Progreso</span>
              <span class="text-[var(--color-accent)]">{{ getCompletedExercisesCount() }} / {{ activeLog()!.exercises.length }}</span>
            </div>
            <div class="w-full h-4 bg-[var(--color-bg-input)] rounded-md overflow-hidden border-2 border-[var(--color-border)] shadow-inner">
              <div
                class="h-full bg-[var(--color-accent)] transition-all duration-500 ease-out border-r-2 border-[#111827]"
                [style.width.%]="(getCompletedExercisesCount() / activeLog()!.exercises.length) * 100"
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
          <div class="flex flex-col gap-6">
            @for (ejLog of activeLog()!.exercises; track $index; let i = $index) {
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
          <div class="flex flex-col gap-3 mt-4">
            <label class="text-sm text-[var(--color-text-muted)] font-heading font-black uppercase tracking-widest drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">Notas del día</label>
            <textarea
              [ngModel]="dailyNotes()"
              (ngModelChange)="updateNotes($event)"
              placeholder="¿Cómo te sentiste hoy?"
              rows="3"
              class="w-full rounded-xl bg-[var(--color-bg-input)] border-2 border-[var(--color-border)] px-5 py-4 text-base font-medium text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none shadow-[inset_2px_2px_0_rgba(0,0,0,0.2)]"
            ></textarea>
          </div>

          <!-- Botón Finalizar -->
          <button
            (click)="finishWorkout()"
            class="btn-primary min-h-[64px] text-xl font-heading font-black uppercase tracking-widest w-full flex items-center justify-center gap-3 mt-6"
          >
            ✓ Finalizar Entrenamiento
          </button>
        </div>
      }

      <!-- Toast de éxito -->
      @if (showToast()) {
        <div class="fixed bottom-28 left-4 right-4 max-w-sm mx-auto z-50 rounded-lg bg-emerald-500 border-2 border-emerald-900 px-6 py-4 flex items-center justify-center gap-3 text-white shadow-[6px_6px_0_rgba(0,0,0,0.5)] animate-slide-up">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span class="font-heading font-black uppercase tracking-widest text-lg drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">¡Guardado!</span>
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

  // Session timer
  sessionStartTime = signal<number | null>(null);
  sessionTimerLabel = signal('0:00');
  private timerInterval: any;

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
      id: crypto.randomUUID(),
      name: ej.name,
      type: ej.type,
      tags: ej.tags ?? [],
      sets: ej.type === 'strength' ? [] : undefined,
      cardio: ej.type === 'cardio' ? { distanceMeters: 0, timeMinutes: 0 } : undefined,
    }));

    const log: WorkoutSession = {
      id: crypto.randomUUID(),
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
    const monthId = this.dateISO().substring(0, 7); // Not strictly needed but API wants it
    const promesas = log.exercises.map((ej) =>
      ej.type === 'strength'
        ? this.progression.getSuggestion(ej.name, monthId)
        : Promise.resolve(null)
    );
    this.suggestions.set(await Promise.all(promesas));
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

  onLogUpdated(_ejLog: ExerciseLog): void {
    this.autoSave();
  }

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

  // ─── Auto-save ───
  private async autoSave(): Promise<void> {
    const log = this.activeLog();
    if (!log) return;
    try {
      await this.workoutUseCases.updateWorkoutSession(log);
    } catch {}
  }

  // ─── Finalize ───
  async finishWorkout(): Promise<void> {
    const log = this.activeLog();
    if (!log) return;

    log.notes = this.dailyNotes();
    await this.workoutUseCases.updateWorkoutSession(log);
    this.stopTimer();

    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);

    this.activeLog.set(null);
    this.activeTemplateName.set('');
    this.activeTemplateTags.set([]);
    this.suggestions.set([]);
    this.dailyNotes.set('');
  }

  // ─── Cancel ───
  cancelWorkout(): void {
    this.stopTimer();
    this.activeLog.set(null);
    this.activeTemplateName.set('');
    this.activeTemplateTags.set([]);
    this.suggestions.set([]);
    this.dailyNotes.set('');
  }
}
