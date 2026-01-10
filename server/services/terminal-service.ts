/**
 * Terminal Service
 * 
 * Provides integrated terminal functionality with PTY (pseudo-terminal) support.
 * Manages multiple terminal sessions and handles terminal I/O.
 */

import { EventEmitter } from 'events';
import { spawn, type ChildProcess } from 'child_process';
import * as os from 'os';

/**
 * Terminal dimensions
 */
export interface TerminalDimensions {
  cols: number;
  rows: number;
}

/**
 * Terminal configuration
 */
export interface TerminalConfig {
  shell?: string;
  cwd?: string;
  env?: Record<string, string>;
  dimensions?: TerminalDimensions;
}

/**
 * Terminal session
 * Manages a single terminal instance with a shell process
 */
export class TerminalSession extends EventEmitter {
  public readonly id: string;
  private process: ChildProcess | null = null;
  private shell: string;
  private cwd: string;
  private env: Record<string, string>;
  private dimensions: TerminalDimensions;
  private buffer: string = '';

  constructor(id: string, config: TerminalConfig) {
    super();
    this.id = id;
    this.shell = config.shell || this.getDefaultShell();
    this.cwd = config.cwd || process.cwd();
    this.env = { ...process.env as Record<string, string>, ...config.env };
    this.dimensions = config.dimensions || { cols: 80, rows: 24 };
  }

  /**
   * Get default shell for the platform
   */
  private getDefaultShell(): string {
    const platform = os.platform();
    
    if (platform === 'win32') {
      return process.env.COMSPEC || 'cmd.exe';
    } else {
      return process.env.SHELL || '/bin/bash';
    }
  }

  /**
   * Start the terminal session
   */
  async start(): Promise<void> {
    console.log(`[TerminalSession] Starting terminal ${this.id} with shell: ${this.shell}`);
    
    // TODO: Use node-pty for proper PTY support
    // For now, using basic child_process which doesn't provide full PTY features
    // This is a placeholder implementation
    
    try {
      this.process = spawn(this.shell, [], {
        cwd: this.cwd,
        env: this.env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.process.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        this.buffer += text;
        this.emit('data', text);
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        this.buffer += text;
        this.emit('data', text);
      });

      this.process.on('exit', (code) => {
        console.log(`[TerminalSession] Terminal ${this.id} exited with code ${code}`);
        this.emit('exit', code);
      });

      this.process.on('error', (error) => {
        console.error(`[TerminalSession] Terminal ${this.id} error:`, error);
        this.emit('error', error);
      });

      this.emit('started');
      
      // Send initial prompt
      if (os.platform() !== 'win32') {
        // For Unix-like systems, the shell will display its own prompt
      }
      
    } catch (error) {
      console.error(`[TerminalSession] Failed to start terminal:`, error);
      throw error;
    }
  }

  /**
   * Write data to the terminal
   */
  write(data: string): void {
    if (this.process && this.process.stdin) {
      this.process.stdin.write(data);
    }
  }

  /**
   * Resize the terminal
   */
  resize(dimensions: TerminalDimensions): void {
    this.dimensions = dimensions;
    
    // TODO: Implement proper PTY resize using node-pty
    // Current implementation doesn't support resize without PTY
    console.log(`[TerminalSession] Resize to ${dimensions.cols}x${dimensions.rows} (not implemented without PTY)`);
    
    this.emit('resized', dimensions);
  }

  /**
   * Get terminal buffer
   */
  getBuffer(): string {
    return this.buffer;
  }

  /**
   * Clear terminal buffer
   */
  clearBuffer(): void {
    this.buffer = '';
    // Send clear screen command
    if (os.platform() === 'win32') {
      this.write('cls\r\n');
    } else {
      this.write('clear\r\n');
    }
  }

  /**
   * Kill the terminal session
   */
  kill(): void {
    if (this.process) {
      console.log(`[TerminalSession] Killing terminal ${this.id}`);
      this.process.kill();
      this.process = null;
    }
  }

  /**
   * Check if terminal is running
   */
  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }
}

/**
 * Terminal Service
 * Manages multiple terminal sessions
 */
export class TerminalService extends EventEmitter {
  private sessions: Map<string, TerminalSession> = new Map();
  private nextSessionId = 1;

  /**
   * Create a new terminal session
   */
  async createSession(config: TerminalConfig = {}): Promise<TerminalSession> {
    const sessionId = `terminal-${this.nextSessionId++}`;
    const session = new TerminalSession(sessionId, config);
    
    this.sessions.set(sessionId, session);
    
    // Forward session events
    session.on('data', (data) => {
      this.emit('sessionData', { sessionId, data });
    });
    
    session.on('exit', (code) => {
      this.emit('sessionExit', { sessionId, code });
      this.sessions.delete(sessionId);
    });
    
    session.on('error', (error) => {
      this.emit('sessionError', { sessionId, error });
    });
    
    await session.start();
    this.emit('sessionCreated', session);
    
    return session;
  }

  /**
   * Get a terminal session by ID
   */
  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Write data to a terminal session
   */
  writeToSession(sessionId: string, data: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session && session.isRunning()) {
      session.write(data);
      return true;
    }
    return false;
  }

  /**
   * Resize a terminal session
   */
  resizeSession(sessionId: string, dimensions: TerminalDimensions): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.resize(dimensions);
      return true;
    }
    return false;
  }

  /**
   * Kill a terminal session
   */
  killSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.kill();
      this.sessions.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * Kill all terminal sessions
   */
  killAllSessions(): void {
    this.sessions.forEach(session => session.kill());
    this.sessions.clear();
  }
}

// Export singleton instance
export const terminalService = new TerminalService();
