import { openDB } from 'idb';
import { Routine, WorkoutSession, UserSettings } from '../models/interfaces';
import { generateId } from '../utils/generate-id';

export async function migrateV2toV3(): Promise<void> {
  console.log('Starting migration V2 to V3...');
  const db = await openDB('gym-local-log', 3);
  
  // We need to read from the old stores if they exist.
  // Because idb v3 schema defines the new stores, old ones might still exist but aren't strictly in the types unless we cast.
  
  const tx = db.transaction(['monthly-archives', 'templates', 'settings', 'routines', 'workout_sessions'], 'readwrite');
  
  try {
    const archives = await tx.objectStore('monthly-archives' as any).getAll();
    const oldTemplates = await tx.objectStore('templates' as any).getAll();
    const oldSettings = await tx.objectStore('settings' as any).get('user-settings');
    
    // Migrate Templates to Routines
    for (const t of oldTemplates) {
      if (!t.schemaVersion || t.schemaVersion < 3) {
        const routine: Routine = {
          id: t.id,
          schemaVersion: 3,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          deviceId: 'local',
          version: 1,
          syncStatus: 'local_only',
          name: t.name,
          exercises: t.exercises
        };
        await tx.objectStore('routines').put(routine);
      }
    }

    // Migrate Settings
    if (oldSettings && (!oldSettings.schemaVersion || oldSettings.schemaVersion < 3)) {
      const settings: UserSettings = {
        ...oldSettings,
        id: 'user-settings',
        schemaVersion: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deviceId: 'local',
        version: 1,
        syncStatus: 'local_only',
      };
      await tx.objectStore('settings').put(settings);
    }

    // Migrate Monthly Archives to flat WorkoutSessions
    const sessionStore = tx.objectStore('workout_sessions');
    for (const archive of archives) {
      if (archive.logs) {
        for (const log of archive.logs) {
          const session: WorkoutSession = {
            id: generateId(),
            schemaVersion: 3,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            deviceId: 'local',
            version: 1,
            syncStatus: 'local_only',
            date: log.date,
            routineId: log.templateId,
            notes: log.notes,
            exercises: log.exercises
          };
          await sessionStore.put(session);
        }
      }
    }
    
    // Optional: We can delete the old stores later or keep them as backup.
    // We will clear them to save space since data is now in v3 stores.
    await tx.objectStore('monthly-archives' as any).clear();
    // We keep 'templates' just in case, but we could clear it.
    
    await tx.done;
    console.log('Migration V2 to V3 completed successfully.');
    
    // Flag in localStorage that migration V3 is done so we don't run it again
    localStorage.setItem('gym_log_schema_version', '3');
  } catch (e) {
    console.error('Error during V2 to V3 migration', e);
    tx.abort();
  }
}
