import { Injectable, inject } from '@angular/core';
import { DbService } from './db.service';
import { Suggestion } from '../models/interfaces';
import { UnitConversionService } from './unit-conversion.service';

export interface ExerciseHistoryRecord {
  date: string;
  weight: number;         // Best set weight IN BASE UNIT (kg)
  reps: number;         // Best set reps
  totalVolume: number;    // IN BASE UNIT
  sets: { weight: number; reps: number }[]; // IN BASE UNIT
}

@Injectable({ providedIn: 'root' })
export class ProgressionService {
  constructor(
    private db: DbService,
    private unitSvc: UnitConversionService
  ) {}

  /**
   * Automated Double Progression Engine
   *
   * Logic:
   * - Finds the last session of the exercise
   * - If achieved 8-11 reps with weight X → suggests X weight with reps+1
   * - If achieved ≥12 reps → suggests weight+increment with 8 reps (Load alert)
   * - If < 8 reps → suggests same weight and same reps (consolidate)
   */
  async getSuggestion(
    exerciseName: string,
    monthId: string
  ): Promise<Suggestion | null> {
    let lastLog = await this.db.getLastExerciseLog(exerciseName, monthId);

    // If no data this month, check the previous month (common at start of month)
    if (!lastLog || !lastLog.sets || lastLog.sets.length === 0) {
      const [year, month] = monthId.split('-').map(Number);
      const prevDate = new Date(year, month - 2, 1); // month-1 = current month index, month-2 = previous
      const prevMonthId = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      lastLog = await this.db.getLastExerciseLog(exerciseName, prevMonthId);
    }

    // No data found in current or previous month
    if (!lastLog || !lastLog.sets || lastLog.sets.length === 0) {
      return null;
    }

    // Use the last completed series as reference
    const lastSet = lastLog.sets[lastLog.sets.length - 1];
    const previousBaseWeight = lastSet.weight; // kg
    const previousReps = lastSet.reps;
    
    // We convert previous weight to user unit for the reference text and logic
    const prevUserWeight = this.unitSvc.kgToUser(previousBaseWeight);
    const unitLabel = this.unitSvc.currentWeightUnit();
    const increment = this.unitSvc.currentSettings()?.weightIncrement ?? 2.5;

    const referenceText = `Anterior: ${prevUserWeight}${unitLabel} × ${previousReps}`;

    if (previousReps >= 12) {
      // Jump load: increment weight, reset to 8 reps
      return {
        suggestedWeight: prevUserWeight + increment,
        suggestedReps: 8,
        isLoadAlert: true,
        referenceText,
      };
    } else if (previousReps >= 8) {
      // Rep progression: same weight, +1 rep
      return {
        suggestedWeight: prevUserWeight,
        suggestedReps: previousReps + 1,
        isLoadAlert: false,
        referenceText,
      };
    } else {
      // Consolidate: same weight, same reps
      return {
        suggestedWeight: prevUserWeight,
        suggestedReps: previousReps,
        isLoadAlert: false,
        referenceText,
      };
    }
  }

  async getExerciseHistory(exerciseName: string, limit: number = 5): Promise<ExerciseHistoryRecord[]> {
    const archives = await this.db.getAllMonthlyArchives();
    archives.sort((a, b) => b.monthId.localeCompare(a.monthId));

    const history: ExerciseHistoryRecord[] = [];

    for (const archive of archives) {
      const logsDescending = [...archive.logs].sort((a, b) => b.date.localeCompare(a.date));
      
      for (const log of logsDescending) {
        const exercise = log.exercises.find(
          (e) => e.name.toLowerCase() === exerciseName.toLowerCase() && e.type === 'strength'
        );
        
        if (exercise && exercise.sets && exercise.sets.length > 0) {
          const bestSet = [...exercise.sets].sort((a, b) => {
             if (b.weight !== a.weight) return b.weight - a.weight;
             return b.reps - a.reps;
          })[0];
          
          const totalVolume = exercise.sets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
          
          history.push({
            date: log.date,
            weight: bestSet.weight,
            reps: bestSet.reps,
            totalVolume,
            sets: exercise.sets.map(s => ({ weight: s.weight, reps: s.reps })),
          });
          
          if (history.length >= limit) return history;
        }
      }
    }

    return history;
  }
}
