import { Injectable, inject, signal } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { StoragePort } from '../ports/storage.port';
import { Routine, WorkoutSession, UserSettings, DEFAULT_SETTINGS } from '../models/interfaces';
import { ChangeEvent, SyncOperation } from '../models/sync';
import { FileSystemService } from '../services/file-system.service';
import { generateId } from '../utils/generate-id';

// ─── IndexedDB Schema V4 ───
interface GymDBSchemaV4 extends DBSchema {
  routines: {
    key: string;
    value: Routine;
  };
  workout_sessions: {
    key: string;
    value: WorkoutSession;
    indexes: { 'by-date': string };
  };
  settings: {
    key: string;
    value: UserSettings;
  };
  pending_changes: {
    key: string;
    value: ChangeEvent;
    indexes: { 'by-occurred-at': number };
  };
}

const DB_NAME = 'gym-local-log';
const DB_VERSION = 4;

@Injectable({
  providedIn: 'root'
})
export class LocalStorageAdapter implements StoragePort {
  // Fix #2: Expose a db error signal so the UI can react to fatal IDB failures.
  readonly dbError = signal<string | null>(null);

  private dbPromise: Promise<IDBPDatabase<GymDBSchemaV4>>;  // Fix #7: use typed schema
  private resolvedDb: IDBPDatabase<GymDBSchemaV4> | null = null;
  private fs = inject(FileSystemService);

  constructor() {
    // Fix #2: Wrap openDB with a .catch() that surfaces the error instead of
    // letting the rejected promise propagate silently to every method.
    this.dbPromise = openDB<GymDBSchemaV4>(DB_NAME, DB_VERSION, {
      async upgrade(rawDb, oldVersion, _newVersion, transaction) {
        // Cast to 'any' during migrations only: we need to access old store names
        // ('templates', 'monthly-archives') that don't exist in GymDBSchemaV4.
        // The typed schema is enforced everywhere else in the adapter.
        const db = rawDb as IDBPDatabase<any>;
        const tx = transaction as any;

        // 1. Create new object stores if they don't exist
        if (!db.objectStoreNames.contains('routines')) {
          db.createObjectStore('routines', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('workout_sessions')) {
          const store = db.createObjectStore('workout_sessions', { keyPath: 'id' });
          store.createIndex('by-date', 'date');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pending_changes')) {
          const store = db.createObjectStore('pending_changes', { keyPath: 'eventId' });
          store.createIndex('by-occurred-at', 'occurredAt');
        }

        // 2. Data Migration from older versions to V4
        if (oldVersion > 0 && oldVersion < 4) {

          // Migrate templates -> routines
          if (db.objectStoreNames.contains('templates')) {
            const oldTemplates = await tx.objectStore('templates').getAll();
            const routineStore = tx.objectStore('routines');
            for (const t of oldTemplates) {
              if (!t.schemaVersion || t.schemaVersion < 3) {
                await routineStore.put({
                  id: t.id,
                  schemaVersion: 4,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                  deviceId: 'local',
                  version: 1,
                  syncStatus: 'local_only',
                  name: t.name,
                  exercises: t.exercises
                } as Routine);
              }
            }
            db.deleteObjectStore('templates');
          }

          // Migrate monthly-archives -> workout_sessions
          if (db.objectStoreNames.contains('monthly-archives')) {
            const archives = await tx.objectStore('monthly-archives').getAll();
            const sessionStore = tx.objectStore('workout_sessions');
            for (const archive of archives) {
              if (archive.logs) {
                for (const log of archive.logs) {
                  await sessionStore.put({
                    id: generateId(),
                    schemaVersion: 4,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    deviceId: 'local',
                    version: 1,
                    syncStatus: 'local_only',
                    date: log.date,
                    routineId: log.templateId,
                    notes: log.notes,
                    exercises: log.exercises
                  } as WorkoutSession);
                }
              }
            }
            db.deleteObjectStore('monthly-archives');
          }

          // Migrate settings
          if (db.objectStoreNames.contains('settings')) {
            const settingsStore = tx.objectStore('settings');
            const oldSettings = await settingsStore.get('user-settings');
            if (oldSettings && (!oldSettings.schemaVersion || oldSettings.schemaVersion < 3)) {
              await settingsStore.put({
                ...oldSettings,
                id: 'user-settings',
                schemaVersion: 4,
                createdAt: oldSettings.createdAt || Date.now(),
                updatedAt: Date.now(),
                deviceId: 'local',
                version: (oldSettings.version || 0) + 1,
                syncStatus: 'local_only',
              } as UserSettings);
            }
          }
        }
      }
    }).then(db => {
      this.resolvedDb = db;
      return db;
    }).catch(err => {
      // Fix #2: Surface the error so the UI can show a meaningful message
      // instead of failing silently on every subsequent IDB operation.
      const msg = `No se pudo abrir la base de datos (${err?.name ?? 'Error desconocido'}). Intenta recargar la página.`;
      this.dbError.set(msg);
      console.error('[LocalStorageAdapter] Fatal IDB open error:', err);
      throw err;
    });
  }

  private async getDb(): Promise<IDBPDatabase<GymDBSchemaV4>> {
    return this.resolvedDb ?? this.dbPromise;
  }

  private async logChange(operation: SyncOperation, entityType: 'Routine' | 'WorkoutSession' | 'UserSettings', entity: any) {
    const db = await this.getDb();
    const event: ChangeEvent = {
      eventId: generateId(),
      entityType,
      entityId: entity.id,
      operation,
      occurredAt: Date.now(),
      payload: entity,
      version: entity.version
    };
    await db.put('pending_changes', event);
  }

  // --- Routines ---
  async saveRoutine(routine: Routine): Promise<void> {
    const db = await this.getDb();
    const existing = await db.get('routines', routine.id);
    const op = existing ? 'update' : 'create';

    routine.updatedAt = Date.now();
    routine.version = (routine.version || 0) + 1;
    if (routine.syncStatus !== 'local_only') {
      routine.syncStatus = 'pending_sync';
    }

    await db.put('routines', routine);
    await this.logChange(op, 'Routine', routine);
  }

  async getRoutines(): Promise<Routine[]> {
    const db = await this.getDb();
    const routines = await db.getAll('routines');
    return routines.filter(r => !r.deletedAt);
  }

  async getRoutine(id: string): Promise<Routine | undefined> {
    const db = await this.getDb();
    const routine = await db.get('routines', id);
    return (routine && !routine.deletedAt) ? routine : undefined;
  }

  async deleteRoutine(id: string): Promise<void> {
    const db = await this.getDb();
    const routine = await db.get('routines', id);
    if (routine) {
      routine.deletedAt = Date.now();
      routine.updatedAt = Date.now();
      routine.version += 1;
      if (routine.syncStatus !== 'local_only') {
        routine.syncStatus = 'pending_sync';
      }
      await db.put('routines', routine);
      await this.logChange('delete', 'Routine', routine);
    }
  }

  // --- Workout Sessions ---
  async saveWorkoutSession(session: WorkoutSession): Promise<void> {
    const db = await this.getDb();
    const existing = await db.get('workout_sessions', session.id);
    const op = existing ? 'update' : 'create';

    session.updatedAt = Date.now();
    session.version = (session.version || 0) + 1;
    if (session.syncStatus !== 'local_only') {
      session.syncStatus = 'pending_sync';
    }

    await db.put('workout_sessions', session);
    await this.logChange(op, 'WorkoutSession', session);
  }

  async getWorkoutSession(id: string): Promise<WorkoutSession | undefined> {
    const db = await this.getDb();
    const session = await db.get('workout_sessions', id);
    return (session && !session.deletedAt) ? session : undefined;
  }

  async getWorkoutSessionsByDateRange(startDate: string, endDate: string): Promise<WorkoutSession[]> {
    const db = await this.getDb();
    const range = IDBKeyRange.bound(startDate, endDate);
    const sessions = await db.getAllFromIndex('workout_sessions', 'by-date', range);
    return sessions.filter(s => !s.deletedAt).sort((a, b) => b.date.localeCompare(a.date));
  }

  async getAllWorkoutSessions(): Promise<WorkoutSession[]> {
    const db = await this.getDb();
    const sessions = await db.getAll('workout_sessions');
    return sessions.filter(s => !s.deletedAt).sort((a, b) => b.date.localeCompare(a.date));
  }

  async deleteWorkoutSession(id: string): Promise<void> {
    const db = await this.getDb();
    const session = await db.get('workout_sessions', id);
    if (session) {
      session.deletedAt = Date.now();
      session.updatedAt = Date.now();
      session.version += 1;
      if (session.syncStatus !== 'local_only') {
        session.syncStatus = 'pending_sync';
      }
      await db.put('workout_sessions', session);
      await this.logChange('delete', 'WorkoutSession', session);
    }
  }

  async getTrainingDays(): Promise<string[]> {
    const sessions = await this.getAllWorkoutSessions();
    const days = new Set<string>();
    for (const s of sessions) {
      days.add(s.date);
    }
    return Array.from(days).sort();
  }

  // --- Settings ---
  async getSettings(): Promise<UserSettings> {
    const db = await this.getDb();
    const settings = await db.get('settings', 'user-settings');
    return settings ?? { ...DEFAULT_SETTINGS };
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    const db = await this.getDb();
    settings.id = 'user-settings';
    settings.updatedAt = Date.now();
    settings.version = (settings.version || 0) + 1;
    if (settings.syncStatus !== 'local_only') {
      settings.syncStatus = 'pending_sync';
    }

    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    if (store.keyPath) {
      await store.put(settings);
    } else {
      await store.put(settings, 'user-settings');
    }
    await tx.done;

    await this.logChange('update', 'UserSettings', settings);
  }

  // --- Sync & Events ---
  async getPendingChanges(): Promise<ChangeEvent[]> {
    const db = await this.getDb();
    return db.getAllFromIndex('pending_changes', 'by-occurred-at');
  }

  async removePendingChanges(eventIds: string[]): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction('pending_changes', 'readwrite');
    for (const id of eventIds) {
      tx.store.delete(id);
    }
    await tx.done;
  }
}
