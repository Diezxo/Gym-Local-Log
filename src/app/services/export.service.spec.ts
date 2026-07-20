import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { ExportService } from './export.service';
import { WorkoutUseCases } from '../use-cases/workout.use-cases';
import { RoutineUseCases } from '../use-cases/routine.use-cases';
import { FileSystemService } from './file-system.service';
import { Template } from '../models/interfaces';

describe('ExportService', () => {
  let service: ExportService;
  let workoutUseCasesSpy: any;
  let routineUseCasesSpy: any;
  let fileSystemSpy: any;

  beforeEach(() => {
    workoutUseCasesSpy = {
      importMonthlyArchive: vi.fn(),
      updateWorkoutSession: vi.fn()
    };
    routineUseCasesSpy = {
      getAllRoutines: vi.fn(),
      updateRoutine: vi.fn()
    };
    fileSystemSpy = {};

    const injector = Injector.create({
      providers: [
        { provide: WorkoutUseCases, useValue: workoutUseCasesSpy },
        { provide: RoutineUseCases, useValue: routineUseCasesSpy },
        { provide: FileSystemService, useValue: fileSystemSpy }
      ]
    });

    runInInjectionContext(injector, () => {
      service = new ExportService();
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('CSV parsing rules', () => {
    it('should reject rows with unknown templates during import', async () => {
      // Mock File
      const csvContent = `Fecha,Rutina,Ejercicio,Tipo,Serie/Distancia,Reps/Tiempo,Peso/Notas\n2025-01-01,Unknown Routine,Bench Press,strength,1,10,60`;
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      // Db has no templates
      routineUseCasesSpy.getAllRoutines.mockReturnValue(Promise.resolve([]));
      
      const result = await service.importCSV(file);
      expect(result.rejected).toBe(1);
      expect(result.imported).toBe(0);
    });

    it('should import correctly if template exists', async () => {
      const csvContent = `Fecha,Rutina,Ejercicio,Tipo,Serie/Distancia,Reps/Tiempo,Peso/Notas\n2025-01-01,Push Day,Bench Press,strength,1,10,60`;
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      // Db has the template
      const mockTemplate: Template = { id: 't1', name: 'Push Day', exercises: [] };
      routineUseCasesSpy.getAllRoutines.mockReturnValue(Promise.resolve([mockTemplate]));
      workoutUseCasesSpy.importMonthlyArchive.mockReturnValue(Promise.resolve());
      
      const result = await service.importCSV(file);
      expect(result.rejected).toBe(0);
      expect(result.imported).toBe(1);
      expect(workoutUseCasesSpy.updateWorkoutSession).toHaveBeenCalled();
    });
  });
});
