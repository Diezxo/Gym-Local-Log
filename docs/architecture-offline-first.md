# Gym Local Log - Offline-First Architecture

## Overview
The architecture has been refactored to support robust offline-first functionality while being fully prepared for a future backend sync. 

## Key Concepts

### 1. Ports and Adapters (Hexagonal Architecture)
- **`StoragePort`**: The contract that defines how the application interacts with data storage. The application core (`UseCases`) only knows about this port, not the implementation.
- **`LocalStorageAdapter`**: The implementation of `StoragePort` using IndexedDB (via `idb-keyval`). This maintains 100% of the current offline functionality.
- **`InMemoryAdapter`**: A lightweight implementation used for unit testing.
- **`RemoteSyncAdapter`**: A stub that can be implemented in the future to connect to a backend API (e.g., Firebase, Supabase).

### 2. Application Core (Use Cases)
The UI components no longer interact directly with the database. Instead, they call **Use Cases**, which orchestrate the domain logic and data access.
- `WorkoutUseCases`: Manages `WorkoutSession` creation, updates, and queries.
- `RoutineUseCases`: Manages `Routine` (Template) management.
- `SyncUseCases`: Manages data import/export, and in the future, backend synchronization.

### 3. Sync Readiness
The domain models have been updated to support eventual consistency:
- UUIDs for all entities.
- Timestamps (`createdAt`, `updatedAt`).
- `deviceId` to track where changes originated.
- `version` and `syncStatus` (`local_only`, `synced`) for tracking sync state and conflict resolution.
- Soft-delete capability.

## Migration (v2 to v3)
The data schema has been flattened. Previously, `WorkoutSession` (formerly `DailyLog`) objects were stored within nested `MonthlyArchive` objects. Now, they are stored as a flat list, but the application continues to group them correctly for UI presentation and file exports, ensuring no disruption to user experience.
