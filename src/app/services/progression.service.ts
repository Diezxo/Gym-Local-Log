import { Injectable, inject } from '@angular/core';
import { WorkoutUseCases } from '../use-cases/workout.use-cases';
import { Suggestion, ExerciseLog } from '../models/interfaces';
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
    private workoutUseCases: WorkoutUseCases,
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
    exerciseId: string | undefined,
    exerciseName: string
  ): Promise<Suggestion | null> {
    const allWorkouts = await this.workoutUseCases.getAllWorkouts();
    // Sort descending
    allWorkouts.sort((a, b) => b.date.localeCompare(a.date));

    let lastLog: ExerciseLog | undefined;
    for (const w of allWorkouts) {
      const ex = w.exercises.find(e => 
        e.type === 'strength' && 
        ((exerciseId && e.exerciseId === exerciseId) || e.name.toLowerCase() === exerciseName.toLowerCase())
      );
      if (ex) {
        lastLog = ex;
        break;
      }
    }

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
      // Jump load: increment weight, reset reps
      // Simplistic linear periodization. TODO: Make configurable
      return {
        suggestedWeight: prevUserWeight + increment,
        suggestedReps: Math.max(previousReps - 4, 8),
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

  async getExerciseHistory(exerciseId: string | undefined, exerciseName: string, limit: number = 5): Promise<ExerciseHistoryRecord[]> {
    const allWorkouts = await this.workoutUseCases.getAllWorkouts();
    const logsDescending = [...allWorkouts].sort((a, b) => b.date.localeCompare(a.date));

    const history: ExerciseHistoryRecord[] = [];

    for (const log of logsDescending) {
      const exercise = log.exercises.find(
        (e) => e.type === 'strength' && 
               ((exerciseId && e.exerciseId === exerciseId) || e.name.toLowerCase() === exerciseName.toLowerCase())
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

    return history;
  }
}
