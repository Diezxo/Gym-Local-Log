import { Injectable, signal } from '@angular/core';
import { get, set } from 'idb-keyval'; // Lightweight idb wrapper for simple key-val

const MAX_BACKUPS = 7;

@Injectable({ providedIn: 'root' })
export class FileSystemService {
  // State
  isConnected = signal(false);
  private dirHandle: FileSystemDirectoryHandle | null = null;

  constructor() {
    this.checkStoredHandle();
  }

  // 1. Check if we have a stored handle from a previous session
  private async checkStoredHandle(): Promise<void> {
    try {
      const handle = await get<FileSystemDirectoryHandle>('gym-local-folder-handle');
      if (handle) {
        this.dirHandle = handle;
        // We don't request permission immediately on load because it might prompt the user
        // without a user gesture. We just mark it as potentially available.
        // The user will need to click 'Conectar' or we check permission silently.
        const permission = await (handle as any).queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') {
          this.isConnected.set(true);
        }
      }
    } catch (e) {
      console.error('Error checking stored handle:', e);
    }
  }

  // 2. Connect to a folder (requires user gesture)
  async connectFolder(): Promise<boolean> {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('Tu navegador no soporta el acceso a carpetas locales (API no disponible).');
    }

    try {
      if (this.dirHandle) {
        const perm = await this.verifyPermission(this.dirHandle);
        if (perm) {
          this.isConnected.set(true);
          return true;
        }
      }

      // If no handle or permission denied, ask user to select a folder
      this.dirHandle = await (window as any).showDirectoryPicker({
        id: 'gym-local-log',
        mode: 'readwrite',
      });
      
      if (this.dirHandle) {
        await set('gym-local-folder-handle', this.dirHandle);
        this.isConnected.set(true);
        return true;
      }
      return false;
    } catch (error: any) {
      if (error.name === 'AbortError') return false; // User cancelled
      throw error;
    }
  }

  // 3. Verify/Request permission for a handle
  private async verifyPermission(fileHandle: FileSystemDirectoryHandle): Promise<boolean> {
    const options = { mode: 'readwrite' };
    const handleAny = fileHandle as any;
    // Check if we already have permission
    if ((await handleAny.queryPermission(options)) === 'granted') {
      return true;
    }
    // Request permission (must be triggered by user gesture)
    if ((await handleAny.requestPermission(options)) === 'granted') {
      return true;
    }
    return false;
  }

  // 4. File Operations

  async writeJsonFile(filename: string, data: any): Promise<void> {
    if (!this.isConnected() || !this.dirHandle) return;
    try {
      const fileHandle = await this.dirHandle.getFileHandle(filename, { create: true });
      const writable = await (fileHandle as any).createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
    } catch (e) {
      console.error('Error writing to file system:', e);
    }
  }

  async readJsonFile<T>(filename: string): Promise<T | null> {
    if (!this.isConnected() || !this.dirHandle) return null;
    try {
      const fileHandle = await this.dirHandle.getFileHandle(filename);
      const file = await fileHandle.getFile();
      const text = await file.text();
      return JSON.parse(text) as T;
    } catch (e: any) {
      if (e.name === 'NotFoundError') return null;
      console.error('Error reading from file system:', e);
      return null;
    }
  }

  // 5. List all YYYY-MM.json monthly data files in the connected folder
  async listMonthlyFiles(): Promise<string[]> {
    if (!this.isConnected() || !this.dirHandle) return [];
    const files: string[] = [];
    const monthPattern = /^\d{4}-\d{2}\.json$/;
    try {
      for await (const [name] of (this.dirHandle as any).entries()) {
        if (monthPattern.test(name)) {
          files.push(name);
        }
      }
    } catch (e) {
      console.error('Error listing monthly files:', e);
    }
    return files;
  }

  // 6. Write a rotating backup for a monthly archive (max MAX_BACKUPS per month)
  async writeBackupJson(monthId: string, data: any): Promise<void> {
    if (!this.isConnected() || !this.dirHandle) return;
    try {
      // Timestamp format: YYYY-MM-DD_HH-MM-SS (safe for filenames)
      const now = new Date();
      const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
      const backupFilename = `${monthId}_bak_${ts}.json`;
      await this.writeJsonFile(backupFilename, data);

      // Rotate: keep only the MAX_BACKUPS most recent backups for this month
      const backupPattern = new RegExp(`^${monthId}_bak_.*\\.json$`);
      const backupFiles: string[] = [];

      for await (const [name] of (this.dirHandle as any).entries()) {
        if (backupPattern.test(name)) {
          backupFiles.push(name);
        }
      }

      // Sort lexicographically — because the timestamp is embedded, oldest are first
      backupFiles.sort();

      // Delete oldest if we exceed MAX_BACKUPS
      while (backupFiles.length > MAX_BACKUPS) {
        const oldest = backupFiles.shift()!;
        try {
          await (this.dirHandle as any).removeEntry(oldest);
        } catch {
          // Ignore deletion errors
        }
      }
    } catch (e) {
      console.error('Error writing backup:', e);
    }
  }
}
