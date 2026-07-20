import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { ProgressionService } from './progression.service';
import { WorkoutUseCases } from '../use-cases/workout.use-cases';
import { UnitConversionService } from './unit-conversion.service';
import { DailyLog, ExerciseLog, StrengthSet, UserSettings, DEFAULT_SETTINGS, WorkoutSession } from '../models/interfaces';

describe('ProgressionService', () => {
  let service: ProgressionService;
  let workoutUseCasesSpy: any;
  let unitSvcSpy: any;

  beforeEach(() => {
    workoutUseCasesSpy = {
      getAllWorkouts: vi.fn()
    };
    unitSvcSpy = {
      currentSettings: vi.fn(),
      currentWeightUnit: vi.fn().mockReturnValue('kg'),
      kgToUser: vi.fn(),
      addIncrementToBaseWeight: vi.fn()
    };

    const injector = Injector.create({
      providers: [
        { provide: WorkoutUseCases, useValue: workoutUseCasesSpy },
        { provide: UnitConversionService, useValue: unitSvcSpy }
      ]
    });

    runInInjectionContext(injector, () => {
      service = new ProgressionService(workoutUseCasesSpy, unitSvcSpy);
    });
    
    // Mock user settings
    unitSvcSpy.currentSettings.mockReturnValue({ ...DEFAULT_SETTINGS, weightUnit: 'kg', weightIncrement: 2.5 });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSuggestions', () => {
    it('should return null if there is no previous log', async () => {
      workoutUseCasesSpy.getAllWorkouts.mockReturnValue(Promise.resolve([]));
      
      const suggestion = await service.getSuggestion('Bench Press', '2025-01');
      expect(suggestion).toBeNull();
    });

    it('should suggest an increase in weight if all reps were met', async () => {
      const mockSet: StrengthSet = { setNumber: 1, reps: 12, weight: 60 };
      const previousLog: ExerciseLog = {
        name: 'Bench Press',
        type: 'strength',
        sets: [mockSet, { setNumber: 2, reps: 12, weight: 60 }, { setNumber: 3, reps: 12, weight: 60 }]
      };
      
      const session: WorkoutSession = {
        id: '1', date: '2025-01-01', schemaVersion: 3, createdAt: 1, updatedAt: 1, deviceId: '1', version: 1, syncStatus: 'local_only',
        routineId: '1',
        exercises: [previousLog],
        notes: ''
      };
      
      workoutUseCasesSpy.getAllWorkouts.mockReturnValue(Promise.resolve([session]));
      unitSvcSpy.kgToUser.mockReturnValue(60); // same weight
      unitSvcSpy.addIncrementToBaseWeight.mockReturnValue(62.5); // base weight + increment

      const suggestion = await service.getSuggestion('Bench Press', '2025-01');
      expect(suggestion).toBeTruthy();
      expect(suggestion?.suggestedWeight).toBe(62.5);
      expect(suggestion?.isLoadAlert).toBe(true); // Progression possible!
      expect(suggestion?.referenceText).toContain('Anterior: 60kg × 12');
    });

    it('should suggest same weight if reps dropped (failed to complete volume)', async () => {
      const previousLog: ExerciseLog = {
        name: 'Bench Press',
        type: 'strength',
        sets: [
          { setNumber: 1, reps: 10, weight: 60 },
          { setNumber: 2, reps: 8, weight: 60 }, // failed 10
          { setNumber: 3, reps: 6, weight: 60 }
        ]
      };
      
      const session: WorkoutSession = {
        id: '1', date: '2025-01-01', schemaVersion: 3, createdAt: 1, updatedAt: 1, deviceId: '1', version: 1, syncStatus: 'local_only',
        routineId: '1',
        exercises: [previousLog],
        notes: ''
      };
      
      workoutUseCasesSpy.getAllWorkouts.mockReturnValue(Promise.resolve([session]));
      unitSvcSpy.kgToUser.mockReturnValue(60); 

      const suggestion = await service.getSuggestion('Bench Press', '2025-01');
      expect(suggestion).toBeTruthy();
      expect(suggestion?.suggestedWeight).toBe(60); // Should stay at 60
      expect(suggestion?.isLoadAlert).toBe(false);
    });
  });
});
