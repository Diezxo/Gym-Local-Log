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

@Injectable({ providedIn: 'root' })
export class DbService {
  private db: Promise<IDBPDatabase<GymDBSchema>>;
  private fs = inject(FileSystemService);

  constructor() {
    this.db = openDB<GymDBSchema>(DB_NAME, DB_VERSION, {
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
    });

    // Check if FS is connected and sync back on startup if possible
    setTimeout(() => {
      if (this.fs.isConnected()) {
        this.syncFromFileSystem();
      }
    }, 1000);
  }

  // ─── Sync ───

  async syncToFileSystem(): Promise<void> {
    if (!this.fs.isConnected()) return;
    const [templates, logs, settings] = await Promise.all([
      this.getTemplates(),
      this.getAllMonthlyArchives(),
      this.getSettings(),
    ]);

    await this.fs.writeJsonFile('templates.json', templates);
    await this.fs.writeJsonFile('settings.json', settings);
    for (const archive of logs) {
      await this.fs.writeJsonFile(`${archive.mesId}.json`, archive);
    }
  }

  async syncFromFileSystem(): Promise<void> {
    if (!this.fs.isConnected()) return;
    try {
      const templates = await this.fs.readJsonFile<Template[]>('templates.json');
      if (templates) {
        const database = await this.db;
        for (const t of templates) await database.put('templates', t);
      }
      
      const settings = await this.fs.readJsonFile<UserSettings>('settings.json');
      if (settings) {
        await this.saveSettings(settings); // This might loop back to write to FS, but that's okay
      }
      // Note: syncing monthly logs dynamically requires reading directory entries, 
      // which we'll skip for now to keep it simple, assuming IDB is up to date unless a new file was manually dropped.
    } catch (e) {
      console.warn('Error syncing from FS on startup:', e);
    }
  }

  // ─── Templates ───

  async saveTemplate(template: Template): Promise<void> {
    const database = await this.db;
    await database.put('templates', template);
    
    if (this.fs.isConnected()) {
      const all = await database.getAll('templates');
      await this.fs.writeJsonFile('templates.json', all);
    }
  }

  async getTemplates(): Promise<Template[]> {
    const database = await this.db;
    return database.getAll('templates');
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const database = await this.db;
    return database.get('templates', id);
  }

  async deleteTemplate(id: string): Promise<void> {
    const database = await this.db;
    await database.delete('templates', id);

    if (this.fs.isConnected()) {
      const all = await database.getAll('templates');
      await this.fs.writeJsonFile('templates.json', all);
    }
  }

  // ─── Monthly Logs ───

  async saveLog(log: LogDiario): Promise<void> {
    const database = await this.db;
    const mesId = log.fecha.substring(0, 7); // YYYY-MM

    let archive = await database.get('monthly-logs', mesId);
    if (!archive) {
      archive = { mesId, logs: [] };
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
    const database = await this.db;
    return database.get('monthly-logs', mesId);
  }

  async deleteLog(fecha: string, templateId: string): Promise<void> {
    const database = await this.db;
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

  async getLastLog(): Promise<LogDiario | null> {
    const logs = await this.getAllMonthlyArchives();
    if (logs.length === 0) return null;
    
    logs.sort((a, b) => b.mesId.localeCompare(a.mesId));
    
    for (const archive of logs) {
      if (archive.logs.length > 0) {
        const sortedLogs = [...archive.logs].sort((a, b) => b.fecha.localeCompare(a.fecha));
        return sortedLogs[0];
      }
    }
    return null;
  }

  async getAllMonthlyArchives(): Promise<ArchivoMensual[]> {
    const database = await this.db;
    return database.getAll('monthly-logs');
  }

  async importMonthlyArchive(archive: ArchivoMensual): Promise<void> {
    const database = await this.db;
    const existing = await database.get('monthly-logs', archive.mesId);

    if (existing) {
      // Merge: add logs that don't exist yet
      for (const log of archive.logs) {
        const exists = existing.logs.some(
          (l) => l.fecha === log.fecha && l.templateId === log.templateId
        );
        if (!exists) {
          existing.logs.push(log);
        }
      }
      existing.logs.sort((a, b) => a.fecha.localeCompare(b.fecha));
      await database.put('monthly-logs', existing);
    } else {
      await database.put('monthly-logs', archive);
    }
  }

  // ─── Progression Queries ───

  async getLastExerciseLog(
    nombreEjercicio: string,
    mesId: string
  ): Promise<EjercicioLog | undefined> {
    const database = await this.db;
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
    const database = await this.db;
    const settings = await database.get('settings', 'user-settings');
    return settings ?? { ...DEFAULT_SETTINGS };
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    const database = await this.db;
    await database.put('settings', settings, 'user-settings');

    if (this.fs.isConnected()) {
      await this.fs.writeJsonFile('settings.json', settings);
    }
  }
}
