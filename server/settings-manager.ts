/**
 * Settings Manager Service
 * 
 * Manages Kate Neo IDE settings across different scopes (global, workspace, folder).
 * Provides settings persistence, validation, and change notifications.
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import {
  KateNeoSettings,
  SettingsScope,
  SettingsUpdateRequest,
  SettingsGetRequest,
  SettingsResponse,
  SettingsChangeEvent,
  DEFAULT_SETTINGS,
} from '../shared/settings-types.js';

/**
 * Settings Manager Configuration
 */
interface SettingsManagerConfig {
  /** Directory for storing global settings */
  globalSettingsDir?: string;
  /** Current workspace directory */
  workspaceDir?: string;
  /** Enable auto-save */
  autoSave?: boolean;
}

/**
 * Settings Manager Service
 * 
 * Manages hierarchical settings with scope precedence:
 * Folder > Workspace > Global > Default
 */
export class SettingsManager extends EventEmitter {
  private globalSettings: Partial<KateNeoSettings> = {};
  private workspaceSettings: Partial<KateNeoSettings> = {};
  private folderSettings: Map<string, Partial<KateNeoSettings>> = new Map();
  
  private config: Required<SettingsManagerConfig>;
  private initialized = false;

  constructor(config: SettingsManagerConfig = {}) {
    super();
    
    const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp';
    
    this.config = {
      globalSettingsDir: config.globalSettingsDir || path.join(homeDir, '.kate-neo'),
      workspaceDir: config.workspaceDir || process.cwd(),
      autoSave: config.autoSave !== undefined ? config.autoSave : true,
    };
  }

  /**
   * Initialize the settings manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure global settings directory exists
      await fs.mkdir(this.config.globalSettingsDir, { recursive: true });

      // Load global settings
      await this.loadGlobalSettings();

      // Load workspace settings if workspace directory exists
      if (this.config.workspaceDir) {
        await this.loadWorkspaceSettings();
      }

      this.initialized = true;
      console.log('[SettingsManager] Initialized');
    } catch (error) {
      console.error('[SettingsManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load global settings from disk
   */
  private async loadGlobalSettings(): Promise<void> {
    const globalSettingsPath = path.join(this.config.globalSettingsDir, 'settings.json');
    
    try {
      const data = await fs.readFile(globalSettingsPath, 'utf-8');
      this.globalSettings = JSON.parse(data);
      console.log('[SettingsManager] Loaded global settings');
    } catch (error) {
      // File doesn't exist or is invalid - use empty settings
      this.globalSettings = {};
      console.log('[SettingsManager] No global settings found, using defaults');
    }
  }

  /**
   * Load workspace settings from disk
   */
  private async loadWorkspaceSettings(): Promise<void> {
    const workspaceSettingsPath = path.join(
      this.config.workspaceDir,
      '.kate-neo',
      'settings.json'
    );
    
    try {
      const data = await fs.readFile(workspaceSettingsPath, 'utf-8');
      this.workspaceSettings = JSON.parse(data);
      console.log('[SettingsManager] Loaded workspace settings');
    } catch (error) {
      // File doesn't exist or is invalid - use empty settings
      this.workspaceSettings = {};
      console.log('[SettingsManager] No workspace settings found');
    }
  }

  /**
   * Save global settings to disk
   */
  private async saveGlobalSettings(): Promise<void> {
    const globalSettingsPath = path.join(this.config.globalSettingsDir, 'settings.json');
    
    try {
      await fs.writeFile(
        globalSettingsPath,
        JSON.stringify(this.globalSettings, null, 2),
        'utf-8'
      );
      console.log('[SettingsManager] Saved global settings');
    } catch (error) {
      console.error('[SettingsManager] Failed to save global settings:', error);
      throw error;
    }
  }

  /**
   * Save workspace settings to disk
   */
  private async saveWorkspaceSettings(): Promise<void> {
    const workspaceSettingsDir = path.join(this.config.workspaceDir, '.kate-neo');
    const workspaceSettingsPath = path.join(workspaceSettingsDir, 'settings.json');
    
    try {
      await fs.mkdir(workspaceSettingsDir, { recursive: true });
      await fs.writeFile(
        workspaceSettingsPath,
        JSON.stringify(this.workspaceSettings, null, 2),
        'utf-8'
      );
      console.log('[SettingsManager] Saved workspace settings');
    } catch (error) {
      console.error('[SettingsManager] Failed to save workspace settings:', error);
      throw error;
    }
  }

  /**
   * Get a setting value using dot notation
   * @param key - Setting key (e.g., 'editor.fontSize')
   * @param obj - Object to search in
   */
  private getNestedValue(key: string, obj: Record<string, unknown>): unknown {
    return key.split('.').reduce((current: unknown, part: string) => {
      if (current && typeof current === 'object' && part in current) {
        return (current as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  }

  /**
   * Set a setting value using dot notation
   * @param key - Setting key (e.g., 'editor.fontSize')
   * @param value - Value to set
   * @param obj - Object to modify
   */
  private setNestedValue(key: string, value: unknown, obj: Record<string, unknown>): void {
    const parts = key.split('.');
    const lastPart = parts.pop()!;
    
    // Prevent prototype pollution
    if (lastPart === '__proto__' || lastPart === 'constructor' || lastPart === 'prototype') {
      throw new Error(`Invalid key: ${lastPart}`);
    }
    
    let current: Record<string, unknown> = obj;
    for (const part of parts) {
      // Prevent prototype pollution
      if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
        throw new Error(`Invalid key part: ${part}`);
      }
      
      if (!(part in current) || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    
    current[lastPart] = value;
  }

  /**
   * Merge settings from different scopes
   * Precedence: Folder > Workspace > Global > Default
   */
  private mergeSettings(folderPath?: string): KateNeoSettings {
    let merged = { ...DEFAULT_SETTINGS };
    
    // Apply global settings
    merged = this.deepMerge(merged, this.globalSettings);
    
    // Apply workspace settings
    merged = this.deepMerge(merged, this.workspaceSettings);
    
    // Apply folder settings if specified
    if (folderPath && this.folderSettings.has(folderPath)) {
      merged = this.deepMerge(merged, this.folderSettings.get(folderPath)!);
    }
    
    return merged;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
      const targetValue = result[key];
      const sourceValue = source[key];
      
      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = this.deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        ) as T[Extract<keyof T, string>];
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
    
    return result;
  }

  /**
   * Get settings
   */
  async getSettings(request: SettingsGetRequest): Promise<SettingsResponse> {
    try {
      let settings: unknown;
      
      if (request.scope) {
        // Get settings from specific scope
        const scopeSettings = this.getSettingsForScope(request.scope);
        settings = request.key
          ? this.getNestedValue(request.key, scopeSettings as Record<string, unknown>)
          : scopeSettings;
      } else {
        // Get merged settings
        const merged = this.mergeSettings();
        settings = request.key
          ? this.getNestedValue(request.key, merged as Record<string, unknown>)
          : merged;
      }
      
      return {
        success: true,
        settings,
      };
    } catch (error) {
      console.error('[SettingsManager] Get settings error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get settings for a specific scope
   */
  private getSettingsForScope(scope: SettingsScope): Partial<KateNeoSettings> {
    switch (scope) {
      case SettingsScope.Global:
        return this.globalSettings;
      case SettingsScope.Workspace:
        return this.workspaceSettings;
      case SettingsScope.Folder:
        // For folder scope, return empty object
        // In a real implementation, you'd specify which folder
        return {};
      default:
        return {};
    }
  }

  /**
   * Update a setting
   */
  async updateSetting(request: SettingsUpdateRequest): Promise<SettingsResponse> {
    try {
      const { scope, key, value } = request;
      
      // Get the appropriate settings object
      let settingsObj: Partial<KateNeoSettings>;
      switch (scope) {
        case SettingsScope.Global:
          settingsObj = this.globalSettings;
          break;
        case SettingsScope.Workspace:
          settingsObj = this.workspaceSettings;
          break;
        case SettingsScope.Folder:
          // For simplicity, we'll use workspace settings for folder scope
          // In a real implementation, you'd handle folder-specific settings
          settingsObj = this.workspaceSettings;
          break;
        default:
          throw new Error(`Invalid scope: ${scope}`);
      }
      
      // Update the value
      this.setNestedValue(key, value, settingsObj as Record<string, unknown>);
      
      // Save to disk if auto-save is enabled
      if (this.config.autoSave) {
        if (scope === SettingsScope.Global) {
          await this.saveGlobalSettings();
        } else {
          await this.saveWorkspaceSettings();
        }
      }
      
      // Emit change event
      const changeEvent: SettingsChangeEvent = {
        scope,
        keys: [key],
        timestamp: Date.now(),
      };
      this.emit('settingsChanged', changeEvent);
      
      return {
        success: true,
        settings: settingsObj,
      };
    } catch (error) {
      console.error('[SettingsManager] Update setting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a setting (reset to default)
   */
  async deleteSetting(scope: SettingsScope, key: string): Promise<SettingsResponse> {
    try {
      let settingsObj: Partial<KateNeoSettings>;
      switch (scope) {
        case SettingsScope.Global:
          settingsObj = this.globalSettings;
          break;
        case SettingsScope.Workspace:
          settingsObj = this.workspaceSettings;
          break;
        default:
          throw new Error(`Invalid scope: ${scope}`);
      }
      
      // Delete the key
      const parts = key.split('.');
      const lastPart = parts.pop()!;
      let current: Record<string, unknown> = settingsObj as Record<string, unknown>;
      
      for (const part of parts) {
        if (!(part in current)) return { success: true };
        current = current[part] as Record<string, unknown>;
      }
      
      delete current[lastPart];
      
      // Save to disk
      if (this.config.autoSave) {
        if (scope === SettingsScope.Global) {
          await this.saveGlobalSettings();
        } else {
          await this.saveWorkspaceSettings();
        }
      }
      
      // Emit change event
      const changeEvent: SettingsChangeEvent = {
        scope,
        keys: [key],
        timestamp: Date.now(),
      };
      this.emit('settingsChanged', changeEvent);
      
      return {
        success: true,
      };
    } catch (error) {
      console.error('[SettingsManager] Delete setting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reset all settings in a scope to defaults
   */
  async resetSettings(scope: SettingsScope): Promise<SettingsResponse> {
    try {
      switch (scope) {
        case SettingsScope.Global:
          this.globalSettings = {};
          if (this.config.autoSave) {
            await this.saveGlobalSettings();
          }
          break;
        case SettingsScope.Workspace:
          this.workspaceSettings = {};
          if (this.config.autoSave) {
            await this.saveWorkspaceSettings();
          }
          break;
      }
      
      // Emit change event
      const changeEvent: SettingsChangeEvent = {
        scope,
        keys: ['*'],
        timestamp: Date.now(),
      };
      this.emit('settingsChanged', changeEvent);
      
      return {
        success: true,
      };
    } catch (error) {
      console.error('[SettingsManager] Reset settings error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all settings (merged)
   */
  getAllSettings(): KateNeoSettings {
    return this.mergeSettings();
  }

  /**
   * Set workspace directory
   */
  async setWorkspaceDir(dir: string): Promise<void> {
    this.config.workspaceDir = dir;
    await this.loadWorkspaceSettings();
  }
}

// Export singleton instance
let settingsManagerInstance: SettingsManager | null = null;

export function getSettingsManager(config?: SettingsManagerConfig): SettingsManager {
  if (!settingsManagerInstance) {
    settingsManagerInstance = new SettingsManager(config);
  }
  return settingsManagerInstance;
}
