import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DbService } from '../../services/db.service';
import {
  Template, EjercicioBase, TipoEjercicio,
  MuscleTag, MUSCLE_TAGS, TAG_COLORS,
} from '../../models/interfaces';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-template-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="min-h-screen bg-[#0a0a0a] px-5 pt-8 pb-32">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-[#f5f5f5] tracking-tight">
          {{ isEditing() ? 'Editar Rutina' : 'Nueva Rutina' }}
        </h1>
      </div>

      <!-- Template name input -->
      <div class="mb-6">
        <input
          type="text"
          [ngModel]="templateName()"
          (ngModelChange)="templateName.set($event)"
          placeholder="Nombre de la rutina"
          class="w-full min-h-14 px-4 rounded-xl bg-[#111] border border-[#1a1a1a] text-[#f5f5f5] text-lg placeholder-[#404040] focus:outline-none focus:border-cyan-400 transition-colors"
        />
      </div>

      <!-- Exercises list -->
      <div class="flex flex-col gap-4 mb-6" cdkDropList (cdkDropListDropped)="drop($event)">
        @for (ejercicio of ejercicios(); track $index) {
          <div cdkDrag class="bg-[#111] rounded-2xl border border-[#1a1a1a] overflow-hidden">

            <!-- Drag handle + exercise name row -->
            <div class="flex items-center gap-3 p-4">
              <!-- Drag Handle -->
              <div cdkDragHandle class="cursor-grab active:cursor-grabbing text-[#2a2a2a] hover:text-[#404040] transition-colors shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="16" y1="9" y2="9"/><line x1="8" x2="16" y1="15" y2="15"/></svg>
              </div>

              <span class="text-[#404040] text-sm font-bold w-5 shrink-0">{{ $index + 1 }}</span>

              <input
                type="text"
                [ngModel]="ejercicio.nombre"
                (ngModelChange)="updateExerciseName($index, $event)"
                placeholder="Nombre del ejercicio"
                class="flex-1 min-h-11 px-3 rounded-xl bg-[#1a1a1a] border border-[#222] text-[#f5f5f5] text-sm placeholder-[#404040] focus:outline-none focus:border-cyan-400 transition-colors"
              />

              <button
                (click)="removeExercise($index)"
                class="text-[#2a2a2a] hover:text-rose-500 transition-colors p-1 active:scale-90 shrink-0"
                aria-label="Eliminar ejercicio"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>

            <!-- Type + Tags -->
            <div class="border-t border-[#1a1a1a] px-4 pt-3 pb-4 space-y-3">

              <!-- Type toggle -->
              <div class="flex gap-2">
                <button
                  (click)="setExerciseType($index, 'fuerza')"
                  class="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                  [class]="ejercicio.tipo === 'fuerza'
                    ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/30'
                    : 'bg-[#1a1a1a] text-[#404040] border border-[#222] hover:border-[#333]'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
                  Fuerza
                </button>
                <button
                  (click)="setExerciseType($index, 'cardio')"
                  class="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                  [class]="ejercicio.tipo === 'cardio'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-[#1a1a1a] text-[#404040] border border-[#222] hover:border-[#333]'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  Cardio
                </button>
              </div>

              <!-- Muscle Tags -->
              <div>
                <p class="text-[9px] uppercase tracking-wider text-[#404040] mb-2">Grupo muscular</p>
                <div class="flex flex-wrap gap-1.5">
                  @for (tag of allTags; track tag) {
                    <button
                      (click)="toggleTag($index, tag)"
                      class="px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all active:scale-95"
                      [style.background]="hasTag(ejercicio, tag) ? getTagColor(tag).bg : 'rgba(255,255,255,0.03)'"
                      [style.borderColor]="hasTag(ejercicio, tag) ? getTagColor(tag).border : 'rgba(255,255,255,0.06)'"
                      [style.color]="hasTag(ejercicio, tag) ? getTagColor(tag).text : '#404040'"
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
        (click)="addExercise()"
        class="w-full flex items-center justify-center gap-2 min-h-12 rounded-xl border border-dashed border-[#222] text-[#404040] text-sm font-medium active:scale-95 transition-all hover:border-cyan-400/50 hover:text-cyan-400 mb-8"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
        Añadir ejercicio
      </button>

      <!-- Error message -->
      @if (errorMessage()) {
        <div class="mb-4 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm">
          {{ errorMessage() }}
        </div>
      }

      <!-- Action buttons -->
      <div class="flex flex-col gap-3">
        <button
          (click)="saveTemplate()"
          class="w-full min-h-14 rounded-xl bg-cyan-400 text-[#0a0a0a] text-base font-bold active:scale-95 transition-all hover:bg-cyan-300 shadow-lg shadow-cyan-400/20"
        >
          Guardar Rutina
        </button>
        <button
          (click)="cancel()"
          class="w-full min-h-14 rounded-xl bg-transparent text-[#404040] font-medium border border-[#1a1a1a] active:scale-95 transition-all hover:text-[#f5f5f5]"
        >
          Cancelar
        </button>
      </div>
    </div>
  `,
  styles: `:host { display: block; }`,
})
export class TemplateEditorComponent implements OnInit {
  private db = inject(DbService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditing = signal(false);
  editingId = signal<string | null>(null);
  templateName = signal('');
  ejercicios = signal<EjercicioBase[]>([]);
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
        this.ejercicios.set([...template.ejercicios]);
      }
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    const ejs = [...this.ejercicios()];
    moveItemInArray(ejs, event.previousIndex, event.currentIndex);
    this.ejercicios.set(ejs);
  }

  addExercise() {
    this.ejercicios.update(list => [...list, { nombre: '', tipo: 'fuerza' as TipoEjercicio, tags: [] }]);
  }

  removeExercise(index: number) {
    this.ejercicios.update(list => list.filter((_, i) => i !== index));
  }

  updateExerciseName(index: number, name: string) {
    this.ejercicios.update(list => {
      const updated = [...list];
      updated[index] = { ...updated[index], nombre: name };
      return updated;
    });
  }

  setExerciseType(index: number, tipo: TipoEjercicio) {
    this.ejercicios.update(list => {
      const updated = [...list];
      updated[index] = { ...updated[index], tipo };
      return updated;
    });
  }

  toggleTag(index: number, tag: MuscleTag) {
    this.ejercicios.update(list => {
      const updated = [...list];
      const ej = { ...updated[index] };
      const currentTags = ej.tags ?? [];
      if (currentTags.includes(tag)) {
        ej.tags = currentTags.filter(t => t !== tag);
      } else {
        ej.tags = [...currentTags, tag];
      }
      updated[index] = ej;
      return updated;
    });
  }

  hasTag(ejercicio: EjercicioBase, tag: MuscleTag): boolean {
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

    const emptyExercise = exercises.find(e => !e.nombre.trim());
    if (emptyExercise) {
      this.errorMessage.set('Todos los ejercicios deben tener un nombre.');
      return;
    }

    const template: Template = {
      id: this.editingId() ?? crypto.randomUUID(),
      nombre: name,
      ejercicios: exercises.map(e => ({
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
