import { Component, OnInit, signal, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DbService } from '../../services/db.service';
import { Template, EjercicioBase, TipoEjercicio } from '../../models/interfaces';

@Component({
  selector: 'app-template-editor',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-[#0a0a0a] px-4 pt-6 pb-28">
      <!-- Header -->
      <h1 class="text-2xl font-bold text-[#f5f5f5] mb-6">
        {{ isEditing() ? 'Editar Rutina' : 'Nueva Rutina' }}
      </h1>

      <!-- Template name input -->
      <div class="mb-6">
        <input
          type="text"
          [ngModel]="templateName()"
          (ngModelChange)="templateName.set($event)"
          placeholder="Nombre de la rutina"
          class="w-full min-h-14 px-4 rounded-xl bg-[#141414] border border-[#1e1e1e] text-[#f5f5f5] text-lg placeholder-[#737373] focus:outline-none focus:border-cyan-400 transition-colors"
        />
      </div>

      <!-- Exercises list -->
      <div class="flex flex-col gap-3 mb-6">
        @for (ejercicio of ejercicios(); track $index) {
          <div class="bg-[#141414] rounded-2xl p-4 border border-[#1e1e1e]">
            <div class="flex items-center gap-3 mb-3">
              <span class="text-[#737373] text-sm font-medium shrink-0">{{ $index + 1 }}.</span>
              <input
                type="text"
                [ngModel]="ejercicio.nombre"
                (ngModelChange)="updateExerciseName($index, $event)"
                placeholder="Nombre del ejercicio"
                class="flex-1 min-h-14 px-4 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a] text-[#f5f5f5] placeholder-[#737373] focus:outline-none focus:border-cyan-400 transition-colors"
              />
              <button
                (click)="removeExercise($index)"
                class="min-h-14 min-w-14 flex items-center justify-center rounded-xl bg-[#1e1e1e] text-rose-500 text-xl font-bold active:bg-rose-500/20 transition-colors"
                aria-label="Eliminar ejercicio"
              >
                ×
              </button>
            </div>

            <!-- Type toggle -->
            <div class="flex gap-2">
              <button
                (click)="setExerciseType($index, 'fuerza')"
                class="flex-1 min-h-14 rounded-xl font-medium transition-colors"
                [class]="ejercicio.tipo === 'fuerza'
                  ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/30'
                  : 'bg-[#1e1e1e] text-[#737373] border border-[#2a2a2a]'"
              >
                💪 Fuerza
              </button>
              <button
                (click)="setExerciseType($index, 'cardio')"
                class="flex-1 min-h-14 rounded-xl font-medium transition-colors"
                [class]="ejercicio.tipo === 'cardio'
                  ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                  : 'bg-[#1e1e1e] text-[#737373] border border-[#2a2a2a]'"
              >
                🏃 Cardio
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Add exercise button -->
      <button
        (click)="addExercise()"
        class="w-full min-h-14 rounded-xl border-2 border-dashed border-[#1e1e1e] text-[#737373] font-medium active:border-cyan-400 active:text-cyan-400 transition-colors mb-8"
      >
        + Añadir Ejercicio
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
          class="w-full min-h-14 rounded-xl bg-cyan-400 text-[#0a0a0a] text-lg font-bold active:bg-cyan-500 transition-colors shadow-lg shadow-cyan-400/25"
        >
          Guardar Plantilla
        </button>
        <button
          (click)="cancel()"
          class="w-full min-h-14 rounded-xl bg-[#141414] text-[#737373] font-medium border border-[#1e1e1e] active:bg-[#1e1e1e] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
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

  addExercise() {
    this.ejercicios.update(list => [...list, { nombre: '', tipo: 'fuerza' as TipoEjercicio }]);
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
      ejercicios: exercises.map(e => ({ nombre: e.nombre.trim(), tipo: e.tipo })),
    };

    await this.db.saveTemplate(template);
    this.router.navigate(['/templates']);
  }

  cancel() {
    this.router.navigate(['/templates']);
  }
}
