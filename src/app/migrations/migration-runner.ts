import { Injectable } from '@angular/core';
import { migrateV2toV3 } from './v2_to_v3';

@Injectable({ providedIn: 'root' })
export class MigrationRunner {
  
  async runMigrations(): Promise<void> {
    const currentVersion = localStorage.getItem('gym_log_schema_version');
    
    // If there's no version, and there is IDB data, we might be on V2
    if (!currentVersion || parseInt(currentVersion, 10) < 3) {
      // Note: In a real app we'd check if old idb exists to avoid running migration on a fresh install.
      // But migrateV2toV3 handles empty stores fine.
      try {
        await migrateV2toV3();
      } catch (e) {
        console.error(`Migration failed:`, e);
        throw e;
      }
    }
  }
}
