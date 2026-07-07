import { Injectable, inject } from '@angular/core';
import { DbService } from './db.service';
import { Sugerencia, UserSettings } from '../models/interfaces';

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
    const lastLog = await this.db.getLastExerciseLog(nombreEjercicio, mesId);

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
}
