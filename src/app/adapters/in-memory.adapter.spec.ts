import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryAdapter } from './in-memory.adapter';
import { Routine, WorkoutSession } from '../models/interfaces';

describe('InMemoryAdapter', () => {
  let adapter: InMemoryAdapter;

  beforeEach(() => {
    adapter = new InMemoryAdapter();
  });

  describe('Routines (Templates)', () => {
    it('should save and retrieve a routine', async () => {
      const routine: Routine = {
        id: 'r1',
        schemaVersion: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deviceId: 'test',
        version: 1,
        syncStatus: 'local_only',
        name: 'Test Routine',
        exercises: []
      };

      await adapter.saveRoutine(routine);
      const retrieved = await adapter.getRoutine('r1');
      expect(retrieved).toEqual({ ...routine, version: 2 });
    });

    it('should return all routines', async () => {
      await adapter.saveRoutine({ id: 'r1', name: 'R1' } as any);
      await adapter.saveRoutine({ id: 'r2', name: 'R2' } as any);

      const routines = await adapter.getRoutines();
      expect(routines.length).toBe(2);
      expect(routines.map(r => r.id)).toContain('r1');
    });

    it('should delete a routine', async () => {
      await adapter.saveRoutine({ id: 'r1', name: 'R1' } as any);
      await adapter.deleteRoutine('r1');
      
      const retrieved = await adapter.getRoutine('r1');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Workout Sessions', () => {
    it('should save and retrieve a session', async () => {
      const session: WorkoutSession = {
        id: 's1',
        schemaVersion: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deviceId: 'test',
        version: 1,
        syncStatus: 'local_only',
        date: '2026-07-16',
        routineId: 'r1',
        exercises: [],
        notes: ''
      };

      await adapter.saveWorkoutSession(session);
      const retrieved = await adapter.getWorkoutSession('s1');
      expect(retrieved).toMatchObject({ 
        ...session, 
        version: 2,
        updatedAt: expect.any(Number)
      });
    });

    it('should query sessions by date range', async () => {
      await adapter.saveWorkoutSession({ id: 's1', date: '2026-07-01' } as any);
      await adapter.saveWorkoutSession({ id: 's2', date: '2026-07-15' } as any);
      await adapter.saveWorkoutSession({ id: 's3', date: '2026-07-31' } as any);

      const sessions = await adapter.getWorkoutSessionsByDateRange('2026-07-10', '2026-07-20');
      expect(sessions.length).toBe(1);
      expect(sessions[0].id).toBe('s2');
    });

    it('should extract unique training days', async () => {
      await adapter.saveWorkoutSession({ id: 's1', date: '2026-07-01' } as any);
      await adapter.saveWorkoutSession({ id: 's2', date: '2026-07-01' } as any); // same day
      await adapter.saveWorkoutSession({ id: 's3', date: '2026-07-02' } as any);

      const days = await adapter.getTrainingDays();
      expect(days.length).toBe(2);
      expect(days.sort()).toEqual(['2026-07-01', '2026-07-02']);
    });
  });
});
