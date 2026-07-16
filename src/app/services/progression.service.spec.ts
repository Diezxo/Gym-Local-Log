import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { ProgressionService } from './progression.service';
import { DailyLog, ExerciseLog, StrengthSet, UserSettings, DEFAULT_SETTINGS } from '../models/interfaces';

describe('ProgressionService', () => {
  let service: ProgressionService;
  let dbServiceSpy: any;
  let unitSvcSpy: any;

  beforeEach(() => {
    dbServiceSpy = {
      getLastExerciseLog: vi.fn()
    };
    unitSvcSpy = {
      currentSettings: vi.fn(),
      currentWeightUnit: vi.fn().mockReturnValue('kg'),
      kgToUser: vi.fn(),
      addIncrementToBaseWeight: vi.fn()
    };

    service = new ProgressionService(dbServiceSpy, unitSvcSpy);
    
    // Mock user settings
    unitSvcSpy.currentSettings.mockReturnValue({ ...DEFAULT_SETTINGS, weightUnit: 'kg', weightIncrement: 2.5 });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSuggestions', () => {
    it('should return null if there is no previous log', async () => {
      dbServiceSpy.getLastExerciseLog.mockReturnValue(Promise.resolve(undefined));
      
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
      
      dbServiceSpy.getLastExerciseLog.mockReturnValue(Promise.resolve(previousLog));
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
      
      dbServiceSpy.getLastExerciseLog.mockReturnValue(Promise.resolve(previousLog));
      unitSvcSpy.kgToUser.mockReturnValue(60); 

      const suggestion = await service.getSuggestion('Bench Press', '2025-01');
      expect(suggestion).toBeTruthy();
      expect(suggestion?.suggestedWeight).toBe(60); // Should stay at 60
      expect(suggestion?.isLoadAlert).toBe(false);
    });
  });
});
