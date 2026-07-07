import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Template,
  LogDiario,
  EjercicioLog,
  SerieFuerza,
  Sugerencia,
  UserSettings,
  DEFAULT_SETTINGS,
} from '../../models/interfaces';
import { DbService } from '../../services/db.service';
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
    <div class="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] pb-24">
      <!-- Header con fecha -->
      <header class="px-4 pt-6 pb-4">
        <p class="text-sm text-[#737373] uppercase tracking-widest">Entrenamiento</p>
        <h1 class="text-xl font-bold capitalize">{{ fechaDisplay() }}</h1>
      </header>

      <!-- Vista: Selección de template -->
      @if (!logActivo()) {
        <div class="px-4 space-y-4 animate-fade-in">
          <h2 class="text-base font-semibold text-[#737373]">Elige tu rutina</h2>

          @if (templates().length === 0) {
            <div class="rounded-2xl bg-[#141414] p-8 text-center space-y-2">
              <p class="text-[#737373] text-sm">No tienes plantillas creadas.</p>
              <p class="text-[#737373] text-xs">Ve a Configuración para crear una.</p>
            </div>
          }

          <div class="grid grid-cols-2 gap-3">
            @for (tmpl of templates(); track tmpl.id) {
              <button
                (click)="seleccionarTemplate(tmpl)"
                class="flex flex-col items-start gap-2 rounded-2xl bg-[#141414] border border-[#1e1e1e] p-5 min-h-[120px] text-left active:scale-[0.97] transition-transform hover:border-cyan-400/40"
              >
                <span class="text-base font-bold text-[#f5f5f5]">{{ tmpl.nombre }}</span>
                <span class="text-xs text-[#737373]">
                  {{ tmpl.ejercicios.length }} ejercicio{{ tmpl.ejercicios.length !== 1 ? 's' : '' }}
                </span>
              </button>
            }
          </div>
        </div>
      }

      <!-- Vista: Entrenamiento activo -->
      @if (logActivo()) {
        <div class="px-4 space-y-4 animate-scale-in">
          <!-- Header Entrenamiento y Cancelar -->
          <div class="flex items-center justify-between">
            <button
              (click)="cancelarEntrenamiento()"
              class="text-sm text-[#737373] hover:text-rose-500 transition-colors flex items-center gap-1 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Cancelar
            </button>
            <span class="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-md">En curso</span>
          </div>

          <!-- Barra de Progreso -->
          <div class="space-y-1.5 pb-2">
            <div class="flex justify-between text-[10px] text-[#737373] font-bold uppercase tracking-wider">
              <span>Progreso</span>
              <span class="text-cyan-400">{{ getCompletedExercisesCount() }} / {{ logActivo()!.ejercicios.length }} completados</span>
            </div>
            <div class="w-full h-1.5 bg-[#141414] rounded-full overflow-hidden border border-[#1e1e1e]">
              <div 
                class="h-full bg-cyan-400 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                [style.width.%]="(getCompletedExercisesCount() / logActivo()!.ejercicios.length) * 100"
              ></div>
            </div>
          </div>

          <!-- Rest Timer -->
          <app-rest-timer
            #restTimerRef
            [duracion]="settings().tiempoDescanso"
            (timerFinished)="onTimerFinished()"
          />

          <!-- Ejercicios -->
          @for (ejLog of logActivo()!.ejercicios; track ejLog.nombre; let i = $index) {
            @if (ejLog.tipo === 'fuerza') {
              <app-exercise-strength
                [ejercicioLog]="ejLog"
                [sugerencia]="sugerencias()[i] ?? null"
                [unidadPeso]="settings().unidadPeso"
                (serieCompletada)="onSerieCompletada($event)"
                (logUpdated)="onLogUpdated($event)"
              />
            } @else {
              <app-exercise-cardio
                [ejercicioLog]="ejLog"
                [unidadDistancia]="settings().unidadDistancia"
                (logUpdated)="onLogUpdated($event)"
              />
            }
          }

          <!-- Notas del día -->
          <div class="space-y-2">
            <label class="text-xs text-[#737373] uppercase tracking-wide">Notas del día</label>
            <textarea
              [ngModel]="notasDelDia()"
              (ngModelChange)="actualizarNotas($event)"
              placeholder="¿Cómo te sentiste hoy?"
              rows="3"
              class="w-full rounded-xl bg-[#141414] border border-[#737373]/30 px-4 py-3 text-sm text-[#f5f5f5] placeholder-[#737373] focus:outline-none focus:border-cyan-400 transition-colors resize-none"
            ></textarea>
          </div>

          <!-- Botón Finalizar -->
          <button
            (click)="finalizarEntrenamiento()"
            class="w-full min-h-16 rounded-2xl bg-emerald-500 text-white font-bold text-lg active:scale-[0.97] transition-transform shadow-lg shadow-emerald-500/20"
          >
            Finalizar Entrenamiento
          </button>
        </div>
      }

      <!-- Toast de éxito -->
      @if (mostrarToast()) {
        <div class="fixed bottom-28 left-4 right-4 z-50 rounded-2xl bg-emerald-500 px-6 py-4 flex items-center justify-center gap-3 text-white shadow-xl animate-slide-up">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span class="font-bold text-sm tracking-wide">¡Entrenamiento guardado con éxito!</span>
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
  `],
})
export class WorkoutComponent implements OnInit {
  // ─── DI ───
  private db = inject(DbService);
  private progression = inject(ProgressionService);
  private router = inject(Router);

  @ViewChild('restTimerRef') restTimerRef!: RestTimerComponent;

  // ─── State ───
  fechaDisplay = signal('');
  fechaISO = signal('');
  templates = signal<Template[]>([]);
  settings = signal<UserSettings>({ ...DEFAULT_SETTINGS });
  logActivo = signal<LogDiario | null>(null);
  sugerencias = signal<(Sugerencia | null)[]>([]);
  notasDelDia = signal('');
  mostrarToast = signal(false);

  // ─── Lifecycle ───
  async ngOnInit() {
    // Format date in Spanish
    const hoy = new Date();
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    this.fechaDisplay.set(hoy.toLocaleDateString('es-ES', opciones));
    this.fechaISO.set(hoy.toISOString().split('T')[0]);

    // Load data
    const [tmpls, setts] = await Promise.all([
      this.db.getTemplates(),
      this.db.getSettings(),
    ]);
    this.templates.set(tmpls);
    this.settings.set(setts);
  }

  // ─── Template Selection ───
  async seleccionarTemplate(tmpl: Template): Promise<void> {
    const ejercicios: EjercicioLog[] = tmpl.ejercicios.map((ej) => ({
      nombre: ej.nombre,
      tipo: ej.tipo,
      series: ej.tipo === 'fuerza' ? [] : undefined,
      cardio: ej.tipo === 'cardio' ? { distanciaKm: 0, tiempoMinutos: 0 } : undefined,
    }));

    const log: LogDiario = {
      fecha: this.fechaISO(),
      templateId: tmpl.id,
      ejercicios,
      notas: '',
    };

    this.logActivo.set(log);
    this.notasDelDia.set('');

    // Load progression suggestions for strength exercises
    await this.cargarSugerencias(log);
  }

  private async cargarSugerencias(log: LogDiario): Promise<void> {
    const mesId = this.fechaISO().substring(0, 7);
    const setts = this.settings();

    const promesas = log.ejercicios.map((ej) => {
      if (ej.tipo === 'fuerza') {
        return this.progression.getSugerencia(ej.nombre, mesId, setts);
      }
      return Promise.resolve(null);
    });

    const resultados = await Promise.all(promesas);
    this.sugerencias.set(resultados);
  }

  // ─── Exercise Events ───
  onSerieCompletada(_serie: SerieFuerza): void {
    // Start rest timer when a set is completed
    if (this.restTimerRef) {
      this.restTimerRef.reiniciar();
      this.restTimerRef.iniciar();
    }
    this.autoGuardar();
  }

  onLogUpdated(_ejLog: EjercicioLog): void {
    this.autoGuardar();
  }

  onTimerFinished(): void {
    // Timer finished - the component handles its own UI/audio/vibration
  }

  // ─── Progress ───
  getCompletedExercisesCount(): number {
    const log = this.logActivo();
    if (!log) return 0;
    
    return log.ejercicios.filter(ej => {
      if (ej.tipo === 'fuerza') {
        return ej.series && ej.series.length > 0;
      } else {
        return ej.cardio && (ej.cardio.distanciaKm > 0 || ej.cardio.tiempoMinutos > 0);
      }
    }).length;
  }

  // ─── Notes ───
  actualizarNotas(value: string): void {
    this.notasDelDia.set(value);
    const log = this.logActivo();
    if (log) {
      log.notas = value;
      this.autoGuardar();
    }
  }

  // ─── Auto-save ───
  private async autoGuardar(): Promise<void> {
    const log = this.logActivo();
    if (!log) return;
    try {
      await this.db.saveLog(log);
    } catch {
      // Silent fail for auto-save
    }
  }

  // ─── Finalize ───
  async finalizarEntrenamiento(): Promise<void> {
    const log = this.logActivo();
    if (!log) return;

    log.notas = this.notasDelDia();
    await this.db.saveLog(log);

    // Show toast
    this.mostrarToast.set(true);
    setTimeout(() => {
      this.mostrarToast.set(false);
    }, 3000);

    // Reset to template selection
    this.logActivo.set(null);
    this.sugerencias.set([]);
    this.notasDelDia.set('');
  }

  // ─── Cancel ───
  cancelarEntrenamiento(): void {
    this.logActivo.set(null);
    this.sugerencias.set([]);
    this.notasDelDia.set('');
  }
}
