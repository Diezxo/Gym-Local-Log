import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DbService } from '../../services/db.service';
import {
  Template, EjercicioBase, TipoEjercicio,
  MuscleTag, MUSCLE_TAGS, TAG_COLORS,
} from '../../models/interfaces';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

// Internal type with a stable uid for correct @for tracking
interface EjercicioConId extends EjercicioBase {
  _uid: string;
}

@Component({
  selector: 'app-template-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="min-h-screen bg-[var(--color-bg-primary)] px-6 pt-12 pb-36 flex flex-col gap-4">
      <!-- Header -->
      <div>
        <h1 class="text-[40px] leading-tight font-black text-[var(--color-text-primary)] tracking-tight">
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
          class="w-full min-h-[48px] px-5 rounded-2xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-lg placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[#00f2fe] transition-colors "
        />
      </div>

      <!-- Exercises list -->
      <div class="flex flex-col gap-4" cdkDropList (cdkDropListDropped)="drop($event)">
        <!--
          BUG FIX: track by _uid (stable unique id per exercise object)
          instead of $index. Using $index causes Angular to recycle DOM nodes
          when the signal updates, which makes tag clicks fire on the wrong exercise.
        -->
        @for (ejercicio of ejercicios(); track ejercicio._uid) {
          <div cdkDrag class="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden ">

            <!-- Drag handle + exercise name row -->
            <div class="flex items-center gap-4 p-4">
              <!-- Drag Handle -->
              <div cdkDragHandle class="cursor-grab active:cursor-grabbing text-[var(--color-text-muted)] hover:text-[#00f2fe] transition-colors shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="16" y1="9" y2="9"/><line x1="8" x2="16" y1="15" y2="15"/></svg>
              </div>

              <span class="text-[#00f2fe] text-base font-black w-6 shrink-0">{{ getIndex(ejercicio) + 1 }}</span>

              <input
                type="text"
                [ngModel]="ejercicio.nombre"
                (ngModelChange)="updateExerciseName(ejercicio._uid, $event)"
                placeholder="Nombre del ejercicio"
                class="flex-1 min-h-[56px] px-4 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-bold placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[#00f2fe] transition-colors "
              />

              <button
                type="button"
                (click)="removeExercise(ejercicio._uid); $event.stopPropagation()"
                class="text-[var(--color-text-muted)] hover:text-rose-500 transition-colors p-2 active:scale-90 shrink-0 bg-[var(--color-bg-input)] rounded-full"
                aria-label="Eliminar ejercicio"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>

            <!-- Type + Tags -->
            <div class="border-t border-[var(--color-border)] px-5 pt-4 pb-5 space-y-4">

              <!-- Type toggle -->
              <div class="flex gap-3">
                <button
                  type="button"
                  (click)="setExerciseType(ejercicio._uid, 'fuerza'); $event.stopPropagation()"
                  class="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                  [class]="ejercicio.tipo === 'fuerza'
                    ? 'bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/30 '
                    : 'bg-[var(--color-bg-input)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
                  Fuerza
                </button>
                <button
                  type="button"
                  (click)="setExerciseType(ejercicio._uid, 'cardio'); $event.stopPropagation()"
                  class="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                  [class]="ejercicio.tipo === 'cardio'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 '
                    : 'bg-[var(--color-bg-input)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  Cardio
                </button>
              </div>

              <!-- Muscle Tags -->
              <div>
                <p class="text-[10px]  text-[var(--color-text-muted)] mb-3 font-bold">Grupo muscular</p>
                <div class="flex flex-wrap gap-2">
                  @for (tag of allTags; track tag) {
                    <button
                      type="button"
                      (click)="toggleTag(ejercicio._uid, tag); $event.stopPropagation()"
                      class="px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all active:scale-95"
                      [style.background]="hasTag(ejercicio, tag) ? getTagColor(tag).bg : 'var(--color-bg-input)'"
                      [style.border-color]="hasTag(ejercicio, tag) ? getTagColor(tag).border : 'var(--color-border)'"
                      [style.color]="hasTag(ejercicio, tag) ? getTagColor(tag).text : 'var(--color-text-muted)'"
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
        class="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-2xl border border-dashed border-[var(--color-border-active)] text-[var(--color-text-muted)] text-base font-bold active:scale-95 transition-all hover:border-[#00f2fe] hover:text-[#00f2fe] bg-[var(--color-bg-card)]/50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
        Añadir ejercicio
      </button>

      <!-- Error message -->
      @if (errorMessage()) {
        <div class="px-5 py-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm font-medium">
          {{ errorMessage() }}
        </div>
      }

      <!-- Action buttons -->
      <div class="flex flex-col gap-4 mt-4">
        <button
          (click)="saveTemplate()"
          class="btn-primary min-h-[48px] text-lg font-black"
        >
          Guardar Rutina
        </button>
        <button
          (click)="cancel()"
          class="btn-secondary min-h-[48px] rounded-full text-lg font-bold"
        >
          Cancelar
        </button>
      </div>
    </div>
  `,
  styles: `:host { display: block; }`, changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateEditorComponent implements OnInit {
  private db = inject(DbService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditing = signal(false);
  editingId = signal<string | null>(null);
  templateName = signal('');
  // Use EjercicioConId internally so @for can track by stable _uid
  ejercicios = signal<EjercicioConId[]>([]);
  errorMessage = signal('');

  readonly allTags: MuscleTag[] = MUSCLE_TAGS;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.editingId.set(id);
      const template = await this.db.getTemplate(id);
      if (template) {
        this.templateName.set(template.nombre);
        this.ejercicios.set(template.ejercicios.map(e => ({ ...e, _uid: crypto.randomUUID() })));
      }
    }
  }

  /** Helper: find the current index of an exercise by its uid */
  getIndex(ej: EjercicioConId): number {
    return this.ejercicios().findIndex(e => e._uid === ej._uid);
  }

  drop(event: CdkDragDrop<string[]>) {
    const ejs = [...this.ejercicios()];
    moveItemInArray(ejs, event.previousIndex, event.currentIndex);
    this.ejercicios.set(ejs);
  }

  addExercise() {
    this.ejercicios.update(list => [
      ...list,
      { nombre: '', tipo: 'fuerza' as TipoEjercicio, tags: [], _uid: crypto.randomUUID() },
    ]);
  }

  removeExercise(uid: string) {
    this.ejercicios.update(list => list.filter(e => e._uid !== uid));
  }

  updateExerciseName(uid: string, name: string) {
    this.ejercicios.update(list =>
      list.map(e => e._uid === uid ? { ...e, nombre: name } : e)
    );
  }

  setExerciseType(uid: string, tipo: TipoEjercicio) {
    this.ejercicios.update(list =>
      list.map(e => e._uid === uid ? { ...e, tipo } : e)
    );
  }

  toggleTag(uid: string, tag: MuscleTag) {
    this.ejercicios.update(list =>
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

  hasTag(ejercicio: EjercicioConId, tag: MuscleTag): boolean {
    return (ejercicio.tags ?? []).includes(tag);
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

    const exercises = this.ejercicios();
    if (exercises.length === 0) {
      this.errorMessage.set('Añade al menos un ejercicio.');
      return;
    }

    if (exercises.some(e => !e.nombre.trim())) {
      this.errorMessage.set('Todos los ejercicios deben tener un nombre.');
      return;
    }

    const template: Template = {
      id: this.editingId() ?? crypto.randomUUID(),
      nombre: name,
      // Strip internal _uid before saving
      ejercicios: exercises.map(({ _uid: _discard, ...e }) => ({
        nombre: e.nombre.trim(),
        tipo: e.tipo,
        tags: e.tags ?? [],
      })),
    };

    await this.db.saveTemplate(template);
    this.router.navigate(['/templates']);
  }

  cancel() {
    this.router.navigate(['/templates']);
  }
}
