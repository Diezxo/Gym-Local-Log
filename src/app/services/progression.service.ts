import { Injectable, inject } from '@angular/core';
import { DbService } from './db.service';
import { Sugerencia, UserSettings } from '../models/interfaces';

export interface ExerciseHistoryRecord {
  fecha: string;
  peso: number;
  reps: number;
  volumenTotal: number;
}

@Injectable({ providedIn: 'root' })
export class ProgressionService {
  private db = inject(DbService);

  /**
   * Motor de Progresión Doble Automatizada
   *
   * Lógica:
   * - Busca la última sesión del ejercicio en el mes actual
   * - Si se lograron 8-11 reps con peso X → sugiere X kg con reps+1
   * - Si se alcanzaron ≥12 reps → sugiere peso+incremento con 8 reps (alerta de carga)
   * - Si < 8 reps → sugiere mismo peso y mismas reps (consolidar)
   */
  async getSugerencia(
    nombreEjercicio: string,
    mesId: string,
    settings: UserSettings
  ): Promise<Sugerencia | null> {
    let lastLog = await this.db.getLastExerciseLog(nombreEjercicio, mesId);

    // If no data this month, check the previous month (common at start of month)
    if (!lastLog || !lastLog.series || lastLog.series.length === 0) {
      const [year, month] = mesId.split('-').map(Number);
      const prevDate = new Date(year, month - 2, 1); // month-1 = current month index, month-2 = previous
      const prevMesId = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      lastLog = await this.db.getLastExerciseLog(nombreEjercicio, prevMesId);
    }

    // No data found in current or previous month
    if (!lastLog || !lastLog.series || lastLog.series.length === 0) {
      return null;
    }

    // Use the last completed series as reference
    const ultimaSerie = lastLog.series[lastLog.series.length - 1];
    const pesoAnterior = ultimaSerie.peso;
    const repsAnteriores = ultimaSerie.reps;
    const unidad = settings.unidadPeso === 'kg' ? 'kg' : 'lb';
    const incremento = settings.incrementoPeso;

    const textoReferencia = `Anterior: ${pesoAnterior}${unidad} × ${repsAnteriores}`;

    if (repsAnteriores >= 12) {
      // Salto de carga: incrementar peso, resetear a 8 reps
      return {
        pesoSugerido: pesoAnterior + incremento,
        repsSugeridas: 8,
        esAlertaCarga: true,
        textoReferencia,
      };
    } else if (repsAnteriores >= 8) {
      // Progresión de reps: mismo peso, +1 rep
      return {
        pesoSugerido: pesoAnterior,
        repsSugeridas: repsAnteriores + 1,
        esAlertaCarga: false,
        textoReferencia,
      };
    } else {
      // Consolidar: mismo peso, mismas reps
      return {
        pesoSugerido: pesoAnterior,
        repsSugeridas: repsAnteriores,
        esAlertaCarga: false,
        textoReferencia,
      };
    }
  }

  async getExerciseHistory(nombreEjercicio: string, limit: number = 5): Promise<ExerciseHistoryRecord[]> {
    const archives = await this.db.getAllMonthlyArchives();
    archives.sort((a, b) => b.mesId.localeCompare(a.mesId));

    const history: ExerciseHistoryRecord[] = [];

    for (const archive of archives) {
      const logsDescending = [...archive.logs].sort((a, b) => b.fecha.localeCompare(a.fecha));
      
      for (const log of logsDescending) {
        const ejercicio = log.ejercicios.find(
          (e) => e.nombre.toLowerCase() === nombreEjercicio.toLowerCase() && e.tipo === 'fuerza'
        );
        
        if (ejercicio && ejercicio.series && ejercicio.series.length > 0) {
          const bestSet = [...ejercicio.series].sort((a, b) => {
             if (b.peso !== a.peso) return b.peso - a.peso;
             return b.reps - a.reps;
          })[0];
          
          const volumenTotal = ejercicio.series.reduce((sum, s) => sum + (s.peso * s.reps), 0);
          
          history.push({
            fecha: log.fecha,
            peso: bestSet.peso,
            reps: bestSet.reps,
            volumenTotal
          });
          
          if (history.length >= limit) return history;
        }
      }
    }

    return history;
  }
}
