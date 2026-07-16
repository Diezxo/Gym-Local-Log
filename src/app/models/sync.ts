export type SyncStatus = 'local_only' | 'pending_sync' | 'synced' | 'conflict';
export type SyncOperation = 'create' | 'update' | 'delete';

export interface BaseEntity {
  id: string; // UUID
  schemaVersion: number;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  deletedAt?: number; // Soft delete
  deviceId: string;
  version: number; // For optimistic concurrency
  syncStatus: SyncStatus;
}

export interface ChangeEvent {
  eventId: string; // UUID
  entityType: 'Routine' | 'WorkoutSession' | 'UserSettings';
  entityId: string;
  operation: SyncOperation;
  occurredAt: number;
  payload: any;
  version: number; // Version of the entity when change occurred
}
