import { Injectable, inject } from '@angular/core';
import { STORAGE_PORT, StoragePort } from '../ports/storage.port';
import { WorkoutSession } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class WorkoutUseCases {
  private storage = inject<StoragePort>(STORAGE_PORT);

  async createWorkoutSession(sessionData: Omit<WorkoutSession, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt' | 'deviceId' | 'version' | 'syncStatus'>): Promise<WorkoutSession> {
    const session: WorkoutSession = {
      ...sessionData,
      id: crypto.randomUUID(),
      schemaVersion: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deviceId: 'local',
      version: 1,
      syncStatus: 'local_only',
    };
    await this.storage.saveWorkoutSession(session);
    return session;
  }

  async updateWorkoutSession(session: WorkoutSession): Promise<void> {
    await this.storage.saveWorkoutSession(session);
  }

  async getWorkoutSession(id: string): Promise<WorkoutSession | undefined> {
    return this.storage.getWorkoutSession(id);
  }

  async getWorkoutsByDateRange(startDate: string, endDate: string): Promise<WorkoutSession[]> {
    return this.storage.getWorkoutSessionsByDateRange(startDate, endDate);
  }

  async getAllWorkouts(): Promise<WorkoutSession[]> {
    return this.storage.getAllWorkoutSessions();
  }

  async deleteWorkoutSession(id: string): Promise<void> {
    await this.storage.deleteWorkoutSession(id);
  }

  async getTrainingDays(): Promise<string[]> {
    return this.storage.getTrainingDays();
  }

  async getLastWorkout(): Promise<WorkoutSession | null> {
    const workouts = await this.storage.getAllWorkoutSessions();
    if (workouts.length === 0) return null;
    return workouts[0]; // Already sorted descending by LocalStorageAdapter
  }
}
