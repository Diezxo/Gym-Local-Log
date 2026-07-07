import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Template,
  ArchivoMensual,
  LogDiario,
  EjercicioLog,
  UserSettings,
  DEFAULT_SETTINGS,
} from '../models/interfaces';

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
  }

  // ─── Templates ───

  async saveTemplate(template: Template): Promise<void> {
    const database = await this.db;
    await database.put('templates', template);
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
  }

  async getMonthlyArchive(mesId: string): Promise<ArchivoMensual | undefined> {
    const database = await this.db;
    return database.get('monthly-logs', mesId);
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
  }
}
