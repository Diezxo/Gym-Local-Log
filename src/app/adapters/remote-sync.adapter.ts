import { Injectable } from '@angular/core';
import { StoragePort } from '../ports/storage.port';
import { Routine, WorkoutSession, UserSettings } from '../models/interfaces';
import { ChangeEvent } from '../models/sync';

/**
 * Stub for future backend integration.
 * Will implement Remote Sync logic (HTTP calls) in Phase 2.
 */
@Injectable()
export class RemoteSyncAdapter implements StoragePort {
  
  constructor() {
    console.warn('RemoteSyncAdapter is currently a stub for phase 2.');
  }

  async saveRoutine(routine: Routine): Promise<void> { throw new Error('Not implemented'); }
  async getRoutines(): Promise<Routine[]> { throw new Error('Not implemented'); }
  async getRoutine(id: string): Promise<Routine | undefined> { throw new Error('Not implemented'); }
  async deleteRoutine(id: string): Promise<void> { throw new Error('Not implemented'); }

  async saveWorkoutSession(session: WorkoutSession): Promise<void> { throw new Error('Not implemented'); }
  async getWorkoutSession(id: string): Promise<WorkoutSession | undefined> { throw new Error('Not implemented'); }
  async getWorkoutSessionsByDateRange(startDate: string, endDate: string): Promise<WorkoutSession[]> { throw new Error('Not implemented'); }
  async getAllWorkoutSessions(): Promise<WorkoutSession[]> { throw new Error('Not implemented'); }
  async deleteWorkoutSession(id: string): Promise<void> { throw new Error('Not implemented'); }
  async getTrainingDays(): Promise<string[]> { throw new Error('Not implemented'); }

  async getSettings(): Promise<UserSettings> { throw new Error('Not implemented'); }
  async saveSettings(settings: UserSettings): Promise<void> { throw new Error('Not implemented'); }

  async getPendingChanges(): Promise<ChangeEvent[]> { throw new Error('Not implemented'); }
  async removePendingChanges(eventIds: string[]): Promise<void> { throw new Error('Not implemented'); }
}
