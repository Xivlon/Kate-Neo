/**
 * File System Watcher - Monitors file system changes
 * 
 * Provides file watching capabilities to detect changes in the workspace
 */

import { eventBus, IDEEventType } from '../events/EventBus';

export interface FileChangeEvent {
  path: string;
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  oldPath?: string; // For rename events
  timestamp: number;
}

export type FileChangeHandler = (event: FileChangeEvent) => void;

/**
 * File System Watcher Class
 * 
 * Monitors file system changes and emits events
 */
export class FileSystemWatcher {
  private watchers: Map<string, FileChangeHandler[]> = new Map();
  private isWatching: boolean = false;

  constructor() {
    console.log('[FileSystemWatcher] Initialized');
  }

  /**
   * Start watching a path
   */
  watch(path: string, handler: FileChangeHandler): () => void {
    if (!this.watchers.has(path)) {
      this.watchers.set(path, []);
    }
    
    this.watchers.get(path)!.push(handler);
    
    if (!this.isWatching) {
      this.startWatching();
    }
    
    console.log(`[FileSystemWatcher] Watching: ${path}`);
    
    // Return unwatch function
    return () => this.unwatch(path, handler);
  }

  /**
   * Stop watching a path
   */
  unwatch(path: string, handler: FileChangeHandler): void {
    const handlers = this.watchers.get(path);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
      
      if (handlers.length === 0) {
        this.watchers.delete(path);
        console.log(`[FileSystemWatcher] Stopped watching: ${path}`);
      }
    }
    
    if (this.watchers.size === 0 && this.isWatching) {
      this.stopWatching();
    }
  }

  /**
   * Start the file system watcher
   */
  private startWatching(): void {
    console.log('[FileSystemWatcher] TODO: Start native file system watching');
    
    // TODO: Implement actual file system watching
    // This will require:
    // 1. Integration with backend file system watcher (chokidar or similar)
    // 2. WebSocket connection to receive file change events
    // 3. Debouncing and batching of events
    
    this.isWatching = true;
  }

  /**
   * Stop the file system watcher
   */
  private stopWatching(): void {
    console.log('[FileSystemWatcher] Stopping file system watching');
    
    // TODO: Cleanup file system watching resources
    
    this.isWatching = false;
  }

  /**
   * Manually trigger a file change event
   * (Used for testing or manual notifications)
   */
  notifyChange(event: FileChangeEvent): void {
    // Notify specific path watchers
    const handlers = this.watchers.get(event.path);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('[FileSystemWatcher] Error in change handler:', error);
        }
      });
    }
    
    // Emit event on event bus
    switch (event.type) {
      case 'created':
        eventBus.emit(IDEEventType.FILE_CREATED, event);
        break;
      case 'modified':
        eventBus.emit(IDEEventType.FILE_CHANGED, event);
        break;
      case 'deleted':
        eventBus.emit(IDEEventType.FILE_DELETED, event);
        break;
      case 'renamed':
        eventBus.emit(IDEEventType.FILE_RENAMED, event);
        break;
    }
  }

  /**
   * Get all watched paths
   */
  getWatchedPaths(): string[] {
    return Array.from(this.watchers.keys());
  }

  /**
   * Check if a path is being watched
   */
  isPathWatched(path: string): boolean {
    return this.watchers.has(path);
  }

  /**
   * Clear all watchers
   */
  clearAll(): void {
    this.watchers.clear();
    if (this.isWatching) {
      this.stopWatching();
    }
  }

  /**
   * Shutdown the watcher
   */
  shutdown(): void {
    console.log('[FileSystemWatcher] Shutting down');
    this.clearAll();
  }
}

/**
 * Global file system watcher instance
 */
export const fileSystemWatcher = new FileSystemWatcher();
