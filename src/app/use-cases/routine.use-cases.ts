import { Injectable, inject } from '@angular/core';
import { STORAGE_PORT, StoragePort } from '../ports/storage.port';
import { Routine } from '../models/interfaces';
import { generateId } from '../utils/generate-id';

@Injectable({ providedIn: 'root' })
export class RoutineUseCases {
  private storage = inject<StoragePort>(STORAGE_PORT);

  async createRoutine(routineData: Omit<Routine, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt' | 'deviceId' | 'version' | 'syncStatus'>): Promise<Routine> {
    // Ensure all exercises have an ID
    const exercisesWithIds = (routineData.exercises || []).map(ex => ({
      ...ex,
      exerciseId: ex.exerciseId || generateId()
    }));

    const routine: Routine = {
      ...routineData,
      exercises: exercisesWithIds,
      id: generateId(),
      schemaVersion: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deviceId: 'local',
      version: 1,
      syncStatus: 'local_only',
    };
    await this.storage.saveRoutine(routine);
    return routine;
  }

  async updateRoutine(routine: Routine): Promise<void> {
    // Ensure all exercises have an ID
    routine.exercises = (routine.exercises || []).map(ex => ({
      ...ex,
      exerciseId: ex.exerciseId || generateId()
    }));
    await this.storage.saveRoutine(routine);
  }

  async getRoutine(id: string): Promise<Routine | undefined> {
    return this.storage.getRoutine(id);
  }

  async getAllRoutines(): Promise<Routine[]> {
    return this.storage.getRoutines();
  }

  async deleteRoutine(id: string): Promise<void> {
    await this.storage.deleteRoutine(id);
  }
}
