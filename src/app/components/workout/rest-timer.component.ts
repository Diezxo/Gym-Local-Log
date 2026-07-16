import { Component, input, output, signal, computed, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-rest-timer',
  standalone: true,
  template: `
    <div
      class="flex flex-col items-center gap-4 rounded-xl bg-[var(--color-bg-card)] p-6 sm:p-8 border-2 transition-all duration-300"
      [class]="containerClasses()"
    >
      <span class="text-xs text-[var(--color-text-muted)] font-heading font-black uppercase tracking-widest">Descanso</span>

      <!-- SVG Circular Progress -->
      <div class="relative flex items-center justify-center" style="width:160px;height:160px">
        <svg class="absolute inset-0 -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80" cy="80" r="72"
            fill="none"
            stroke="var(--color-bg-input)"
            stroke-width="12"
          />
          <circle
            cx="80" cy="80" r="72"
            fill="none"
            [attr.stroke]="isFinished() ? '#f43f5e' : 'var(--color-accent)'"
            stroke-width="12"
            stroke-linecap="round"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="dashOffset()"
            class="transition-all duration-300 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
          />
        </svg>
        <span
          class="text-4xl font-mono font-black z-10 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]"
          [class.text-[var(--color-accent)]]="!isFinished() && isActive()"
          [class.text-rose-500]="isFinished()"
          [class.text-[var(--color-text-primary)]]="!isActive() && !isFinished()"
        >
          {{ formattedTime() }}
        </span>
      </div>

      <!-- Botones -->
      <div class="flex items-center justify-center gap-3 mt-4 w-full px-2 max-w-[280px]">
        <button (click)="adjustTime(-30)" class="h-14 flex-1 rounded-md bg-[#111827] text-[var(--color-text-muted)] text-base font-heading font-black uppercase active:translate-y-[2px] active:translate-x-[2px] transition-all duration-200 hover:text-[var(--color-accent)] border-2 border-[var(--color-border)] hover:border-[var(--color-accent)] shadow-[2px_2px_0_rgba(0,0,0,0.5)] hover:shadow-none">-30s</button>
        
        <button (click)="restart()" class="h-14 w-14 shrink-0 flex items-center justify-center rounded-md bg-[#111827] text-[var(--color-text-muted)] active:translate-y-[2px] active:translate-x-[2px] transition-all duration-200 hover:text-rose-500 border-2 border-[var(--color-border)] hover:border-rose-500 shadow-[2px_2px_0_rgba(0,0,0,0.5)] hover:shadow-none" aria-label="Reiniciar">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        
        <button (click)="toggleTimer()" class="h-16 w-16 shrink-0 flex items-center justify-center rounded-lg bg-[var(--color-accent)] text-[#111827] active:translate-y-[4px] active:translate-x-[4px] transition-all duration-200 shadow-[4px_4px_0_rgba(249,115,22,0.5)] active:shadow-none border-2 border-[#111827]" aria-label="Play/Pause">
          @if (isActive()) {
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          }
        </button>

        <button (click)="adjustTime(30)" class="h-14 flex-1 rounded-md bg-[#111827] text-[var(--color-text-muted)] text-base font-heading font-black uppercase active:translate-y-[2px] active:translate-x-[2px] transition-all duration-200 hover:text-[var(--color-accent)] border-2 border-[var(--color-border)] hover:border-[var(--color-accent)] shadow-[2px_2px_0_rgba(0,0,0,0.5)] hover:shadow-none">+30s</button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes pulse-border {
      0%, 100% { border-color: #f43f5e; box-shadow: 6px 6px 0px rgba(244, 63, 94, 0.4); background-color: rgba(244, 63, 94, 0.05); }
      50% { border-color: #fb7185; box-shadow: 6px 6px 0px rgba(244, 63, 94, 0.8); background-color: rgba(244, 63, 94, 0.15); }
    }
    :host .timer-finished {
      animation: pulse-border 1s ease-in-out infinite;
      border-color: #f43f5e;
    }
    :host .timer-active {
      border-color: var(--color-accent);
      box-shadow: 4px 4px 0px rgba(249, 115, 22, 0.5);
    }
    :host .timer-idle {
      border-color: var(--color-border);
      box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.3);
    }
  `], changeDetection: ChangeDetectionStrategy.OnPush
})
export class RestTimerComponent implements OnInit, OnDestroy {
  // ─── Inputs / Outputs ───
  duration = input<number>(90);
  timerFinished = output<void>();

  // ─── State ───
  secondsRemaining = signal(0);
  currentDuration = signal(0);
  isActive = signal(false);
  isFinished = signal(false);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  readonly circumference = 2 * Math.PI * 72; // ~452.39

  // ─── Computed ───
  formattedTime = computed(() => {
    const total = this.secondsRemaining();
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  });

  dashOffset = computed(() => {
    const dur = this.currentDuration();
    if (dur === 0) return 0;
    const progress = this.secondsRemaining() / dur;
    return this.circumference * (1 - progress);
  });

  containerClasses = computed(() => {
    if (this.isFinished()) return 'timer-finished';
    if (this.isActive()) return 'timer-active';
    return 'timer-idle';
  });

  ngOnInit() {
    this.secondsRemaining.set(this.duration());
    this.currentDuration.set(this.duration());
  }

  start(): void {
    if (this.isFinished()) {
      this.restart();
    }
    
    this.isActive.set(true);
    this.isFinished.set(false);
    this.intervalId = setInterval(() => {
      const remaining = this.secondsRemaining();
      if (remaining <= 1) {
        this.secondsRemaining.set(0);
        this.stop();
        this.isFinished.set(true);
        this.timerFinished.emit();
        this.playBeep();
        this.vibrate();
      } else {
        this.secondsRemaining.set(remaining - 1);
      }
    }, 1000);
  }

  toggleTimer() {
    if (this.isActive()) {
      this.pause();
    } else {
      this.start();
    }
  }

  pause(): void {
    this.stop();
  }

  restart(): void {
    this.stop();
    this.secondsRemaining.set(this.duration());
    this.currentDuration.set(this.duration());
    this.isFinished.set(false);
  }

  adjustTime(seconds: number) {
    const current = this.secondsRemaining();
    const next = current + seconds;
    if (next > 0) {
      this.secondsRemaining.set(next);
      if (next > this.currentDuration()) {
        this.currentDuration.set(next);
      }
      this.vibrateShort();
    } else {
      this.secondsRemaining.set(1);
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  // ─── Private helpers ───

  private stop(): void {
    this.isActive.set(false);
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private playBeep(): void {
    try {
      const ctx = new AudioContext();
      
      const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        
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

  private vibrate(): void {
    try {
      navigator?.vibrate?.([500, 150, 500, 150, 500]);
    } catch {
      // Ignore
    }
  }

  private vibrateShort(): void {
    try {
      navigator?.vibrate?.([20]);
    } catch {
      // Ignore
    }
  }
}
