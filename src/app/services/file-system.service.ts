import { Injectable, signal } from '@angular/core';
import { get, set } from 'idb-keyval'; // Lightweight idb wrapper for simple key-val

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
    } catch {
      // Ignore errors (e.g. API not supported)
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
}
