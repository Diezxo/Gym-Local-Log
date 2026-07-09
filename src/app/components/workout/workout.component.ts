import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
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
  TAG_COLORS,
  MuscleTag,
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
    <div class="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] pb-28">

      <!-- Header -->
      <header class="px-5 pt-7 pb-4">
        <p class="text-xs text-[#404040] uppercase tracking-[0.2em] mb-1">Entrenar</p>
        <h1 class="text-2xl font-bold capitalize">{{ fechaDisplay() }}</h1>
      </header>

      <!-- ── Vista: Selección de template ── -->
      @if (!logActivo()) {
        <div class="px-5 space-y-3 animate-fade-in">
          <p class="text-sm font-semibold text-[#404040] uppercase tracking-wider mb-4">Elige tu rutina</p>

          @if (templates().length === 0) {
            <div class="rounded-2xl bg-[#111] border border-[#1a1a1a] p-10 text-center space-y-2">
              <p class="text-[#404040] text-sm">No tienes plantillas creadas.</p>
              <p class="text-[#2a2a2a] text-xs">Ve a Rutinas para crear una.</p>
            </div>
          }

          @for (tmpl of templates(); track tmpl.id) {
            <button
              (click)="seleccionarTemplate(tmpl)"
              class="w-full text-left bg-[#111] border border-[#1a1a1a] rounded-2xl overflow-hidden active:scale-[0.98] transition-all hover:border-[#222] group"
            >
              <!-- Main content -->
              <div class="flex items-center gap-4 p-4">
                <!-- Dumbbell icon -->
                <div class="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#222] flex items-center justify-center shrink-0 group-hover:border-cyan-400/30 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cyan-400/70 group-hover:text-cyan-400 transition-colors"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
                </div>

                <div class="flex-1 min-w-0">
                  <p class="text-[#f5f5f5] font-bold text-base truncate mb-0.5">{{ tmpl.nombre }}</p>
                  <p class="text-[#404040] text-xs truncate">
                    {{ tmpl.ejercicios.map(e => e.nombre).join(' · ') }}
                  </p>
                </div>

                <span class="shrink-0 text-xs font-bold text-[#404040] bg-[#1a1a1a] px-2 py-1 rounded-lg">
                  {{ tmpl.ejercicios.length }}
                </span>
              </div>

              <!-- Tags row -->
              @if (getTemplateTags(tmpl).length > 0) {
                <div class="border-t border-[#1a1a1a] px-4 py-2.5 flex flex-wrap gap-1.5">
                  @for (tag of getTemplateTags(tmpl); track tag) {
                    <span
                      class="px-2 py-0.5 rounded-full text-[9px] font-bold border"
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

      <!-- ── Vista: Entrenamiento activo ── -->
      @if (logActivo()) {
        <div class="px-5 space-y-4 animate-scale-in">

          <!-- Active header: template name + timer + cancel -->
          <div class="flex items-center justify-between gap-3 py-1">
            <button
              (click)="cancelarEntrenamiento()"
              class="text-xs text-[#404040] hover:text-rose-500 transition-colors flex items-center gap-1 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Cancelar
            </button>

            <!-- Session timer -->
            <div class="flex items-center gap-2 bg-[#111] border border-[#1a1a1a] rounded-xl px-3 py-1.5">
              <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span class="font-mono text-sm font-bold text-[#f5f5f5]">{{ sessionTimerLabel() }}</span>
            </div>

            <span class="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-lg border border-cyan-400/20">En curso</span>
          </div>

          <!-- Template name + tags -->
          <div class="pb-1">
            <h2 class="text-lg font-bold text-[#f5f5f5] truncate mb-2">{{ activeTemplateName() }}</h2>
            @if (activeTemplateTags().length > 0) {
              <div class="flex flex-wrap gap-1.5">
                @for (tag of activeTemplateTags(); track tag) {
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    [style.background]="getTagColor(tag).bg"
                    [style.borderColor]="getTagColor(tag).border"
                    [style.color]="getTagColor(tag).text"
                  >{{ tag }}</span>
                }
              </div>
            }
          </div>

          <!-- Barra de Progreso -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-[10px] text-[#404040] font-bold uppercase tracking-wider">
              <span>Progreso</span>
              <span class="text-cyan-400">{{ getCompletedExercisesCount() }} / {{ logActivo()!.ejercicios.length }} completados</span>
            </div>
            <div class="w-full h-1.5 bg-[#111] rounded-full overflow-hidden border border-[#1a1a1a]">
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
            <label class="text-xs text-[#404040] uppercase tracking-wider">Notas del día</label>
            <textarea
              [ngModel]="notasDelDia()"
              (ngModelChange)="actualizarNotas($event)"
              placeholder="¿Cómo te sentiste hoy?"
              rows="3"
              class="w-full rounded-xl bg-[#111] border border-[#1a1a1a] px-4 py-3 text-sm text-[#f5f5f5] placeholder-[#404040] focus:outline-none focus:border-cyan-400 transition-colors resize-none"
            ></textarea>
          </div>

          <!-- Botón Finalizar -->
          <button
            (click)="finalizarEntrenamiento()"
            class="w-full min-h-16 rounded-2xl bg-emerald-500 text-white font-bold text-lg active:scale-[0.97] transition-transform shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
          >
            ✓ Finalizar Entrenamiento
          </button>
        </div>
      }

      <!-- Toast de éxito -->
      @if (mostrarToast()) {
        <div class="fixed bottom-28 left-4 right-4 z-50 rounded-2xl bg-emerald-500 px-6 py-4 flex items-center justify-center gap-3 text-white shadow-xl animate-slide-up">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span class="font-bold text-sm tracking-wide">¡Entrenamiento guardado!</span>
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
export class WorkoutComponent implements OnInit, OnDestroy {
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
  activeTemplateName = signal('');
  activeTemplateTags = signal<MuscleTag[]>([]);
  sugerencias = signal<(Sugerencia | null)[]>([]);
  notasDelDia = signal('');
  mostrarToast = signal(false);

  // Session timer
  sessionStartTime = signal<number | null>(null);
  sessionTimerLabel = signal('0:00');
  private timerInterval: any;

  async ngOnInit() {
    const hoy = new Date();
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long', day: 'numeric', month: 'long',
    };
    this.fechaDisplay.set(hoy.toLocaleDateString('es-ES', opciones));
    this.fechaISO.set(hoy.toISOString().split('T')[0]);

    const [tmpls, setts] = await Promise.all([
      this.db.getTemplates(),
      this.db.getSettings(),
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
  async seleccionarTemplate(tmpl: Template): Promise<void> {
    const ejercicios: EjercicioLog[] = tmpl.ejercicios.map((ej) => ({
      nombre: ej.nombre,
      tipo: ej.tipo,
      tags: ej.tags ?? [],
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
    this.activeTemplateName.set(tmpl.nombre);
    this.activeTemplateTags.set(this.getTemplateTags(tmpl));
    this.notasDelDia.set('');
    this.startTimer();

    await this.cargarSugerencias(log);
  }

  private async cargarSugerencias(log: LogDiario): Promise<void> {
    const mesId = this.fechaISO().substring(0, 7);
    const setts = this.settings();
    const promesas = log.ejercicios.map((ej) =>
      ej.tipo === 'fuerza'
        ? this.progression.getSugerencia(ej.nombre, mesId, setts)
        : Promise.resolve(null)
    );
    this.sugerencias.set(await Promise.all(promesas));
  }

  // ─── Helpers ───
  getTemplateTags(tmpl: Template): MuscleTag[] {
    const tags = new Set<MuscleTag>();
    tmpl.ejercicios.forEach(e => e.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }

  getTagColor(tag: MuscleTag) {
    return TAG_COLORS[tag] ?? { bg: 'rgba(255,255,255,0.05)', text: '#a3a3a3', border: 'rgba(255,255,255,0.1)' };
  }

  // ─── Exercise Events ───
  onSerieCompletada(_serie: SerieFuerza): void {
    if (this.restTimerRef) {
      this.restTimerRef.reiniciar();
      this.restTimerRef.iniciar();
    }
    this.autoGuardar();
  }

  onLogUpdated(_ejLog: EjercicioLog): void {
    this.autoGuardar();
  }

  onTimerFinished(): void {}

  // ─── Progress ───
  getCompletedExercisesCount(): number {
    const log = this.logActivo();
    if (!log) return 0;
    return log.ejercicios.filter(ej => {
      if (ej.tipo === 'fuerza') return ej.series && ej.series.length > 0;
      return ej.cardio && (ej.cardio.distanciaKm > 0 || ej.cardio.tiempoMinutos > 0);
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
    } catch {}
  }

  // ─── Finalize ───
  async finalizarEntrenamiento(): Promise<void> {
    const log = this.logActivo();
    if (!log) return;

    log.notas = this.notasDelDia();
    await this.db.saveLog(log);
    this.stopTimer();

    this.mostrarToast.set(true);
    setTimeout(() => this.mostrarToast.set(false), 3000);

    this.logActivo.set(null);
    this.activeTemplateName.set('');
    this.activeTemplateTags.set([]);
    this.sugerencias.set([]);
    this.notasDelDia.set('');
  }

  // ─── Cancel ───
  cancelarEntrenamiento(): void {
    this.stopTimer();
    this.logActivo.set(null);
    this.activeTemplateName.set('');
    this.activeTemplateTags.set([]);
    this.sugerencias.set([]);
    this.notasDelDia.set('');
  }
}
