import { Component, input, output, signal, computed, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-rest-timer',
  standalone: true,
  template: `
    <div
      class="flex flex-col items-center gap-4 rounded-2xl bg-[var(--color-bg-card)] p-8 border transition-all duration-300 "
      [class]="contenedorClases()"
    >
      <span class="text-xs  text-[var(--color-text-muted)] font-black">Descanso</span>

      <!-- SVG Circular Progress -->
      <div class="relative flex items-center justify-center" style="width:140px;height:140px">
        <svg class="absolute inset-0 -rotate-90" viewBox="0 0 140 140">
          <circle
            cx="70" cy="70" r="62"
            fill="none"
            stroke="var(--color-bg-input)"
            stroke-width="10"
          />
          <circle
            cx="70" cy="70" r="62"
            fill="none"
            [attr.stroke]="terminado() ? '#f43f5e' : '#00f2fe'"
            stroke-width="10"
            stroke-linecap="round"
            [attr.stroke-dasharray]="circumferencia"
            [attr.stroke-dashoffset]="dashOffset()"
            class="transition-all duration-300 drop-"
          />
        </svg>
        <span
          class="text-4xl font-mono font-black z-10 drop-"
          [class.text-[#00f2fe]]="!terminado() && activo()"
          [class.text-rose-500]="terminado()"
          [class.text-[var(--color-text-primary)]]="!activo() && !terminado()"
        >
          {{ tiempoFormateado() }}
        </span>
      </div>

      <!-- Botones -->
      <div class="flex items-center justify-center gap-4 mt-4 w-full px-2">
        <button (click)="adjustTime(-30)" class="h-[60px] flex-1 rounded-xl bg-[var(--color-bg-input)] text-[var(--color-text-muted)] text-base font-bold active:scale-95 transition-all duration-300 hover:bg-[#00f2fe]/10 hover:text-[#00f2fe] border border-[var(--color-border)] hover:border-[#00f2fe]/30">-30s</button>
        
        <button (click)="reiniciar()" class="h-[60px] w-[60px] shrink-0 flex items-center justify-center rounded-xl bg-[var(--color-bg-input)] text-[var(--color-text-muted)] active:scale-95 transition-all duration-300 hover:bg-rose-500/10 hover:text-rose-400 border border-[var(--color-border)] hover:border-rose-500/30" aria-label="Reiniciar">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        
        <button (click)="toggleTimer()" class="h-[72px] w-[72px] shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#00f2fe] to-[#4facfe] text-[#0a0a0a] active:scale-90 transition-all duration-300  hover:" aria-label="Play/Pause">
          @if (activo()) {
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          }
        </button>

        <button (click)="adjustTime(30)" class="h-[60px] flex-1 rounded-xl bg-[var(--color-bg-input)] text-[var(--color-text-muted)] text-base font-bold active:scale-95 transition-all duration-300 hover:bg-[#00f2fe]/10 hover:text-[#00f2fe] border border-[var(--color-border)] hover:border-[#00f2fe]/30">+30s</button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes pulse-border {
      0%, 100% { border-color: #f43f5e; box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); background-color: rgba(244, 63, 94, 0.05); }
      50% { border-color: #fb7185; box-shadow: 0 0 30px 10px rgba(244, 63, 94, 0.4); background-color: rgba(244, 63, 94, 0.15); }
    }
    :host .timer-finished {
      animation: pulse-border 1s ease-in-out infinite;
      border-color: #f43f5e;
    }
    :host .timer-active {
      border-color: #00f2fe;
      box-shadow: 0 0 20px rgba(0,242,254,0.1);
    }
    :host .timer-idle {
      border-color: var(--color-border);
    }
  `], changeDetection: ChangeDetectionStrategy.OnPush
})
export class RestTimerComponent implements OnInit, OnDestroy {
  // ─── Inputs / Outputs ───
  duracion = input<number>(90);
  timerFinished = output<void>();

  // ─── State ───
  segundosRestantes = signal(0);
  duracionActual = signal(0);
  activo = signal(false);
  terminado = signal(false);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  readonly circumferencia = 2 * Math.PI * 62; // ~389.55

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
      
      const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        
        // Envelope para evitar clicks
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
        gainNode.gain.setValueAtTime(0.5, startTime + duration - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      // Triple beep pattern
      playTone(523.25, now, 0.15);       // C5
      playTone(523.25, now + 0.25, 0.15); // C5
      playTone(659.25, now + 0.5, 0.4);  // E5 (longer)
      
      setTimeout(() => ctx.close(), 1000);
    } catch {
      // AudioContext not available
    }
  }

  private vibrar(): void {
    try {
      // Patrón intenso para el final del descanso
      navigator?.vibrate?.([500, 150, 500, 150, 500]);
    } catch {
      // Ignorar errores en navegadores sin soporte
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
