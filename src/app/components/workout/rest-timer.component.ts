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
      <div class="flex items-center justify-center gap-3 mt-6 w-full px-6">
        <button (click)="adjustTime(-30)" class="h-12 flex-1 rounded-xl bg-[#1e1e1e] text-[#a3a3a3] text-sm font-semibold active:scale-95 transition-all duration-300 hover:bg-[#2a2a2a] hover:text-[#f5f5f5]">-30s</button>
        
        <button (click)="reiniciar()" class="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl bg-[#1e1e1e] text-[#a3a3a3] active:scale-95 transition-all duration-300 hover:bg-[#2a2a2a] hover:text-[#f5f5f5]" aria-label="Reiniciar">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        
        <button (click)="toggleTimer()" class="h-14 w-14 shrink-0 flex items-center justify-center rounded-2xl bg-cyan-400 text-[#0a0a0a] active:scale-90 transition-all duration-300 shadow-lg shadow-cyan-400/20 hover:bg-cyan-300" aria-label="Play/Pause">
          @if (activo()) {
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          }
        </button>

        <button (click)="adjustTime(30)" class="h-12 flex-1 rounded-xl bg-[#1e1e1e] text-[#a3a3a3] text-sm font-semibold active:scale-95 transition-all duration-300 hover:bg-[#2a2a2a] hover:text-[#f5f5f5]">+30s</button>
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
  duracionActual = signal(0);
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
    const dur = this.duracionActual();
    if (dur === 0) return 0;
    const progreso = this.segundosRestantes() / dur;
    return this.circumferencia * (1 - progreso);
  });

  contenedorClases = computed(() => {
    if (this.terminado()) return 'timer-finished';
    if (this.activo()) return 'timer-active';
    return 'timer-idle';
  });

  ngOnInit() {
    this.segundosRestantes.set(this.duracion());
    this.duracionActual.set(this.duracion());
  }

  iniciar(): void {
    if (this.terminado()) {
      this.reiniciar();
    }
    
    this.activo.set(true);
    this.terminado.set(false);
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

  toggleTimer() {
    if (this.activo()) {
      this.pausar();
    } else {
      this.iniciar();
    }
  }

  pausar(): void {
    this.detener();
  }

  reiniciar(): void {
    this.detener();
    this.segundosRestantes.set(this.duracion());
    this.duracionActual.set(this.duracion());
    this.terminado.set(false);
  }

  adjustTime(seconds: number) {
    const current = this.segundosRestantes();
    const next = current + seconds;
    if (next > 0) {
      this.segundosRestantes.set(next);
      if (next > this.duracionActual()) {
        this.duracionActual.set(next);
      }
      this.vibrarShort();
    } else {
      this.segundosRestantes.set(1);
    }
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

  private vibrarShort(): void {
    try {
      navigator?.vibrate?.([20]);
    } catch {
      // API not available
    }
  }
}
