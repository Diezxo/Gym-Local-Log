import { Component, input, output, signal, computed, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-rest-timer',
  standalone: true,
  template: `
    <div
      class="flex flex-col items-center gap-3 rounded-2xl bg-[#141414] p-4 border transition-all duration-300"
      [class]="contenedorClases()"
    >
      <span class="text-xs uppercase tracking-widest text-[#737373]">Descanso</span>

      <!-- SVG Circular Progress -->
      <div class="relative flex items-center justify-center" style="width:120px;height:120px">
        <svg class="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="#1e1e1e"
            stroke-width="8"
          />
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            [attr.stroke]="terminado() ? '#f43f5e' : '#22d3ee'"
            stroke-width="8"
            stroke-linecap="round"
            [attr.stroke-dasharray]="circumferencia"
            [attr.stroke-dashoffset]="dashOffset()"
            class="transition-all duration-300"
          />
        </svg>
        <span
          class="text-3xl font-mono font-bold z-10"
          [class.text-cyan-400]="!terminado() && activo()"
          [class.text-rose-500]="terminado()"
          [class.text-[#f5f5f5]]="!activo() && !terminado()"
        >
          {{ tiempoFormateado() }}
        </span>
      </div>

      <!-- Botones -->
      <div class="flex gap-2">
        @if (!activo() && !terminado()) {
          <button
            (click)="iniciar()"
            class="min-h-14 rounded-xl bg-cyan-400 px-6 text-[#0a0a0a] font-semibold text-sm active:scale-95 transition-transform"
          >
            Iniciar
          </button>
        }
        @if (activo()) {
          <button
            (click)="pausar()"
            class="min-h-14 rounded-xl bg-[#1e1e1e] px-6 text-[#f5f5f5] font-semibold text-sm border border-[#737373] active:scale-95 transition-transform"
          >
            Pausar
          </button>
        }
        @if (!activo() && segundosRestantes() < duracion() && !terminado()) {
          <button
            (click)="iniciar()"
            class="min-h-14 rounded-xl bg-cyan-400 px-6 text-[#0a0a0a] font-semibold text-sm active:scale-95 transition-transform"
          >
            Reanudar
          </button>
        }
        <button
          (click)="reiniciar()"
          class="min-h-14 rounded-xl bg-[#1e1e1e] px-6 text-[#737373] font-semibold text-sm border border-[#1e1e1e] active:scale-95 transition-transform"
        >
          Reiniciar
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes pulse-border {
      0%, 100% { border-color: #f43f5e; box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); }
      50% { border-color: #fb7185; box-shadow: 0 0 16px 4px rgba(244, 63, 94, 0.25); }
    }
    :host .timer-finished {
      animation: pulse-border 1s ease-in-out infinite;
      border-color: #f43f5e;
    }
    :host .timer-active {
      border-color: #22d3ee;
    }
    :host .timer-idle {
      border-color: #1e1e1e;
    }
  `],
})
export class RestTimerComponent implements OnDestroy {
  // ─── Inputs / Outputs ───
  duracion = input<number>(90);
  timerFinished = output<void>();

  // ─── State ───
  segundosRestantes = signal(0);
  activo = signal(false);
  terminado = signal(false);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  readonly circumferencia = 2 * Math.PI * 52; // ~326.73

  // ─── Computed ───
  tiempoFormateado = computed(() => {
    const total = this.segundosRestantes();
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  });

  dashOffset = computed(() => {
    const dur = this.duracion();
    if (dur === 0) return 0;
    const progreso = this.segundosRestantes() / dur;
    return this.circumferencia * (1 - progreso);
  });

  contenedorClases = computed(() => {
    if (this.terminado()) return 'timer-finished';
    if (this.activo()) return 'timer-active';
    return 'timer-idle';
  });

  constructor() {
    this.segundosRestantes.set(this.duracion());
  }

  // ─── Public API ───

  iniciar(): void {
    if (this.activo()) return;

    // If finished or not yet started, reset to full duration
    if (this.terminado() || this.segundosRestantes() === 0) {
      this.segundosRestantes.set(this.duracion());
      this.terminado.set(false);
    }

    // If first start (still at default 0 from constructor race), set duration
    if (this.segundosRestantes() === 0) {
      this.segundosRestantes.set(this.duracion());
    }

    this.activo.set(true);
    this.intervalId = setInterval(() => {
      const restante = this.segundosRestantes();
      if (restante <= 1) {
        this.segundosRestantes.set(0);
        this.detener();
        this.terminado.set(true);
        this.timerFinished.emit();
        this.reproducirBeep();
        this.vibrar();
      } else {
        this.segundosRestantes.set(restante - 1);
      }
    }, 1000);
  }

  pausar(): void {
    this.detener();
  }

  reiniciar(): void {
    this.detener();
    this.segundosRestantes.set(this.duracion());
    this.terminado.set(false);
  }

  ngOnDestroy(): void {
    this.detener();
  }

  // ─── Private helpers ───

  private detener(): void {
    this.activo.set(false);
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private reproducirBeep(): void {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 440;
      gainNode.gain.value = 0.3;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.3);
      oscillator.onended = () => ctx.close();
    } catch {
      // AudioContext not available
    }
  }

  private vibrar(): void {
    try {
      navigator?.vibrate?.([200, 100, 200]);
    } catch {
      // Vibration API not available
    }
  }
}
