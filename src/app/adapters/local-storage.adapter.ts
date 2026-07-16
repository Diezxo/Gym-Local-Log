import { Injectable, inject } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { StoragePort } from '../ports/storage.port';
import { Routine, WorkoutSession, UserSettings, DEFAULT_SETTINGS } from '../models/interfaces';
import { ChangeEvent, SyncOperation } from '../models/sync';
import { FileSystemService } from '../services/file-system.service';
import { DEFAULT_TEMPLATES } from '../models/default-templates';

// ─── IndexedDB Schema V3 ───
interface GymDBSchemaV3 extends DBSchema {
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
const DB_VERSION = 3;

@Injectable({
  providedIn: 'root'
})
export class LocalStorageAdapter implements StoragePort {
  private dbPromise: Promise<IDBPDatabase<GymDBSchemaV3>>;
  private resolvedDb: IDBPDatabase<GymDBSchemaV3> | null = null;
  private fs = inject(FileSystemService);

  constructor() {
    this.dbPromise = openDB<GymDBSchemaV3>(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, newVersion, transaction) {
        // v1 -> v2 was handled in the old DbService. 
        // We assume migrations up to v2 are already done or handled by migration runner.
        // The migration-runner.ts will handle data migration from v2 stores to v3 stores.
        // Here we just ensure the V3 schema stores exist.
        
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
      }
    }).then(db => {
      this.resolvedDb = db;
      return db;
    });

    this.dbPromise.then(() => {
      this.initDefaultRoutines();
    });
  }

  private async getDb(): Promise<IDBPDatabase<GymDBSchemaV3>> {
    return this.resolvedDb ?? this.dbPromise;
  }

  private async logChange(operation: SyncOperation, entityType: 'Routine' | 'WorkoutSession' | 'UserSettings', entity: any) {
    const db = await this.getDb();
    const event: ChangeEvent = {
      eventId: crypto.randomUUID(),
      entityType,
      entityId: entity.id,
      operation,
      occurredAt: Date.now(),
      payload: entity,
      version: entity.version
    };
    await db.put('pending_changes', event);
  }

  private async initDefaultRoutines(): Promise<void> {
    try {
      const db = await this.getDb();
      const existing = await db.getAll('routines');
      if (existing.length === 0) {
        for (const routine of DEFAULT_TEMPLATES) {
          await db.put('routines', routine);
        }
      }
    } catch (e) {
      console.warn('Error seeding default routines:', e);
    }
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
    // In IDB, we can use an index with a bound range
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
    await db.put('settings', settings);
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
