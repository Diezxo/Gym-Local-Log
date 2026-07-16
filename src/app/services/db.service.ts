import { Injectable, inject } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Template,
  ArchivoMensual,
  LogDiario,
  EjercicioLog,
  UserSettings,
  DEFAULT_SETTINGS,
} from '../models/interfaces';
import { DEFAULT_TEMPLATES } from '../models/default-templates';
import { FileSystemService } from './file-system.service';

// ─── Schema de IndexedDB ───
interface GymDBSchema extends DBSchema {
  templates: {
    key: string;
    value: Template;
  };
  'monthly-logs': {
    key: string;
    value: ArchivoMensual;
  };
  settings: {
    key: string;
    value: UserSettings;
  };
}

const DB_NAME = 'gym-local-log';
const DB_VERSION = 1;
const CURRENT_SCHEMA_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class DbService {
  // Cached resolved DB instance — avoids re-awaiting the Promise on every call
  private dbPromise: Promise<IDBPDatabase<GymDBSchema>>;
  private resolvedDb: IDBPDatabase<GymDBSchema> | null = null;

  private fs = inject(FileSystemService);

  constructor() {
    this.dbPromise = openDB<GymDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('templates')) {
          db.createObjectStore('templates', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('monthly-logs')) {
          db.createObjectStore('monthly-logs', { keyPath: 'mesId' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    }).then(db => {
      this.resolvedDb = db;
      return db;
    });

    // After DB is ready: seed defaults and optionally sync from FS
    this.dbPromise.then(() => {
      this.initDefaultTemplates();
      setTimeout(() => {
        if (this.fs.isConnected()) {
          this.syncFromFileSystem();
        }
      }, 1000);
    });
  }

  /** Returns the DB, using the cached instance if already resolved */
  private async getDb(): Promise<IDBPDatabase<GymDBSchema>> {
    return this.resolvedDb ?? this.dbPromise;
  }

  // ─── Default Templates ───

  /**
   * On first launch (empty templates store), seeds the default templates.
   * This ensures a new user immediately sees useful routines.
   */
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

    // Write all files in parallel instead of sequentially
    await Promise.all([
      this.fs.writeJsonFile('templates.json', templates),
      this.fs.writeJsonFile('settings.json', settings),
      ...logs.map(async archive => {
        await this.fs.writeJsonFile(`${archive.mesId}.json`, archive);
        // Write rotating backup for each month during a full sync
        await this.fs.writeBackupJson(archive.mesId, archive);
      }),
    ]);
  }

  /**
   * Restores data from the connected FS folder into IndexedDB.
   * Reads templates.json, settings.json, and all YYYY-MM.json files.
   */
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

      // Restore monthly logs from all YYYY-MM.json files in the folder
      const monthlyFiles = await this.fs.listMonthlyFiles();
      for (const filename of monthlyFiles) {
        const archive = await this.fs.readJsonFile<ArchivoMensual>(filename);
        if (archive && archive.mesId && Array.isArray(archive.logs)) {
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

  async saveLog(log: LogDiario): Promise<void> {
    const database = await this.getDb();
    const mesId = log.fecha.substring(0, 7); // YYYY-MM

    let archive = await database.get('monthly-logs', mesId);
    if (!archive) {
      archive = { mesId, schemaVersion: CURRENT_SCHEMA_VERSION, logs: [] };
    }

    // Replace existing log for same date+template, or add new
    const existingIdx = archive.logs.findIndex(
      (l) => l.fecha === log.fecha && l.templateId === log.templateId
    );
    if (existingIdx >= 0) {
      archive.logs[existingIdx] = log;
    } else {
      archive.logs.push(log);
    }

    await database.put('monthly-logs', archive);

    if (this.fs.isConnected()) {
      await this.fs.writeJsonFile(`${mesId}.json`, archive);
    }
  }

  async getMonthlyArchive(mesId: string): Promise<ArchivoMensual | undefined> {
    const database = await this.getDb();
    return database.get('monthly-logs', mesId);
  }

  async deleteLog(fecha: string, templateId: string): Promise<void> {
    const database = await this.getDb();
    const mesId = fecha.substring(0, 7);

    const archive = await database.get('monthly-logs', mesId);
    if (archive) {
      archive.logs = archive.logs.filter(
        (l) => !(l.fecha === fecha && l.templateId === templateId)
      );
      await database.put('monthly-logs', archive);

      if (this.fs.isConnected()) {
        await this.fs.writeJsonFile(`${mesId}.json`, archive);
      }
    }
  }

  async getTrainingDays(): Promise<string[]> {
    const logs = await this.getAllMonthlyArchives();
    const days = new Set<string>();
    for (const archive of logs) {
      for (const log of archive.logs) {
        days.add(log.fecha);
      }
    }
    return Array.from(days).sort();
  }

  /**
   * Performance fix: instead of loading ALL archives just to get the latest log,
   * we get the archive keys first, then only load the most recent months until we
   * find a non-empty one.
   */
  async getLastLog(): Promise<LogDiario | null> {
    const database = await this.getDb();
    // Get all keys sorted descending (most recent first)
    const keys = (await database.getAllKeys('monthly-logs'))
      .map(k => k as string)
      .sort((a, b) => b.localeCompare(a));

    for (const key of keys) {
      const archive = await database.get('monthly-logs', key);
      if (archive && archive.logs.length > 0) {
        const sorted = [...archive.logs].sort((a, b) => b.fecha.localeCompare(a.fecha));
        return sorted[0];
      }
    }
    return null;
  }

  async getAllMonthlyArchives(): Promise<ArchivoMensual[]> {
    const database = await this.getDb();
    return database.getAll('monthly-logs');
  }

  async importMonthlyArchive(archive: ArchivoMensual): Promise<void> {
    const database = await this.getDb();
    const existing = await database.get('monthly-logs', archive.mesId);

    if (existing) {
      // Merge: add logs that don't exist yet
      const existingKeys = new Set(existing.logs.map(l => `${l.fecha}|${l.templateId}`));
      for (const log of archive.logs) {
        if (!existingKeys.has(`${log.fecha}|${log.templateId}`)) {
          existing.logs.push(log);
        }
      }
      existing.logs.sort((a, b) => a.fecha.localeCompare(b.fecha));
      // Preserve/upgrade schemaVersion
      if (!existing.schemaVersion) {
        existing.schemaVersion = archive.schemaVersion ?? CURRENT_SCHEMA_VERSION;
      }
      await database.put('monthly-logs', existing);
    } else {
      // Ensure schemaVersion is set
      const toStore: ArchivoMensual = {
        ...archive,
        schemaVersion: archive.schemaVersion ?? CURRENT_SCHEMA_VERSION,
      };
      await database.put('monthly-logs', toStore);
    }
  }

  // ─── Progression Queries ───

  async getLastExerciseLog(
    nombreEjercicio: string,
    mesId: string
  ): Promise<EjercicioLog | undefined> {
    const database = await this.getDb();
    const archive = await database.get('monthly-logs', mesId);
    if (!archive) return undefined;

    // Search from most recent log backwards
    const sortedLogs = [...archive.logs].sort((a, b) =>
      b.fecha.localeCompare(a.fecha)
    );

    for (const log of sortedLogs) {
      const ejercicio = log.ejercicios.find(
        (e) => e.nombre === nombreEjercicio
      );
      if (ejercicio) return ejercicio;
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
