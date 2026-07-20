import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RoutineUseCases } from '../../use-cases/routine.use-cases';
import {
  Routine, BaseExercise, ExerciseType,
  MuscleTag, MUSCLE_TAGS, TAG_COLORS,
} from '../../models/interfaces';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { generateId } from '../../utils/generate-id';

// Internal type with a stable uid for correct @for tracking
interface ExerciseWithId extends BaseExercise {
  _uid: string;
}

@Component({
  selector: 'app-template-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="min-h-screen bg-[var(--color-bg-primary)] px-4 sm:px-6 pt-10 pb-36 flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <!-- Header -->
      <div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          {{ isEditing() ? 'Editar Rutina' : 'Nueva Rutina' }}
        </h1>
      </div>

      <!-- Template name input -->
      <div>
        <input
          type="text"
          [ngModel]="templateName()"
          (ngModelChange)="templateName.set($event)"
          placeholder="Nombre de la rutina"
          class="w-full h-16 px-5 rounded-2xl bg-[var(--color-bg-input)] border border-white/5 text-xl font-bold text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all shadow-inner"
        />
      </div>

      <!-- Exercises list -->
      <div class="flex flex-col gap-4" cdkDropList (cdkDropListDropped)="drop($event)">
        <!--
          BUG FIX: track by _uid (stable unique id per exercise object)
          instead of $index. Using $index causes Angular to recycle DOM nodes
          when the signal updates, which makes tag clicks fire on the wrong exercise.
        -->
        @for (exercise of exercises(); track exercise._uid) {
          <div cdkDrag class="bg-[var(--color-bg-card)] rounded-3xl border border-white/5 shadow-sm overflow-hidden group">

            <!-- Drag handle + exercise name row -->
            <div class="flex items-center gap-3 p-5 sm:p-6">
              <!-- Drag Handle -->
              <div cdkDragHandle class="cursor-grab active:cursor-grabbing text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors shrink-0 p-1 -ml-2 rounded-lg hover:bg-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="16" y1="9" y2="9"/><line x1="8" x2="16" y1="15" y2="15"/></svg>
              </div>

              <div class="w-8 h-8 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center font-bold text-sm shrink-0">
                {{ getIndex(exercise) + 1 }}
              </div>

              <input
                type="text"
                [ngModel]="exercise.name"
                (ngModelChange)="updateExerciseName(exercise._uid, $event)"
                placeholder="Nombre del ejercicio"
                class="flex-1 h-12 px-4 rounded-xl bg-[var(--color-bg-primary)] border border-white/5 text-base font-semibold text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all shadow-inner"
              />

              <button
                type="button"
                (click)="removeExercise(exercise._uid); $event.stopPropagation()"
                class="text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-all"
                aria-label="Eliminar ejercicio"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>

            <!-- Type + Tags -->
            <div class="border-t border-white/5 px-5 sm:px-6 pt-5 pb-6 space-y-6 bg-[var(--color-bg-input)]/20">

              <!-- Type toggle -->
              <div class="flex gap-3">
                <button
                  type="button"
                  (click)="setExerciseType(exercise._uid, 'strength'); $event.stopPropagation()"
                  class="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl font-semibold uppercase tracking-wider text-[11px] transition-all"
                  [class]="exercise.type === 'strength'
                    ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] border border-white/5 hover:bg-white/5'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
                  Fuerza
                </button>
                <button
                  type="button"
                  (click)="setExerciseType(exercise._uid, 'cardio'); $event.stopPropagation()"
                  class="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl font-semibold uppercase tracking-wider text-[11px] transition-all"
                  [class]="exercise.type === 'cardio'
                    ? 'bg-[var(--color-accent-success)]/20 text-[var(--color-accent-success)] border border-[var(--color-accent-success)]/30'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] border border-white/5 hover:bg-white/5'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  Cardio
                </button>
              </div>

              <!-- Muscle Tags -->
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Grupo muscular</p>
                <div class="flex flex-wrap gap-2">
                  @for (tag of allTags; track tag) {
                    <button
                      type="button"
                      (click)="toggleTag(exercise._uid, tag); $event.stopPropagation()"
                      class="px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all active:scale-95 border"
                      [style.background]="hasTag(exercise, tag) ? getTagColor(tag).bg : 'var(--color-bg-primary)'"
                      [style.border-color]="hasTag(exercise, tag) ? getTagColor(tag).border : 'rgba(255,255,255,0.05)'"
                      [style.color]="hasTag(exercise, tag) ? getTagColor(tag).text : 'var(--color-text-muted)'"
                      [class]="hasTag(exercise, tag) ? 'opacity-100' : 'opacity-70 hover:opacity-100 hover:bg-white/5'"
                    >{{ tag }}</button>
                  }
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Add exercise button -->
      <button
        type="button"
        (click)="addExercise()"
        class="w-full flex items-center justify-center gap-2 min-h-[56px] rounded-2xl border border-dashed border-white/20 text-[var(--color-text-muted)] font-semibold uppercase tracking-wider active:scale-95 transition-all hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)] bg-[var(--color-bg-input)]/50 hover:bg-[var(--color-bg-input)]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
        Añadir ejercicio
      </button>

      <!-- Error message -->
      @if (errorMessage()) {
        <div class="px-5 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold tracking-wide">
          {{ errorMessage() }}
        </div>
      }

      <!-- Action buttons -->
      <div class="flex flex-col gap-3 mt-2">
        <button
          (click)="saveTemplate()"
          class="btn-primary min-h-[56px] text-base rounded-2xl"
        >
          Guardar Rutina
        </button>
        <button
          (click)="cancel()"
          class="btn-secondary min-h-[56px] rounded-2xl text-base"
        >
          Cancelar
        </button>
      </div>
    </div>
  `,
  styles: `:host { display: block; }`, changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateEditorComponent implements OnInit {
  private routineUseCases = inject(RoutineUseCases);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditing = signal(false);
  editingId = signal<string | null>(null);
  templateName = signal('');
  // Use ExerciseWithId internally so @for can track by stable _uid
  exercises = signal<ExerciseWithId[]>([]);
  errorMessage = signal('');

  readonly allTags: MuscleTag[] = MUSCLE_TAGS;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.editingId.set(id);
      const template = await this.routineUseCases.getRoutine(id);
      if (template) {
        this.templateName.set(template.name);
        this.exercises.set(template.exercises.map(e => ({ ...e, _uid: generateId() })));
      }
    }
  }

  /** Helper: find the current index of an exercise by its uid */
  getIndex(ej: ExerciseWithId): number {
    return this.exercises().findIndex(e => e._uid === ej._uid);
  }

  drop(event: CdkDragDrop<string[]>) {
    const ejs = [...this.exercises()];
    moveItemInArray(ejs, event.previousIndex, event.currentIndex);
    this.exercises.set(ejs);
  }

  addExercise() {
    this.exercises.update(list => [
      ...list,
      { name: '', type: 'strength' as ExerciseType, tags: [], _uid: generateId() },
    ]);
  }

  removeExercise(uid: string) {
    this.exercises.update(list => list.filter(e => e._uid !== uid));
  }

  updateExerciseName(uid: string, name: string) {
    this.exercises.update(list =>
      list.map(e => e._uid === uid ? { ...e, name: name } : e)
    );
  }

  setExerciseType(uid: string, type: ExerciseType) {
    this.exercises.update(list =>
      list.map(e => e._uid === uid ? { ...e, type } : e)
    );
  }

  toggleTag(uid: string, tag: MuscleTag) {
    this.exercises.update(list =>
      list.map(e => {
        if (e._uid !== uid) return e;
        const currentTags = e.tags ?? [];
        return {
          ...e,
          tags: currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag],
        };
      })
    );
  }

  hasTag(exercise: ExerciseWithId, tag: MuscleTag): boolean {
    return (exercise.tags ?? []).includes(tag);
  }

  getTagColor(tag: MuscleTag) {
    return TAG_COLORS[tag];
  }

  async saveTemplate() {
    this.errorMessage.set('');

    const name = this.templateName().trim();
    if (!name) {
      this.errorMessage.set('El nombre de la rutina es obligatorio.');
      return;
    }

    const exercisesList = this.exercises();
    if (exercisesList.length === 0) {
      this.errorMessage.set('Añade al menos un ejercicio.');
      return;
    }

    if (exercisesList.some(e => !e.name.trim())) {
      this.errorMessage.set('Todos los ejercicios deben tener un nombre.');
      return;
    }

    const template: Routine = {
      id: this.editingId() ?? generateId(),
      schemaVersion: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deviceId: 'local',
      version: 1,
      syncStatus: 'local_only',
      name: name,
      // Strip internal _uid before saving
      exercises: exercisesList.map(({ _uid: _discard, ...e }) => ({
        name: e.name.trim(),
        type: e.type,
        tags: e.tags ?? [],
      })),
    };

    await this.routineUseCases.updateRoutine(template);
    this.router.navigate(['/templates']);
  }

  cancel() {
    this.router.navigate(['/templates']);
  }
}
