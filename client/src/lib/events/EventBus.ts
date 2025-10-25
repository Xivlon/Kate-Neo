/**
 * Event Bus - Centralized event system for IDE components
 * 
 * Provides a publish-subscribe mechanism for component communication
 */

export type EventHandler<T = any> = (data: T) => void;

export interface EventSubscription {
  unsubscribe(): void;
}

/**
 * Event types used throughout the IDE
 */
export enum IDEEventType {
  // Document events
  DOCUMENT_OPENED = 'document:opened',
  DOCUMENT_CHANGED = 'document:changed',
  DOCUMENT_SAVED = 'document:saved',
  DOCUMENT_CLOSED = 'document:closed',
  
  // Editor events
  EDITOR_FOCUS_CHANGED = 'editor:focus-changed',
  EDITOR_SELECTION_CHANGED = 'editor:selection-changed',
  EDITOR_CURSOR_MOVED = 'editor:cursor-moved',
  
  // File system events
  FILE_CREATED = 'file:created',
  FILE_CHANGED = 'file:changed',
  FILE_DELETED = 'file:deleted',
  FILE_RENAMED = 'file:renamed',
  
  // Workspace events
  WORKSPACE_OPENED = 'workspace:opened',
  WORKSPACE_CLOSED = 'workspace:closed',
  WORKSPACE_CONFIG_CHANGED = 'workspace:config-changed',
  
  // LSP events
  LSP_DIAGNOSTICS_UPDATED = 'lsp:diagnostics-updated',
  LSP_SERVER_STARTED = 'lsp:server-started',
  LSP_SERVER_STOPPED = 'lsp:server-stopped',
  
  // UI events
  THEME_CHANGED = 'ui:theme-changed',
  PANEL_OPENED = 'ui:panel-opened',
  PANEL_CLOSED = 'ui:panel-closed',
  
  // Git events
  GIT_STATUS_CHANGED = 'git:status-changed',
  GIT_BRANCH_CHANGED = 'git:branch-changed',
  
  // Terminal events
  TERMINAL_CREATED = 'terminal:created',
  TERMINAL_OUTPUT = 'terminal:output',
  TERMINAL_CLOSED = 'terminal:closed',
}

/**
 * Event Bus Class
 * 
 * Centralized event management system for the IDE
 */
export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private globalHandlers: Set<EventHandler> = new Set();

  constructor() {
    console.log('[EventBus] Initialized');
  }

  /**
   * Subscribe to a specific event
   */
  on<T = any>(event: IDEEventType | string, handler: EventHandler<T>): EventSubscription {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    
    this.handlers.get(event)!.add(handler);
    
    return {
      unsubscribe: () => this.off(event, handler),
    };
  }

  /**
   * Subscribe to an event that will only fire once
   */
  once<T = any>(event: IDEEventType | string, handler: EventHandler<T>): EventSubscription {
    const wrappedHandler = (data: T) => {
      handler(data);
      this.off(event, wrappedHandler);
    };
    
    return this.on(event, wrappedHandler);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: IDEEventType | string, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(event);
      }
    }
  }

  /**
   * Emit an event
   */
  emit<T = any>(event: IDEEventType | string, data?: T): void {
    // Call specific event handlers
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[EventBus] Error in handler for event "${event}":`, error);
        }
      });
    }
    
    // Call global handlers
    this.globalHandlers.forEach(handler => {
      try {
        handler({ event, data });
      } catch (error) {
        console.error(`[EventBus] Error in global handler for event "${event}":`, error);
      }
    });
  }

  /**
   * Subscribe to all events
   */
  onAny(handler: EventHandler<{ event: string; data: any }>): EventSubscription {
    this.globalHandlers.add(handler);
    
    return {
      unsubscribe: () => this.globalHandlers.delete(handler),
    };
  }

  /**
   * Remove all handlers for a specific event
   */
  clearEvent(event: IDEEventType | string): void {
    this.handlers.delete(event);
  }

  /**
   * Remove all handlers
   */
  clearAll(): void {
    this.handlers.clear();
    this.globalHandlers.clear();
  }

  /**
   * Get number of handlers for an event
   */
  getHandlerCount(event: IDEEventType | string): number {
    return this.handlers.get(event)?.size || 0;
  }

  /**
   * Get all registered events
   */
  getEvents(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Check if an event has any handlers
   */
  hasHandlers(event: IDEEventType | string): boolean {
    return this.getHandlerCount(event) > 0;
  }
}

/**
 * Global event bus instance
 */
export const eventBus = new EventBus();
