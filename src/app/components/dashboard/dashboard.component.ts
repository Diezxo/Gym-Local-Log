import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DbService } from '../../services/db.service';
import {
  LogDiario,
  MuscleTag,
  TAG_COLORS,
} from '../../models/interfaces';

interface TagVolumen {
  tag: MuscleTag;
  valor: number; // kg para fuerza, km para cardio
  unidad: string;
  sesiones: number;
}

interface HeatDay {
  date: string; // YYYY-MM-DD
  trained: boolean;
  dayNum: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-[var(--color-bg-primary)] px-6 pt-12 pb-36 flex flex-col gap-8">

      <!-- ── Header ── -->
      <div>
        <p class="text-sm text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-2 font-bold">{{ dayLabel() }}</p>
        <h1 class="text-[40px] leading-tight font-black text-[var(--color-text-primary)] tracking-tight">Dashboard</h1>
      </div>

      <!-- ── Semana Actual ── -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Esta semana</h2>
          <span class="text-sm text-[var(--color-text-secondary)] font-medium">{{ weekRangeLabel() }}</span>
        </div>
        <div class="grid grid-cols-7 gap-2 bg-[var(--color-bg-card)] rounded-[32px] p-6 border border-[var(--color-border)] shadow-xl">
          @for (day of weekDays(); track day.label) {
            <div class="flex flex-col items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider"
                [class]="day.isToday ? 'text-[#00f2fe]' : 'text-[var(--color-text-muted)]'">
                {{ day.label }}
              </span>
              <div
                class="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all"
                [class]="getWeekDayClass(day)"
              >
                {{ day.dayNum }}
              </div>
            </div>
          }
        </div>
      </div>

      <!-- ── Streak + Stats Row ── -->
      <div class="grid grid-cols-3 gap-4">
        <!-- Racha -->
        <div class="col-span-1 bg-[var(--color-bg-card)] rounded-[32px] p-5 border border-[var(--color-border)] flex flex-col items-center justify-center gap-2 shadow-xl min-h-[120px]">
          <span class="text-[40px] font-black text-amber-400 leading-none">{{ streak() }}</span>
          <span class="text-xs uppercase tracking-wider text-[var(--color-text-muted)] text-center leading-tight font-bold">Racha<br/>días</span>
        </div>
        <!-- Sesiones mes -->
        <div class="col-span-1 bg-[var(--color-bg-card)] rounded-[32px] p-5 border border-[var(--color-border)] flex flex-col items-center justify-center gap-2 shadow-xl relative overflow-hidden min-h-[120px]">
          <div class="absolute inset-0 bg-gradient-to-br from-[#00f2fe]/10 to-[#a252ff]/10 z-0 pointer-events-none"></div>
          <span class="text-[40px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#a252ff] z-10 leading-none">{{ monthSessions() }}</span>
          <span class="text-xs uppercase tracking-wider text-[var(--color-text-muted)] text-center leading-tight font-bold z-10">Sesiones<br/>este mes</span>
        </div>
        <!-- Días restantes del mes -->
        <div class="col-span-1 bg-[var(--color-bg-card)] rounded-[32px] p-5 border border-[var(--color-border)] flex flex-col items-center justify-center gap-2 shadow-xl min-h-[120px]">
          <span class="text-[40px] font-black text-[var(--color-text-primary)] leading-none">{{ daysLeftInMonth() }}</span>
          <span class="text-xs uppercase tracking-wider text-[var(--color-text-muted)] text-center leading-tight font-bold">Días<br/>restantes</span>
        </div>
      </div>

      <!-- ── Volumen por Tag ── -->
      @if (tagVolumens().length > 0) {
        <div>
          <h2 class="text-base font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Volumen este mes</h2>
          <div class="flex flex-col gap-3">
            @for (tv of tagVolumens(); track tv.tag) {
              <div
                class="flex items-center gap-4 rounded-[20px] px-5 py-4 border shadow-md"
                [style.background]="getTagColor(tv.tag).bg"
                [style.borderColor]="getTagColor(tv.tag).border"
              >
                <div class="w-3 h-3 rounded-full flex-shrink-0" [style.background]="getTagColor(tv.tag).text"></div>
                <span class="flex-1 text-base font-bold text-[var(--color-text-primary)]">{{ tv.tag }}</span>
                <div class="flex items-center gap-3">
                  <span class="text-sm text-[var(--color-text-muted)] font-medium">{{ tv.sesiones }} ses.</span>
                  <span class="font-black text-base" [style.color]="getTagColor(tv.tag).text">
                    {{ formatTagValue(tv) }}
                  </span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ── Consistencia (30 días) ── -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Consistencia</h2>
          <span class="text-sm font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-xl">
            {{ trainedCount() }} / 30 días
          </span>
        </div>
        <div class="bg-[var(--color-bg-card)] rounded-[32px] border border-[var(--color-border)] p-6 shadow-xl">
          <div class="grid gap-2.5" style="grid-template-columns: repeat(10, 1fr)">
            @for (day of heatmap(); track day.date) {
              <div
                class="aspect-square rounded-md transition-colors"
                [class]="day.trained ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-[var(--color-bg-input)]'"
                [title]="day.date"
              ></div>
            }
          </div>
        </div>
      </div>

      <!-- ── Último Entrenamiento ── -->
      @if (lastLog()) {
        <div class="mt-4">
          <h2 class="text-base font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Último entrenamiento</h2>
          <div class="bg-[var(--color-bg-card)] rounded-[32px] p-6 border border-[var(--color-border)] shadow-xl">
            <div class="flex items-center justify-between mb-5">
              <span class="text-[var(--color-text-primary)] font-black text-xl">{{ formatFecha(lastLog()!.fecha) }}</span>
              <span class="text-sm font-bold text-[var(--color-text-muted)] bg-[var(--color-bg-input)] px-3 py-1 rounded-full">Hace {{ getDaysAgo(lastLog()!.fecha) }}</span>
            </div>
            <div class="flex flex-wrap gap-2.5 mb-6">
              @for (tag of getLogTags(lastLog()!); track tag) {
                <span
                  class="px-4 py-1.5 rounded-full text-xs font-bold border"
                  [style.background]="getTagColor(tag).bg"
                  [style.borderColor]="getTagColor(tag).border"
                  [style.color]="getTagColor(tag).text"
                >{{ tag }}</span>
              }
            </div>
            <button
              (click)="irAEntrenar()"
              class="btn-primary min-h-[64px] text-lg font-black w-full"
            >
              Iniciar nuevo entrenamiento →
            </button>
          </div>
        </div>
      } @else {
        <div class="mt-4">
          <button
            (click)="irAEntrenar()"
            class="btn-primary min-h-[72px] text-xl font-black w-full shadow-[0_10px_30px_rgba(0,242,254,0.4)] hover:shadow-[0_15px_40px_rgba(0,242,254,0.6)]"
          >
            ¡Empieza tu primer entrenamiento!
          </button>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class DashboardComponent implements OnInit {
  private db = inject(DbService);
  private router = inject(Router);

  dayLabel = signal('');
  weekDays = signal<{ label: string; dayNum: number; isToday: boolean; trained: boolean }[]>([]);
  weekRangeLabel = signal('');
  streak = signal(0);
  monthSessions = signal(0);
  daysLeftInMonth = signal(0);
  tagVolumens = signal<TagVolumen[]>([]);
  heatmap = signal<HeatDay[]>([]);
  trainedCount = signal(0);
  lastLog = signal<LogDiario | null>(null);

  private readonly monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  private readonly monthShort = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  private readonly dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  private readonly dayNamesFull = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

  async ngOnInit() {
    const now = new Date();
    this.dayLabel.set(`${this.dayNamesFull[now.getDay()]}, ${now.getDate()} de ${this.monthNames[now.getMonth()]}`);

    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    this.daysLeftInMonth.set(daysLeft);

    const [archives, lastLog] = await Promise.all([
      this.db.getAllMonthlyArchives(),
      this.db.getLastLog(),
    ]);

    this.lastLog.set(lastLog);

    const allTrainingDays = new Set<string>();
    archives.forEach(a => a.logs.forEach(l => allTrainingDays.add(l.fecha)));
    const sortedDays = Array.from(allTrainingDays).sort();

    // ── Streak ──
    this.streak.set(this.calcStreak(sortedDays, now));

    // ── Heatmap 30 días ──
    this.buildHeatmap(allTrainingDays, now);

    // ── Semana actual ──
    this.buildWeek(allTrainingDays, now);

    // ── Stats del mes ──
    const mesId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentArchive = archives.find(a => a.mesId === mesId);
    this.monthSessions.set(currentArchive?.logs.length ?? 0);

    // ── Volumen por tag ──
    this.calcTagVolumens(currentArchive?.logs ?? []);
  }

  private buildWeek(trained: Set<string>, now: Date) {
    const days: { label: string; dayNum: number; isToday: boolean; trained: boolean }[] = [];
    const todayStr = this.toLocalDateStr(now);

    // Start of current week (Monday) — use local dates
    const dow = now.getDay(); // 0=Sun
    const startOffset = dow === 0 ? -6 : 1 - dow;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + startOffset);

    const weekLabels = ['L','M','X','J','V','S','D'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
      const ds = this.toLocalDateStr(d);
      days.push({
        label: weekLabels[i],
        dayNum: d.getDate(),
        isToday: ds === todayStr,
        trained: trained.has(ds),
      });
    }

    const endOfWeek = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
    this.weekRangeLabel.set(
      `${weekStart.getDate()} ${this.monthShort[weekStart.getMonth()]} – ${endOfWeek.getDate()} ${this.monthShort[endOfWeek.getMonth()]}`
    );
    this.weekDays.set(days);
  }

  getWeekDayClass(day: { isToday: boolean; trained: boolean; dayNum: number }): string {
    if (day.trained && day.isToday) return 'bg-gradient-to-br from-[#00f2fe] to-[#a252ff] text-white shadow-[0_0_15px_rgba(79,172,254,0.5)]';
    if (day.trained) return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
    if (day.isToday) return 'bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/30 shadow-[0_0_10px_rgba(0,242,254,0.2)]';
    return 'bg-transparent text-[var(--color-text-muted)]';
  }

  private buildHeatmap(trained: Set<string>, now: Date) {
    const days: HeatDay[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const ds = this.toLocalDateStr(d);
      days.push({ date: ds, trained: trained.has(ds), dayNum: d.getDate() });
    }
    this.heatmap.set(days);
    this.trainedCount.set(days.filter(d => d.trained).length);
  }

  private calcStreak(sortedDays: string[], now: Date): number {
    if (sortedDays.length === 0) return 0;
    const trainingSet = new Set(sortedDays);
    let streak = 0;
    const todayStr = this.toLocalDateStr(now);
    // Start from today; if today wasn't trained, start from yesterday
    let checkDate = new Date(now);
    if (!trainingSet.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (true) {
      const ds = this.toLocalDateStr(checkDate);
      if (trainingSet.has(ds)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  /** Returns YYYY-MM-DD in LOCAL time (avoids UTC midnight shift) */
  private toLocalDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private calcTagVolumens(logs: LogDiario[]) {
    const tagMap = new Map<MuscleTag, { vol: number; km: number; sesiones: Set<string> }>();

    for (const log of logs) {
      for (const ej of log.ejercicios) {
        const tags = ej.tags ?? [];
        for (const tag of tags) {
          if (!tagMap.has(tag)) tagMap.set(tag, { vol: 0, km: 0, sesiones: new Set() });
          const entry = tagMap.get(tag)!;
          entry.sesiones.add(log.fecha);
          if (ej.tipo === 'fuerza' && ej.series) {
            entry.vol += ej.series.reduce((s, r) => s + r.peso * r.reps, 0);
          } else if (ej.cardio) {
            entry.km += ej.cardio.distanciaKm ?? 0;
          }
        }
      }
    }

    const result: TagVolumen[] = [];
    tagMap.forEach((v, tag) => {
      const isCardio = tag === 'Cardio';
      result.push({
        tag,
        valor: isCardio ? Math.round(v.km * 10) / 10 : Math.round(v.vol),
        unidad: isCardio ? 'km' : 'kg',
        sesiones: v.sesiones.size,
      });
    });

    result.sort((a, b) => b.valor - a.valor);
    this.tagVolumens.set(result);
  }

  getTagColor(tag: MuscleTag) {
    return TAG_COLORS[tag] ?? { bg: 'rgba(255,255,255,0.05)', text: '#a3a3a3', border: 'rgba(255,255,255,0.1)' };
  }

  formatTagValue(tv: TagVolumen): string {
    if (tv.unidad === 'km') return `${tv.valor} km`;
    return `${tv.valor.toLocaleString()} kg`;
  }

  getLogTags(log: LogDiario): MuscleTag[] {
    const tags = new Set<MuscleTag>();
    log.ejercicios.forEach(e => e.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }

  formatFecha(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d} ${this.monthShort[parseInt(m, 10) - 1]} ${y}`;
  }

  getDaysAgo(fecha: string): string {
    // Compare calendar dates in local time to avoid UTC midnight off-by-one
    const [y, m, d] = fecha.split('-').map(Number);
    const logDate = new Date(y, m - 1, d);
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.round((todayLocal.getTime() - logDate.getTime()) / 86400000);
    if (diff <= 0) return 'hoy';
    if (diff === 1) return 'ayer';
    return `${diff} días`;
  }

  irAEntrenar() {
    this.router.navigate(['/workout']);
  }
}
