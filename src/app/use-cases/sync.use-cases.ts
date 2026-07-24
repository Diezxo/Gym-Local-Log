import { Injectable, inject } from '@angular/core';
import { STORAGE_PORT, StoragePort } from '../ports/storage.port';
import { FileSystemService } from '../services/file-system.service';
import { MonthlyArchive, Routine, UserSettings, WorkoutSession } from '../models/interfaces';
import { generateId } from '../utils/generate-id';

@Injectable({ providedIn: 'root' })
export class SyncUseCases {
  private storage = inject<StoragePort>(STORAGE_PORT);
  private fs = inject(FileSystemService);

  async exportAllData(): Promise<void> {
    if (!this.fs.isConnected()) return;

    const [routines, sessions, settings] = await Promise.all([
      this.storage.getRoutines(),
      this.storage.getAllWorkoutSessions(),
      this.storage.getSettings(),
    ]);

    // Group sessions by month for file export
    const sessionsByMonth = new Map<string, WorkoutSession[]>();
    for (const s of sessions) {
      const monthId = s.date.substring(0, 7);
      if (!sessionsByMonth.has(monthId)) {
        sessionsByMonth.set(monthId, []);
      }
      sessionsByMonth.get(monthId)!.push(s);
    }

    const exportPromises: Promise<void>[] = [];
    
    exportPromises.push(this.fs.writeJsonFile('routines.json', routines));
    exportPromises.push(this.fs.writeJsonFile('settings.json', settings));

    for (const [monthId, logs] of sessionsByMonth.entries()) {
      const archive: MonthlyArchive = {
        monthId,
        schemaVersion: 3,
        logs
      };
      exportPromises.push(this.fs.writeJsonFile(`${monthId}.json`, archive));
      exportPromises.push(this.fs.writeBackupJson(monthId, archive));
    }

    await Promise.all(exportPromises);
  }

  async importDataFromFiles(): Promise<void> {
    if (!this.fs.isConnected()) return;

    try {
      const [routines, settings] = await Promise.all([
        this.fs.readJsonFile<Routine[]>('routines.json').catch(() => null),
        this.fs.readJsonFile<UserSettings>('settings.json').catch(() => null),
      ]);

      const importPromises: Promise<void>[] = [];

      if (routines) {
        for (const r of routines) {
          importPromises.push(this.storage.saveRoutine(r));
        }
      }

      if (settings) {
        importPromises.push(this.storage.saveSettings(settings));
      }

      await Promise.all(importPromises);

      // Fix #11: Process monthly files in parallel with Promise.allSettled so that
      // a corrupt/missing file doesn’t abort the entire import, and errors are
      // reported per-file rather than swallowing all progress.
      const monthlyFiles = await this.fs.listMonthlyFiles();
      const monthlyResults = await Promise.allSettled(
        monthlyFiles.map(async (filename) => {
          const archive = await this.fs.readJsonFile<any>(filename);
          if (!archive || !(archive.monthId || archive.mesId) || !Array.isArray(archive.logs)) return;

          const savePromises = archive.logs.map(async (rawLog: any) => {
            const session: WorkoutSession = {
              id: rawLog.id || generateId(),
              schemaVersion: rawLog.schemaVersion || 3,
              createdAt: rawLog.createdAt || Date.now(),
              updatedAt: rawLog.updatedAt || Date.now(),
              deviceId: rawLog.deviceId || 'local',
              version: rawLog.version || 1,
              syncStatus: rawLog.syncStatus || 'local_only',
              date: rawLog.date || rawLog.fecha,
              routineId: rawLog.routineId || rawLog.templateId,
              notes: rawLog.notes || rawLog.notas,
              exercises: (rawLog.exercises || rawLog.ejercicios || []).map((e: any) => ({
                id: e.id || generateId(),
                name: e.name || e.nombre,
                type: (e.type === 'strength' || e.tipo === 'fuerza') ? 'strength' : 'cardio',
                tags: e.tags,
                sets: (e.sets || e.series || []).map((s: any) => ({
                  setNumber: s.setNumber || s.numero,
                  reps: s.reps,
                  weight: s.weight || s.peso || 0,
                })),
                cardio: (e.cardio) ? {
                  distanceMeters: e.cardio.distanceMeters || ((e.cardio.distanciaKm || 0) * 1000),
                  timeMinutes: e.cardio.timeMinutes || e.cardio.tiempoMinutos || 0,
                  technicalNotes: e.cardio.technicalNotes || e.cardio.notasTecnica,
                } : undefined
              }))
            };
            await this.storage.saveWorkoutSession(session);
          });

          await Promise.all(savePromises);
        })
      );

      const failed = monthlyResults.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        console.warn(`[SyncUseCases] ${failed.length} monthly file(s) failed to import:`,
          failed.map(r => (r as PromiseRejectedResult).reason));
      }
    } catch (e) {
      console.error('Error importing from FS:', e);
      throw e;
    }
  }
}
