/**
 * Terminal Manager - Integrated terminal management
 * 
 * Manages terminal sessions and provides terminal functionality within the IDE
 */

import { eventBus, IDEEventType } from '../events/EventBus';

export interface TerminalSession {
  id: string;
  title: string;
  cwd: string;
  shell?: string;
  env?: Record<string, string>;
  createdAt: number;
  active: boolean;
}

export interface TerminalOutput {
  sessionId: string;
  data: string;
  timestamp: number;
}

export type TerminalOutputHandler = (output: TerminalOutput) => void;

/**
 * Terminal Manager Class
 * 
 * Manages terminal sessions and coordinates with backend terminal service
 */
export class TerminalManager {
  private sessions: Map<string, TerminalSession> = new Map();
  private outputHandlers: Map<string, Set<TerminalOutputHandler>> = new Map();
  private nextSessionId: number = 1;

  constructor() {
    console.log('[TerminalManager] Initialized');
  }

  /**
   * Create a new terminal session
   */
  async createSession(
    cwd: string = '/',
    shell?: string,
    title?: string
  ): Promise<TerminalSession> {
    const sessionId = `terminal-${this.nextSessionId++}`;
    
    const session: TerminalSession = {
      id: sessionId,
      title: title || `Terminal ${this.nextSessionId - 1}`,
      cwd,
      shell,
      createdAt: Date.now(),
      active: true,
    };

    this.sessions.set(sessionId, session);
    
    console.log(`[TerminalManager] TODO: Create terminal session with backend PTY`);
    console.log(`[TerminalManager] Session created: ${sessionId}`);
    
    // TODO: Send request to backend to create terminal session
    // This will involve:
    // 1. Sending WebSocket message to backend
    // 2. Backend spawns PTY process
    // 3. Backend sends back session details
    
    // Emit event
    eventBus.emit(IDEEventType.TERMINAL_CREATED, session);

    return session;
  }

  /**
   * Close a terminal session
   */
  async closeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    console.log(`[TerminalManager] TODO: Close backend terminal session: ${sessionId}`);
    
    // TODO: Send close message to backend
    // TODO: Clean up PTY resources
    
    this.sessions.delete(sessionId);
    this.outputHandlers.delete(sessionId);
    
    console.log(`[TerminalManager] Session closed: ${sessionId}`);
    
    // Emit event
    eventBus.emit(IDEEventType.TERMINAL_CLOSED, { sessionId });

    return true;
  }

  /**
   * Send input to terminal
   */
  async sendInput(sessionId: string, data: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    console.log(`[TerminalManager] TODO: Send input to terminal: ${data.length} chars`);
    
    // TODO: Send input to backend terminal PTY
    // This will be sent via WebSocket to the backend
    
    return true;
  }

  /**
   * Resize terminal
   */
  async resizeSession(
    sessionId: string,
    cols: number,
    rows: number
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    console.log(`[TerminalManager] TODO: Resize terminal to ${cols}x${rows}`);
    
    // TODO: Send resize message to backend PTY
    
    return true;
  }

  /**
   * Register output handler for a session
   */
  onOutput(sessionId: string, handler: TerminalOutputHandler): () => void {
    if (!this.outputHandlers.has(sessionId)) {
      this.outputHandlers.set(sessionId, new Set());
    }
    
    this.outputHandlers.get(sessionId)!.add(handler);
    
    // Return cleanup function
    return () => {
      const handlers = this.outputHandlers.get(sessionId);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Handle output from backend (called when WebSocket receives data)
   */
  handleOutput(sessionId: string, data: string): void {
    const output: TerminalOutput = {
      sessionId,
      data,
      timestamp: Date.now(),
    };

    // Notify handlers
    const handlers = this.outputHandlers.get(sessionId);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(output);
        } catch (error) {
          console.error('[TerminalManager] Error in output handler:', error);
        }
      });
    }

    // Emit event
    eventBus.emit(IDEEventType.TERMINAL_OUTPUT, output);
  }

  /**
   * Get a terminal session
   */
  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all terminal sessions
   */
  getAllSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get active terminal session
   */
  getActiveSession(): TerminalSession | undefined {
    return Array.from(this.sessions.values()).find(s => s.active);
  }

  /**
   * Set active session
   */
  setActiveSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Deactivate all sessions
    this.sessions.forEach(s => {
      s.active = false;
    });

    // Activate target session
    session.active = true;

    return true;
  }

  /**
   * Clear terminal output (client-side only, doesn't affect PTY)
   */
  clearTerminal(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    console.log(`[TerminalManager] TODO: Clear terminal display for ${sessionId}`);
    
    // TODO: This would emit an event that the terminal component listens to
    // to clear its display buffer
    
    return true;
  }

  /**
   * Close all terminal sessions
   */
  async closeAll(): Promise<void> {
    const sessionIds = Array.from(this.sessions.keys());
    console.log(`[TerminalManager] Closing ${sessionIds.length} terminal sessions`);

    for (const sessionId of sessionIds) {
      await this.closeSession(sessionId);
    }
  }

  /**
   * Shutdown the terminal manager
   */
  async shutdown(): Promise<void> {
    console.log('[TerminalManager] Shutting down');
    await this.closeAll();
    this.outputHandlers.clear();
  }
}

/**
 * Global terminal manager instance
 */
export const terminalManager = new TerminalManager();
