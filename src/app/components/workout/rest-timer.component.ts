import { Component, input, output, signal, computed, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-rest-timer',
  standalone: true,
  template: `
    <div
      class="flex flex-col items-center gap-4 rounded-2xl bg-[var(--color-bg-card)] p-8 border transition-all duration-300 "
      [class]="containerClasses()"
    >
      <span class="text-xs  text-[var(--color-text-muted)] font-black">Rest</span>

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
            [attr.stroke]="isFinished() ? '#f43f5e' : '#00f2fe'"
            stroke-width="10"
            stroke-linecap="round"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="dashOffset()"
            class="transition-all duration-300"
          />
        </svg>
        <span
          class="text-4xl font-mono font-black z-10"
          [class.text-[#00f2fe]]="!isFinished() && isActive()"
          [class.text-rose-500]="isFinished()"
          [class.text-[var(--color-text-primary)]]="!isActive() && !isFinished()"
        >
          {{ formattedTime() }}
        </span>
      </div>

      <!-- Botones -->
      <div class="flex items-center justify-center gap-4 mt-4 w-full px-2">
        <button (click)="adjustTime(-30)" class="h-[60px] flex-1 rounded-xl bg-[var(--color-bg-input)] text-[var(--color-text-muted)] text-base font-bold active:scale-95 transition-all duration-300 hover:bg-[#00f2fe]/10 hover:text-[#00f2fe] border border-[var(--color-border)] hover:border-[#00f2fe]/30">-30s</button>
        
        <button (click)="restart()" class="h-[60px] w-[60px] shrink-0 flex items-center justify-center rounded-xl bg-[var(--color-bg-input)] text-[var(--color-text-muted)] active:scale-95 transition-all duration-300 hover:bg-rose-500/10 hover:text-rose-400 border border-[var(--color-border)] hover:border-rose-500/30" aria-label="Reiniciar">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        
        <button (click)="toggleTimer()" class="h-[72px] w-[72px] shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#00f2fe] to-[#4facfe] text-[#0a0a0a] active:scale-90 transition-all duration-300" aria-label="Play/Pause">
          @if (isActive()) {
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
  duration = input<number>(90);
  timerFinished = output<void>();

  // ─── State ───
  secondsRemaining = signal(0);
  currentDuration = signal(0);
  isActive = signal(false);
  isFinished = signal(false);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  readonly circumference = 2 * Math.PI * 62; // ~389.55

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
