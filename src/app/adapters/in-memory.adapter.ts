import { Injectable } from '@angular/core';
import { StoragePort } from '../ports/storage.port';
import { Routine, WorkoutSession, UserSettings, DEFAULT_SETTINGS } from '../models/interfaces';
import { ChangeEvent, SyncOperation } from '../models/sync';
import { generateId } from '../utils/generate-id';

@Injectable()
export class InMemoryAdapter implements StoragePort {
  private routines = new Map<string, Routine>();
  private sessions = new Map<string, WorkoutSession>();
  private settings: UserSettings = { ...DEFAULT_SETTINGS };
  private pendingChanges: ChangeEvent[] = [];

  private logChange(operation: SyncOperation, entityType: 'Routine' | 'WorkoutSession' | 'UserSettings', entity: any) {
    this.pendingChanges.push({
      eventId: generateId(),
      entityType,
      entityId: entity.id,
      operation,
      occurredAt: Date.now(),
      payload: JSON.parse(JSON.stringify(entity)), // clone
      version: entity.version
    });
  }

  // --- Routines ---
  async saveRoutine(routine: Routine): Promise<void> {
    const existing = this.routines.get(routine.id);
    const op = existing ? 'update' : 'create';
    
    const clone = JSON.parse(JSON.stringify(routine));
    clone.updatedAt = Date.now();
    clone.version = (clone.version || 0) + 1;
    if (clone.syncStatus !== 'local_only') clone.syncStatus = 'pending_sync';

    this.routines.set(routine.id, clone);
    this.logChange(op, 'Routine', clone);
  }

  async getRoutines(): Promise<Routine[]> {
    return Array.from(this.routines.values()).filter(r => !r.deletedAt).map(r => JSON.parse(JSON.stringify(r)));
  }

  async getRoutine(id: string): Promise<Routine | undefined> {
    const routine = this.routines.get(id);
    return (routine && !routine.deletedAt) ? JSON.parse(JSON.stringify(routine)) : undefined;
  }

  async deleteRoutine(id: string): Promise<void> {
    const routine = this.routines.get(id);
    if (routine && !routine.deletedAt) {
      routine.deletedAt = Date.now();
      routine.updatedAt = Date.now();
      routine.version += 1;
      if (routine.syncStatus !== 'local_only') routine.syncStatus = 'pending_sync';
      this.logChange('delete', 'Routine', routine);
    }
  }

  // --- Workout Sessions ---
  async saveWorkoutSession(session: WorkoutSession): Promise<void> {
    const existing = this.sessions.get(session.id);
    const op = existing ? 'update' : 'create';
    
    const clone = JSON.parse(JSON.stringify(session));
    clone.updatedAt = Date.now();
    clone.version = (clone.version || 0) + 1;
    if (clone.syncStatus !== 'local_only') clone.syncStatus = 'pending_sync';

    this.sessions.set(session.id, clone);
    this.logChange(op, 'WorkoutSession', clone);
  }

  async getWorkoutSession(id: string): Promise<WorkoutSession | undefined> {
    const session = this.sessions.get(id);
    return (session && !session.deletedAt) ? JSON.parse(JSON.stringify(session)) : undefined;
  }

  async getWorkoutSessionsByDateRange(startDate: string, endDate: string): Promise<WorkoutSession[]> {
    return Array.from(this.sessions.values())
      .filter(s => !s.deletedAt && s.date >= startDate && s.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(s => JSON.parse(JSON.stringify(s)));
  }

  async getAllWorkoutSessions(): Promise<WorkoutSession[]> {
    return Array.from(this.sessions.values())
      .filter(s => !s.deletedAt)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(s => JSON.parse(JSON.stringify(s)));
  }

  async deleteWorkoutSession(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (session && !session.deletedAt) {
      session.deletedAt = Date.now();
      session.updatedAt = Date.now();
      session.version += 1;
      if (session.syncStatus !== 'local_only') session.syncStatus = 'pending_sync';
      this.logChange('delete', 'WorkoutSession', session);
    }
  }

  async getTrainingDays(): Promise<string[]> {
    const days = new Set<string>();
    for (const session of this.sessions.values()) {
      if (!session.deletedAt) {
        days.add(session.date);
      }
    }
    return Array.from(days).sort();
  }

  // --- Settings ---
  async getSettings(): Promise<UserSettings> {
    return JSON.parse(JSON.stringify(this.settings));
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    const clone = JSON.parse(JSON.stringify(settings));
    clone.updatedAt = Date.now();
    clone.version = (clone.version || 0) + 1;
    if (clone.syncStatus !== 'local_only') clone.syncStatus = 'pending_sync';
    this.settings = clone;
    this.logChange('update', 'UserSettings', clone);
  }

  // --- Sync & Events ---
  async getPendingChanges(): Promise<ChangeEvent[]> {
    return JSON.parse(JSON.stringify(this.pendingChanges));
  }

  async removePendingChanges(eventIds: string[]): Promise<void> {
    const ids = new Set(eventIds);
    this.pendingChanges = this.pendingChanges.filter(e => !ids.has(e.eventId));
  }
}
