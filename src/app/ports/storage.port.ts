import { InjectionToken } from '@angular/core';
import { Routine, WorkoutSession, UserSettings } from '../models/interfaces';
import { ChangeEvent } from '../models/sync';

export interface StoragePort {
  // --- Routines ---
  saveRoutine(routine: Routine): Promise<void>;
  getRoutines(): Promise<Routine[]>;
  getRoutine(id: string): Promise<Routine | undefined>;
  deleteRoutine(id: string): Promise<void>;

  // --- Workout Sessions ---
  saveWorkoutSession(session: WorkoutSession): Promise<void>;
  getWorkoutSession(id: string): Promise<WorkoutSession | undefined>;
  getWorkoutSessionsByDateRange(startDate: string, endDate: string): Promise<WorkoutSession[]>;
  getAllWorkoutSessions(): Promise<WorkoutSession[]>;
  deleteWorkoutSession(id: string): Promise<void>;
  getTrainingDays(): Promise<string[]>;

  // --- Settings ---
  getSettings(): Promise<UserSettings>;
  saveSettings(settings: UserSettings): Promise<void>;

  // --- Sync & Events ---
  getPendingChanges(): Promise<ChangeEvent[]>;
  removePendingChanges(eventIds: string[]): Promise<void>;
}

export const STORAGE_PORT = new InjectionToken<StoragePort>('StoragePort');
