import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
    <div class="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] pb-36">

      <!-- Header -->
      <header class="px-6 pt-12 pb-6">
        <p class="text-sm text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-2 font-bold">Entrenar</p>
        <h1 class="text-[40px] leading-tight font-black capitalize tracking-tight">{{ fechaDisplay() }}</h1>
      </header>

      <!-- ── Vista: Selección de template ── -->
      @if (!logActivo()) {
        <div class="px-6 flex flex-col gap-5 animate-fade-in">
          <p class="text-base font-black text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Elige tu rutina</p>

          @if (templates().length === 0) {
            <div class="rounded-[32px] bg-[var(--color-bg-card)] border border-[var(--color-border)] p-12 text-center flex flex-col gap-3 shadow-lg">
              <p class="text-[var(--color-text-primary)] text-lg font-bold">No tienes plantillas creadas.</p>
              <p class="text-[var(--color-text-muted)] text-sm font-medium">Ve a Rutinas para crear una.</p>
            </div>
          }

          @for (tmpl of templates(); track tmpl.id) {
            <button
              (click)="seleccionarTemplate(tmpl)"
              class="w-full text-left bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[32px] overflow-hidden active:scale-[0.98] transition-all hover:border-[#00f2fe]/50 group shadow-lg hover:shadow-xl"
            >
              <!-- Main content -->
              <div class="flex items-center gap-4 p-5">
                <!-- Dumbbell icon -->
                <div class="w-14 h-14 rounded-[20px] bg-[var(--color-bg-input)] border border-[var(--color-border)] flex items-center justify-center shrink-0 group-hover:border-[#00f2fe]/40 transition-colors shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-[#00f2fe] drop-shadow-[0_0_8px_rgba(0,242,254,0.3)] group-hover:drop-shadow-[0_0_12px_rgba(0,242,254,0.6)] transition-all"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
                </div>

                <div class="flex-1 min-w-0">
                  <p class="text-[var(--color-text-primary)] font-black text-lg truncate mb-1">{{ tmpl.nombre }}</p>
                  <p class="text-[var(--color-text-muted)] text-sm truncate font-medium">
                    {{ tmpl.ejercicios.map(e => e.nombre).join(' · ') }}
                  </p>
                </div>

                <span class="shrink-0 text-xs font-bold text-[var(--color-text-secondary)] bg-[var(--color-bg-input)] px-3 py-1.5 rounded-xl border border-[var(--color-border)]">
                  {{ tmpl.ejercicios.length }} ej.
                </span>
              </div>

              <!-- Tags row -->
              @if (getTemplateTags(tmpl).length > 0) {
                <div class="border-t border-[var(--color-border)] px-5 py-3.5 flex flex-wrap gap-2">
                  @for (tag of getTemplateTags(tmpl); track tag) {
                    <span
                      class="px-3 py-1 rounded-full text-[10px] font-bold border"
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
        <div class="px-6 flex flex-col gap-6 animate-scale-in">

          <!-- Active header: template name + timer + cancel -->
          <div class="flex items-center justify-between gap-3 pt-2">
            <button
              (click)="cancelarEntrenamiento()"
              class="text-sm font-bold text-[var(--color-text-muted)] hover:text-rose-500 transition-colors flex items-center gap-1.5 active:scale-95 bg-[var(--color-bg-input)] px-4 py-2 rounded-full border border-[var(--color-border)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Cancelar
            </button>

            <!-- Session timer -->
            <div class="flex items-center gap-2.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-full px-4 py-2 shadow-inner">
              <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
              <span class="font-mono text-base font-black text-[var(--color-text-primary)] tracking-tight">{{ sessionTimerLabel() }}</span>
            </div>

            <span class="text-xs font-black text-[#00f2fe] bg-[#00f2fe]/10 px-4 py-2 rounded-full border border-[#00f2fe]/30 shadow-[0_0_10px_rgba(0,242,254,0.15)]">En curso</span>
          </div>

          <!-- Template name + tags -->
          <div class="flex flex-col gap-3">
            <h2 class="text-2xl font-black text-[var(--color-text-primary)] truncate">{{ activeTemplateName() }}</h2>
            @if (activeTemplateTags().length > 0) {
              <div class="flex flex-wrap gap-2">
                @for (tag of activeTemplateTags(); track tag) {
                  <span
                    class="px-3 py-1 rounded-full text-[11px] font-bold border"
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
            <div class="flex justify-between text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider">
              <span>Progreso</span>
              <span class="text-[#00f2fe]">{{ getCompletedExercisesCount() }} / {{ logActivo()!.ejercicios.length }} completados</span>
            </div>
            <div class="w-full h-2.5 bg-[var(--color-bg-input)] rounded-full overflow-hidden border border-[var(--color-border)] shadow-inner">
              <div
                class="h-full bg-gradient-to-r from-[#00f2fe] to-[#a252ff] transition-all duration-500 ease-out shadow-[0_0_12px_rgba(0,242,254,0.6)] rounded-full"
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
          <div class="flex flex-col gap-3">
            <label class="text-sm text-[var(--color-text-muted)] font-bold uppercase tracking-wider">Notas del día</label>
            <textarea
              [ngModel]="notasDelDia()"
              (ngModelChange)="actualizarNotas($event)"
              placeholder="¿Cómo te sentiste hoy?"
              rows="3"
              class="w-full rounded-[24px] bg-[var(--color-bg-input)] border border-[var(--color-border)] px-5 py-4 text-base font-medium text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[#00f2fe] transition-colors resize-none shadow-inner"
            ></textarea>
          </div>

          <!-- Botón Finalizar -->
          <button
            (click)="finalizarEntrenamiento()"
            class="btn-primary min-h-[72px] text-xl font-black w-full flex items-center justify-center gap-3 mt-4 shadow-[0_10px_30px_rgba(16,185,129,0.3)] bg-gradient-to-r from-emerald-400 to-emerald-600 hover:shadow-[0_15px_40px_rgba(16,185,129,0.5)] border-none"
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
