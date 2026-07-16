import { Injectable, inject } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Template,
  MonthlyArchive,
  DailyLog,
  ExerciseLog,
  UserSettings,
  DEFAULT_SETTINGS,
} from '../models/interfaces';
import { DEFAULT_TEMPLATES } from '../models/default-templates';
import { FileSystemService } from './file-system.service';

// ─── IndexedDB Schema ───
interface GymDBSchema extends DBSchema {
  templates: {
    key: string;
    value: Template;
  };
  'monthly-archives': {
    key: string;
    value: MonthlyArchive;
  };
  settings: {
    key: string;
    value: UserSettings;
  };
  // We declare the old store loosely for migration purposes
  'monthly-logs': {
    key: string;
    value: any;
  };
}

const DB_NAME = 'gym-local-log';
const DB_VERSION = 2;
const CURRENT_SCHEMA_VERSION = 2;

@Injectable({ providedIn: 'root' })
export class DbService {
  private dbPromise: Promise<IDBPDatabase<GymDBSchema>>;
  private resolvedDb: IDBPDatabase<GymDBSchema> | null = null;

  private fs = inject(FileSystemService);

  constructor() {
    this.dbPromise = openDB<GymDBSchema>(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion < 1) {
          db.createObjectStore('templates', { keyPath: 'id' });
          db.createObjectStore('monthly-archives', { keyPath: 'monthId' });
          db.createObjectStore('settings');
        }

        if (oldVersion === 1) {
          // --- V1 to V2 Migration (Spanish to English + Unit Normalization to kg/meters) ---
          
          if (!db.objectStoreNames.contains('monthly-archives')) {
            db.createObjectStore('monthly-archives', { keyPath: 'monthId' });
          }

          const settingsStore = transaction.objectStore('settings');
          const templatesStore = transaction.objectStore('templates');
          const newMonthlyStore = transaction.objectStore('monthly-archives');
          // Old store was 'monthly-logs' with keyPath 'mesId'
          const oldMonthlyStore = transaction.objectStore('monthly-logs' as any);

          // 1. Migrate settings and read previous unit preferences
          const oldSettings = await settingsStore.get('user-settings');
          let weightMult = 1; // kg to kg
          let distMult = 1000; // km to meters

          if (oldSettings) {
            const isLb = (oldSettings as any).unidadPeso === 'lb';
            const isMi = (oldSettings as any).unidadDistancia === 'mi';
            weightMult = isLb ? 0.453592 : 1;
            distMult = isMi ? 1609.34 : 1000;

            const newSettings: UserSettings = {
              weightUnit: (oldSettings as any).unidadPeso ?? 'kg',
              distanceUnit: (oldSettings as any).unidadDistancia ?? 'km',
              language: (oldSettings as any).idioma ?? 'es',
              weightIncrement: (oldSettings as any).incrementoPeso ?? 2.5,
              restTime: (oldSettings as any).tiempoDescanso ?? 90,
            };
            await settingsStore.put(newSettings, 'user-settings');
          }

          // 2. Migrate templates (Spanish -> English mapping)
          let cursorTemplate = await templatesStore.openCursor();
          while (cursorTemplate) {
            const val: any = cursorTemplate.value;
            const newVal: Template = {
              id: val.id,
              name: val.nombre || val.name,
              exercises: (val.ejercicios || val.exercises || []).map((e: any) => ({
                name: e.nombre || e.name,
                type: (e.tipo === 'fuerza' || e.type === 'strength') ? 'strength' : 'cardio',
                tags: e.tags,
              })),
            };
            await cursorTemplate.update(newVal);
            cursorTemplate = await cursorTemplate.continue();
          }

          // 3. Migrate monthly logs (Spanish -> English + kg/meters)
          if (oldMonthlyStore) {
            let cursorLog = await oldMonthlyStore.openCursor();
            while (cursorLog) {
              const val: any = cursorLog.value;
              const newVal: MonthlyArchive = {
                monthId: val.mesId || val.monthId,
                schemaVersion: CURRENT_SCHEMA_VERSION,
                logs: (val.logs || []).map((l: any) => ({
                  date: l.fecha || l.date,
                  templateId: l.templateId,
                  notes: l.notas || l.notes,
                  exercises: (l.ejercicios || l.exercises || []).map((e: any) => ({
                    name: e.nombre || e.name,
                    type: (e.tipo === 'fuerza' || e.type === 'strength') ? 'strength' : 'cardio',
                    tags: e.tags,
                    sets: (e.series || e.sets || []).map((s: any) => ({
                      setNumber: s.numero || s.setNumber,
                      reps: s.reps,
                      // Normalize to kg, keeping 1 decimal place
                      weight: Math.round(((s.peso || s.weight || 0) * weightMult) * 10) / 10,
                    })),
                    cardio: (e.cardio) ? {
                      distanceMeters: Math.round((e.cardio.distanciaKm || 0) * distMult) || e.cardio.distanceMeters || 0,
                      timeMinutes: e.cardio.tiempoMinutos || e.cardio.timeMinutes || 0,
                      technicalNotes: e.cardio.notasTecnica || e.cardio.technicalNotes,
                    } : undefined,
                  })),
                })),
              };
              await newMonthlyStore.put(newVal);
              cursorLog = await cursorLog.continue();
            }
            db.deleteObjectStore('monthly-logs' as any);
          }
        }
      },
    }).then(db => {
      this.resolvedDb = db;
      return db;
    });

    this.dbPromise.then(() => {
      this.initDefaultTemplates();
      setTimeout(() => {
        if (this.fs.isConnected()) {
          this.syncFromFileSystem();
        }
      }, 1000);
    });
  }

  private async getDb(): Promise<IDBPDatabase<GymDBSchema>> {
    return this.resolvedDb ?? this.dbPromise;
  }

  // ─── Default Templates ───

  private async initDefaultTemplates(): Promise<void> {
    try {
      const database = await this.getDb();
      const existing = await database.getAll('templates');
      if (existing.length === 0) {
        for (const template of DEFAULT_TEMPLATES) {
          await database.put('templates', template);
        }
      }
    } catch (e) {
      console.warn('Error seeding default templates:', e);
    }
  }

  // ─── Sync ───

  async syncToFileSystem(): Promise<void> {
    if (!this.fs.isConnected()) return;
    const [templates, logs, settings] = await Promise.all([
      this.getTemplates(),
      this.getAllMonthlyArchives(),
      this.getSettings(),
    ]);

    await Promise.all([
      this.fs.writeJsonFile('templates.json', templates),
      this.fs.writeJsonFile('settings.json', settings),
      ...logs.map(async archive => {
        await this.fs.writeJsonFile(`${archive.monthId}.json`, archive);
        await this.fs.writeBackupJson(archive.monthId, archive);
      }),
    ]);
  }

  async syncFromFileSystem(): Promise<void> {
    if (!this.fs.isConnected()) return;
    try {
      const [templates, settings] = await Promise.all([
        this.fs.readJsonFile<Template[]>('templates.json'),
        this.fs.readJsonFile<UserSettings>('settings.json'),
      ]);

      const database = await this.getDb();
      const ops: Promise<unknown>[] = [];

      if (templates) {
        for (const t of templates) ops.push(database.put('templates', t));
      }
      if (settings) {
        ops.push(this.saveSettings(settings));
      }

      await Promise.all(ops);

      const monthlyFiles = await this.fs.listMonthlyFiles();
      for (const filename of monthlyFiles) {
        // If they have V1 files (YYYY-MM.json), the importMonthlyArchive will migrate them
        const archive = await this.fs.readJsonFile<any>(filename);
        if (archive && (archive.monthId || archive.mesId) && Array.isArray(archive.logs)) {
          await this.importMonthlyArchive(archive);
        }
      }
    } catch (e) {
      console.warn('Error syncing from FS on startup:', e);
    }
  }

  // ─── Templates ───

  async saveTemplate(template: Template): Promise<void> {
    const database = await this.getDb();
    await database.put('templates', template);

    if (this.fs.isConnected()) {
      const all = await database.getAll('templates');
      await this.fs.writeJsonFile('templates.json', all);
    }
  }

  async getTemplates(): Promise<Template[]> {
    const database = await this.getDb();
    return database.getAll('templates');
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const database = await this.getDb();
    return database.get('templates', id);
  }

  async deleteTemplate(id: string): Promise<void> {
    const database = await this.getDb();
    await database.delete('templates', id);

    if (this.fs.isConnected()) {
      const all = await database.getAll('templates');
      await this.fs.writeJsonFile('templates.json', all);
    }
  }

  // ─── Monthly Logs ───

  async saveLog(log: DailyLog): Promise<void> {
    const database = await this.getDb();
    const monthId = log.date.substring(0, 7); // YYYY-MM

    let archive = await database.get('monthly-archives', monthId);
    if (!archive) {
      archive = { monthId, schemaVersion: CURRENT_SCHEMA_VERSION, logs: [] };
    }

    const existingIdx = archive.logs.findIndex(
      (l) => l.date === log.date && l.templateId === log.templateId
    );
    if (existingIdx >= 0) {
      archive.logs[existingIdx] = log;
    } else {
      archive.logs.push(log);
    }

    await database.put('monthly-archives', archive);

    if (this.fs.isConnected()) {
      await this.fs.writeJsonFile(`${monthId}.json`, archive);
    }
  }

  async getMonthlyArchive(monthId: string): Promise<MonthlyArchive | undefined> {
    const database = await this.getDb();
    return database.get('monthly-archives', monthId);
  }

  async deleteLog(date: string, templateId: string): Promise<void> {
    const database = await this.getDb();
    const monthId = date.substring(0, 7);

    const archive = await database.get('monthly-archives', monthId);
    if (archive) {
      archive.logs = archive.logs.filter(
        (l) => !(l.date === date && l.templateId === templateId)
      );
      await database.put('monthly-archives', archive);

      if (this.fs.isConnected()) {
        await this.fs.writeJsonFile(`${monthId}.json`, archive);
      }
    }
  }

  async getTrainingDays(): Promise<string[]> {
    const logs = await this.getAllMonthlyArchives();
    const days = new Set<string>();
    for (const archive of logs) {
      for (const log of archive.logs) {
        days.add(log.date);
      }
    }
    return Array.from(days).sort();
  }

  async getLastLog(): Promise<DailyLog | null> {
    const database = await this.getDb();
    const keys = (await database.getAllKeys('monthly-archives'))
      .map(k => k as string)
      .sort((a, b) => b.localeCompare(a));

    for (const key of keys) {
      const archive = await database.get('monthly-archives', key);
      if (archive && archive.logs.length > 0) {
        const sorted = [...archive.logs].sort((a, b) => b.date.localeCompare(a.date));
        return sorted[0];
      }
    }
    return null;
  }

  async getAllMonthlyArchives(): Promise<MonthlyArchive[]> {
    const database = await this.getDb();
    return database.getAll('monthly-archives');
  }

  /**
   * Imports a MonthlyArchive. If it's V1 (Spanish properties), it translates them to V2.
   */
  async importMonthlyArchive(rawArchive: any): Promise<void> {
    const database = await this.getDb();
    
    // Auto-migrate V1 to V2 JSON
    const archive: MonthlyArchive = {
      monthId: rawArchive.monthId || rawArchive.mesId,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      logs: (rawArchive.logs || []).map((l: any) => ({
        date: l.date || l.fecha,
        templateId: l.templateId,
        notes: l.notes || l.notas,
        exercises: (l.exercises || l.ejercicios || []).map((e: any) => ({
          name: e.name || e.nombre,
          type: (e.type === 'strength' || e.tipo === 'fuerza') ? 'strength' : 'cardio',
          tags: e.tags,
          sets: (e.sets || e.series || []).map((s: any) => ({
            setNumber: s.setNumber || s.numero,
            reps: s.reps,
            // If importing V1 without knowing user units, we assume it's already in kg since we can't reliably know.
            // Ideally V1 JSONs are only imported on the same machine.
            weight: s.weight || s.peso || 0,
          })),
          cardio: (e.cardio) ? {
             distanceMeters: e.cardio.distanceMeters || ((e.cardio.distanciaKm || 0) * 1000),
             timeMinutes: e.cardio.timeMinutes || e.cardio.tiempoMinutos || 0,
             technicalNotes: e.cardio.technicalNotes || e.cardio.notasTecnica,
          } : undefined
        }))
      }))
    };

    const existing = await database.get('monthly-archives', archive.monthId);

    if (existing) {
      const existingKeys = new Set(existing.logs.map(l => `${l.date}|${l.templateId}`));
      for (const log of archive.logs) {
        if (!existingKeys.has(`${log.date}|${log.templateId}`)) {
          existing.logs.push(log);
        }
      }
      existing.logs.sort((a, b) => a.date.localeCompare(b.date));
      existing.schemaVersion = CURRENT_SCHEMA_VERSION;
      await database.put('monthly-archives', existing);
    } else {
      await database.put('monthly-archives', archive);
    }
  }

  // ─── Progression Queries ───

  async getLastExerciseLog(
    exerciseName: string,
    monthId: string
  ): Promise<ExerciseLog | undefined> {
    const database = await this.getDb();
    const archive = await database.get('monthly-archives', monthId);
    if (!archive) return undefined;

    const sortedLogs = [...archive.logs].sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    for (const log of sortedLogs) {
      const exercise = log.exercises.find(
        (e) => e.name === exerciseName
      );
      if (exercise) return exercise;
    }

    return undefined;
  }

  // ─── Settings ───

  async getSettings(): Promise<UserSettings> {
    const database = await this.getDb();
    const settings = await database.get('settings', 'user-settings');
    return settings ?? { ...DEFAULT_SETTINGS };
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    const database = await this.getDb();
    await database.put('settings', settings, 'user-settings');

    if (this.fs.isConnected()) {
      await this.fs.writeJsonFile('settings.json', settings);
    }
  }
}
