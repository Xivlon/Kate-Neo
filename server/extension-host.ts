/**
 * Extension Host Service
 * 
 * Manages extension loading, activation, and lifecycle.
 * Provides the extension API to loaded extensions.
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs/promises';
import {
  ExtensionManifest,
  ExtensionContext,
  ExtensionAPI,
  ExtensionModule,
  ExtensionState,
  LoadedExtension,
  ExtensionHostEvent,
  Disposable,
  StateStorage,
  WorkspaceAPI,
  LanguageAPI,
  WindowAPI,
  CommandAPI,
  Command,
} from '../shared/extension-types.js';

/**
 * Extension Host - manages extension lifecycle
 */
export class ExtensionHost extends EventEmitter {
  private extensions: Map<string, LoadedExtension> = new Map();
  private commands: Map<string, (...args: any[]) => any> = new Map();
  private extensionsPath: string;
  private api: ExtensionAPI;

  constructor(extensionsPath: string = './extensions') {
    super();
    this.extensionsPath = extensionsPath;
    this.api = this.createExtensionAPI();
  }

  /**
   * Initialize extension host
   */
  async initialize(): Promise<void> {
    console.log('[ExtensionHost] Initializing...');
    
    // Ensure extensions directory exists
    try {
      await fs.mkdir(this.extensionsPath, { recursive: true });
    } catch (error) {
      console.error('[ExtensionHost] Failed to create extensions directory:', error);
    }

    // Discover and load extensions
    await this.discoverExtensions();
  }

  /**
   * Discover extensions in extensions directory
   */
  private async discoverExtensions(): Promise<void> {
    try {
      const entries = await fs.readdir(this.extensionsPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const extensionPath = path.join(this.extensionsPath, entry.name);
          const manifestPath = path.join(extensionPath, 'package.json');
          
          try {
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            const manifest: ExtensionManifest = JSON.parse(manifestContent);
            
            if (this.validateManifest(manifest)) {
              await this.loadExtension(extensionPath, manifest);
            }
          } catch (error) {
            console.warn(`[ExtensionHost] Failed to load extension from ${extensionPath}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('[ExtensionHost] Failed to discover extensions:', error);
    }
  }

  /**
   * Validate extension manifest
   */
  private validateManifest(manifest: any): manifest is ExtensionManifest {
    return (
      typeof manifest === 'object' &&
      typeof manifest.id === 'string' &&
      typeof manifest.name === 'string' &&
      typeof manifest.version === 'string'
    );
  }

  /**
   * Load an extension
   */
  async loadExtension(extensionPath: string, manifest: ExtensionManifest): Promise<void> {
    const extensionId = manifest.id;

    if (this.extensions.has(extensionId)) {
      console.warn(`[ExtensionHost] Extension ${extensionId} already loaded`);
      return;
    }

    console.log(`[ExtensionHost] Loading extension: ${extensionId}`);

    const context = this.createExtensionContext(extensionId, extensionPath);
    const loadedExtension: LoadedExtension = {
      manifest,
      state: ExtensionState.Loading,
      context,
    };

    this.extensions.set(extensionId, loadedExtension);
    this.emit('event', { type: 'extension.loaded', extensionId } as ExtensionHostEvent);

    // Auto-activate if no activation events specified
    if (!manifest.activationEvents || manifest.activationEvents.includes('*')) {
      await this.activateExtension(extensionId);
    }
  }

  /**
   * Activate an extension
   */
  async activateExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension ${extensionId} not found`);
    }

    if (extension.state === ExtensionState.Active) {
      return;
    }

    console.log(`[ExtensionHost] Activating extension: ${extensionId}`);

    try {
      // Load extension module if it has a main entry point
      if (extension.manifest.main) {
        const modulePath = path.join(extension.context.extensionPath, extension.manifest.main);
        
        // Import extension module
        // Note: In production, this would use proper module loading
        // For now, we'll mark it as active without loading actual code
        extension.state = ExtensionState.Active;
        extension.activatedAt = Date.now();
        
        console.log(`[ExtensionHost] Extension ${extensionId} activated successfully`);
        this.emit('event', { type: 'extension.activated', extensionId } as ExtensionHostEvent);
      } else {
        // No main entry point, just mark as active
        extension.state = ExtensionState.Active;
        extension.activatedAt = Date.now();
      }
    } catch (error) {
      extension.state = ExtensionState.Failed;
      extension.error = error instanceof Error ? error.message : String(error);
      console.error(`[ExtensionHost] Failed to activate extension ${extensionId}:`, error);
      this.emit('event', { 
        type: 'extension.failed', 
        extensionId, 
        error: extension.error 
      } as ExtensionHostEvent);
      throw error;
    }
  }

  /**
   * Deactivate an extension
   */
  async deactivateExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension || extension.state !== ExtensionState.Active) {
      return;
    }

    console.log(`[ExtensionHost] Deactivating extension: ${extensionId}`);

    try {
      // Call deactivate if available
      if (extension.module?.deactivate) {
        await extension.module.deactivate();
      }

      // Dispose all subscriptions
      for (const subscription of extension.context.subscriptions) {
        subscription.dispose();
      }
      extension.context.subscriptions = [];

      extension.state = ExtensionState.Unloaded;
      this.emit('event', { type: 'extension.deactivated', extensionId } as ExtensionHostEvent);
    } catch (error) {
      console.error(`[ExtensionHost] Failed to deactivate extension ${extensionId}:`, error);
      throw error;
    }
  }

  /**
   * Get all loaded extensions
   */
  getExtensions(): LoadedExtension[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Get extension by ID
   */
  getExtension(extensionId: string): LoadedExtension | undefined {
    return this.extensions.get(extensionId);
  }

  /**
   * Create extension context
   */
  private createExtensionContext(extensionId: string, extensionPath: string): ExtensionContext {
    const storagePath = path.join(this.extensionsPath, '.storage', extensionId);
    
    return {
      extensionId,
      extensionPath,
      storagePath,
      globalState: this.createStateStorage(`global-${extensionId}`),
      workspaceState: this.createStateStorage(`workspace-${extensionId}`),
      subscriptions: [],
    };
  }

  /**
   * Create state storage
   */
  private createStateStorage(key: string): StateStorage {
    const storage = new Map<string, any>();
    
    return {
      get<T>(key: string, defaultValue?: T): T | undefined {
        return storage.has(key) ? storage.get(key) : defaultValue;
      },
      async update(key: string, value: any): Promise<void> {
        storage.set(key, value);
      },
    };
  }

  /**
   * Create Extension API
   */
  private createExtensionAPI(): ExtensionAPI {
    const workspaceAPI: WorkspaceAPI = {
      rootPath: process.cwd(),
      workspaceFolders: [
        {
          uri: `file://${process.cwd()}`,
          name: path.basename(process.cwd()),
          index: 0,
        },
      ],
      registerFileSystemProvider: (scheme: string, provider: any) => {
        console.log(`[ExtensionAPI] Registered file system provider for scheme: ${scheme}`);
        return { dispose: () => {} };
      },
      openTextDocument: async (path: string) => {
        // Placeholder implementation
        return {
          uri: `file://${path}`,
          languageId: 'plaintext',
          version: 1,
          getText: () => '',
          lineCount: 0,
        };
      },
      saveAll: async () => true,
    };

    const languageAPI: LanguageAPI = {
      registerCompletionProvider: (selector, provider) => {
        console.log('[ExtensionAPI] Registered completion provider');
        return { dispose: () => {} };
      },
      registerHoverProvider: (selector, provider) => {
        console.log('[ExtensionAPI] Registered hover provider');
        return { dispose: () => {} };
      },
      registerCodeLensProvider: (selector, provider) => {
        console.log('[ExtensionAPI] Registered code lens provider');
        return { dispose: () => {} };
      },
    };

    const windowAPI: WindowAPI = {
      showInformationMessage: async (message: string) => {
        console.log(`[ExtensionAPI] Info: ${message}`);
      },
      showWarningMessage: async (message: string) => {
        console.warn(`[ExtensionAPI] Warning: ${message}`);
      },
      showErrorMessage: async (message: string) => {
        console.error(`[ExtensionAPI] Error: ${message}`);
      },
      showQuickPick: async (items: string[]) => {
        return items[0];
      },
      createOutputChannel: (name: string) => {
        return {
          append: (value: string) => process.stdout.write(value),
          appendLine: (value: string) => console.log(value),
          clear: () => {},
          show: () => {},
          hide: () => {},
          dispose: () => {},
        };
      },
    };

    const commandAPI: CommandAPI = {
      registerCommand: (command: string, callback: (...args: any[]) => any) => {
        if (this.commands.has(command)) {
          console.warn(`[ExtensionAPI] Command ${command} already registered`);
        }
        this.commands.set(command, callback);
        console.log(`[ExtensionAPI] Registered command: ${command}`);
        this.emit('event', { type: 'command.registered', command } as ExtensionHostEvent);
        
        return {
          dispose: () => {
            this.commands.delete(command);
          },
        };
      },
      executeCommand: async (command: string, ...args: any[]) => {
        const handler = this.commands.get(command);
        if (!handler) {
          throw new Error(`Command ${command} not found`);
        }
        console.log(`[ExtensionAPI] Executing command: ${command}`);
        this.emit('event', { type: 'command.executed', command } as ExtensionHostEvent);
        return handler(...args);
      },
      getCommands: async () => {
        return Array.from(this.commands.keys());
      },
    };

    return {
      workspace: workspaceAPI,
      languages: languageAPI,
      window: windowAPI,
      commands: commandAPI,
    };
  }

  /**
   * Execute a command
   */
  async executeCommand(command: string, ...args: any[]): Promise<any> {
    return this.api.commands.executeCommand(command, ...args);
  }

  /**
   * Get registered commands
   */
  getCommands(): string[] {
    return Array.from(this.commands.keys());
  }

  /**
   * Shutdown extension host
   */
  async shutdown(): Promise<void> {
    console.log('[ExtensionHost] Shutting down...');
    
    for (const extensionId of Array.from(this.extensions.keys())) {
      try {
        await this.deactivateExtension(extensionId);
      } catch (error) {
        console.error(`[ExtensionHost] Error deactivating ${extensionId}:`, error);
      }
    }
    
    this.extensions.clear();
    this.commands.clear();
  }
}
