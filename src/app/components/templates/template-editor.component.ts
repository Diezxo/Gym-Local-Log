import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DbService } from '../../services/db.service';
import { Template, EjercicioBase, TipoEjercicio } from '../../models/interfaces';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-template-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="min-h-screen bg-[#0a0a0a] px-6 pt-8 pb-32">
      <!-- Header -->
      <h1 class="text-3xl font-bold text-[#f5f5f5] mb-8 tracking-tight">
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
      <div class="flex flex-col gap-5 mb-8" cdkDropList (cdkDropListDropped)="drop($event)">
        @for (ejercicio of ejercicios(); track $index) {
          <div cdkDrag class="bg-[#141414] rounded-3xl p-6 border border-[#1e1e1e] transition-all duration-300 shadow-sm hover:border-[#2a2a2a] relative">
            
            <!-- Drag Handle -->
            <div cdkDragHandle class="absolute top-4 left-0 right-0 flex justify-center cursor-grab active:cursor-grabbing text-[#2a2a2a] hover:text-[#737373] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="16" y1="9" y2="9"/><line x1="8" x2="16" y1="15" y2="15"/></svg>
            </div>

            <div class="flex items-center gap-4 mb-4 mt-2">
              <span class="text-[#737373] text-sm font-semibold shrink-0">{{ $index + 1 }}.</span>
              <input
                type="text"
                [ngModel]="ejercicio.nombre"
                (ngModelChange)="updateExerciseName($index, $event)"
                placeholder="Nombre del ejercicio"
                class="flex-1 min-h-14 px-4 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a] text-[#f5f5f5] placeholder-[#737373] focus:outline-none focus:border-cyan-400 transition-colors"
              />
              <button
                (click)="removeExercise($index)"
                class="min-h-14 min-w-14 flex items-center justify-center rounded-xl bg-[#1e1e1e] text-[#a3a3a3] active:scale-95 transition-all duration-300 hover:bg-rose-500/10 hover:text-rose-500"
                aria-label="Eliminar ejercicio"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>

            <!-- Type toggle -->
            <div class="flex gap-3">
              <button
                (click)="setExerciseType($index, 'fuerza')"
                class="flex-1 min-h-14 flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300 active:scale-95"
                [class]="ejercicio.tipo === 'fuerza'
                  ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                  : 'bg-[#1e1e1e] text-[#737373] border border-[#2a2a2a] hover:bg-[#2a2a2a]'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
                Fuerza
              </button>
              <button
                (click)="setExerciseType($index, 'cardio')"
                class="flex-1 min-h-14 flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300 active:scale-95"
                [class]="ejercicio.tipo === 'cardio'
                  ? 'bg-green-500/15 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                  : 'bg-[#1e1e1e] text-[#737373] border border-[#2a2a2a] hover:bg-[#2a2a2a]'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4"/><path d="M12 12c-2.8 0-5 2.2-5 5v5"/><path d="M17 12c2.8 0 5 2.2 5 5v5"/><path d="M7 17H2"/></svg>
                Cardio
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Add exercise button -->
      <button
        (click)="addExercise()"
        class="w-full flex items-center justify-center gap-2 min-h-14 rounded-xl border border-dashed border-[#2a2a2a] text-[#737373] font-medium active:scale-[0.98] transition-all duration-300 hover:border-cyan-400 hover:text-cyan-400 hover:bg-cyan-400/5 mb-8"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
        Añadir Ejercicio
      </button>

      <!-- Error message -->
      @if (errorMessage()) {
        <div class="mb-4 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm">
          {{ errorMessage() }}
        </div>
      }

      <!-- Action buttons -->
      <div class="flex flex-col gap-4">
        <button
          (click)="saveTemplate()"
          class="w-full min-h-14 rounded-xl bg-cyan-400 text-[#0a0a0a] text-lg font-bold active:scale-[0.98] transition-all duration-300 hover:bg-cyan-300 shadow-lg shadow-cyan-400/25"
        >
          Guardar Plantilla
        </button>
        <button
          (click)="cancel()"
          class="w-full min-h-14 rounded-xl bg-transparent text-[#737373] font-medium border border-[#1e1e1e] active:scale-[0.98] transition-all duration-300 hover:bg-[#1e1e1e] hover:text-[#f5f5f5]"
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

  drop(event: CdkDragDrop<string[]>) {
    const ejs = [...this.ejercicios()];
    moveItemInArray(ejs, event.previousIndex, event.currentIndex);
    this.ejercicios.set(ejs);
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
