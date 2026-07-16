import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { ExportService } from './export.service';
import { Template } from '../models/interfaces';

describe('ExportService', () => {
  let service: ExportService;
  let dbServiceSpy: any;

  beforeEach(() => {
    dbServiceSpy = {
      getMonthlyArchive: vi.fn(),
      getAllMonthlyArchives: vi.fn(),
      importMonthlyArchive: vi.fn(),
      getTemplates: vi.fn(),
      saveTemplate: vi.fn()
    };

    service = new ExportService(dbServiceSpy);
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
      dbServiceSpy.getTemplates.mockReturnValue(Promise.resolve([]));
      
      const result = await service.importCSV(file);
      expect(result.rejected).toBe(1);
      expect(result.imported).toBe(0);
    });

    it('should import correctly if template exists', async () => {
      const csvContent = `Fecha,Rutina,Ejercicio,Tipo,Serie/Distancia,Reps/Tiempo,Peso/Notas\n2025-01-01,Push Day,Bench Press,strength,1,10,60`;
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      // Db has the template
      const mockTemplate: Template = { id: 't1', name: 'Push Day', exercises: [] };
      dbServiceSpy.getTemplates.mockReturnValue(Promise.resolve([mockTemplate]));
      dbServiceSpy.importMonthlyArchive.mockReturnValue(Promise.resolve());
      
      const result = await service.importCSV(file);
      expect(result.rejected).toBe(0);
      expect(result.imported).toBe(1);
      expect(dbServiceSpy.importMonthlyArchive).toHaveBeenCalled();
    });
  });
});
