import { Component, input, output, signal, computed, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-rest-timer',
  standalone: true,
  template: `
    <div
      class="flex flex-col items-center gap-4 rounded-3xl bg-[var(--color-bg-card)] p-6 sm:p-8 border border-white/5 shadow-sm transition-all duration-300"
      [class]="containerClasses()"
    >
      <span class="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wider">Descanso</span>

      <!-- SVG Circular Progress -->
      <div class="relative flex items-center justify-center" style="width:160px;height:160px">
        <svg class="absolute inset-0 -rotate-90" viewBox="0 0 160 160">
          <defs>
            <linearGradient id="timer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--color-accent)" />
              <stop offset="100%" stop-color="var(--color-accent-secondary)" />
            </linearGradient>
            <linearGradient id="timer-finished-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f43f5e" />
              <stop offset="100%" stop-color="#fb7185" />
            </linearGradient>
          </defs>
          <circle
            cx="80" cy="80" r="72"
            fill="none"
            stroke="var(--color-bg-input)"
            stroke-width="8"
          />
          <circle
            cx="80" cy="80" r="72"
            fill="none"
            [attr.stroke]="isFinished() ? 'url(#timer-finished-grad)' : 'url(#timer-grad)'"
            stroke-width="8"
            stroke-linecap="round"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="dashOffset()"
            class="transition-all duration-300"
          />
        </svg>
        <span
          class="text-4xl font-mono font-semibold z-10 transition-colors duration-300"
          [class.text-[var(--color-text-primary)]]="!isFinished()"
          [class.text-rose-400]="isFinished()"
        >
          {{ formattedTime() }}
        </span>
      </div>

      <!-- Botones -->
      <div class="flex items-center justify-center gap-4 mt-2 w-full px-2 max-w-[280px]">
        <button (click)="adjustTime(-30)" class="h-12 flex-1 rounded-full bg-[var(--color-bg-input)] text-[var(--color-text-muted)] text-sm font-medium hover:text-white transition-all duration-200 hover:bg-[var(--color-bg-elevated)] active:scale-95">-30s</button>
        
        <button (click)="restart()" class="h-12 w-12 shrink-0 flex items-center justify-center rounded-full bg-[var(--color-bg-input)] text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 active:scale-95" aria-label="Reiniciar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        
        <button (click)="toggleTimer()" class="h-14 w-14 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:opacity-90 active:scale-95 transition-all duration-200" aria-label="Play/Pause">
          @if (isActive()) {
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="4" height="16" x="6" y="4" rx="1"/><rect width="4" height="16" x="14" y="4" rx="1"/></svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-1"><path d="M6 4l14 8-14 8V4z"/></svg>
          }
        </button>

        <button (click)="adjustTime(30)" class="h-12 flex-1 rounded-full bg-[var(--color-bg-input)] text-[var(--color-text-muted)] text-sm font-medium hover:text-white transition-all duration-200 hover:bg-[var(--color-bg-elevated)] active:scale-95">+30s</button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 15px -3px rgba(244, 63, 94, 0.1); border-color: rgba(244, 63, 94, 0.1); }
      50% { box-shadow: 0 0 25px -3px rgba(244, 63, 94, 0.3); border-color: rgba(244, 63, 94, 0.3); }
    }
    :host .timer-finished {
      animation: pulse-glow 1.5s ease-in-out infinite;
    }
    :host .timer-active {
      border-color: rgba(59, 130, 246, 0.15);
      box-shadow: 0 8px 20px -5px rgba(59, 130, 246, 0.1);
    }
    :host .timer-idle {
      /* default styles from tailwind classes */
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
